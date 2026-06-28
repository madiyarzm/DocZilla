"""Citation helpers (Phase 4).

A citation always has the shape:
    {filename, page, section, clause_id, exact_text_snippet, score}

The frontend uses these to highlight the exact source passage. No chat answer
is served without at least attempting a citation; if retrieval finds nothing we
return an explicit "no source" marker instead of letting the model hallucinate.
"""
from __future__ import annotations

from typing import Any, Dict, List


def build_citation(chunk: Dict[str, Any], max_len: int = 320) -> Dict[str, Any]:
    meta = chunk.get("metadata", {})
    snippet = chunk.get("content", "").strip()
    if len(snippet) > max_len:
        snippet = snippet[:max_len].rsplit(" ", 1)[0] + "…"
    return {
        "filename": meta.get("filename", "unknown"),
        "page": meta.get("page", 1),
        "section": meta.get("section", ""),
        "clause_id": meta.get("clause_id"),
        "exact_text_snippet": snippet,
        "score": round(float(chunk.get("score", 0.0)), 4),
    }


def build_citations(chunks: List[Dict[str, Any]], min_score: float = 0.05) -> List[Dict[str, Any]]:
    return [build_citation(c) for c in chunks if c.get("score", 0) >= min_score]
