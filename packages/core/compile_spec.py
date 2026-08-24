#!/usr/bin/env python3
"""OmniSkillSpec Compiler: Converts structured SkillSpec JSON/YAML into portable Skill trees."""

from __future__ import annotations
import json
import re
from pathlib import Path
from typing import Any, Dict

def compile_spec(spec_data: Dict[str, Any], output_dir: Path) -> Path:
    name = spec_data.get("name", "unnamed-skill")
    description = spec_data.get("description", "").strip()
    job = spec_data.get("job", "")
    instructions = spec_data.get("instructions", [])
    references = spec_data.get("references", {})
    evals = spec_data.get("evals", [])

    skill_path = output_dir / name
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
    import sys
    if len(sys.argv) < 2:
        print("Usage: compile_spec.py <spec.json> [output_dir]")
        sys.exit(1)
    spec_file = Path(sys.argv[1])
    out = Path(sys.argv[2]) if len(sys.argv) > 2 else Path(".")
    data = json.loads(spec_file.read_text(encoding="utf-8"))
    res = compile_spec(data, out)
    print(f"Compiled skill to: {res}")
