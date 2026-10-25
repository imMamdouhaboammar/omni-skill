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
