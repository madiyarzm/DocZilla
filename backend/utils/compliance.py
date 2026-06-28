"""Agentic compliance loop (Phase 3 — core feature).

Pipeline:
  1. Extract a structured checklist from the policy (ground truth).
  2. Check the contract against every checklist item -> PASS/FAIL/AMBIGUOUS
     with evidence.
  3. For FAIL/AMBIGUOUS items, suggest a rewrite, apply it, and re-check.
  4. Iterate until everything PASSes or max_iterations is hit.
  5. Return a report: score, per-clause results, suggested rewrites, and a full
     audit trail (timestamp, clause_id, decision, evidence, iteration).

All reasoning is done by Upstage Solar (solar-pro3 by default).
"""
from __future__ import annotations

import datetime
from typing import Any, Dict, List

from utils.llm_client import complete, complete_json

SEVERITY_WEIGHT = {"high": 3, "medium": 2, "low": 1}


def _now() -> str:
    return datetime.datetime.utcnow().isoformat() + "Z"


def _as_list(data: Any, *keys: str) -> List[Any]:
    """Normalize LLM JSON — solar-pro3 json_mode returns objects, not bare arrays."""
    if isinstance(data, list):
        return data
    if isinstance(data, dict):
        for key in keys:
            val = data.get(key)
            if isinstance(val, list):
                return val
        for val in data.values():
            if isinstance(val, list):
                return val
    return []


def extract_checklist(policy_text: str) -> List[Dict[str, Any]]:
    system = (
        "You are a compliance analyst. From the policy document, extract a list "
        "of specific, individually testable compliance requirements that a "
        "contract must satisfy."
    )
    prompt = (
        'Return a JSON object with a single key "checklist" whose value is an array. '
        "Each item must have exactly these keys:\n"
        '  "clause_id": short stable id like "C1", "C2", ...\n'
        '  "requirement": one concrete, testable requirement (a single sentence)\n'
        '  "severity": one of "high", "medium", "low"\n\n'
        "Policy document:\n" + policy_text[:12000]
    )
    data = complete_json(system, prompt, max_tokens=2048)
    out = []
    for i, item in enumerate(_as_list(data, "checklist", "items", "requirements"), start=1):
        out.append(
            {
                "clause_id": str(item.get("clause_id") or f"C{i}"),
                "requirement": str(item.get("requirement", "")).strip(),
                "severity": str(item.get("severity", "medium")).lower(),
            }
        )
    return [x for x in out if x["requirement"]]


def check_contract(
    checklist: List[Dict[str, Any]], contract_text: str
) -> List[Dict[str, Any]]:
    system = (
        "You are a meticulous compliance checker. For each checklist requirement, "
        "decide whether the contract satisfies it. Use ONLY the contract text as "
        "evidence."
    )
    prompt = (
        "Checklist (JSON):\n"
        + _json(checklist)
        + "\n\nContract text:\n"
        + contract_text[:14000]
        + '\n\nReturn a JSON object with a single key "results" whose value is an array. '
        "Each object must have:\n"
        '  "clause_id": the matching id\n'
        '  "status": "PASS" | "FAIL" | "AMBIGUOUS"\n'
        '  "evidence": a short quote or explanation from the contract (or why it is missing)\n'
        '  "suggestion": for FAIL/AMBIGUOUS, a concrete clause rewrite that would make it PASS; '
        "otherwise an empty string"
    )
    data = complete_json(system, prompt, max_tokens=4096)
    rows = _as_list(data, "results", "items", "checklist")
    by_id = {str(d.get("clause_id")): d for d in rows if isinstance(d, dict)}

    results = []
    for item in checklist:
        d = by_id.get(item["clause_id"], {})
        status = str(d.get("status", "AMBIGUOUS")).upper()
        if status not in ("PASS", "FAIL", "AMBIGUOUS"):
            status = "AMBIGUOUS"
        results.append(
            {
                **item,
                "status": status,
                "evidence": str(d.get("evidence", "")).strip(),
                "suggestion": str(d.get("suggestion", "")).strip(),
            }
        )
    return results


def apply_suggestions(contract_text: str, failing: List[Dict[str, Any]]) -> str:
    system = (
        "You are a contract editor. Revise the contract so it satisfies the "
        "listed requirements, integrating the suggested rewrites naturally. "
        "Keep all existing compliant content intact."
    )
    fixes = "\n".join(
        f"- ({f['clause_id']}, {f['severity']}) {f['requirement']}\n"
        f"  Suggested rewrite: {f['suggestion']}"
        for f in failing
    )
    prompt = (
        "Current contract:\n"
        + contract_text[:14000]
        + "\n\nApply these fixes:\n"
        + fixes
        + "\n\nReturn ONLY the full revised contract text."
    )
    return complete(system, [{"role": "user", "content": prompt}], max_tokens=6000)


def score(results: List[Dict[str, Any]]) -> Dict[str, Any]:
    total_w = sum(SEVERITY_WEIGHT.get(r["severity"], 2) for r in results) or 1
    pass_w = sum(
        SEVERITY_WEIGHT.get(r["severity"], 2)
        for r in results
        if r["status"] == "PASS"
    )
    counts = {"PASS": 0, "FAIL": 0, "AMBIGUOUS": 0}
    for r in results:
        counts[r["status"]] = counts.get(r["status"], 0) + 1
    return {
        "compliance_score": round(100 * pass_w / total_w, 1),
        "counts": counts,
        "total": len(results),
    }


def run_loop(
    policy_text: str, contract_text: str, max_iterations: int = 3
) -> Dict[str, Any]:
    audit: List[Dict[str, Any]] = []
    checklist = extract_checklist(policy_text)
    audit.append(
        {
            "timestamp": _now(),
            "clause_id": "*",
            "decision": f"Extracted {len(checklist)} checklist items from policy",
            "evidence": "",
            "iteration": 0,
        }
    )

    current_contract = contract_text
    iterations: List[Dict[str, Any]] = []
    results: List[Dict[str, Any]] = []

    for it in range(1, max_iterations + 1):
        results = check_contract(checklist, current_contract)
        for r in results:
            audit.append(
                {
                    "timestamp": _now(),
                    "clause_id": r["clause_id"],
                    "decision": r["status"],
                    "evidence": r["evidence"],
                    "iteration": it,
                }
            )
        sc = score(results)
        iterations.append({"iteration": it, **sc, "results": results})

        failing = [r for r in results if r["status"] != "PASS" and r["suggestion"]]
        if not failing:
            break
        if it < max_iterations:
            current_contract = apply_suggestions(current_contract, failing)
            audit.append(
                {
                    "timestamp": _now(),
                    "clause_id": "*",
                    "decision": f"Applied {len(failing)} suggested rewrite(s)",
                    "evidence": "",
                    "iteration": it,
                }
            )

    final = score(results)
    return {
        "checklist": checklist,
        "iterations": iterations,
        "final_results": results,
        "final_contract": current_contract,
        "audit_trail": audit,
        **final,
        "all_pass": final["counts"].get("PASS", 0) == final["total"],
    }


def _json(obj) -> str:
    import json

    return json.dumps(obj, ensure_ascii=False)
