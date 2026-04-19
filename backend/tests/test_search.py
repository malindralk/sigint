"""Smoke tests for semantic search endpoints."""

import pytest

from app.api.deps import get_embedding_service
from app.main import app


class _MockEmbeddingService:
    """Fake embedding service returning canned results with similarity scores."""

    async def search_similar(self, query, limit=10, threshold=0.3):
        return [
            {
                "chunk_text": "Signal intelligence overview and techniques",
                "chunk_index": 0,
                "slug": "sigint-basics",
                "title": "SIGINT Basics",
                "category": "sigint",
                "similarity": 0.92,
            },
            {
                "chunk_text": "Radio frequency monitoring methods",
                "chunk_index": 1,
                "slug": "rf-monitoring",
                "title": "RF Monitoring",
                "category": "sigint",
                "similarity": 0.78,
            },
        ]


@pytest.fixture(autouse=True)
def _mock_embeddings():
    """Override the embedding service for all tests in this module."""
    app.dependency_overrides[get_embedding_service] = lambda: _MockEmbeddingService()
    yield
    app.dependency_overrides.pop(get_embedding_service, None)


class TestSemanticSearch:
    """POST /api/search"""

    async def test_returns_results_with_similarity(self, client, auth_token):
        resp = await client.post(
            "/api/search",
            json={"query": "signal intelligence", "limit": 5},
            headers={"Authorization": f"Bearer {auth_token}"},
        )
        assert resp.status_code == 200
        body = resp.json()
        assert body["query"] == "signal intelligence"
        assert body["count"] == 2
        assert len(body["results"]) == 2
        for result in body["results"]:
            assert 0.0 <= result["similarity"] <= 1.0
            assert "chunk_text" in result
            assert "slug" in result

    async def test_similarity_scores_are_numeric(self, client, auth_token):
        resp = await client.post(
            "/api/search",
            json={"query": "radio frequency"},
            headers={"Authorization": f"Bearer {auth_token}"},
        )
        assert resp.status_code == 200
        for result in resp.json()["results"]:
            assert isinstance(result["similarity"], float)

    async def test_unauthenticated_returns_401(self, client):
        resp = await client.post("/api/search", json={"query": "test"})
        assert resp.status_code in (401, 403)
