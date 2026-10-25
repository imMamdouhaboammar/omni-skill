#!/usr/bin/env python3
"""OmniSkillSpec Compiler: Converts structured SkillSpec JSON/YAML into portable Skill trees."""

from __future__ import annotations
import json
import re
from pathlib import Path
from typing import Any, Dict

NAME_RE = re.compile(r"^[a-z0-9]+(?:-[a-z0-9]+)*$")

def compile_spec(spec_data: Dict[str, Any], output_dir: Path) -> Path:
    if not isinstance(spec_data, dict):
        raise TypeError("Specification data must be a dictionary.")

    name = spec_data.get("name")
    if name is None or not isinstance(name, str):
        raise TypeError(f"Skill name must be a non-empty string, got {type(name).__name__}.")

    if not NAME_RE.match(name):
        raise ValueError(f"Invalid skill name '{name}'. Must be lowercase kebab-case alphanumeric.")

    resolved_output = output_dir.resolve()
    skill_path = (output_dir / name).resolve()

    try:
        skill_path.relative_to(resolved_output)
    except ValueError:
        raise ValueError(f"Path containment violation: '{name}' escapes output directory '{output_dir}'.")

    if skill_path == resolved_output:
        raise ValueError("Skill path cannot be the output root directory.")

    description = spec_data.get("description", "").strip()
    job = spec_data.get("job", "")
    instructions = spec_data.get("instructions", [])
    references = spec_data.get("references", {})
    evals = spec_data.get("evals", [])

    skill_path.mkdir(parents=True, exist_ok=True)

    # 1. Generate SKILL.md
    lines = [
        "---",
        f"name: {name}",
        "description: >",
        f"  {description}",
        "---",
        "",
        f"# {name.replace('-', ' ').title()}",
        "",
        f"> {job}",
        "",
        "## Invariant Guidelines",
        ""
    ]
    for step in instructions:
        lines.append(f"- {step}")

    lines.extend([
        "",
        "## Capability Requirements",
        "",
        f"- Target Hosts: {', '.join(spec_data.get('target_hosts', ['agent-skills', 'chatgpt', 'codex', 'claude-code']))}",
        f"- Freedom Level: {spec_data.get('freedom_level', 'medium')}",
        ""
    ])

    (skill_path / "SKILL.md").write_text("\n".join(lines), encoding="utf-8")

    # 2. Generate references
    if references:
        ref_dir = skill_path / "references"
        ref_dir.mkdir(exist_ok=True)
        for ref_name, ref_content in references.items():
            (ref_dir / f"{ref_name}.md").write_text(str(ref_content), encoding="utf-8")

    # 3. Generate evals
    if evals:
        eval_dir = skill_path / "evals"
        eval_dir.mkdir(exist_ok=True)
        (eval_dir / "evals.json").write_text(json.dumps({"evals": evals}, indent=2), encoding="utf-8")

    return skill_path

if __name__ == "__main__":
    import argparse
    import sys
    parser = argparse.ArgumentParser(description="Compile an OmniSkill JSON specification")
    parser.add_argument("spec", type=Path, help="Specification JSON path")
    parser.add_argument("output_dir", nargs="?", type=Path, default=Path("."), help="Destination directory")
    args = parser.parse_args()
    spec_file = args.spec
    if not spec_file.exists():
        print(f"Error: Specification file not found: {spec_file}", file=sys.stderr)
        sys.exit(1)
    out = args.output_dir
    try:
        data = json.loads(spec_file.read_text(encoding="utf-8"))
    except Exception as exc:
        print(f"Error: Failed to parse JSON specification: {exc}", file=sys.stderr)
        sys.exit(1)
    try:
        res = compile_spec(data, out)
    except Exception as exc:
        print(f"Error: Failed to compile specification: {exc}", file=sys.stderr)
        sys.exit(1)
    print(f"Compiled skill to: {res}")
