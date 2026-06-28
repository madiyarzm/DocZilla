"""Legacy policy endpoints used by the dashboard's action sidebar.

Reimplemented on top of the new Solar-powered compliance engine so the
existing UI keeps working. The richer flow lives at /api/compliance/check.
"""
import json
import os
import shutil
import tempfile

from fastapi import APIRouter, File, HTTPException, UploadFile

from config import DATA_DIR
from utils.compliance import check_contract, extract_checklist
from utils.ingest import ingest_file

policy_router = APIRouter()

POLICY_PATH = os.path.join(DATA_DIR, "company_policy.txt")
CHECKLIST_PATH = os.path.join(DATA_DIR, "policy_checklist.json")
LATEST_DOC_PATH = os.path.join(DATA_DIR, "latest_document.txt")


@policy_router.post("/upload-policy", tags=["Policy"])
async def upload_company_policy(file: UploadFile = File(...)):
    ext = os.path.splitext(file.filename or "f")[1].lower()
    tmp_path = None
    try:
        with tempfile.NamedTemporaryFile(delete=False, suffix=ext) as tmp:
            shutil.copyfileobj(file.file, tmp)
            tmp_path = tmp.name
        policy_text, _ = ingest_file(tmp_path, file.filename or "policy")
        with open(POLICY_PATH, "w", encoding="utf-8") as f:
            f.write(policy_text)

        checklist = extract_checklist(policy_text)
        with open(CHECKLIST_PATH, "w", encoding="utf-8") as f:
            json.dump(checklist, f, indent=2)

        return {"status": "success", "checklist": checklist}
    except RuntimeError as e:
        raise HTTPException(status_code=502, detail=str(e))
    finally:
        if tmp_path and os.path.exists(tmp_path):
            os.remove(tmp_path)


@policy_router.post("/compare-policy", tags=["Policy"])
async def compare_policy():
    if not os.path.exists(LATEST_DOC_PATH):
        raise HTTPException(status_code=404, detail="Upload a document first.")
    if not os.path.exists(CHECKLIST_PATH):
        raise HTTPException(status_code=404, detail="Upload a policy first.")

    with open(LATEST_DOC_PATH, "r", encoding="utf-8") as f:
        document_text = f.read()
    with open(CHECKLIST_PATH, "r", encoding="utf-8") as f:
        checklist = json.load(f)

    try:
        results = check_contract(checklist, document_text)
    except RuntimeError as e:
        raise HTTPException(status_code=502, detail=str(e))

    lines = ["Here's how the document compares to our internal policy:\n"]
    for r in results:
        icon = {"PASS": "✅", "FAIL": "❌", "AMBIGUOUS": "⚠️"}.get(r["status"], "⚠️")
        lines.append(f"{icon} {r['requirement']}")
        if r["evidence"]:
            lines.append(f"   {r['evidence']}")
    return {
        "status": "success",
        "results": results,
        "formatted_results": "\n".join(lines),
    }
