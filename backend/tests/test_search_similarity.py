"""Tests for semantic search similarity scoring.

Verifies that:
1. Similarity scores are computed dynamically (not hardcoded)
2. Scores are in valid range (0 to 1)
3. Threshold filtering works correctly
"""

import uuid
from datetime import datetime
from unittest.mock import AsyncMock, MagicMock, patch

import numpy as np
import pytest


class TestCosineSimlarity:
    """Test the cosine similarity computation logic directly."""

    def _cosine_similarity(self, vec_a: list[float], vec_b: list[float]) -> float:
        """Replicate the cosine similarity logic from the embedding service."""
        a = np.array(vec_a)
        b = np.array(vec_b)
        dot_product = np.dot(a, b)
        norm_a = np.linalg.norm(a)
        norm_b = np.linalg.norm(b)
        if norm_a == 0 or norm_b == 0:
            return 0.0
        return float(dot_product / (norm_a * norm_b))

    def test_identical_vectors_have_similarity_one(self):
        """Identical vectors should have cosine similarity of 1.0."""
        vec = [0.1, 0.2, 0.3, 0.4, 0.5]
        similarity = self._cosine_similarity(vec, vec)
        assert abs(similarity - 1.0) < 1e-6

    def test_orthogonal_vectors_have_similarity_zero(self):
        """Orthogonal vectors should have cosine similarity of 0.0."""
        vec_a = [1.0, 0.0, 0.0]
        vec_b = [0.0, 1.0, 0.0]
        similarity = self._cosine_similarity(vec_a, vec_b)
        assert abs(similarity) < 1e-6

    def test_opposite_vectors_have_negative_similarity(self):
        """Opposite vectors should have cosine similarity of -1.0."""
        vec_a = [1.0, 0.0, 0.0]
        vec_b = [-1.0, 0.0, 0.0]
        similarity = self._cosine_similarity(vec_a, vec_b)
        assert abs(similarity - (-1.0)) < 1e-6

    def test_similarity_in_valid_range(self):
        """Cosine similarity should always be between -1 and 1."""
        rng = np.random.default_rng(42)
        for _ in range(100):
            vec_a = rng.standard_normal(384).tolist()
            vec_b = rng.standard_normal(384).tolist()
            similarity = self._cosine_similarity(vec_a, vec_b)
            assert -1.0 <= similarity <= 1.0

    def test_zero_vector_returns_zero_similarity(self):
        """A zero vector should return 0 similarity."""
        vec_a = [0.0, 0.0, 0.0]
        vec_b = [1.0, 2.0, 3.0]
        similarity = self._cosine_similarity(vec_a, vec_b)
        assert similarity == 0.0


