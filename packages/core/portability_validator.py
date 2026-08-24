#!/usr/bin/env python3
"""OmniSkill Portability and Static Security Validator."""

from __future__ import annotations
import argparse
import json
import re
import sys
from pathlib import Path
from typing import Any, Dict, List

NAME_RE = re.compile(r"^[a-z0-9]+(?:-[a-z0-9]+)*$")
SECRET_RE = re.compile(
    r"(sk-[A-Za-z0-9_-]{16,}|ANTHROPIC_API_KEY\s*=|OPENAI_API_KEY\s*=|BEGIN (?:RSA |EC )?PRIVATE KEY)"
)
ABSOLUTE_PERSONAL_RE = re.compile(
    r"(/(?:Users|home)/[^\s/]+|[A-Za-z]:[/\\]+(?:Users|home)[/\\]+[^\s/\\]+)"
)

def parse_frontmatter(text: str) -> tuple[str | None, str | None]:
    if not text.startswith("---\n"):
        return None, None
    end = text.find("\n---", 4)
    if end == -1:
        return None, None
    block = text[4:end].splitlines()
    name = None
    description_lines = []
    in_description = False
    for line in block:
        if line.startswith("name:"):
            name = line.split(":", 1)[1].strip().strip("'\"")
            in_description = False
        elif line.startswith("description:"):
            value = line.split(":", 1)[1].strip()
            in_description = value in {">", "|", ">-", "|-"} or not value
            if value and not in_description:
                description_lines.append(value.strip("'\""))
        elif in_description:
            if line.startswith(" ") or line.startswith("\t"):
                description_lines.append(line.strip())
            else:
                in_description = False
    return name, " ".join(description_lines).strip()

def validate_skill(skill_dir: Path, targets: List[str] = None) -> Dict[str, Any]:
    findings = []
    skill_md = skill_dir / "SKILL.md"
    if not skill_md.exists():
        return {"skill": str(skill_dir), "errors": 1, "warnings": 0, "findings": [{"severity": "error", "message": "Missing SKILL.md"}], "pass": False}

    content = skill_md.read_text(encoding="utf-8")
    lines = content.splitlines()

    name, desc = parse_frontmatter(content)
    if not name or not NAME_RE.match(name):
        findings.append({"severity": "error", "code": "INVALID_NAME", "message": f"Invalid skill name: {name}"})
    if not desc:
        findings.append({"severity": "error", "code": "MISSING_DESCRIPTION", "message": "Missing frontmatter description"})
    if len(lines) > 500:
        findings.append({"severity": "warning", "code": "BODY_LARGE", "message": f"SKILL.md is {len(lines)} lines (prefer <500)"})

    for file_path in skill_dir.rglob("*"):
        if file_path.is_file() and not file_path.name.startswith(".") and "__pycache__" not in file_path.parts and not file_path.suffix.lower() in {".pyc", ".png", ".jpg", ".svg", ".zip", ".tar", ".gz"}:
            try:
                txt = file_path.read_text(encoding="utf-8", errors="ignore")
                if SECRET_RE.search(txt):
                    findings.append({"severity": "error", "code": "SECRET_LEAK", "message": f"Possible secret found in {file_path.relative_to(skill_dir)}"})
                if ABSOLUTE_PERSONAL_RE.search(txt):
                    findings.append({"severity": "warning", "code": "PERSONAL_PATH", "message": f"Absolute personal path found in {file_path.relative_to(skill_dir)}"})
            except Exception:
                pass

    errors = sum(1 for f in findings if f["severity"] == "error")
    warnings = sum(1 for f in findings if f["severity"] == "warning")
    return {
        "skill": str(skill_dir),
        "targets": targets or ["agent-skills", "chatgpt", "codex", "claude-code"],
        "errors": errors,
        "warnings": warnings,
        "findings": findings,
        "pass": errors == 0
    }

if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("skill_dir", type=Path)
    parser.add_argument("--targets", default="agent-skills,chatgpt,codex,claude-code")
    args = parser.parse_args()
    report = validate_skill(args.skill_dir, args.targets.split(","))
    print(json.dumps(report, indent=2))
    sys.exit(0 if report["pass"] else 1)
