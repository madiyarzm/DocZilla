"""Trending FAQ tracker (Phase 6) — IN-MEMORY ONLY.

Counts query frequency for the current process. Semantically similar questions
(> 0.85 cosine) are merged into one entry. This resets on restart — in
production you'd back this with Redis; for the demo, in-memory is fine.
"""
from __future__ import annotations

import threading
from typing import Any, Dict, List

import numpy as np

from utils.embeddings import embed_text

_SIM_THRESHOLD = 0.85
_lock = threading.Lock()

# Each entry: {"question": str, "count": int, "embedding": np.ndarray}
_entries: List[Dict[str, Any]] = []


def record_query(question: str) -> None:
    question = question.strip()
    if not question:
        return
    emb = embed_text(question)
    with _lock:
        for entry in _entries:
            if float(np.dot(entry["embedding"], emb)) >= _SIM_THRESHOLD:
                entry["count"] += 1
                return
        _entries.append({"question": question, "count": 1, "embedding": emb})


def top_questions(limit: int = 10) -> List[Dict[str, Any]]:
    with _lock:
        ranked = sorted(_entries, key=lambda e: e["count"], reverse=True)[:limit]
        return [{"question": e["question"], "count": e["count"]} for e in ranked]


def reset() -> None:
    with _lock:
        _entries.clear()
