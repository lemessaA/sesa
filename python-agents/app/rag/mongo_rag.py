"""
RAG chunks stored in MongoDB with embedding[] for Atlas Vector Search.
Falls back to in-process cosine ranking when RAG_ATLAS_VECTOR_INDEX is unset
(e.g. local Mongo without a vector search index).
"""

from __future__ import annotations

import os
from datetime import datetime, timezone
from typing import Any
from urllib.parse import urlparse, unquote

import numpy as np
from bson import ObjectId
from bson.errors import InvalidId
from pymongo import ASCENDING, MongoClient
from pymongo.collection import Collection
from pymongo.database import Database

from app.rag.embeddings import embed_query, embed_texts, get_model_name

# all-MiniLM-L6-v2
_EMBEDDING_DIMS = 384


def _mongo_uri() -> str:
    return (os.environ.get("MONGODB_URI") or os.environ.get("MONGO_URI") or "").strip()


def _db_from_uri(uri: str) -> str:
    try:
        path = urlparse(uri).path or ""
        name = (path[1:].split("?")[0] or "").strip()
        if name:
            return unquote(name)
    except Exception:
        pass
    return "sesa_db"


def _get_client() -> MongoClient:
    uri = _mongo_uri()
    if not uri:
        raise RuntimeError("MONGO_URI (or MONGODB_URI) is not set for Mongo RAG")
    return MongoClient(uri, serverSelectionTimeoutMS=20_000)


def _coll() -> Collection:
    name = (os.environ.get("RAG_MONGO_COLLECTION") or "rag_chunks").strip() or "rag_chunks"
    client = _get_client()
    db: Database = client[_db_from_uri(_mongo_uri())]
    return db[name]


def _user_oid(user_id: str) -> ObjectId:
    s = (user_id or "").strip()
    if len(s) == 24:
        try:
            return ObjectId(s)
        except InvalidId:
            pass
    # Deterministic synthetic id for non-ObjectId test ids (not ideal for production filters)
    raise ValueError("user_id must be a 24-char hex MongoDB ObjectId string for RAG.")


def _atlas_index_name() -> str:
    return (os.environ.get("RAG_ATLAS_VECTOR_INDEX") or "").strip()


def _chunk_text(text: str, size: int = 900, overlap: int = 150) -> list[str]:
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


def _search_vector_atlas(
    collection: Collection, user_oid: ObjectId, query_vector: list[float], top_k: int
) -> list[dict[str, Any]]:
    index = _atlas_index_name()
    if not index:
        return []
    try:
        pipeline: list[dict[str, Any]] = [
            {
                "$vectorSearch": {
                    "index": index,
                    "path": "embedding",
                    "queryVector": query_vector,
                    "numCandidates": min(200, top_k * 40),
                    "limit": top_k,
                    "filter": {"userId": user_oid},
                }
            },
            {
                "$project": {
                    "text": 1,
                    "sourceName": 1,
                    "documentId": 1,
                    "score": {"$meta": "vectorSearchScore"},
                }
            },
        ]
        return list(collection.aggregate(pipeline))
    except Exception:
        return []


def _search_python(
    collection: Collection, user_oid: ObjectId, qvec: np.ndarray, top_k: int, max_scan: int = 5000
) -> list[dict[str, Any]]:
    cur = collection.find(
        {"userId": user_oid},
        {"text": 1, "sourceName": 1, "documentId": 1, "embedding": 1},
    ).limit(int(max_scan))
    rows = list(cur)
    if not rows:
        return []
    embs: list[np.ndarray] = []
    metas: list[dict[str, Any]] = []
    for r in rows:
        emb = r.get("embedding")
        if not emb or not isinstance(emb, list):
            continue
        a = np.asarray(emb, dtype=np.float32)
        if a.size != _EMBEDDING_DIMS:
            continue
        embs.append(a)
        metas.append(r)
    if not embs:
        return []
    mat = np.stack(embs)
    sims = mat @ qvec.astype(np.float32)
    idx = np.argsort(-sims)[: top_k * 2]
    out: list[dict[str, Any]] = []
    for i in idx:
        r = metas[int(i)]
        t = (r.get("text") or "")[:3000]
        out.append(
            {
                "text": t,
                "source_name": r.get("sourceName", "document"),
                "source_doc_id": str(r.get("documentId", "")),
                "score": float(sims[int(i)]),
            }
        )
    return out[:top_k]


def _search_hybrid(
    collection: Collection, user_id: str, query: str, top_k: int
) -> list[dict[str, Any]]:
    oid = _user_oid(user_id)
    qv = embed_query(query.strip())
    q_list = [float(x) for x in qv.tolist()]
    atlas = _search_vector_atlas(collection, oid, q_list, top_k)
    if atlas:
        return [
            {
                "text": (d.get("text") or "")[:3000],
                "source_name": d.get("sourceName", "document"),
                "source_doc_id": str(d.get("documentId", "")),
                "score": float(d.get("score") or 0.0),
            }
            for d in atlas
        ]
    return _search_python(collection, oid, qv, top_k)


