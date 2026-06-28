"""Upstage Solar wrapper — the reasoning engine for DocZilla.

All LLM reasoning (compliance checking, rewrites, chat answers, summaries) goes
through Upstage's Solar models via their OpenAI-compatible API. The same
``UPSTAGE_API_KEY`` is used by ``utils/parser.py`` for document parsing/OCR, so
the whole platform runs on a single provider.

Public API mirrors the previous LLM wrappers so the rest of the codebase can
stay unchanged: ``complete``, ``complete_json``, ``stream_text``.
"""
from __future__ import annotations

import json
import re
from typing import Any, Dict, Iterator, List, Optional

from openai import OpenAI

from config import (
    UPSTAGE_API_KEY,
    UPSTAGE_BASE_URL,
    UPSTAGE_MODEL,
    UPSTAGE_REASONING_EFFORT,
)

_client: Optional[OpenAI] = None

# solar-pro3 supports a "reasoning_effort" knob. Other Solar variants ignore it,
# so we only forward it for known reasoning models.
_REASONING_MODELS = {"solar-pro3"}


def get_client() -> OpenAI:
    global _client
    if not UPSTAGE_API_KEY:
        raise RuntimeError(
            "UPSTAGE_API_KEY is not set. Add it to backend/.env "
            "(get one at https://console.upstage.ai)."
        )
    if _client is None:
        _client = OpenAI(api_key=UPSTAGE_API_KEY, base_url=UPSTAGE_BASE_URL)
    return _client


def _build_messages(
    system: str, messages: List[Dict[str, Any]]
) -> List[Dict[str, Any]]:
    """Prepend the system prompt and normalize message roles."""
    out: List[Dict[str, Any]] = [{"role": "system", "content": system}]
    for m in messages:
        role = m.get("role", "user")
        if role not in ("user", "assistant", "system", "tool"):
            role = "user"
        out.append({"role": role, "content": str(m.get("content", ""))})
    return out


def _kwargs(max_tokens: int, json_mode: bool = False) -> Dict[str, Any]:
    kw: Dict[str, Any] = {
        "model": UPSTAGE_MODEL,
        "max_tokens": max_tokens,
        "temperature": 0.2,  # compliance work benefits from determinism
    }
    if UPSTAGE_MODEL in _REASONING_MODELS:
        kw["reasoning_effort"] = UPSTAGE_REASONING_EFFORT
    if json_mode:
        kw["response_format"] = {"type": "json_object"}
    return kw


def complete(
    system: str,
    messages: List[Dict[str, Any]],
    max_tokens: int = 4096,
    thinking: bool = False,  # kept for API compatibility
) -> str:
    """Single non-streaming completion; returns the response text."""
    resp = get_client().chat.completions.create(
        messages=_build_messages(system, messages),
        stream=False,
        **_kwargs(max_tokens),
    )
    return (resp.choices[0].message.content or "").strip()


def complete_json(system: str, prompt: str, max_tokens: int = 4096) -> Any:
    """Ask the model for JSON and parse it robustly (handles code fences)."""
    full_system = (
        system + "\n\nRespond with ONLY valid JSON. No prose, no code fences."
    )
    # Try native JSON mode first; if the model rejects it, fall back to plain
    # completion + our robust extractor.
    try:
        resp = get_client().chat.completions.create(
            messages=_build_messages(full_system, [{"role": "user", "content": prompt}]),
            stream=False,
            **_kwargs(max_tokens, json_mode=True),
        )
        text = (resp.choices[0].message.content or "").strip()
    except Exception:
        text = complete(full_system, [{"role": "user", "content": prompt}], max_tokens)
    return _extract_json(text)


def stream_text(
    system: str, messages: List[Dict[str, Any]], max_tokens: int = 2048
) -> Iterator[str]:
    """Yield text deltas for chat streaming."""
    stream = get_client().chat.completions.create(
        messages=_build_messages(system, messages),
        stream=True,
        **_kwargs(max_tokens),
    )
    for chunk in stream:
        if not chunk.choices:
            continue
        delta = chunk.choices[0].delta.content
        if delta:
            yield delta


def _extract_json(text: str) -> Any:
    text = (text or "").strip()
    fence = re.match(r"^```(?:json)?\s*(.*?)\s*```$", text, re.DOTALL)
    if fence:
        text = fence.group(1).strip()
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        for opener, closer in (("[", "]"), ("{", "}")):
            start, end = text.find(opener), text.rfind(closer)
            if start != -1 and end > start:
                try:
                    return json.loads(text[start : end + 1])
                except json.JSONDecodeError:
                    continue
        raise
