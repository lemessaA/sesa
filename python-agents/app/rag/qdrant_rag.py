"""RAG backed by Qdrant (per-user points with payload filter)."""

from __future__ import annotations

import os
import time
import uuid
from dataclasses import dataclass, field
from typing import Any

import numpy as np
from qdrant_client import QdrantClient
from qdrant_client.models import (
    Distance,
    FieldCondition,
    Filter,
    FilterSelector,
    MatchValue,
    PointIdsList,
    PointStruct,
    VectorParams,
)

from app.rag.embeddings import embed_query, embed_texts, get_model_name

_CHUNK_SIZE = 900
_CHUNK_OVERLAP = 150
_DEFAULT_COL = "sesa_rag"


def _qdrant_url() -> str:
    return (os.environ.get("QDRANT_URL") or os.environ.get("RAG_QDRANT_URL") or "").strip()


def _collection_name() -> str:
    return (os.environ.get("RAG_QDRANT_COLLECTION") or _DEFAULT_COL).strip() or _DEFAULT_COL


def _embedding_dim() -> int:
    env = (os.environ.get("RAG_EMBEDDING_DIM") or "").strip()
    if env.isdigit() and int(env) > 0:
        return int(env)
    from app.rag.embeddings import get_model

    m = get_model()
    d = getattr(m, "get_sentence_embedding_dimension", lambda: 384)()
    return int(d) if d else 384


_client: QdrantClient | None = None


def _get_client() -> QdrantClient:
    global _client
    if _client is None:
        u = _qdrant_url()
        if not u:
            raise RuntimeError("QDRANT_URL (or RAG_QDRANT_URL) is not set for Qdrant RAG")
        # Accept http://host:6333; optional path
        _client = QdrantClient(url=u, timeout=60)
    return _client


def _ensure_collection() -> str:
    client = _get_client()
    col = _collection_name()
    dim = _embedding_dim()
    names = {c.name for c in client.get_collections().collections}
    if col not in names:
        client.create_collection(
            collection_name=col,
            vectors_config=VectorParams(size=dim, distance=Distance.COSINE),
        )
    return col


def _chunk_text(text: str, size: int = _CHUNK_SIZE, overlap: int = _CHUNK_OVERLAP) -> list[str]:
    t = text.strip()
    if not t:
        return []
    if len(t) <= size:
        return [t]
    out: list[str] = []
    i = 0
    while i < len(t):
        out.append(t[i : i + size])
        if i + size >= len(t):
            break
        i += size - overlap
    return out


