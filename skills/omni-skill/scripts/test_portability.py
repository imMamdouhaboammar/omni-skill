#!/usr/bin/env python3
"""Smoke tests for the cross-host SkillSpec compiler and portability validator."""

from __future__ import annotations

import json
import subprocess
import sys
import tempfile
from pathlib import Path

HERE = Path(__file__).resolve().parent
COMPILE = HERE / "compile_skill_spec.py"
VALIDATE = HERE / "validate_portability.py"


def run(*args: str) -> subprocess.CompletedProcess:
    return subprocess.run(
        [sys.executable, *args],
        text=True,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        check=False,
    )


def main() -> None:
    spec = {
        "name": "demo-skill",
        "purpose": "Create a deterministic demo artifact",
        "baseline_failure": "The agent skips the required verification",
        "triggers": {
            "positive": [
                "build the demo artifact",
                "make this demo repeatable",
                "teach the agent the demo workflow"
            ],
            "negative": [
                "explain what a demo is",
                "run an existing demo"
            ]
        },
        "outputs": ["A verified demo.txt file"],
        "invariants": ["Do not overwrite unrelated files"],
        "workflow": [
            {"action": "Inspect the target", "why": "Preserve existing state", "freedom": "medium"},
            {"action": "Create the artifact", "why": "Produce the requested result", "freedom": "low"},
            {"action": "Verify the artifact", "why": "Catch incomplete output", "freedom": "low"}
        ],
        "tools": ["read", "write", "python"],
        "resources": [],
        "host_targets": ["agent-skills", "chatgpt", "codex"],
        "evals": [
            {"prompt": "build the demo artifact for this folder", "should_trigger": True, "expected": ["demo.txt exists"]},
            {"prompt": "make this demo repeatable", "should_trigger": True},
            {"prompt": "what does the word demo mean?", "should_trigger": False}
        ]
    }

    with tempfile.TemporaryDirectory() as tmp:
        root = Path(tmp)
        spec_path = root / "spec.json"
        spec_path.write_text(json.dumps(spec), encoding="utf-8")

        compiled = run(str(COMPILE), "--spec", str(spec_path), "--out", str(root / "out"))
        assert compiled.returncode == 0, compiled.stderr
        skill_dir = root / "out" / "demo-skill"
        assert (skill_dir / "SKILL.md").is_file()
        assert (skill_dir / "evals" / "evals.json").is_file()

        validated = run(str(VALIDATE), str(skill_dir), "--targets", "agent-skills,chatgpt,codex")
        assert validated.returncode == 0, validated.stdout + validated.stderr
        payload = json.loads(validated.stdout)
        assert payload["pass"] is True
        assert payload["errors"] == 0

        bad = dict(spec)
        bad["name"] = "Bad Name"
        spec_path.write_text(json.dumps(bad), encoding="utf-8")
        rejected = run(str(COMPILE), "--spec", str(spec_path), "--out", str(root / "bad"))
        assert rejected.returncode != 0

    print("portable skill smoke tests: PASS")


if __name__ == "__main__":
    main()
