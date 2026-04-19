"""Smoke tests for admin article CRUD endpoints."""


class TestAdminArticleCRUD:
    """Full create / read / update / delete cycle on /api/admin/articles."""

    async def test_create_article(self, client, admin_token):
        resp = await client.post(
            "/api/admin/articles",
            json={
                "slug": "new-article",
                "category": "sigint",
                "title": "New Article",
                "description": "Created via test",
                "content": "# New\n\nArticle content.",
                "is_published": True,
            },
            headers={"Authorization": f"Bearer {admin_token}"},
        )
        assert resp.status_code == 201
        body = resp.json()
        assert body["slug"] == "new-article"
        assert "id" in body

    async def test_read_article_after_create(self, client, admin_token):
        # Create
        create_resp = await client.post(
            "/api/admin/articles",
            json={
                "slug": "read-test",
                "category": "sigint",
                "title": "Read Test",
                "content": "Content here.",
            },
            headers={"Authorization": f"Bearer {admin_token}"},
        )
        assert create_resp.status_code == 201

        # Read via public endpoint
        get_resp = await client.get("/api/articles/read-test")
        assert get_resp.status_code == 200
        assert get_resp.json()["title"] == "Read Test"

    async def test_update_article(self, client, admin_token, sample_article):
        article_id = str(sample_article.id)
        resp = await client.patch(
            f"/api/admin/articles/{article_id}",
            json={"title": "Updated Title"},
            headers={"Authorization": f"Bearer {admin_token}"},
        )
        assert resp.status_code == 200
        assert resp.json()["title"] == "Updated Title"

    async def test_delete_article(self, client, admin_token, sample_article):
        article_id = str(sample_article.id)
        resp = await client.delete(
            f"/api/admin/articles/{article_id}",
            headers={"Authorization": f"Bearer {admin_token}"},
        )
        assert resp.status_code == 200

        # Confirm it is gone
        get_resp = await client.get(f"/api/articles/{sample_article.slug}")
        assert get_resp.status_code == 404

    async def test_unauthenticated_create_returns_401(self, client):
        resp = await client.post(
            "/api/admin/articles",
            json={
                "slug": "unauth",
                "category": "sigint",
                "title": "Unauth",
                "content": "Should fail.",
            },
        )
        assert resp.status_code in (401, 403)

    async def test_regular_user_cannot_create(self, client, auth_token):
        resp = await client.post(
            "/api/admin/articles",
            json={
                "slug": "forbidden",
                "category": "sigint",
                "title": "Forbidden",
                "content": "Should fail.",
            },
            headers={"Authorization": f"Bearer {auth_token}"},
        )
        assert resp.status_code == 403
