#!/usr/bin/env python3
"""OmniSkill BinEval and Pressure Test Scoring Engine."""

from __future__ import annotations
import json
import re
from pathlib import Path
from typing import Any, Dict, List

def run_bineval(eval_suite: List[Dict[str, Any]], candidate_response: str) -> Dict[str, Any]:
    results = []
    passed = 0
    for case in eval_suite:
        cid = case.get("id", "unknown")
        assertions = case.get("assertions", [])
        case_passed = True
        for assertion in assertions:
            pattern = assertion.get("pattern", "")
            required = assertion.get("required", True)
            found = bool(re.search(pattern, candidate_response, re.IGNORECASE))
            if (required and not found) or (not required and found):
                case_passed = False
                break
        if case_passed:
            passed += 1
        results.append({"id": cid, "passed": case_passed})

    total = len(eval_suite)
    rate = (passed / total) if total > 0 else 1.0
    return {
        "total": total,
        "passed": passed,
        "pass_rate": round(rate, 4),
        "results": results
    }

def split_held_out(cases: List[Dict[str, Any]], train_ratio: float = 0.7) -> tuple[List[Dict[str, Any]], List[Dict[str, Any]]]:
    import random
    shuffled = list(cases)
    random.seed(42)
    random.shuffle(shuffled)
    cut = int(len(shuffled) * train_ratio)
    return shuffled[:cut], shuffled[cut:]

if __name__ == "__main__":
    import sys
    if len(sys.argv) < 3 or sys.argv[1] in ("-h", "--help"):
        print("Usage: eval_engine.py <evals.json> <candidate_response_or_file>")
        sys.exit(0 if len(sys.argv) >= 2 and sys.argv[1] in ("-h", "--help") else 1)
    eval_file = Path(sys.argv[1])
    if not eval_file.exists():
        print(f"Error: evals file not found: {eval_file}", file=sys.stderr)
        sys.exit(1)
    try:
        raw_evals = json.loads(eval_file.read_text(encoding="utf-8"))
        suite = raw_evals.get("evals", raw_evals if isinstance(raw_evals, list) else [])
    except Exception as exc:
        print(f"Error: Failed to parse evals JSON: {exc}", file=sys.stderr)
        sys.exit(1)

    cand_arg = sys.argv[2]
    cand_path = Path(cand_arg)
    candidate_text = cand_path.read_text(encoding="utf-8") if cand_path.exists() and cand_path.is_file() else cand_arg

    outcome = run_bineval(suite, candidate_text)
    print(json.dumps(outcome, indent=2))
    sys.exit(0 if outcome["passed"] == outcome["total"] else 1)
