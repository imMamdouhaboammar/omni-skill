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
