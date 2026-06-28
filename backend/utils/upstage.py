"""Upstage Document Parse + OCR helpers.

Document Parse returns *structured* elements (category, page, text) which we
turn into chunks that preserve section/clause metadata. OCR is used for plain
images / scanned receipts and returns flat text.

Docs: https://console.upstage.ai/docs/capabilities/document-digitization
"""
from __future__ import annotations

from typing import Any, Dict, List

import requests

from config import UPSTAGE_API_KEY

DIGITIZATION_URL = "https://api.upstage.ai/v1/document-digitization"

# Upstage element categories that mark the start of a new section.
HEADING_CATEGORIES = {"heading1", "header", "title", "index"}


def _require_key():
    if not UPSTAGE_API_KEY:
        raise RuntimeError(
            "UPSTAGE_API_KEY is not set. Add it to backend/.env "
            "(get $10 free credits at https://console.upstage.ai)."
        )


def _element_text(element: Dict[str, Any]) -> str:
    content = element.get("content") or {}
    return (content.get("text") or content.get("markdown") or "").strip()


def parse_document(file_path: str) -> List[Dict[str, Any]]:
    """Parse a PDF/image/DOCX into a list of structured elements.

    Each returned element: {text, category, page}.
    """
    _require_key()
    with open(file_path, "rb") as fh:
        resp = requests.post(
            DIGITIZATION_URL,
            headers={"Authorization": f"Bearer {UPSTAGE_API_KEY}"},
            files={"document": fh},
            data={
                "model": "document-parse",
                "ocr": "auto",
                "coordinates": "false",
                "output_formats": '["text"]',
            },
            timeout=120,
        )
    if resp.status_code != 200:
        raise RuntimeError(f"Upstage document parse failed: {resp.text}")

    result = resp.json()
    elements = []
    for el in result.get("elements", []):
        text = _element_text(el)
        if not text:
            continue
        elements.append(
            {
                "text": text,
                "category": el.get("category", "paragraph"),
                "page": int(el.get("page", 1) or 1),
            }
        )

    # Fallback: some responses only populate the top-level content.
    if not elements:
        content = result.get("content") or {}
        text = (content.get("text") or content.get("markdown") or "").strip()
        if text:
            elements.append({"text": text, "category": "paragraph", "page": 1})
    return elements


def ocr_image(file_path: str) -> str:
    """Run OCR on an image / scanned doc, returning plain text."""
    _require_key()
    with open(file_path, "rb") as fh:
        resp = requests.post(
            DIGITIZATION_URL,
            headers={"Authorization": f"Bearer {UPSTAGE_API_KEY}"},
            files={"document": fh},
            data={"model": "ocr"},
            timeout=120,
        )
    if resp.status_code != 200:
        raise RuntimeError(f"Upstage OCR failed: {resp.text}")
    result = resp.json()
    if result.get("text"):
        return result["text"]
    # Reconstruct from pages if a flat text field is absent.
    pages = result.get("pages", [])
    return "\n".join(p.get("text", "") for p in pages).strip()
