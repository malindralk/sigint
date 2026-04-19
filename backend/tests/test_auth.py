"""Smoke tests for authentication endpoints."""


class TestLogin:
    """POST /api/auth/login"""

    async def test_valid_credentials_returns_200(self, client, test_user):
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

    async def test_wrong_password_returns_401(self, client, test_user):
        resp = await client.post(
            "/api/auth/login",
            json={"email": "user@test.com", "password": "WrongPassword1!"},
        )
        assert resp.status_code == 401

    async def test_unknown_email_returns_401(self, client):
        resp = await client.post(
            "/api/auth/login",
            json={"email": "nobody@test.com", "password": "SomePassword1!"},
        )
        assert resp.status_code == 401

    async def test_missing_fields_returns_422(self, client):
        resp = await client.post("/api/auth/login", json={})
        assert resp.status_code == 422
