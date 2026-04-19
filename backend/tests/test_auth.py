"""Tests for authentication endpoints with dev login gating."""

import pytest


class TestDevLoginDisabled:
    """When DEV_LOGIN_ENABLED is false (default in testing env), manual auth endpoints return 403."""

    async def test_login_returns_403(self, client):
        resp = await client.post(
            "/api/auth/login",
            json={"email": "user@test.com", "password": "TestPassword1!"},
        )
        assert resp.status_code == 403
        assert "Manual login is disabled" in resp.json()["detail"]

    async def test_register_returns_403(self, client):
        resp = await client.post(
            "/api/auth/register",
            json={
                "email": "new@test.com",
                "password": "NewPassword123!",
                "username": "newuser",
            },
        )
        assert resp.status_code == 403
        assert "Registration is disabled" in resp.json()["detail"]

    async def test_password_reset_request_returns_403(self, client):
        resp = await client.post(
            "/api/auth/password/reset-request",
            json={"email": "user@test.com"},
        )
        assert resp.status_code == 403
        assert "Password reset is disabled" in resp.json()["detail"]

    async def test_password_reset_returns_403(self, client):
        resp = await client.post(
            "/api/auth/password/reset",
            json={"token": "fake-token", "new_password": "NewPassword123!"},
        )
        assert resp.status_code == 403
        assert "Password reset is disabled" in resp.json()["detail"]

    async def test_dev_status_returns_false(self, client):
        resp = await client.get("/api/auth/dev-status")
        assert resp.status_code == 200
        assert resp.json()["dev_login_enabled"] is False


class TestDevLoginEnabled:
    """When DEV_LOGIN_ENABLED is true and APP_ENV is development."""

    async def test_login_valid_credentials_returns_200(
        self, client, test_user, enable_dev_login
    ):
        resp = await client.post(
            "/api/auth/login",
            json={"email": "user@test.com", "password": "TestPassword1!"},
        )
        assert resp.status_code == 200
        body = resp.json()
        assert "access_token" in body
        assert body["token_type"] == "bearer"
        assert body["expires_in"] > 0
        assert body["user"]["email"] == "user@test.com"
        assert body["user"]["role"] == "user"

    async def test_login_wrong_password_returns_401(
        self, client, test_user, enable_dev_login
    ):
        resp = await client.post(
            "/api/auth/login",
            json={"email": "user@test.com", "password": "WrongPassword1!"},
        )
        assert resp.status_code == 401

    async def test_login_unknown_email_returns_401(self, client, enable_dev_login):
        resp = await client.post(
            "/api/auth/login",
            json={"email": "nobody@test.com", "password": "SomePassword1!"},
        )
        assert resp.status_code == 401

    async def test_login_missing_fields_returns_422(self, client, enable_dev_login):
        resp = await client.post("/api/auth/login", json={})
        assert resp.status_code == 422

    async def test_dev_status_returns_true(self, client, enable_dev_login):
        resp = await client.get("/api/auth/dev-status")
        assert resp.status_code == 200
        assert resp.json()["dev_login_enabled"] is True

    async def test_register_allowed(self, client, enable_dev_login):
        resp = await client.post(
            "/api/auth/register",
            json={
                "email": "newdev@test.com",
                "password": "DevPassword123!",
                "username": "devuser",
            },
        )
        assert resp.status_code == 201
        body = resp.json()
        assert body["user"]["email"] == "newdev@test.com"
