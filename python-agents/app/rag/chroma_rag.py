"""Local Chroma RAG (optional; load only when RAG_VECTOR_BACKEND=chroma or MONGO_URI unset)."""

from __future__ import annotations

import json
import os
import re
import time
import uuid
from dataclasses import dataclass, field
from pathlib import Path
from typing import Any

import chromadb
from chromadb import Collection
from chromadb.utils import embedding_functions

# Relative to package parent (python-agents/)


def _data_root() -> Path:
    base = os.environ.get("RAG_DATA_DIR", "").strip()
    if base:
        return Path(base)
    return Path(__file__).resolve().parent.parent.parent / "data" / "rag"


def _user_dir(user_id: str) -> Path:
    safe = re.sub(r"[^\w\-.]+", "_", user_id)[:200]
    p = _data_root() / safe
    p.mkdir(parents=True, exist_ok=True)
    return p


def _collection_name(user_id: str) -> str:
    safe = re.sub(r"[^\w\-.]+", "_", user_id)[:200]
    name = f"u_{safe}"
    if len(name) > 500:
        import hashlib

        name = "u_" + hashlib.sha256(user_id.encode()).hexdigest()[:48]
    return name


_embedding_fn: Any = None


def _get_embedding_fn() -> Any:
    global _embedding_fn
    if _embedding_fn is None:
        model = os.environ.get("RAG_EMBEDDING_MODEL", "all-MiniLM-L6-v2").strip()
        _embedding_fn = embedding_functions.SentenceTransformerEmbeddingFunction(model_name=model)
    return _embedding_fn


def _chroma_client() -> chromadb.PersistentClient:
    path = _data_root() / "chroma_db"
    path.mkdir(parents=True, exist_ok=True)
    return chromadb.PersistentClient(path=str(path))


def _get_collection(user_id: str) -> Collection:
    client = _chroma_client()
    name = _collection_name(user_id)
    return client.get_or_create_collection(
        name=name,
        embedding_function=_get_embedding_fn(),
        metadata={"user_id": user_id},
    )


def _migrate_json_if_needed(user_id: str, col: Collection) -> None:
    legacy = _user_dir(user_id) / "store.json"
    if not legacy.exists() or col.count() > 0:
        return
    try:
        raw = json.loads(legacy.read_text(encoding="utf-8"))
        chunks = raw.get("chunks") or []
        if not isinstance(chunks, list) or not chunks:
            return
    except Exception:
        return
    ids: list[str] = []
    docs: list[str] = []
    metas: list[dict[str, Any]] = []
    now = time.time()
    for i, c in enumerate(chunks):
        t = (c.get("text") or "").strip()
        if not t:
            continue
        ids.append(str(c.get("id") or f"mig_{i}_{uuid.uuid4().hex[:8]}"))
        docs.append(t[:50_000])
        metas.append(
            {
                "source_doc_id": str(c.get("source_doc_id") or ""),
                "source_name": str(c.get("source_name") or "document"),
                "created": float(now + i * 1e-6),
            }
        )
    if not ids:
        return
    batch = 128
    for i in range(0, len(ids), batch):
        col.add(ids=ids[i : i + batch], documents=docs[i : i + batch], metadatas=metas[i : i + batch])
    try:
        legacy.rename(legacy.with_suffix(".json.bak"))
    except OSError:
        pass