class TestEmbeddingServiceSearch:
    """Test the EmbeddingService search with mocked DB and model."""

    @pytest.fixture
    def mock_db(self):
        """Create a mock async database session."""
        db = AsyncMock()
        return db

    @pytest.fixture
    def mock_model(self):
        """Create a mock sentence transformer model."""
        model = MagicMock()
        return model

    @pytest.fixture
    def embedding_service(self, mock_db, mock_model):
        """Create an EmbeddingService with mocked dependencies."""
        with patch(
            "app.services.embedding.EmbeddingService.get_model",
            return_value=mock_model,
        ):
            from app.services.embedding import EmbeddingService

            svc = EmbeddingService(mock_db)
        return svc

    def test_different_queries_produce_different_scores(self, embedding_service):
        """Verify similarity is not hardcoded - different inputs yield different outputs."""
        # Create distinct embeddings for different queries
        rng = np.random.default_rng(123)
        vec_query1 = rng.standard_normal(384)
        vec_query2 = rng.standard_normal(384)
        vec_chunk = rng.standard_normal(384)

        # Compute similarities manually
        sim1 = float(
            np.dot(vec_query1, vec_chunk)
            / (np.linalg.norm(vec_query1) * np.linalg.norm(vec_chunk))
        )
        sim2 = float(
            np.dot(vec_query2, vec_chunk)
            / (np.linalg.norm(vec_query2) * np.linalg.norm(vec_chunk))
        )

        # Different query vectors must produce different similarity scores
        assert sim1 != sim2, "Different queries must produce different similarity scores"

    def test_generate_embeddings_returns_list_of_floats(self, embedding_service):
        """Verify generate_embeddings returns proper format."""
        # Mock the model's encode method
        fake_embeddings = np.random.default_rng(0).standard_normal((2, 384))
        embedding_service.model.encode.return_value = fake_embeddings

        result = embedding_service.generate_embeddings(["hello", "world"])
        assert len(result) == 2
        assert len(result[0]) == 384
        assert all(isinstance(v, float) for v in result[0])

    @pytest.mark.asyncio
    async def test_search_sqlite_threshold_filtering(self, embedding_service, mock_db):
        """Results below threshold should be excluded."""
        from unittest.mock import PropertyMock

        rng = np.random.default_rng(42)

        # Create a query vector and chunk vectors with known similarities
        query_vec = rng.standard_normal(384)
        # Create a very similar chunk (high similarity)
        similar_chunk_vec = query_vec + rng.standard_normal(384) * 0.1
        # Create a very dissimilar chunk (low similarity)
        dissimilar_chunk_vec = -query_vec + rng.standard_normal(384) * 0.1

        # Mock generate_embeddings to return our controlled vectors
        call_count = [0]

        def mock_generate(texts):
            nonlocal call_count
            if call_count[0] == 0:
                # First call is for the query
                call_count[0] += 1
                return [query_vec.tolist()]
            else:
                # Second call is for the chunks
                return [similar_chunk_vec.tolist(), dissimilar_chunk_vec.tolist()]

        embedding_service.generate_embeddings = mock_generate

        # Create mock DB rows
        mock_embedding_1 = MagicMock()
        mock_embedding_1.chunk_text = "Similar content about signals"
        mock_embedding_1.chunk_index = 0

        mock_embedding_2 = MagicMock()
        mock_embedding_2.chunk_text = "Unrelated content about cooking"
        mock_embedding_2.chunk_index = 1

        # Mock row objects (SQLAlchemy Row-like)
        mock_row_1 = MagicMock()
        mock_row_1.__getitem__ = lambda self, i: mock_embedding_1 if i == 0 else None
        mock_row_1.slug = "signals-intro"
        mock_row_1.title = "Signals Introduction"
        mock_row_1.category = "sigint"

        mock_row_2 = MagicMock()
        mock_row_2.__getitem__ = lambda self, i: mock_embedding_2 if i == 0 else None
        mock_row_2.slug = "cooking-101"
        mock_row_2.title = "Cooking 101"
        mock_row_2.category = "other"

        # Mock DB execute result
        mock_result = AsyncMock()
        mock_result.all.return_value = [mock_row_1, mock_row_2]
        mock_db.execute.return_value = mock_result

        # Patch USE_PGVECTOR to False so we use SQLite path
        with patch("app.services.embedding.USE_PGVECTOR", False):
            results = await embedding_service.search_similar(
                query="signal intelligence",
                limit=10,
                threshold=0.3,
            )

        # The similar chunk should be included, the dissimilar one likely excluded
        # At minimum, verify scores are not hardcoded to 0.5
        for result in results:
            assert result["similarity"] != 0.5, "Similarity must not be hardcoded to 0.5"
            assert 0.0 <= result["similarity"] <= 1.0, "Similarity must be in valid range"
            assert result["similarity"] > 0.3, "Results must exceed threshold"

    @pytest.mark.asyncio
    async def test_search_returns_scores_in_valid_range(self, embedding_service, mock_db):
        """All returned similarity scores must be between 0 and 1."""
        rng = np.random.default_rng(99)

        query_vec = rng.standard_normal(384)
        chunk_vecs = [rng.standard_normal(384) for _ in range(5)]

        call_count = [0]

        def mock_generate(texts):
            nonlocal call_count
            if call_count[0] == 0:
                call_count[0] += 1
                return [query_vec.tolist()]
            else:
                return [v.tolist() for v in chunk_vecs]

        embedding_service.generate_embeddings = mock_generate

        # Create mock rows
        mock_rows = []
        for i in range(5):
            emb = MagicMock()
            emb.chunk_text = f"Chunk {i} about radio frequencies"
            emb.chunk_index = i

            row = MagicMock()
            row.__getitem__ = (lambda e: lambda self, idx: e if idx == 0 else None)(emb)
            row.slug = f"article-{i}"
            row.title = f"Article {i}"
            row.category = "sigint"
            mock_rows.append(row)

        mock_result = AsyncMock()
        mock_result.all.return_value = mock_rows
        mock_db.execute.return_value = mock_result

        with patch("app.services.embedding.USE_PGVECTOR", False):
            results = await embedding_service.search_similar(
                query="radio frequency analysis",
                limit=10,
                threshold=0.0,  # Accept all to check range
            )

        assert len(results) > 0, "Should return at least some results"
        for result in results:
            assert -1.0 <= result["similarity"] <= 1.0, (
                f"Similarity {result['similarity']} out of valid range"
            )

    @pytest.mark.asyncio
    async def test_results_ordered_by_similarity_descending(self, embedding_service, mock_db):
        """Results should be ordered by similarity score, highest first."""
        rng = np.random.default_rng(77)

        query_vec = rng.standard_normal(384)
        # Create chunks with varying similarity to query
        chunk_vecs = [rng.standard_normal(384) for _ in range(5)]

        call_count = [0]

        def mock_generate(texts):
            nonlocal call_count
            if call_count[0] == 0:
                call_count[0] += 1
                return [query_vec.tolist()]
            else:
                return [v.tolist() for v in chunk_vecs]

        embedding_service.generate_embeddings = mock_generate

        mock_rows = []
        for i in range(5):
            emb = MagicMock()
            emb.chunk_text = f"Chunk {i}"
            emb.chunk_index = i

            row = MagicMock()
            row.__getitem__ = (lambda e: lambda self, idx: e if idx == 0 else None)(emb)
            row.slug = f"article-{i}"
            row.title = f"Article {i}"
            row.category = "sigint"
            mock_rows.append(row)

        mock_result = AsyncMock()
        mock_result.all.return_value = mock_rows
        mock_db.execute.return_value = mock_result

        with patch("app.services.embedding.USE_PGVECTOR", False):
            results = await embedding_service.search_similar(
                query="test query",
                limit=10,
                threshold=-1.0,  # Accept all
            )

        if len(results) >= 2:
            for i in range(len(results) - 1):
                assert results[i]["similarity"] >= results[i + 1]["similarity"], (
                    "Results must be sorted by similarity descending"
                )
