"""Smoke tests for article endpoints."""


class TestListArticles:
    """GET /api/articles"""

    async def test_returns_list(self, client, sample_article):
        resp = await client.get("/api/articles")
        assert resp.status_code == 200
        body = resp.json()
        assert isinstance(body, list)
        assert len(body) >= 1
        assert body[0]["slug"] == "test-signals"

    async def test_empty_when_no_articles(self, client):
        resp = await client.get("/api/articles")
        assert resp.status_code == 200
        assert resp.json() == []


class TestGetArticle:
    """GET /api/articles/{slug}"""

    async def test_returns_article_by_slug(self, client, sample_article):
        resp = await client.get("/api/articles/test-signals")
        assert resp.status_code == 200
        body = resp.json()
        assert body["slug"] == "test-signals"
        assert body["title"] == "Test Signals Article"
        assert body["category"] == "sigint"
        assert "content" in body

    async def test_nonexistent_slug_returns_404(self, client):
        resp = await client.get("/api/articles/no-such-article")
        assert resp.status_code == 404
