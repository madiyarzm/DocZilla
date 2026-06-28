"""A tiny, dependency-light vector store.

Holds embeddings + chunk text + rich metadata, scores queries with cosine
similarity (vectors are pre-normalized so cosine == dot product), and persists
to a pickle file. This stands in for FAISS — same role, but zero install risk,
which keeps the demo reliable on any machine. Swapping in faiss-cpu later only
touches this file.
"""
from __future__ import annotations

import os
import pickle
from dataclasses import dataclass, field
from typing import Any, Dict, List

import numpy as np

from utils.embeddings import embed_text, embed_texts


@dataclass
class StoredChunk:
    content: str
    metadata: Dict[str, Any] = field(default_factory=dict)


class VectorStore:
    def __init__(self, path: str):
        self.path = path
        self.embeddings: np.ndarray | None = None  # (n, dim)
        self.chunks: List[StoredChunk] = []
        self._load()

    # ---- persistence -------------------------------------------------
    def _load(self):
        if os.path.exists(self.path):
            try:
                with open(self.path, "rb") as f:
                    data = pickle.load(f)
                self.embeddings = data.get("embeddings")
                self.chunks = [
                    StoredChunk(c["content"], c.get("metadata", {}))
                    for c in data.get("chunks", [])
                ]
            except Exception:
                self.embeddings, self.chunks = None, []

    def _save(self):
        os.makedirs(os.path.dirname(self.path), exist_ok=True)
        with open(self.path, "wb") as f:
            pickle.dump(
                {
                    "embeddings": self.embeddings,
                    "chunks": [
                        {"content": c.content, "metadata": c.metadata}
                        for c in self.chunks
                    ],
                },
                f,
            )

    # ---- mutation ----------------------------------------------------
    def reset(self):
        self.embeddings, self.chunks = None, []
        self._save()

    def add(self, contents: List[str], metadatas: List[Dict[str, Any]]):
        if not contents:
            return
        vecs = embed_texts(contents)
        if self.embeddings is None:
            self.embeddings = vecs
        else:
            self.embeddings = np.vstack([self.embeddings, vecs])
        for content, meta in zip(contents, metadatas):
            self.chunks.append(StoredChunk(content, meta))
        self._save()

    # ---- query -------------------------------------------------------
    def search(self, query: str, k: int = 5) -> List[Dict[str, Any]]:
        if self.embeddings is None or not self.chunks:
            return []
        q = embed_text(query)
        scores = self.embeddings @ q  # cosine (normalized vectors)
        top = np.argsort(scores)[::-1][:k]
        return [
            {
                "content": self.chunks[i].content,
                "metadata": self.chunks[i].metadata,
                "score": float(scores[i]),
            }
            for i in top
        ]

    def __len__(self):
        return len(self.chunks)
