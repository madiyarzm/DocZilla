import os
import shutil
import tempfile

from fastapi import APIRouter, File, HTTPException, UploadFile

from config import DATA_DIR
from utils.embeddings import backend_name
from utils.ingest import ingest_file
from utils.stores import get_main_store

upload_router = APIRouter()

ALLOWED_EXTS = {".pdf", ".png", ".jpg", ".jpeg", ".txt", ".docx", ".json"}


@upload_router.post("/upload", tags=["Upload"])
async def upload_file(file: UploadFile = File(...)):
    filename = file.filename or "upload"
    ext = os.path.splitext(filename)[1].lower()
    if ext not in ALLOWED_EXTS and filename not in ("package.json", "requirements.txt"):
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported file type '{ext}'. Allowed: PDF, PNG, JPG, "
            "DOCX, TXT, package.json, requirements.txt.",
        )

    tmp_path = None
    try:
        with tempfile.NamedTemporaryFile(delete=False, suffix=ext) as tmp:
            shutil.copyfileobj(file.file, tmp)
            tmp_path = tmp.name

        full_text, chunks = ingest_file(tmp_path, filename)

        # Persist latest extracted text (used by the Slack summary feature).
        with open(os.path.join(DATA_DIR, "latest_document.txt"), "w", encoding="utf-8") as f:
            f.write(full_text)

        store = get_main_store()
        store.add(
            [c["content"] for c in chunks],
            [c["metadata"] for c in chunks],
        )

        return {
            "message": "File ingested, chunked, embedded and stored.",
            "filename": filename,
            "chunks": len(chunks),
            "embedding_backend": backend_name(),
            "sample_metadata": [c["metadata"] for c in chunks[:3]],
        }
    except RuntimeError as e:
        raise HTTPException(status_code=502, detail=str(e))
    finally:
        if tmp_path and os.path.exists(tmp_path):
            os.remove(tmp_path)
