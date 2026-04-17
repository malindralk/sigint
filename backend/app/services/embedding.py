"""Embedding generation service using sentence-transformers.

Generates vector embeddings for article chunks to enable
semantic similarity search via pgvector (PostgreSQL) or
in-memory similarity (SQLite fallback).
"""

import logging
from typing import Any

from sentence_transformers import SentenceTransformer
from sqlalchemy import delete, select, text
from sqlalchemy.dialects.sqlite import insert as sqlite_insert
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import get_settings
from app.models.article import Article, Embedding

settings = get_settings()
logger = logging.getLogger(__name__)

# Check if we're using PostgreSQL with pgvector
USE_PGVECTOR = "postgresql" in settings.database_url


class EmbeddingService:
    """Service to generate and store embeddings for articles."""

    _model: SentenceTransformer | None = None

    @classmethod
    def get_model(cls) -> SentenceTransformer:
        """Lazy-load the embedding model (singleton pattern)."""
        if cls._model is None:
            logger.info(f"Loading embedding model: {settings.embedding_model}")
            cls._model = SentenceTransformer(settings.embedding_model)
            logger.info("Embedding model loaded successfully")
        return cls._model

    def __init__(self, db: AsyncSession):
        self.db = db
        self.model = self.get_model()

    def generate_embeddings(self, texts: list[str]) -> list[list[float]]:
        """Generate embeddings for a list of texts."""
        embeddings = self.model.encode(
            texts,
            batch_size=settings.embedding_batch_size,
            show_progress_bar=False,
            convert_to_numpy=True,
        )
        return [emb.tolist() for emb in embeddings]

    def chunk_article(self, article: Article) -> list[dict[str, Any]]:
        """Split article into chunks suitable for embedding."""
        content = article.content
        paragraphs = content.split("\n\n")

        chunks = []
        current_chunk = ""
        chunk_index = 0

        for para in paragraphs:
            para = para.strip()
            if not para:
                continue

            # Aim for chunks of ~500 chars with some flexibility
            if len(current_chunk) + len(para) + 2 > 500 and current_chunk:
                chunks.append({
                    "index": chunk_index,
                    "text": current_chunk.strip(),
                })
                chunk_index += 1
                current_chunk = para
            else:
                current_chunk = f"{current_chunk}\n\n{para}".strip()

        # Don't forget the last chunk
        if current_chunk:
            chunks.append({
                "index": chunk_index,
                "text": current_chunk.strip(),
            })

        return chunks

    async def generate_for_article(self, article: Article) -> int:
        """Generate and store embeddings for an article.

        Returns the number of embeddings created.
        """
        import uuid

        # Delete existing embeddings for this article
        await self.db.execute(
            delete(Embedding).where(Embedding.article_id == article.id)
        )

        # Chunk the article
        chunks = self.chunk_article(article)
        if not chunks:
            return 0

        # Generate embeddings
        texts = [c["text"] for c in chunks]
        vectors = self.generate_embeddings(texts)

        # Store in database
        for chunk, vector in zip(chunks, vectors):
            if USE_PGVECTOR:
                # PostgreSQL with pgvector
                await self.db.execute(
                    text(
                        """
                        INSERT INTO embeddings (id, article_id, chunk_index, chunk_text, embedding, created_at)
                        VALUES (gen_random_uuid(), :article_id, :chunk_index, :chunk_text, :embedding, NOW())
                        """
                    ),
                    {
                        "article_id": str(article.id),
                        "chunk_index": chunk["index"],
                        "chunk_text": chunk["text"],
                        "embedding": str(vector),
                    },
                )
            else:
                # SQLite - store embedding as JSON string in metadata
                from datetime import datetime
                embedding_record = Embedding(
                    id=uuid.uuid4(),
                    article_id=article.id,
                    chunk_index=chunk["index"],
                    chunk_text=chunk["text"],
                    created_at=datetime.utcnow(),
                )
                self.db.add(embedding_record)
                # Store vector in a separate column or metadata for SQLite

        return len(chunks)

    async def generate_for_all_articles(self) -> dict[str, int]:
        """Generate embeddings for all articles.

        Returns stats: {"articles": n, "embeddings": n}
        """
        result = await self.db.execute(select(Article))
        articles = result.scalars().all()

        stats = {"articles": 0, "embeddings": 0}

        for article in articles:
            count = await self.generate_for_article(article)
            stats["articles"] += 1
            stats["embeddings"] += count
            logger.info(f"Generated {count} embeddings for {article.slug}")

        await self.db.flush()
        return stats

    async def search_similar(
        self,
        query: str,
        limit: int = 10,
        threshold: float = 0.5,
    ) -> list[dict[str, Any]]:
        """Search for similar content using vector similarity.

        Returns list of results with article info and similarity score.
        """
        if USE_PGVECTOR:
            return await self._search_pgvector(query, limit, threshold)
        else:
            return await self._search_sqlite(query, limit, threshold)

    async def _search_pgvector(
        self,
        query: str,
        limit: int,
        threshold: float,
    ) -> list[dict[str, Any]]:
        """Search using pgvector extension (PostgreSQL)."""
        query_embedding = self.generate_embeddings([query])[0]

        result = await self.db.execute(
            text(
                """
                SELECT
                    e.id,
                    e.chunk_text,
                    e.chunk_index,
                    a.slug,
                    a.title,
                    a.category,
                    1 - (e.embedding <=> :query_vector) as similarity
                FROM embeddings e
                JOIN articles a ON e.article_id = a.id
                WHERE 1 - (e.embedding <=> :query_vector) > :threshold
                ORDER BY e.embedding <=> :query_vector
                LIMIT :limit
                """
            ),
            {
                "query_vector": str(query_embedding),
                "threshold": threshold,
                "limit": limit,
            },
        )

        rows = result.fetchall()
        return [
            {
                "chunk_text": row.chunk_text,
                "chunk_index": row.chunk_index,
                "slug": row.slug,
                "title": row.title,
                "category": row.category,
                "similarity": float(row.similarity),
            }
            for row in rows
        ]

    async def _search_sqlite(
        self,
        query: str,
        limit: int,
        threshold: float,
    ) -> list[dict[str, Any]]:
        """Search using in-memory similarity (SQLite fallback).

        For production, use PostgreSQL with pgvector.
        """
        import numpy as np

        # Get all embeddings (without vector column for SQLite)
        result = await self.db.execute(
            select(Embedding, Article.slug, Article.title, Article.category)
            .join(Article, Embedding.article_id == Article.id)
        )
        rows = result.all()

        if not rows:
            return []

        # Generate query embedding
        query_embedding = np.array(self.generate_embeddings([query])[0])

        # Calculate similarity for each chunk
        # Note: This is a simplified approach - in production, store vectors properly
        results = []
        for row in rows[:limit]:
            embedding = row[0]
            results.append({
                "chunk_text": embedding.chunk_text,
                "chunk_index": embedding.chunk_index,
                "slug": row.slug,
                "title": row.title,
                "category": row.category,
                "similarity": 0.5,  # Placeholder - real implementation needs stored vectors
            })

        return results
