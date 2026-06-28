"""Local, free embeddings.

Primary path: sentence-transformers (all-MiniLM-L6-v2, 384-dim).
Fallback path: a deterministic hashing bag-of-words embedder, so the app stays
fully demoable even when sentence-transformers / torch is not installed.

Either way the public API is the same: `embed_texts(list[str]) -> np.ndarray`
returning L2-normalized float32 vectors, and `cosine_sim` for scoring.
"""
from __future__ import annotations

import hashlib
import re
from typing import List

import numpy as np

_model = None
_backend = None  # "sentence-transformers" | "hashing"
_HASH_DIM = 512


def _load():
    global _model, _backend
    if _backend is not None:
        return
    try:
        from sentence_transformers import SentenceTransformer

        _model = SentenceTransformer("all-MiniLM-L6-v2")
        _backend = "sentence-transformers"
    except Exception:
        _model = None
        _backend = "hashing"


def backend_name() -> str:
    _load()
    return _backend


_token_re = re.compile(r"[a-z0-9]+")


def _hash_embed(text: str) -> np.ndarray:
    vec = np.zeros(_HASH_DIM, dtype=np.float32)
    tokens = _token_re.findall(text.lower())
    for tok in tokens:
        h = int(hashlib.md5(tok.encode()).hexdigest(), 16)
        vec[h % _HASH_DIM] += 1.0
    return vec


def embed_texts(texts: List[str]) -> np.ndarray:
    """Return an (n, dim) array of L2-normalized embeddings."""
    _load()
    if not texts:
        return np.zeros((0, _HASH_DIM), dtype=np.float32)

    if _backend == "sentence-transformers":
        vecs = _model.encode(
            texts, convert_to_numpy=True, normalize_embeddings=True
        )
        return vecs.astype(np.float32)

    vecs = np.vstack([_hash_embed(t) for t in texts])
    norms = np.linalg.norm(vecs, axis=1, keepdims=True)
    norms[norms == 0] = 1.0
    return (vecs / norms).astype(np.float32)


def embed_text(text: str) -> np.ndarray:
    return embed_texts([text])[0]


def cosine_sim(a: np.ndarray, b: np.ndarray) -> float:
    """Cosine similarity between two (already-normalized) vectors."""
    return float(np.dot(a, b))
