"""Metadata-rich chunking.

Every chunk carries source metadata so any downstream answer can cite it:
    {filename, page, section, clause_id, category}

`chunk_elements` works on Upstage's structured elements (preserves page +
section headings). `chunk_text` handles flat text (OCR output, .txt) by
splitting on blank lines and inferring section headings heuristically.
"""
from __future__ import annotations

import re
from typing import Any, Dict, List

from utils.upstage import HEADING_CATEGORIES

MAX_CHARS = 1200  # soft cap per chunk


def _new_chunk(filename, page, section, clause_id, category, text) -> Dict[str, Any]:
    return {
        "content": text.strip(),
        "metadata": {
            "filename": filename,
            "page": page,
            "section": section,
            "clause_id": clause_id,
            "category": category,
        },
    }


def chunk_elements(elements: List[Dict[str, Any]], filename: str) -> List[Dict[str, Any]]:
    chunks: List[Dict[str, Any]] = []
    section = "Introduction"
    clause_id = 0
    for el in elements:
        text = el["text"].strip()
        if not text:
            continue
        if el["category"] in HEADING_CATEGORIES and len(text) < 160:
            section = text
            continue
        # Split overly long elements on sentence boundaries.
        for piece in _split_long(text):
            clause_id += 1
            chunks.append(
                _new_chunk(
                    filename, el["page"], section, clause_id, el["category"], piece
                )
            )
    return chunks


def chunk_text(text: str, filename: str) -> List[Dict[str, Any]]:
    chunks: List[Dict[str, Any]] = []
    section = "Introduction"
    clause_id = 0
    blocks = [b.strip() for b in re.split(r"\n\s*\n", text) if b.strip()]
    for block in blocks:
        # A short, title-like line becomes the current section.
        if len(block) < 80 and "\n" not in block and not block.endswith("."):
            section = block
            continue
        for piece in _split_long(block):
            clause_id += 1
            chunks.append(
                _new_chunk(filename, 1, section, clause_id, "paragraph", piece)
            )
    if not chunks and text.strip():
        chunks.append(_new_chunk(filename, 1, section, 1, "paragraph", text))
    return chunks


def _split_long(text: str) -> List[str]:
    if len(text) <= MAX_CHARS:
        return [text]
    sentences = re.split(r"(?<=[.!?])\s+", text)
    out, cur = [], ""
    for s in sentences:
        if len(cur) + len(s) > MAX_CHARS and cur:
            out.append(cur.strip())
            cur = s
        else:
            cur = f"{cur} {s}".strip()
    if cur:
        out.append(cur.strip())
    return out
