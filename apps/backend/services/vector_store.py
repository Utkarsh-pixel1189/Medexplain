"""
Vector store abstraction. Ships with a simple in-process implementation
(good for local dev / demos) plus a documented seam for swapping in Pinecone,
Milvus, Weaviate, or Supabase Vector — the roadmap intentionally avoids
locking the project to one provider.
"""
import math
from abc import ABC, abstractmethod

from core.config import get_settings

settings = get_settings()


class VectorStore(ABC):
    @abstractmethod
    def upsert(self, vector_id: str, embedding: list[float], metadata: dict) -> None: ...

    @abstractmethod
    def query(self, embedding: list[float], top_k: int, filter: dict | None = None) -> list[dict]:
        """Returns [{id, score, metadata}, ...] sorted by descending similarity."""
        ...

    @abstractmethod
    def delete(self, vector_id: str) -> None: ...


def _cosine(a: list[float], b: list[float]) -> float:
    dot = sum(x * y for x, y in zip(a, b))
    na = math.sqrt(sum(x * x for x in a))
    nb = math.sqrt(sum(y * y for y in b))
    return dot / (na * nb + 1e-9)


class InMemoryVectorStore(VectorStore):
    """Cosine-similarity brute force store, held in RAM. Resets every time the
    backend restarts — use PostgresVectorStore below for anything you want to
    survive a restart."""

    def __init__(self):
        self._store: dict[str, tuple[list[float], dict]] = {}

    def upsert(self, vector_id, embedding, metadata):
        self._store[vector_id] = (embedding, metadata)

    def delete(self, vector_id):
        self._store.pop(vector_id, None)

    def query(self, embedding, top_k, filter=None):
        results = []
        for vid, (vec, meta) in self._store.items():
            if filter and not all(meta.get(k) == v for k, v in filter.items()):
                continue
            results.append({"id": vid, "score": _cosine(embedding, vec), "metadata": meta})
        results.sort(key=lambda r: r["score"], reverse=True)
        return results[:top_k]


class PostgresVectorStore(VectorStore):
    """Persists embeddings in the `embeddings` table you already have, so QA
    keeps working across backend restarts — no extra service required.
    Brute-force cosine similarity is fine at personal scale (hundreds to a
    few thousand chunks); swap in pgvector or Pinecone if you ever outgrow it."""

    def upsert(self, vector_id, embedding, metadata):
        from core.db import SessionLocal
        from models.models import Embedding as EmbeddingModel

        db = SessionLocal()
        try:
            row = db.query(EmbeddingModel).filter(EmbeddingModel.vector_ref == vector_id).first()
            if row is None:
                row = EmbeddingModel(vector_ref=vector_id, provider="mistral")
                db.add(row)
            row.vector = embedding
            row.meta = metadata
            db.commit()
        finally:
            db.close()

    def query(self, embedding, top_k, filter=None):
        from core.db import SessionLocal
        from models.models import Embedding as EmbeddingModel

        db = SessionLocal()
        try:
            rows = db.query(EmbeddingModel).filter(EmbeddingModel.vector.isnot(None)).all()
            results = []
            for row in rows:
                meta = row.meta or {}
                if filter and not all(meta.get(k) == v for k, v in filter.items()):
                    continue
                results.append({"id": row.vector_ref, "score": _cosine(embedding, row.vector), "metadata": meta})
            results.sort(key=lambda r: r["score"], reverse=True)
            return results[:top_k]
        finally:
            db.close()

    def delete(self, vector_id):
        from core.db import SessionLocal
        from models.models import Embedding as EmbeddingModel

        db = SessionLocal()
        try:
            db.query(EmbeddingModel).filter(EmbeddingModel.vector_ref == vector_id).delete()
            db.commit()
        finally:
            db.close()


class PineconeVectorStore(VectorStore):
    """Skeleton for swapping to Pinecone. Fill in once you've provisioned an
    index (pip install pinecone-client, then set PINECONE_API_KEY / PINECONE_INDEX)."""

    def __init__(self):
        try:
            from pinecone import Pinecone
        except ImportError as e:
            raise RuntimeError("Install pinecone-client to use PineconeVectorStore") from e
        pc = Pinecone(api_key=settings.PINECONE_API_KEY)
        self.index = pc.Index(settings.PINECONE_INDEX)

    def upsert(self, vector_id, embedding, metadata):
        self.index.upsert(vectors=[(vector_id, embedding, metadata)])

    def query(self, embedding, top_k, filter=None):
        res = self.index.query(vector=embedding, top_k=top_k, filter=filter, include_metadata=True)
        return [{"id": m.id, "score": m.score, "metadata": m.metadata} for m in res.matches]

    def delete(self, vector_id):
        self.index.delete(ids=[vector_id])


_singleton: VectorStore | None = None


def get_vector_store() -> VectorStore:
    global _singleton
    if _singleton is not None:
        return _singleton
    if settings.VECTOR_STORE_PROVIDER == "pinecone":
        _singleton = PineconeVectorStore()
    elif settings.VECTOR_STORE_PROVIDER == "postgres":
        _singleton = PostgresVectorStore()
    else:
        _singleton = InMemoryVectorStore()
    return _singleton
