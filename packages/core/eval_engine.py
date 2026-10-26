#!/usr/bin/env python3
"""OmniSkill BinEval and Pressure Test Scoring Engine."""

from __future__ import annotations
import json
import re
from pathlib import Path
from typing import Any, Dict, List, Union

def run_bineval(
    eval_suite: List[Dict[str, Any]],
    candidate_response: Union[str, Dict[str, str], None] = None
) -> Dict[str, Any]:
    total = len(eval_suite)
    if total == 0:
        return {
            "total": 0,
            "passed": 0,
            "failed": 0,
            "unverified": 0,
            "errors": 0,
            "pass_rate": 0.0,
            "status": "EMPTY_SUITE",
            "results": []
        }

    results = []
    passed = 0
    failed = 0
    unverified = 0
    errors = 0

    for case in eval_suite:
        cid = case.get("id", "unknown")
        assertions = case.get("assertions", [])

        # Determine observed response for this specific case
        if candidate_response is None:
            resp = None
        elif isinstance(candidate_response, dict):
            resp = candidate_response.get(cid)
        else:
            resp = candidate_response

        if resp is None:
            unverified += 1
            results.append({
                "id": cid,
                "passed": False,
                "status": "UNVERIFIED",
                "message": "No observed candidate response provided"
            })
            continue

        if not isinstance(assertions, list) or len(assertions) == 0:
            errors += 1
            results.append({
                "id": cid,
                "passed": False,
                "status": "ERROR",
                "message": "Case has no assertions defined"
            })
            continue

        case_passed = True
        error_msg = None
        failing_pattern = None

        for assertion in assertions:
            pattern = assertion.get("pattern", "")
            required = assertion.get("required", True)
            try:
                found = bool(re.search(pattern, resp, re.IGNORECASE))
            except re.error as exc:
                case_passed = False
                error_msg = f"Invalid regex pattern '/{pattern}/': {exc}"
                break

            if required and not found:
                case_passed = False
                failing_pattern = pattern
                break
            if not required and found:
                case_passed = False
                failing_pattern = pattern
                break

        if error_msg is not None:
            errors += 1
            results.append({
                "id": cid,
                "passed": False,
                "status": "ERROR",
                "message": error_msg
            })
        elif case_passed:
            passed += 1
            results.append({
                "id": cid,
                "passed": True,
                "status": "PASSED"
            })
        else:
            failed += 1
            results.append({
                "id": cid,
                "passed": False,
                "status": "FAILED",
                "failing_pattern": failing_pattern
            })

    rate = (passed / total) if total > 0 else 0.0

    if unverified > 0:
        overall_status = "UNVERIFIED"
    elif errors > 0:
        overall_status = "ERROR"
    elif failed > 0:
        overall_status = "FAIL"
    elif passed == total and total > 0:
        overall_status = "PASS"
    else:
        overall_status = "FAIL"

    return {
        "total": total,
        "passed": passed,
        "failed": failed,
        "unverified": unverified,
        "errors": errors,
        "pass_rate": round(rate, 4),
        "status": overall_status,
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
    import argparse
    import sys
    parser = argparse.ArgumentParser(description="Evaluate a response against BinEval assertions")
    parser.add_argument("evals", type=Path, help="Evaluation JSON path")
    parser.add_argument("candidate", nargs="?", default=None, help="Candidate response text, response file, or JSON response map")
    parser.add_argument("--responses", "-r", default=None, help="Path to JSON file mapping case IDs to responses")
    parser.add_argument("--json", "-j", action="store_true", help="Output JSON")
    args = parser.parse_args()

    eval_file = args.evals
    if not eval_file.exists():
        print(f"Error: evals file not found: {eval_file}", file=sys.stderr)
        sys.exit(1)
    try:
        raw_evals = json.loads(eval_file.read_text(encoding="utf-8"))
        suite = raw_evals if isinstance(raw_evals, list) else raw_evals.get("evals", [])
        if not isinstance(suite, list):
            raise ValueError("evals must be a JSON array")
    except Exception as exc:
        print(f"Error: Failed to parse evals JSON: {exc}", file=sys.stderr)
        sys.exit(1)

    candidate_data: Union[str, Dict[str, str], None] = None
    resp_source = args.responses or args.candidate

    if resp_source is not None:
        cand_path = Path(resp_source)
        try:
            candidate_is_file = cand_path.is_file()
        except OSError:
            candidate_is_file = False

        if candidate_is_file:
            content = cand_path.read_text(encoding="utf-8")
            try:
                parsed_json = json.loads(content)
                if isinstance(parsed_json, dict):
                    candidate_data = {str(k): str(v) for k, v in parsed_json.items()}
                elif isinstance(parsed_json, list):
                    candidate_data = {
                        item["id"]: str(item.get("response", item.get("text", "")))
                        for item in parsed_json
                        if isinstance(item, dict) and "id" in item
                    }
                else:
                    candidate_data = content
            except json.JSONDecodeError:
                candidate_data = content
        else:
            candidate_data = resp_source

    outcome = run_bineval(suite, candidate_data)
    print(json.dumps(outcome, indent=2))
    sys.exit(0 if (outcome["status"] == "PASS" and outcome["total"] > 0) else 1)
