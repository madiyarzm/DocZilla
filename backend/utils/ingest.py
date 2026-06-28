"""Unified ingestion: file -> extracted text -> metadata-rich chunks.

Supported: PDF, PNG, JPG/JPEG (OCR), DOCX, TXT, package.json, requirements.txt.
Returns (full_text, chunks) where chunks carry {filename, page, section,
clause_id, category} metadata.
"""
from __future__ import annotations

import json
import os
from typing import Any, Dict, List, Tuple

from utils.chunk import chunk_elements, chunk_text
from utils.upstage import ocr_image, parse_document

IMAGE_EXTS = {".png", ".jpg", ".jpeg"}


def ingest_file(file_path: str, filename: str) -> Tuple[str, List[Dict[str, Any]]]:
    ext = os.path.splitext(filename)[1].lower()

    if ext == ".pdf" or ext == ".docx":
        elements = parse_document(file_path)
        full_text = "\n\n".join(e["text"] for e in elements)
        return full_text, chunk_elements(elements, filename)

    if ext in IMAGE_EXTS:
        text = ocr_image(file_path)
        return text, chunk_text(text, filename)

    if ext == ".txt":
        text = _read(file_path)
        return text, chunk_text(text, filename)

    if filename == "package.json" or ext == ".json":
        text = _read(file_path)
        return text, _chunk_dependency_manifest(text, filename, "npm")

    if filename == "requirements.txt" or filename.endswith("requirements.txt"):
        text = _read(file_path)
        return text, _chunk_dependency_manifest(text, filename, "pip")

    # Unknown: best-effort as text.
    text = _read(file_path)
    return text, chunk_text(text, filename)


def _read(file_path: str) -> str:
    with open(file_path, "r", encoding="utf-8", errors="replace") as f:
        return f.read()


def _chunk_dependency_manifest(text: str, filename: str, ecosystem: str) -> List[Dict[str, Any]]:
    """Represent a dependency manifest as one chunk per dependency."""
    deps = parse_dependencies(text, ecosystem)
    chunks: List[Dict[str, Any]] = []
    for i, (name, version) in enumerate(deps, start=1):
        chunks.append(
            {
                "content": f"Dependency: {name} (version {version}) [{ecosystem}]",
                "metadata": {
                    "filename": filename,
                    "page": 1,
                    "section": "Dependencies",
                    "clause_id": i,
                    "category": "dependency",
                    "ecosystem": ecosystem,
                    "package": name,
                    "version": version,
                },
            }
        )
    return chunks


def parse_dependencies(text: str, ecosystem: str) -> List[Tuple[str, str]]:
    """Parse a package.json or requirements.txt into (name, version) pairs."""
    deps: List[Tuple[str, str]] = []
    if ecosystem == "npm":
        try:
            data = json.loads(text)
        except json.JSONDecodeError:
            return deps
        for key in ("dependencies", "devDependencies", "peerDependencies"):
            for name, version in (data.get(key) or {}).items():
                deps.append((name, str(version)))
    else:  # pip
        for raw in text.splitlines():
            line = raw.strip()
            if not line or line.startswith("#") or line.startswith("-"):
                continue
            line = line.split(";")[0].split("#")[0].strip()
            for sep in ("==", ">=", "<=", "~=", ">", "<", "!="):
                if sep in line:
                    name, version = line.split(sep, 1)
                    deps.append((name.strip(), version.strip()))
                    break
            else:
                deps.append((line, "latest"))
    return deps
