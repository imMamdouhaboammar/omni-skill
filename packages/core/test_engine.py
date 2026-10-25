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
    def test_compile_spec_root_validation(self):
        with tempfile.TemporaryDirectory() as tmpdir:
            out_dir = Path(tmpdir)
            invalid_roots = [None, "invalid", 12345, True, False, ["list"]]
            for root_val in invalid_roots:
                with self.subTest(root=root_val):
                    with self.assertRaises(TypeError) as ctx:
                        compile_spec(root_val, out_dir)
                    self.assertIn("Specification data must be a dictionary", str(ctx.exception))

    def test_compile_spec_description_validation(self):
        with tempfile.TemporaryDirectory() as tmpdir:
            out_dir = Path(tmpdir)
            base_spec = {
                "name": "sample-tool",
                "job": "Does tasks",
                "instructions": ["Step 1"]
            }

            # 1. Missing or None description
            for val in [None]:
                spec = dict(base_spec)
                spec["description"] = val
                with self.subTest(desc=val):
                    with self.assertRaises((TypeError, ValueError)) as ctx:
                        compile_spec(spec, out_dir)
                    self.assertIn("description", str(ctx.exception).lower())

            # Missing key entirely
            with self.assertRaises((TypeError, ValueError)) as ctx:
                compile_spec(dict(base_spec), out_dir)
            self.assertIn("description", str(ctx.exception).lower())

            # 2. Non-string description
            for val in [12345, True, ["desc"], {"text": "desc"}]:
                spec = dict(base_spec)
                spec["description"] = val
                with self.subTest(desc=val):
                    with self.assertRaises(TypeError) as ctx:
                        compile_spec(spec, out_dir)
                    self.assertIn("description", str(ctx.exception).lower())

            # 3. Empty or whitespace-only description
            for val in ["", "   ", "\t\n  \r\n"]:
                spec = dict(base_spec)
                spec["description"] = val
                with self.subTest(desc=val):
                    with self.assertRaises(ValueError) as ctx:
                        compile_spec(spec, out_dir)
                    self.assertIn("description", str(ctx.exception).lower())

    def test_compile_spec_job_validation(self):
        with tempfile.TemporaryDirectory() as tmpdir:
            out_dir = Path(tmpdir)
            base_spec = {
                "name": "sample-tool",
                "description": "Valid description",
                "instructions": ["Step 1"]
            }

            # 1. Missing or None job
            for val in [None]:
                spec = dict(base_spec)
                spec["job"] = val
                with self.subTest(job=val):
                    with self.assertRaises((TypeError, ValueError)) as ctx:
                        compile_spec(spec, out_dir)
                    self.assertIn("job", str(ctx.exception).lower())

            # Missing key entirely
            with self.assertRaises((TypeError, ValueError)) as ctx:
                compile_spec(dict(base_spec), out_dir)
            self.assertIn("job", str(ctx.exception).lower())

            # 2. Non-string job
            for val in [12345, True, ["job"], {"text": "job"}]:
                spec = dict(base_spec)
                spec["job"] = val
                with self.subTest(job=val):
                    with self.assertRaises(TypeError) as ctx:
                        compile_spec(spec, out_dir)
                    self.assertIn("job", str(ctx.exception).lower())

            # 3. Empty or whitespace-only job
            for val in ["", "   ", "\r\n  \t"]:
                spec = dict(base_spec)
                spec["job"] = val
                with self.subTest(job=val):
                    with self.assertRaises(ValueError) as ctx:
                        compile_spec(spec, out_dir)
                    self.assertIn("job", str(ctx.exception).lower())

    def test_compile_spec_instructions_validation(self):
        with tempfile.TemporaryDirectory() as tmpdir:
            out_dir = Path(tmpdir)
            base_spec = {
                "name": "sample-tool",
                "description": "Valid description",
                "job": "Valid job"
            }

            # 1. Missing or None instructions
            for val in [None]:
                spec = dict(base_spec)
                spec["instructions"] = val
                with self.subTest(inst=val):
                    with self.assertRaises((TypeError, ValueError)) as ctx:
                        compile_spec(spec, out_dir)
                    self.assertIn("instructions", str(ctx.exception).lower())

            # Missing key entirely
            with self.assertRaises((TypeError, ValueError)) as ctx:
                compile_spec(dict(base_spec), out_dir)
            self.assertIn("instructions", str(ctx.exception).lower())

            # 2. Non-list instructions
            for val in ["Step 1", 12345, True, {"step": 1}]:
                spec = dict(base_spec)
                spec["instructions"] = val
                with self.subTest(inst=val):
                    with self.assertRaises(TypeError) as ctx:
                        compile_spec(spec, out_dir)
                    self.assertIn("instructions", str(ctx.exception).lower())

            # 3. Empty instructions list
            spec = dict(base_spec)
            spec["instructions"] = []
            with self.assertRaises(ValueError) as ctx:
                compile_spec(spec, out_dir)
            self.assertIn("instructions", str(ctx.exception).lower())

            # 4. Non-string elements
            for val in [[123], ["Step 1", None], ["Step 1", False], ["Step 1", {"sub": 2}]]:
                spec = dict(base_spec)
                spec["instructions"] = val
                with self.subTest(inst=val):
                    with self.assertRaises(TypeError) as ctx:
                        compile_spec(spec, out_dir)
                    self.assertIn("instructions", str(ctx.exception).lower())

            # 5. Empty or whitespace elements
            for val in [[""], ["Step 1", "   "], ["\t\n  \r\n"]]:
                spec = dict(base_spec)
                spec["instructions"] = val
                with self.subTest(inst=val):
                    with self.assertRaises(ValueError) as ctx:
                        compile_spec(spec, out_dir)
                    self.assertIn("instructions", str(ctx.exception).lower())

    def test_compile_spec_target_hosts_validation(self):
        with tempfile.TemporaryDirectory() as tmpdir:
            out_dir = Path(tmpdir)
            base_spec = {
                "name": "sample-tool",
                "description": "Valid description",
                "job": "Valid job",
                "instructions": ["Step 1"]
            }

            # 1. Non-list target_hosts
            for val in ["chatgpt", 12345, True, {"host": "codex"}]:
                spec = dict(base_spec)
                spec["target_hosts"] = val
                with self.subTest(hosts=val):
                    with self.assertRaises(TypeError) as ctx:
                        compile_spec(spec, out_dir)
                    self.assertIn("target_hosts", str(ctx.exception).lower())

            # 2. Non-string elements in target_hosts
            for val in [[123], ["chatgpt", None], ["chatgpt", False], [{}]]:
                spec = dict(base_spec)
                spec["target_hosts"] = val
                with self.subTest(hosts=val):
                    with self.assertRaises(TypeError) as ctx:
                        compile_spec(spec, out_dir)
                    self.assertIn("target_hosts", str(ctx.exception).lower())

            # 3. Empty or whitespace elements in target_hosts
            for val in [[""], ["chatgpt", "   "], ["\t\n  \r\n"]]:
                spec = dict(base_spec)
                spec["target_hosts"] = val
                with self.subTest(hosts=val):
                    with self.assertRaises(ValueError) as ctx:
                        compile_spec(spec, out_dir)
                    self.assertIn("target_hosts", str(ctx.exception).lower())

            # 4. Valid target_hosts or omitted
            spec1 = dict(base_spec)
            spec1["target_hosts"] = ["chatgpt", "codex"]
            res1 = compile_spec(spec1, out_dir)
            self.assertIn("- Target Hosts: chatgpt, codex", (res1 / "SKILL.md").read_text(encoding="utf-8"))

    def test_compile_spec_freedom_level_validation(self):
        with tempfile.TemporaryDirectory() as tmpdir:
            out_dir = Path(tmpdir)
            base_spec = {
                "name": "sample-tool",
                "description": "Valid description",
                "job": "Valid job",
                "instructions": ["Step 1"]
            }

            # 1. Invalid enum strings
            for val in ["extreme", "none", "HIGH", "low ", "medium\n", ""]:
                spec = dict(base_spec)
                spec["freedom_level"] = val
                with self.subTest(level=val):
                    with self.assertRaises(ValueError) as ctx:
                        compile_spec(spec, out_dir)
                    self.assertIn("freedom_level", str(ctx.exception).lower())

            # 2. Non-string types
            for val in [12345, True, False, ["high"], {"level": "high"}]:
                spec = dict(base_spec)
                spec["freedom_level"] = val
                with self.subTest(level=val):
                    with self.assertRaises((TypeError, ValueError)) as ctx:
                        compile_spec(spec, out_dir)
                    self.assertIn("freedom_level", str(ctx.exception).lower())

            # 3. Valid values
            for val in ["high", "medium", "low"]:
                spec = dict(base_spec)
                spec["name"] = f"sample-{val}"
                spec["freedom_level"] = val
                res = compile_spec(spec, out_dir)
                self.assertIn(f"- Freedom Level: {val}", (res / "SKILL.md").read_text(encoding="utf-8"))

            # Omitted or None
            spec_none = dict(base_spec)
            spec_none["name"] = "sample-none"
            spec_none["freedom_level"] = None
            res_none = compile_spec(spec_none, out_dir)
            self.assertIn("- Freedom Level: medium", (res_none / "SKILL.md").read_text(encoding="utf-8"))

    def test_compile_spec_references_values_validation(self):
        with tempfile.TemporaryDirectory() as tmpdir:
            out_dir = Path(tmpdir)
            base_spec = {
                "name": "sample-tool",
                "description": "Valid description",
                "job": "Valid job",
                "instructions": ["Step 1"]
            }

            invalid_vals = [12345, True, False, None, {"nested": "val"}, ["array", "val"]]
            for val in invalid_vals:
                spec = dict(base_spec)
                spec["references"] = {"api-guide": val}
                with self.subTest(val=val):
                    with self.assertRaises(TypeError) as ctx:
                        compile_spec(spec, out_dir)
                    self.assertIn("references", str(ctx.exception).lower())

    def test_compile_spec_evals_validation(self):
        with tempfile.TemporaryDirectory() as tmpdir:
            out_dir = Path(tmpdir)
            base_spec = {
                "name": "sample-tool",
                "description": "Valid description",
                "job": "Valid job",
                "instructions": ["Step 1"]
            }

            # 1. Non-list evals
            for val in ["invalid", 12345, True, {"id": "case-1"}]:
                spec = dict(base_spec)
                spec["evals"] = val
                with self.subTest(evals=val):
                    with self.assertRaises(TypeError) as ctx:
                        compile_spec(spec, out_dir)
                    self.assertIn("evals", str(ctx.exception).lower())

            # 2. Invalid eval items
            invalid_items = [
                "not-a-dict",
                12345,
                None,
                [],
                {"description": "Missing id", "assertions": [{"pattern": "success"}]},
                {"id": "", "assertions": [{"pattern": "success"}]},
                {"id": "   ", "assertions": [{"pattern": "success"}]},
                {"id": 123, "assertions": [{"pattern": "success"}]},
                {"id": "c1", "description": 12345, "assertions": [{"pattern": "success"}]},
                {"id": "c1", "description": ["list"], "assertions": [{"pattern": "success"}]}
            ]
            for item in invalid_items:
                spec = dict(base_spec)
                spec["evals"] = [item]
                with self.subTest(item=item):
                    with self.assertRaises((TypeError, ValueError)) as ctx:
                        compile_spec(spec, out_dir)
                    self.assertIn("evals", str(ctx.exception).lower())

            # 3. Invalid assertions
            invalid_assertions = [
                {"id": "c1"}, # missing assertions
                {"id": "c1", "assertions": None},
                {"id": "c1", "assertions": "not-a-list"},
                {"id": "c1", "assertions": []}, # empty assertions
                {"id": "c1", "assertions": ["not-a-dict"]},
                {"id": "c1", "assertions": [None]},
                {"id": "c1", "assertions": [{}]}, # missing pattern
                {"id": "c1", "assertions": [{"pattern": ""}]}, # empty pattern
                {"id": "c1", "assertions": [{"pattern": "   "}]}, # whitespace pattern
                {"id": "c1", "assertions": [{"pattern": 123}]}, # non-string pattern
                {"id": "c1", "assertions": [{"pattern": "ok", "required": "yes"}]}, # non-bool required
                {"id": "c1", "assertions": [{"pattern": "ok", "required": 1}]} # non-bool required
            ]
            for item in invalid_assertions:
                spec = dict(base_spec)
                spec["evals"] = [item]
                with self.subTest(item=item):
                    with self.assertRaises((TypeError, ValueError)) as ctx:
                        compile_spec(spec, out_dir)
                    self.assertIn("evals", str(ctx.exception).lower())

            # 4. Valid evals
            spec_ok = dict(base_spec)
            spec_ok["evals"] = [
                {
                    "id": "c1",
                    "description": "desc",
                    "assertions": [{"pattern": "ok", "required": True}]
                },
                {
                    "id": "c2",
                    "assertions": [{"pattern": "ok"}]
                }
            ]
            res = compile_spec(spec_ok, out_dir)
            evals_json = json.loads((res / "evals" / "evals.json").read_text(encoding="utf-8"))
            self.assertEqual(len(evals_json["evals"]), 2)
            self.assertEqual(evals_json["evals"][0]["id"], "c1")
            self.assertTrue(evals_json["evals"][0]["assertions"][0]["required"])

    def test_compile_spec_zero_filesystem_mutation_on_validation_failure(self):
        import hashlib

        failure_scenarios = [
            ("missing description", {"name": "fail-skill", "job": "Job", "instructions": ["Step 1"]}),
            ("number description", {"name": "fail-skill", "description": 12345, "job": "Job", "instructions": ["Step 1"]}),
            ("empty description", {"name": "fail-skill", "description": "   ", "job": "Job", "instructions": ["Step 1"]}),
            ("missing job", {"name": "fail-skill", "description": "Desc", "instructions": ["Step 1"]}),
            ("number job", {"name": "fail-skill", "description": "Desc", "job": 12345, "instructions": ["Step 1"]}),
            ("empty job", {"name": "fail-skill", "description": "Desc", "job": "", "instructions": ["Step 1"]}),
            ("missing instructions", {"name": "fail-skill", "description": "Desc", "job": "Job"}),
            ("string instructions", {"name": "fail-skill", "description": "Desc", "job": "Job", "instructions": "Not list"}),
            ("empty instructions", {"name": "fail-skill", "description": "Desc", "job": "Job", "instructions": []}),
            ("number in instructions", {"name": "fail-skill", "description": "Desc", "job": "Job", "instructions": [123]}),
            ("empty step in instructions", {"name": "fail-skill", "description": "Desc", "job": "Job", "instructions": [""]}),
            ("string target_hosts", {"name": "fail-skill", "description": "Desc", "job": "Job", "instructions": ["Step 1"], "target_hosts": "chatgpt"}),
            ("number in target_hosts", {"name": "fail-skill", "description": "Desc", "job": "Job", "instructions": ["Step 1"], "target_hosts": [123]}),
            ("invalid freedom_level", {"name": "fail-skill", "description": "Desc", "job": "Job", "instructions": ["Step 1"], "freedom_level": "extreme"}),
            ("adversarial reference key", {"name": "fail-skill", "description": "Desc", "job": "Job", "instructions": ["Step 1"], "references": {"../escape": "content"}}),
            ("number reference value", {"name": "fail-skill", "description": "Desc", "job": "Job", "instructions": ["Step 1"], "references": {"api-guide": 12345}}),
            ("string evals", {"name": "fail-skill", "description": "Desc", "job": "Job", "instructions": ["Step 1"], "evals": "bad"}),
            ("eval item missing id", {"name": "fail-skill", "description": "Desc", "job": "Job", "instructions": ["Step 1"], "evals": [{"assertions": [{"pattern": "ok"}]}]}),
            ("eval assertion missing pattern", {"name": "fail-skill", "description": "Desc", "job": "Job", "instructions": ["Step 1"], "evals": [{"id": "c1", "assertions": [{}]}]}),
            ("eval assertion non-bool required", {"name": "fail-skill", "description": "Desc", "job": "Job", "instructions": ["Step 1"], "evals": [{"id": "c1", "assertions": [{"pattern": "ok", "required": "yes"}]}]})
        ]

        for label, spec in failure_scenarios:
            with self.subTest(scenario=label):
                with tempfile.TemporaryDirectory() as root_str:
                    root = Path(root_str)
                    out_dir = root / "output"
                    out_dir.mkdir(parents=True, exist_ok=True)
                    sentinel = root / "sentinel.txt"
                    sentinel.write_text("TOP-SECRET-SENTINEL-DATA", encoding="utf-8")
                    sentinel_hash = hashlib.sha256(sentinel.read_bytes()).hexdigest()

                    with self.assertRaises((TypeError, ValueError)):
                        compile_spec(spec, out_dir)

                    self.assertFalse((out_dir / "fail-skill").exists())
                    self.assertEqual(len(list(out_dir.iterdir())), 0)
                    self.assertEqual(hashlib.sha256(sentinel.read_bytes()).hexdigest(), sentinel_hash)

    def test_compile_spec_golden_spec_parity(self):
        with tempfile.TemporaryDirectory() as tmpdir:
            out_dir = Path(tmpdir)
            golden_spec = {
                "name": "golden-skill",
                "description": "A comprehensive production-grade skill specification.",
                "job": "Executes deterministic validation and compilation flows flawlessly.",
                "target_hosts": ["chatgpt", "codex", "claude-code"],
                "freedom_level": "low",
                "instructions": [
                    "Read input parameters carefully.",
                    "Validate preconditions before mutation.",
                    "Emit structured report."
                ],
                "references": {
                    "architecture-overview": "# Architecture\nLayered system contract.",
                    "api-conventions": "# Conventions\nFollow semver and fail closed."
                },
                "evals": [
                    {
                        "id": "case-preflight-gate",
                        "description": "Verify preflight gates fail closed on malformed input",
                        "assertions": [
                            {"pattern": "FAIL_CLOSED", "required": True},
                            {"pattern": "BYPASS_UNAUTHORIZED", "required": False}
                        ]
                    },
                    {
                        "id": "case-success-path",
                        "assertions": [
                            {"pattern": "COMPILED_SUCCESS", "required": True}
                        ]
                    }
                ]
            }

            res = compile_spec(golden_spec, out_dir)
            self.assertTrue(res.exists())

            skill_md = (res / "SKILL.md").read_text(encoding="utf-8")
            self.assertIn("name: golden-skill", skill_md)
            self.assertIn("A comprehensive production-grade skill specification.", skill_md)
            self.assertIn("# Golden Skill", skill_md)
            self.assertIn("> Executes deterministic validation and compilation flows flawlessly.", skill_md)
            self.assertIn("- Read input parameters carefully.", skill_md)
            self.assertIn("- Validate preconditions before mutation.", skill_md)
            self.assertIn("- Emit structured report.", skill_md)
            self.assertIn("- Target Hosts: chatgpt, codex, claude-code", skill_md)
            self.assertIn("- Freedom Level: low", skill_md)

            ref1 = (res / "references" / "architecture-overview.md").read_text(encoding="utf-8")
            self.assertEqual(ref1, "# Architecture\nLayered system contract.")
            ref2 = (res / "references" / "api-conventions.md").read_text(encoding="utf-8")
            self.assertEqual(ref2, "# Conventions\nFollow semver and fail closed.")

            evals_data = json.loads((res / "evals" / "evals.json").read_text(encoding="utf-8"))
            self.assertEqual(len(evals_data["evals"]), 2)
            self.assertEqual(evals_data["evals"][0]["id"], "case-preflight-gate")
            self.assertEqual(evals_data["evals"][0]["description"], "Verify preflight gates fail closed on malformed input")
            self.assertEqual(len(evals_data["evals"][0]["assertions"]), 2)
            self.assertEqual(evals_data["evals"][0]["assertions"][0]["pattern"], "FAIL_CLOSED")
            self.assertTrue(evals_data["evals"][0]["assertions"][0]["required"])
            self.assertEqual(evals_data["evals"][1]["id"], "case-success-path")
            self.assertNotIn("description", evals_data["evals"][1])

            # Minimal spec
            minimal_spec = {
                "name": "minimal-skill",
                "description": "Minimal spec description.",
                "job": "Performs minimum actions.",
                "instructions": ["Step 1: Just run."]
            }
            res_min = compile_spec(minimal_spec, out_dir)
            self.assertTrue(res_min.exists())
            skill_md_min = (res_min / "SKILL.md").read_text(encoding="utf-8")
            self.assertIn("name: minimal-skill", skill_md_min)
            self.assertIn("- Target Hosts: agent-skills, chatgpt, codex, claude-code", skill_md_min)
            self.assertIn("- Freedom Level: medium", skill_md_min)
            self.assertFalse((res_min / "references").exists())
            self.assertFalse((res_min / "evals").exists())

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

    def test_compile_spec_path_containment_adversarial(self):
        """Adversarial test suite enforcing skill name containment within output_dir (#7)."""
        import hashlib

        with tempfile.TemporaryDirectory() as root_str:
            root = Path(root_str)
            out_dir = root / "output"
            out_dir.mkdir(parents=True, exist_ok=True)

            sentinel = root / "sentinel.txt"
            sentinel.write_text("TOP-SECRET-SENTINEL-DATA", encoding="utf-8")
            sentinel_hash = hashlib.sha256(sentinel.read_bytes()).hexdigest()

            adversarial_payloads = [
                ("../escaped-skill", "parent traversal"),
                ("..", "direct dot-dot"),
                ("../../../outside-skill", "deep traversal"),
                ("nested/../../escaped-child", "nested traversal"),
                ("/tmp/evil-root-skill", "absolute unix path"),
                ("/etc/cron.d/malicious", "absolute-looking path"),
                ("C:\\windows\\system32\\evil", "windows-style absolute path"),
                ("sub/dir", "forward slash separator"),
                ("sub\\dir", "backward slash separator"),
                ("", "empty name"),
                ("   ", "whitespace name"),
                ("EvilSkill", "uppercase non-kebab name"),
                ("bad$name!", "special symbols in name"),
                (None, "None name"),
                (12345, "integer name"),
                (False, "boolean name"),
                (["escaped"], "list name"),
                ({"evil": "path"}, "dict name")
            ]

            for payload, label in adversarial_payloads:
                with self.subTest(label=label):
                    spec = {
                        "name": payload,
                        "description": "Adversarial test description",
                        "job": "Attempt escape",
                        "instructions": ["Step 1"]
                    }
                    with self.assertRaises((ValueError, TypeError)):
                        compile_spec(spec, out_dir)

                    # Assert sentinel remains intact
                    self.assertEqual(hashlib.sha256(sentinel.read_bytes()).hexdigest(), sentinel_hash)
                    self.assertFalse((root / "escaped-skill").exists())
                    self.assertFalse((root / "SKILL.md").exists())
                    self.assertFalse((root / "escaped-child").exists())

            # Symlink containment check
            real_dir = root / "real-target"
            real_dir.mkdir(parents=True, exist_ok=True)
            symlink_dir = root / "symlink-out"
            try:
                symlink_dir.symlink_to(real_dir)
                spec = {
                    "name": "../symlink-escape",
                    "description": "Escape via symlink target",
                    "job": "Test symlink containment",
                    "instructions": ["Step 1"]
                }
                with self.assertRaises((ValueError, TypeError)):
                    compile_spec(spec, symlink_dir)
                self.assertFalse((root / "symlink-escape").exists())
            except OSError:
                pass

    def test_compile_spec_references_containment_adversarial(self):
        """Adversarial test suite enforcing reference name containment within references/ (#8)."""
        import hashlib

        with tempfile.TemporaryDirectory() as root_str:
            root = Path(root_str)
            out_dir = root / "output"
            out_dir.mkdir(parents=True, exist_ok=True)

            sentinel = root / "sentinel.txt"
            sentinel.write_text("TOP-SECRET-SENTINEL-DATA", encoding="utf-8")
            sentinel_hash = hashlib.sha256(sentinel.read_bytes()).hexdigest()

            adversarial_refs = [
                ("../escaped-ref", "parent traversal"),
                ("../../SKILL", "attempt overwrite SKILL.md"),
                ("../../../outside-ref", "deep traversal"),
                ("nested/../../escaped-child", "nested traversal"),
                ("/etc/passwd", "absolute unix path"),
                ("C:\\evil\\target", "windows-style absolute path"),
                ("sub/ref", "forward slash separator"),
                ("sub\\ref", "backward slash separator"),
                (".", "dot segment"),
                ("..", "dot-dot segment"),
                (".hidden", "hidden file dot prefix"),
                ("reference.md", "file extension suffix .md"),
                ("reference.json", "file extension suffix .json"),
                ("", "empty key"),
                ("   ", "whitespace key"),
                ("ApiGuide", "uppercase non-kebab key"),
                ("ref$name!", "special symbols in key"),
                ("api_guide", "underscore in key"),
                ("api-guide\n", "trailing newline")
            ]

            for payload, label in adversarial_refs:
                with self.subTest(label=label):
                    spec = {
                        "name": "test-ref-skill",
                        "description": "Adversarial reference test",
                        "job": "Attempt ref escape",
                        "instructions": ["Step 1"],
                        "references": {
                            payload: "EVIL CONTENT"
                        }
                    }
                    with self.assertRaises((ValueError, TypeError)):
                        compile_spec(spec, out_dir)

                    # Sentinel must remain untouched
                    self.assertEqual(hashlib.sha256(sentinel.read_bytes()).hexdigest(), sentinel_hash)
                    self.assertFalse((root / "escaped-ref.md").exists())
                    self.assertFalse((out_dir / "escaped-ref.md").exists())
                    self.assertFalse((root / "outside-ref.md").exists())

                    # Verify SKILL.md was not overwritten by evil content
                    skill_md = out_dir / "test-ref-skill" / "SKILL.md"
                    if skill_md.exists():
                        self.assertNotIn("EVIL CONTENT", skill_md.read_text(encoding="utf-8"))

            # Non-dict references
            for bad_ref in [["array-ref"], "string-ref", 12345, True]:
                spec = {
                    "name": "test-bad-refs",
                    "description": "Bad refs type",
                    "job": "Fail",
                    "instructions": ["Step 1"],
                    "references": bad_ref
                }
                with self.assertRaises((ValueError, TypeError)):
                    compile_spec(spec, out_dir)

            # All-or-nothing validation: reject all if one reference key is adversarial
            all_or_nothing_spec = {
                "name": "all-or-nothing-skill",
                "description": "Batch reference validation",
                "job": "Fail atomically",
                "instructions": ["Step 1"],
                "references": {
                    "valid-first": "# Valid First",
                    "../evil-second": "EVIL",
                    "valid-third": "# Valid Third"
                }
            }
            with self.assertRaises((ValueError, TypeError)):
                compile_spec(all_or_nothing_spec, out_dir)

            ref_dir = out_dir / "all-or-nothing-skill" / "references"
            if ref_dir.exists():
                self.assertFalse((ref_dir / "valid-first.md").exists())
                self.assertFalse((ref_dir / "valid-third.md").exists())

            # Symlinked references directory attack
            symlink_skill_dir = out_dir / "symlink-ref-skill"
            symlink_skill_dir.mkdir(parents=True)
            outside_target = root / "symlink-target-dir"
            outside_target.mkdir(parents=True)
            (symlink_skill_dir / "references").symlink_to(outside_target)

            symlink_spec = {
                "name": "symlink-ref-skill",
                "description": "Symlink ref dir attack",
                "job": "Fail",
                "instructions": ["Step 1"],
                "references": {
                    "normal-ref": "SYMLINK CONTENT"
                }
            }
            with self.assertRaises(ValueError):
                compile_spec(symlink_spec, out_dir)
            self.assertEqual(hashlib.sha256(sentinel.read_bytes()).hexdigest(), sentinel_hash)
            self.assertFalse((outside_target / "normal-ref.md").exists())

            # Symlinked target file in references attack
            file_symlink_skill = out_dir / "file-symlink-skill"
            file_ref_dir = file_symlink_skill / "references"
            file_ref_dir.mkdir(parents=True)
            outside_file = root / "outside-target.md"
            outside_file.write_text("INITIAL", encoding="utf-8")
            (file_ref_dir / "attack.md").symlink_to(outside_file)

            file_symlink_spec = {
                "name": "file-symlink-skill",
                "description": "File symlink attack",
                "job": "Fail",
                "instructions": ["Step 1"],
                "references": {
                    "attack": "OVERWRITE TARGET VIA SYMLINK"
                }
            }
            with self.assertRaises(ValueError):
                compile_spec(file_symlink_spec, out_dir)
            self.assertEqual(outside_file.read_text(encoding="utf-8"), "INITIAL")

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
                "job": "Runs CLI tests.",
                "instructions": ["Step 1: Run CLI tests."]
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

            # Adversarial escape attempt via CLI
            adv_file = Path(tmpdir) / "adv_spec.json"
            adv_file.write_text(json.dumps({
                "name": "../adversarial-cli-escape",
                "description": "Escape test",
                "job": "Fail"
            }), encoding="utf-8")
            proc_adv = subprocess.run([sys.executable, str(CORE_DIR / "compile_spec.py"), str(adv_file), tmpdir], capture_output=True, text=True)
            self.assertEqual(proc_adv.returncode, 1)
            self.assertFalse((Path(tmpdir).parent / "adversarial-cli-escape").exists())

            # Adversarial reference escape attempt via CLI
            adv_ref_file = Path(tmpdir) / "adv_ref_spec.json"
            adv_ref_file.write_text(json.dumps({
                "name": "cli-valid-tool",
                "description": "Valid tool",
                "job": "Escape ref",
                "references": {
                    "../escaped-ref": "evil"
                }
            }), encoding="utf-8")
            proc_adv_ref = subprocess.run([sys.executable, str(CORE_DIR / "compile_spec.py"), str(adv_ref_file), tmpdir], capture_output=True, text=True)
            self.assertEqual(proc_adv_ref.returncode, 1)
            self.assertFalse((Path(tmpdir) / "escaped-ref.md").exists())
            self.assertFalse((Path(tmpdir).parent / "escaped-ref.md").exists())

            # Invalid spec contract via CLI (e.g. missing instructions)
            invalid_contract_file = Path(tmpdir) / "invalid_contract.json"
            invalid_contract_file.write_text(json.dumps({
                "name": "invalid-contract-tool",
                "description": "Tool missing instructions",
                "job": "Run tests"
            }), encoding="utf-8")
            target_out = Path(tmpdir) / "contract_out"
            target_out.mkdir()
            proc_contract = subprocess.run([sys.executable, str(CORE_DIR / "compile_spec.py"), str(invalid_contract_file), str(target_out)], capture_output=True, text=True)
            self.assertEqual(proc_contract.returncode, 1)
            self.assertIn("Field 'instructions' must be a non-empty array", proc_contract.stderr)
            self.assertEqual(len(list(target_out.iterdir())), 0)

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
