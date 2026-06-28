"""Slack integration (kept from the original) — now summarizes via Upstage Solar."""
import os
from typing import Optional

import requests
from fastapi import APIRouter, HTTPException

from config import DATA_DIR, SLACK_WEBHOOK_URL
from utils.llm_client import complete

slack_router = APIRouter()

LATEST_DOC_PATH = os.path.join(DATA_DIR, "latest_document.txt")


@slack_router.post("/send-slack", tags=["Slack"])
async def send_slack_summary(only_summary: Optional[bool] = None):
    if not os.path.exists(LATEST_DOC_PATH):
        raise HTTPException(status_code=404, detail="No document uploaded yet.")
    with open(LATEST_DOC_PATH, "r", encoding="utf-8") as f:
        document_text = f.read()
    if not document_text.strip():
        raise HTTPException(status_code=400, detail="Latest document is empty.")

    try:
        summary = complete(
            "You write clear, well-organized summaries of documents.",
            [{"role": "user", "content": document_text[:12000]}],
            max_tokens=1024,
        )
    except RuntimeError as e:
        raise HTTPException(status_code=502, detail=str(e))

    if only_summary:
        return {"status": "success", "summary": summary}

    if not SLACK_WEBHOOK_URL:
        raise HTTPException(
            status_code=400,
            detail="SLACK_WEBHOOK_URL is not configured.",
        )
    slack_response = requests.post(
        SLACK_WEBHOOK_URL,
        json={"text": f"*Summary of Latest Document:*\n{summary}"},
        headers={"Content-Type": "application/json"},
        timeout=15,
    )
    if slack_response.status_code != 200:
        raise HTTPException(
            status_code=502,
            detail=f"Failed to send to Slack: {slack_response.text}",
        )
    return {"status": "success", "message": "Summary sent to Slack.", "summary": summary}
