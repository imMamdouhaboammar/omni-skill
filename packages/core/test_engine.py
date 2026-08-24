#!/usr/bin/env python3
"""Unit tests for OmniSkill Python deterministic core engine."""

import json
import tempfile
import unittest
from pathlib import Path
from compile_spec import compile_spec
from portability_validator import validate_skill
from eval_engine import run_bineval, split_held_out

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

    def test_bineval_scoring(self):
        cases = [
            {"id": "c1", "assertions": [{"pattern": "hello", "required": True}]},
            {"id": "c2", "assertions": [{"pattern": "forbidden", "required": False}]}
        ]
        res = run_bineval(cases, "hello world!")
        self.assertEqual(res["passed"], 2)
        self.assertEqual(res["pass_rate"], 1.0)

    def test_held_out_split(self):
        cases = [{"id": f"c{i}"} for i in range(10)]
        train, held_out = split_held_out(cases, 0.7)
        self.assertEqual(len(train), 7)
        self.assertEqual(len(held_out), 3)

if __name__ == "__main__":
    unittest.main()
