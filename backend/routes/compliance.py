"""Compliance routes: agentic policy-vs-contract loop (Phase 3) and the
dependency license checker (Phase 5)."""
import os
import shutil
import tempfile

from fastapi import APIRouter, File, Form, HTTPException, UploadFile

from utils.compliance import run_loop
from utils.ingest import ingest_file, parse_dependencies
from utils.licenses import (
    check_compatibility,
    fetch_npm_license,
    fetch_pip_license,
)

compliance_router = APIRouter(prefix="/api/compliance", tags=["Compliance"])


def _ingest_upload(file: UploadFile) -> str:
    ext = os.path.splitext(file.filename or "f")[1].lower()
    tmp_path = None
    try:
        with tempfile.NamedTemporaryFile(delete=False, suffix=ext) as tmp:
            shutil.copyfileobj(file.file, tmp)
            tmp_path = tmp.name
        text, _ = ingest_file(tmp_path, file.filename or "upload")
        return text
    finally:
        if tmp_path and os.path.exists(tmp_path):
            os.remove(tmp_path)


@compliance_router.post("/check")
async def compliance_check(
    policy_file: UploadFile = File(...),
    contract_file: UploadFile = File(...),
    max_iterations: int = Form(3),
):
    """Run the full agentic compliance loop on a policy + contract."""
    try:
        policy_text = _ingest_upload(policy_file)
        contract_text = _ingest_upload(contract_file)
        if not policy_text.strip() or not contract_text.strip():
            raise HTTPException(status_code=400, detail="Empty policy or contract.")
        report = run_loop(
            policy_text, contract_text, max_iterations=max(1, min(max_iterations, 6))
        )
        report["policy_filename"] = policy_file.filename
        report["contract_filename"] = contract_file.filename
        return report
    except HTTPException:
        raise
    except Exception as e:
        # Surface the underlying provider message (e.g. Upstage credit/auth
        # errors) instead of a generic 500.
        raise HTTPException(status_code=502, detail=f"Compliance check failed: {e}")


@compliance_router.post("/license")
async def license_check(
    file: UploadFile = File(...),
    project_license: str = Form("MIT"),
):
    """Check each dependency's license for compatibility with project_license."""
    filename = file.filename or ""
    ecosystem = "npm" if filename.endswith(".json") or filename == "package.json" else "pip"

    content = (await file.read()).decode("utf-8", errors="replace")
    deps = parse_dependencies(content, ecosystem)
    if not deps:
        raise HTTPException(
            status_code=400,
            detail="No dependencies found. Upload a package.json or requirements.txt.",
        )

    results = []
    for name, version in deps:
        lic = fetch_npm_license(name) if ecosystem == "npm" else fetch_pip_license(name)
        compatible, reason, spdx_clause = check_compatibility(lic, project_license)
        results.append(
            {
                "dependency": name,
                "version": version,
                "license": lic,
                "compatible": compatible,
                "reason": reason,
                "spdx_clause": spdx_clause,
            }
        )

    conflicts = [r for r in results if not r["compatible"]]
    return {
        "ecosystem": ecosystem,
        "project_license": project_license,
        "dependency_count": len(results),
        "conflict_count": len(conflicts),
        "results": results,
    }