@dataclass
class QdrantRAGStore:
    user_id: str
    _collection: str
    _dim: int = field(repr=False)

    @classmethod
    def load(cls, user_id: str) -> "QdrantRAGStore":
        _ensure_collection()
        return cls(
            user_id=(user_id or "").strip(),
            _collection=_collection_name(),
            _dim=_embedding_dim(),
        )

    @property
    def has_chunks(self) -> bool:
        c = _get_client()
        try:
            r = c.count(
                self._collection,
                count_filter=Filter(
                    must=[FieldCondition(key="user_id", match=MatchValue(value=self.user_id))]
                ),
            )
            n = r.count if hasattr(r, "count") else (r or 0)
            return int(n) > 0
        except Exception:
            return False

    def _user_filter(self) -> Filter:
        return Filter(must=[FieldCondition(key="user_id", match=MatchValue(value=self.user_id))])

    def _doc_filter(self, source_doc_id: str) -> Filter:
        return Filter(
            must=[
                FieldCondition(key="user_id", match=MatchValue(value=self.user_id)),
                FieldCondition(key="source_doc_id", match=MatchValue(value=source_doc_id)),
            ]
        )

    def add_document(
        self,
        source_doc_id: str,
        source_name: str,
        full_text: str,
        max_chunks_per_doc: int = 500,
        max_total_chunks: int = 4000,
    ) -> int:
        client = _get_client()
        col = self._collection
        # Remove existing chunks for this document
        try:
            client.delete(
                col,
                points_selector=FilterSelector(filter=self._doc_filter(source_doc_id)),
            )
        except Exception:
            pass

        pieces = _chunk_text(full_text)[:max_chunks_per_doc]
        if not pieces:
            return 0
        now = time.time()
        embs = embed_texts(pieces, normalize=True)
        if embs.size == 0:
            return 0

        model_name = get_model_name()
        points: list[PointStruct] = []
        for i, piece in enumerate(pieces):
            vec = [float(x) for x in np.asarray(embs[i]).ravel()[: self._dim]]
            pid = str(uuid.uuid4())
            points.append(
                PointStruct(
                    id=pid,
                    vector=vec,
                    payload={
                        "user_id": self.user_id,
                        "source_doc_id": source_doc_id,
                        "source_name": source_name,
                        "text": piece[:50_000],
                        "model": model_name,
                        "created": now + i * 1e-6,
                    },
                )
            )

        for i in range(0, len(points), 32):
            batch = points[i : i + 32]
            client.upsert(collection_name=col, points=batch)

        self._trim_global_max(max_total_chunks=max_total_chunks)
        return len(pieces)

    def _trim_global_max(self, max_total_chunks: int) -> int:
        client = _get_client()
        col = self._collection
        ufilter = self._user_filter()
        r = client.count(col, count_filter=ufilter)
        n = int(r.count) if hasattr(r, "count") else int(r or 0)
        if n <= max_total_chunks:
            return 0
        overflow = n - max_total_chunks
        # scroll oldest by created
        to_delete: list[str | int] = []
        sc = client.scroll(
            collection_name=col,
            scroll_filter=ufilter,
            limit=overflow + 100,
            with_payload=True,
            with_vectors=False,
        )
        rows = list(getattr(sc, "points", sc[0] if sc else None) or [])
        rows.sort(
            key=lambda p: float((p.payload or {}).get("created", 0.0) if p.payload is not None else 0.0)
        )
        for p in rows[:overflow]:
            to_delete.append(p.id)
        if to_delete:
            client.delete(col, points_selector=PointIdsList(points=to_delete))
        return len(to_delete)

    def remove_document(self, source_doc_id: str) -> int:
        c = _get_client()
        col = self._collection
        before = c.count(
            col,
            count_filter=self._user_filter(),
        )
        b = int(before.count) if hasattr(before, "count") else int(before or 0)
        try:
            c.delete(
                col,
                points_selector=FilterSelector(filter=self._doc_filter(source_doc_id)),
            )
        except Exception:
            return 0
        after = c.count(col, count_filter=self._user_filter())
        a = int(after.count) if hasattr(after, "count") else int(after or 0)
        return max(0, b - a)

    def fallback_diverse_excerpts(
        self, max_docs: int = 3, max_len: int = 1_500
    ) -> list[dict[str, Any]]:
        client = _get_client()
        col = self._collection
        ufilter = self._user_filter()
        r = client.scroll(
            collection_name=col,
            scroll_filter=ufilter,
            limit=200,
            with_payload=True,
            with_vectors=False,
        )
        points = list(getattr(r, "points", r[0] if r else None) or [])
        if not points:
            return []
        # First chunk per source_doc_id
        points.sort(
            key=lambda p: float((p.payload or {}).get("created", 0.0) if p.payload is not None else 0.0)
        )
        seen: set[str] = set()
        out: list[dict[str, Any]] = []
        for p in points:
            pl = p.payload or {}
            if not isinstance(pl, dict):
                continue
            sid = str(pl.get("source_doc_id", ""))
            if sid in seen:
                continue
            seen.add(sid)
            t = (pl.get("text") or "")[:max_len]
            if not t.strip():
                continue
            out.append(
                {
                    "text": t,
                    "source_name": pl.get("source_name", "document"),
                    "source_doc_id": sid,
                    "score": 0.0,
                }
            )
            if len(out) >= max_docs:
                break
        return out

    def search(self, query: str, top_k: int = 5) -> list[dict[str, Any]]:
        if not query.strip() or not self.has_chunks:
            return []
        client = _get_client()
        col = self._collection
        qv = embed_query(query.strip(), normalize=True)
        q_list = [float(x) for x in np.asarray(qv).ravel()[: self._dim]]
        try:
            res = client.search(
                collection_name=col,
                query_vector=q_list,
                query_filter=Filter(
                    must=[FieldCondition(key="user_id", match=MatchValue(value=self.user_id))]
                ),
                limit=top_k,
                with_payload=True,
            )
        except Exception:
            return []
        out: list[dict[str, Any]] = []
        for r in res:
            pl = r.payload or {}
            if not isinstance(pl, dict):
                continue
            sc = float(r.score) if r.score is not None else 0.0
            out.append(
                {
                    "text": (pl.get("text") or "")[:3000],
                    "source_name": pl.get("source_name", "document"),
                    "source_doc_id": pl.get("source_doc_id", ""),
                    "score": sc,
                }
            )
        return out


def search_user_rag_qdrant(user_id: str, query: str, top_k: int = 5) -> list[dict[str, Any]]:
    store = QdrantRAGStore.load(user_id)
    if not store.has_chunks:
        return []
    primary = store.search(query, top_k=top_k)
    if not primary:
        return store.fallback_diverse_excerpts(max_docs=min(3, top_k), max_len=2_000)
    best = max((h.get("score") or 0.0) for h in primary)
    # Cosine similarity on normalized ST vectors: >~0.45 is a decent match
    if best < 0.35:
        fb = store.fallback_diverse_excerpts(max_docs=2, max_len=1_200)
        merged: list[dict[str, Any]] = []
        seen: set[str] = set()
        for h in primary[:2] + fb:
            key = f"{h.get('source_doc_id')}_{(h.get('text') or '')[:40]}"
            if key in seen:
                continue
            seen.add(key)
            merged.append(h)
            if len(merged) >= top_k:
                break
        return merged[:top_k]
    return primary


def ingest_user_document_qdrant(
    user_id: str, source_doc_id: str, source_name: str, full_text: str, max_total_chunks: int = 4000
) -> int:
    store = QdrantRAGStore.load(user_id)
    return store.add_document(
        source_doc_id, source_name, full_text, max_total_chunks=max_total_chunks
    )
