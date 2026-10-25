#!/usr/bin/env python3
"""Comprehensive unit and end-to-end tests for OmniSkill Python deterministic core engine."""

from __future__ import annotations
import json
import io
import runpy
import subprocess
import sys
import tempfile
import unittest
from contextlib import redirect_stdout
from pathlib import Path
from unittest.mock import patch

from compile_spec import compile_spec
from portability_validator import validate_skill
from eval_engine import run_bineval, split_held_out

CORE_DIR = Path(__file__).parent

class TestOmniSkillEngine(unittest.TestCase):
    def test_compile_spec_and_validate(self):
        with tempfile.TemporaryDirectory() as tmpdir:
            out_dir = Path(tmpdir)
            spec = {
                "name": "sample-tool",
                "description": "A sample tool for testing OmniSkill engine.",
                "job": "Performs sample deterministic actions.",
                "instructions": ["Step 1: Check input", "Step 2: Emit result"],
                "target_hosts": ["agent-skills", "chatgpt", "codex", "claude-code"],
                "evals": [{"id": "case-1", "assertions": [{"pattern": "success", "required": True}]}]
            }
            res = compile_spec(spec, out_dir)
            self.assertTrue((res / "SKILL.md").exists())
            self.assertTrue((res / "evals" / "evals.json").exists())

            report = validate_skill(res)
            self.assertTrue(report["pass"])
            self.assertEqual(report["errors"], 0)

    def test_bineval_scoring_table_driven(self):
        """Table-driven test testing assertion permutations and edge cases."""
        test_cases = [
            {
                "name": "all_pass_required_and_forbidden",
                "suite": [
                    {"id": "c1", "assertions": [{"pattern": "hello", "required": True}]},
                    {"id": "c2", "assertions": [{"pattern": "forbidden", "required": False}]}
                ],
                "response": "hello world!",
                "want_passed": 2,
                "want_rate": 1.0
            },
            {
                "name": "required_pattern_missing",
                "suite": [
                    {"id": "c1", "assertions": [{"pattern": "missing_token", "required": True}]}
                ],
                "response": "ordinary response content",
                "want_passed": 0,
                "want_rate": 0.0
            },
            {
                "name": "forbidden_pattern_present",
                "suite": [
                    {"id": "c1", "assertions": [{"pattern": "CRITICAL_LEAK", "required": False}]}
                ],
                "response": "Here is CRITICAL_LEAK in output",
                "want_passed": 0,
                "want_rate": 0.0
            },
            {
                "name": "case_insensitive_matching",
                "suite": [
                    {"id": "c1", "assertions": [{"pattern": "status_ok", "required": True}]}
                ],
                "response": "STATUS_OK returned from service",
                "want_passed": 1,
                "want_rate": 1.0
            },
            {
                "name": "empty_eval_suite",
                "suite": [],
                "response": "any response",
                "want_passed": 0,
                "want_rate": 1.0
            }
        ]

        for tc in test_cases:
            with self.subTest(tc["name"]):
                res = run_bineval(tc["suite"], tc["response"])
                self.assertEqual(res["passed"], tc["want_passed"])
                self.assertEqual(res["pass_rate"], tc["want_rate"])

    def test_held_out_split(self):
        cases = [{"id": f"c{i}"} for i in range(10)]
        train, held_out = split_held_out(cases, 0.7)
        self.assertEqual(len(train), 7)
        self.assertEqual(len(held_out), 3)

    def test_compile_spec_cli_end_to_end(self):
        """Test compile_spec.py CLI interface with valid and error states."""
        # Help flag
        proc_help = subprocess.run([sys.executable, str(CORE_DIR / "compile_spec.py"), "--help"], capture_output=True, text=True)
        self.assertEqual(proc_help.returncode, 0)
        self.assertIn("usage:", proc_help.stdout.lower())

        # Missing file error
        proc_missing = subprocess.run([sys.executable, str(CORE_DIR / "compile_spec.py"), "/non/existent/file.json"], capture_output=True, text=True)
        self.assertEqual(proc_missing.returncode, 1)

        # Successful compilation
        with tempfile.TemporaryDirectory() as tmpdir:
            spec_file = Path(tmpdir) / "spec.json"
            spec_file.write_text(json.dumps({
                "name": "cli-compiled-tool",
                "description": "Tool compiled via CLI.",
                "job": "Runs CLI tests."
            }), encoding="utf-8")

            proc_ok = subprocess.run([sys.executable, str(CORE_DIR / "compile_spec.py"), str(spec_file), tmpdir], capture_output=True, text=True)
            self.assertEqual(proc_ok.returncode, 0)
            self.assertTrue((Path(tmpdir) / "cli-compiled-tool" / "SKILL.md").exists())

            proc_help_after = subprocess.run(
                [sys.executable, str(CORE_DIR / "compile_spec.py"), str(spec_file), "--help"],
                cwd=tmpdir, capture_output=True, text=True
            )
            self.assertEqual(proc_help_after.returncode, 0)
            self.assertIn("usage:", proc_help_after.stdout.lower())
            self.assertFalse((Path(tmpdir) / "--help").exists())

    def test_eval_engine_cli_end_to_end(self):
        """Test eval_engine.py CLI interface with valid and error states."""
        # Help flag
        proc_help = subprocess.run([sys.executable, str(CORE_DIR / "eval_engine.py"), "--help"], capture_output=True, text=True)
        self.assertEqual(proc_help.returncode, 0)
        self.assertIn("usage:", proc_help.stdout.lower())

        # Missing file error
        proc_missing = subprocess.run([sys.executable, str(CORE_DIR / "eval_engine.py"), "/non/existent/evals.json", "candidate response"], capture_output=True, text=True)
        self.assertEqual(proc_missing.returncode, 1)

        # Passing evaluation
        with tempfile.TemporaryDirectory() as tmpdir:
            eval_file = Path(tmpdir) / "evals.json"
            eval_file.write_text(json.dumps({
                "evals": [{"id": "t1", "assertions": [{"pattern": "verified", "required": True}]}]
            }), encoding="utf-8")

            proc_ok = subprocess.run([sys.executable, str(CORE_DIR / "eval_engine.py"), str(eval_file), "task outcome verified"], capture_output=True, text=True)
            self.assertEqual(proc_ok.returncode, 0)
            data = json.loads(proc_ok.stdout)
            self.assertEqual(data["passed"], 1)

            # Failing evaluation
            proc_fail = subprocess.run([sys.executable, str(CORE_DIR / "eval_engine.py"), str(eval_file), "task outcome failed"], capture_output=True, text=True)
            self.assertEqual(proc_fail.returncode, 1)

            eval_file.write_text(json.dumps([{"id": "array-format", "assertions": [{"pattern": "verified", "required": True}]}]), encoding="utf-8")
            proc_array = subprocess.run([sys.executable, str(CORE_DIR / "eval_engine.py"), str(eval_file), "verified"], capture_output=True, text=True)
            self.assertEqual(proc_array.returncode, 0, proc_array.stderr)

            proc_help_after = subprocess.run(
                [sys.executable, str(CORE_DIR / "eval_engine.py"), str(eval_file), "--help"],
                capture_output=True, text=True
            )
            self.assertEqual(proc_help_after.returncode, 0)
            self.assertIn("usage:", proc_help_after.stdout.lower())

            with patch.object(Path, "is_file", side_effect=OSError("candidate path probe failed")):
                with patch.object(sys, "argv", [str(CORE_DIR / "eval_engine.py"), str(eval_file), "verified"]):
                    with redirect_stdout(io.StringIO()) as output:
                        with self.assertRaises(SystemExit) as exit_result:
                            runpy.run_path(str(CORE_DIR / "eval_engine.py"), run_name="__main__")
            self.assertEqual(exit_result.exception.code, 0)
            self.assertEqual(json.loads(output.getvalue())["passed"], 1)

if __name__ == "__main__":
    unittest.main()