@dataclass
class ChromaRAGStore:
    user_id: str
    _collection: Collection | None = None
    chunks: list[dict[str, Any]] = field(default_factory=list)

    @classmethod
    def load(cls, user_id: str) -> "ChromaRAGStore":
        col = _get_collection(user_id)
        _migrate_json_if_needed(user_id, col)
        return cls(user_id=user_id, _collection=col, chunks=[])

    @property
    def _col(self) -> Collection:
        assert self._collection is not None
        return self._collection

    @property
    def has_chunks(self) -> bool:
        try:
            return self._col.count() > 0
        except Exception:
            return False

    def save(self) -> None:
        return

    def _chunk_text(self, text: str, size: int = 900, overlap: int = 150) -> list[str]:
        t = text.strip()
        if not t:
            return []
        if len(t) <= size:
            return [t]
        out: list[str] = []
        i = 0
        while i < len(t):
            piece = t[i : i + size]
            out.append(piece)
            if i + size >= len(t):
                break
            i += size - overlap
        return out

    def add_document(
        self,
        source_doc_id: str,
        source_name: str,
        full_text: str,
        max_chunks_per_doc: int = 500,
        max_total_chunks: int = 4000,
    ) -> int:
        col = self._col
        try:
            col.delete(where={"source_doc_id": source_doc_id})
        except Exception:
            pass
        pieces = self._chunk_text(full_text)[:max_chunks_per_doc]
        if not pieces:
            return 0
        now = time.time()
        ids: list[str] = []
        docs: list[str] = []
        metas: list[dict[str, Any]] = []
        for i, piece in enumerate(pieces):
            ids.append(str(uuid.uuid4()))
            docs.append(piece)
            metas.append(
                {
                    "source_doc_id": source_doc_id,
                    "source_name": source_name,
                    "created": now + i * 1e-6,
                }
            )
        col.add(ids=ids, documents=docs, metadatas=metas)
        self._trim_global_max(max_total_chunks=max_total_chunks)
        return len(pieces)

    def _trim_global_max(self, max_total_chunks: int = 4000) -> None:
        col = self._col
        try:
            n = col.count()
        except Exception:
            return
        if n <= max_total_chunks:
            return
        overflow = n - max_total_chunks
        data = col.get(include=["metadatas"])
        metas = data.get("metadatas") or []
        ids_list = data.get("ids") or []
        if not ids_list or not metas:
            return
        pairs: list[tuple[float, str]] = []
        for i, mid in enumerate(ids_list):
            m = metas[i] if i < len(metas) else {}
            created = float(m.get("created") or 0.0) if isinstance(m, dict) else 0.0
            pairs.append((created, mid))
        pairs.sort(key=lambda x: x[0])
        to_delete = [pid for _, pid in pairs[:overflow]]
        if to_delete:
            col.delete(ids=to_delete)

    def remove_document(self, source_doc_id: str) -> int:
        col = self._col
        before = col.count()
        try:
            col.delete(where={"source_doc_id": source_doc_id})
        except Exception:
            return 0
        after = col.count()
        return max(0, before - after)

    def clear_user(self) -> None:
        name = _collection_name(self.user_id)
        client = _chroma_client()
        try:
            client.delete_collection(name)
        except Exception:
            pass
        _ = _get_collection(self.user_id)

    def fallback_diverse_excerpts(
        self, max_docs: int = 3, max_len: int = 1_500
    ) -> list[dict[str, Any]]:
        col = self._col
        if col.count() == 0:
            return []
        data = col.get(include=["documents", "metadatas"])
        docs = data.get("documents") or []
        metas = data.get("metadatas") or []
        seen: set[str] = set()
        out: list[dict[str, Any]] = []
        for i, text in enumerate(docs):
            m = metas[i] if i < len(metas) else {}
            if not isinstance(m, dict):
                m = {}
            sid = str(m.get("source_doc_id", ""))
            if sid in seen:
                continue
            seen.add(sid)
            t = (text or "")[:max_len]
            if not t.strip():
                continue
            out.append(
                {
                    "text": t,
                    "source_name": m.get("source_name", "document"),
                    "source_doc_id": sid,
                    "score": 0.0,
                }
            )
            if len(out) >= max_docs:
                break
        return out

    def search(self, query: str, top_k: int = 5) -> list[dict[str, Any]]:
        col = self._col
        if not query.strip() or col.count() == 0:
            return []
        try:
            res = col.query(
                query_texts=[query.strip()],
                n_results=min(top_k, max(1, col.count())),
                include=["documents", "metadatas", "distances"],
            )
        except Exception:
            return []
        dists = (res.get("distances") or [[]])[0]
        docss = (res.get("documents") or [[]])[0]
        metss = (res.get("metadatas") or [[]])[0]
        out: list[dict[str, Any]] = []
        for i, text in enumerate(docss):
            m = metss[i] if i < len(metss) else {}
            if not isinstance(m, dict):
                m = {}
            d = dists[i] if i < len(dists) else 0.0
            score = 1.0 / (1.0 + float(d))
            out.append(
                {
                    "text": (text or "")[:3000],
                    "source_name": m.get("source_name", "document"),
                    "source_doc_id": m.get("source_doc_id", ""),
                    "score": score,
                }
            )
        return out


def search_user_rag_chroma(user_id: str, query: str, top_k: int = 5) -> list[dict[str, Any]]:
    store = ChromaRAGStore.load(user_id)
    if not store.has_chunks:
        return []
    primary = store.search(query, top_k=top_k)
    if not primary:
        return store.fallback_diverse_excerpts(max_docs=min(3, top_k), max_len=2_000)
    best = max((h.get("score") or 0.0) for h in primary)
    if best < 0.12:
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


def ingest_user_document_chroma(
    user_id: str, source_doc_id: str, source_name: str, full_text: str, max_total_chunks: int = 4000
) -> int:
    store = ChromaRAGStore.load(user_id)
    return store.add_document(
        source_doc_id, source_name, full_text, max_total_chunks=max_total_chunks
    )