def _fallback_diverse(
    collection: Collection, user_oid: ObjectId, max_docs: int, max_len: int
) -> list[dict[str, Any]]:
    seen: set[str] = set()
    out: list[dict[str, Any]] = []
    cur = collection.find(
        {"userId": user_oid},
        {"text": 1, "sourceName": 1, "documentId": 1},
    ).sort("created", ASCENDING)
    for r in cur:
        did = str(r.get("documentId", ""))
        if did in seen:
            continue
        seen.add(did)
        t = (r.get("text") or "")[:max_len]
        if not t.strip():
            continue
        out.append(
            {
                "text": t,
                "source_name": r.get("sourceName", "document"),
                "source_doc_id": did,
                "score": 0.0,
            }
        )
        if len(out) >= max_docs:
            break
    return out


def _trim_user_global(collection: Collection, user_oid: ObjectId, max_total: int) -> None:
    n = collection.count_documents({"userId": user_oid})
    if n <= max_total:
        return
    overflow = n - max_total
    # Oldest by created
    old = list(
        collection.find({"userId": user_oid}, {"_id": 1}).sort("created", ASCENDING).limit(overflow)
    )
    ids = [x["_id"] for x in old if x.get("_id")]
    if ids:
        collection.delete_many({"_id": {"$in": ids}})


class MongoRAGStore:
    def __init__(self, user_id: str, collection: Collection) -> None:
        self.user_id = user_id
        self._coll = collection
        self.chunks: list[dict[str, Any]] = []

    @classmethod
    def load(cls, user_id: str) -> "MongoRAGStore":
        return cls((user_id or "").strip(), _coll())

    @property
    def has_chunks(self) -> bool:
        try:
            return self._coll.count_documents({"userId": _user_oid(self.user_id)}) > 0
        except (InvalidId, ValueError):
            return False
        except Exception:
            return False

    def save(self) -> None:
        return

    def add_document(
        self,
        source_doc_id: str,
        source_name: str,
        full_text: str,
        max_chunks_per_doc: int = 500,
        max_total_chunks: int = 4000,
    ) -> int:
        oid = _user_oid(self.user_id)
        self._coll.delete_many({"userId": oid, "documentId": source_doc_id})
        pieces = _chunk_text(full_text)[:max_chunks_per_doc]
        if not pieces:
            return 0
        embs = embed_texts(pieces, normalize=True)
        now = datetime.now(timezone.utc)
        model_name = get_model_name()
        docs: list[dict[str, Any]] = []
        for i, (piece, row) in enumerate(zip(pieces, embs)):
            emb = [float(x) for x in row.tolist()]
            docs.append(
                {
                    "userId": oid,
                    "documentId": source_doc_id,
                    "sourceName": source_name,
                    "chunkIndex": i,
                    "text": piece,
                    "embedding": emb,
                    "model": model_name,
                    "created": now,
                }
            )
        if docs:
            self._coll.insert_many(docs, ordered=True)
        _trim_user_global(self._coll, oid, max_total_chunks)
        return len(pieces)

    def remove_document(self, source_doc_id: str) -> int:
        oid = _user_oid(self.user_id)
        before = self._coll.count_documents({"userId": oid, "documentId": source_doc_id})
        self._coll.delete_many({"userId": oid, "documentId": source_doc_id})
        return int(before)

    def clear_user(self) -> None:
        oid = _user_oid(self.user_id)
        self._coll.delete_many({"userId": oid})

    def fallback_diverse_excerpts(self, max_docs: int = 3, max_len: int = 1500) -> list[dict[str, Any]]:
        oid = _user_oid(self.user_id)
        return _fallback_diverse(self._coll, oid, max_docs, max_len)

    def search(self, query: str, top_k: int = 5) -> list[dict[str, Any]]:
        if not query.strip() or not self.has_chunks:
            return []
        try:
            return _search_hybrid(self._coll, self.user_id, query, top_k)
        except (InvalidId, ValueError):
            return []


def search_user_rag_mongo(user_id: str, query: str, top_k: int = 5) -> list[dict[str, Any]]:
    store = MongoRAGStore.load(user_id)
    if not store.has_chunks:
        return []
    primary = store.search(query, top_k=top_k)
    if not primary:
        return store.fallback_diverse_excerpts(max_docs=min(3, top_k), max_len=2_000)
    best = max((h.get("score") or 0.0) for h in primary)
    if best < 0.05:
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


def ingest_user_document_mongo(
    user_id: str, source_doc_id: str, source_name: str, full_text: str, max_total_chunks: int = 4000
) -> int:
    store = MongoRAGStore.load(user_id)
    return store.add_document(
        source_doc_id, source_name, full_text, max_total_chunks=max_total_chunks
    )
