#!/usr/bin/env python3
"""OmniSkillSpec Compiler: Converts structured SkillSpec JSON/YAML into portable Skill trees."""

from __future__ import annotations
import json
import re
from pathlib import Path
from typing import Any, Dict

NAME_RE = re.compile(r"^[a-z0-9]+(?:-[a-z0-9]+)*\Z")
REF_NAME_RE = re.compile(r"^[a-z0-9]+(?:-[a-z0-9]+)*\Z")

def _serialize_frontmatter(name: str, description: str) -> str:
    desc = description.strip()
    try:
        import yaml
        return yaml.safe_dump(
            {"name": name, "description": desc},
            sort_keys=False,
            allow_unicode=True
        ).strip()
    except ImportError:
        lines = desc.splitlines()
        if len(lines) > 1:
            indented = "\n".join(f"  {line}" for line in lines)
            return f"name: {name}\ndescription: |-\n{indented}"
        needs_quotes = (
            any(c in desc for c in ":#%@&*[]{}|>-")
            or desc.startswith(("-", "?", ":"))
            or "'" in desc
            or '"' in desc
        )
        if needs_quotes:
            return f"name: {name}\ndescription: {json.dumps(desc, ensure_ascii=False)}"
        return f"name: {name}\ndescription: {desc}"

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

    desc_raw = spec_data.get("description")
    if desc_raw is None or not isinstance(desc_raw, str):
        raise TypeError("Field 'description' must be a non-empty string.")
    if len(desc_raw.strip()) == 0:
        raise ValueError("Field 'description' must be a non-empty string.")
    description = desc_raw.strip()

    job_raw = spec_data.get("job")
    if job_raw is None or not isinstance(job_raw, str):
        raise TypeError("Field 'job' must be a non-empty string.")
    if len(job_raw.strip()) == 0:
        raise ValueError("Field 'job' must be a non-empty string.")
    job = job_raw.strip()

    instructions_raw = spec_data.get("instructions")
    if instructions_raw is None or not isinstance(instructions_raw, list):
        raise TypeError("Field 'instructions' must be a non-empty array of non-empty strings.")
    if len(instructions_raw) == 0:
        raise ValueError("Field 'instructions' must be a non-empty array of non-empty strings.")

    instructions = []
    for i, step in enumerate(instructions_raw):
        if not isinstance(step, str):
            raise TypeError(f"Field 'instructions[{i}]' must be a non-empty string.")
        if len(step.strip()) == 0:
            raise ValueError(f"Field 'instructions[{i}]' must be a non-empty string.")
        instructions.append(step)

    target_hosts = None
    if "target_hosts" in spec_data and spec_data["target_hosts"] is not None:
        raw_hosts = spec_data["target_hosts"]
        if not isinstance(raw_hosts, list):
            raise TypeError("Field 'target_hosts' must be an array of non-empty strings.")
        target_hosts = []
        for i, host in enumerate(raw_hosts):
            if not isinstance(host, str):
                raise TypeError(f"Field 'target_hosts[{i}]' must be a non-empty string.")
            if len(host.strip()) == 0:
                raise ValueError(f"Field 'target_hosts[{i}]' must be a non-empty string.")
            target_hosts.append(host)

    freedom_level = "medium"
    if "freedom_level" in spec_data and spec_data["freedom_level"] is not None:
        raw_level = spec_data["freedom_level"]
        if not isinstance(raw_level, str):
            raise TypeError(f"Field 'freedom_level' must be one of 'high', 'medium', 'low'. Received: {raw_level}")
        if raw_level not in ("high", "medium", "low"):
            raise ValueError(f"Field 'freedom_level' must be one of 'high', 'medium', 'low'. Received: {raw_level}")
        freedom_level = raw_level

    references = spec_data.get("references")
    ref_dir = skill_path / "references"
    resolved_ref_dir = ref_dir.resolve()
    ref_entries = []

    # Preflight validate all references before any filesystem modification
    if references is not None:
        if not isinstance(references, dict):
            raise TypeError("Field 'references' must be a dictionary mapping reference names to markdown content.")
        if ref_dir.is_symlink():
            raise ValueError("Path containment violation: 'references' directory is a symbolic link.")

        seen_ref_keys = set()
        ref_entries = list(references.items())
        for ref_name, ref_content in ref_entries:
            if not isinstance(ref_name, str) or not REF_NAME_RE.match(ref_name):
                raise ValueError(
                    f"Invalid reference name '{ref_name}'. Must be lowercase kebab-case alphanumeric without file extensions."
                )
            if not isinstance(ref_content, str):
                raise TypeError(f"Field 'references[\"{ref_name}\"]' must be a string.")
            canonical_ref_key = ref_name.lower()
            if canonical_ref_key in seen_ref_keys:
                raise ValueError(f"Duplicate reference name detected: '{ref_name}'.")
            seen_ref_keys.add(canonical_ref_key)

            target_ref_file = (ref_dir / f"{ref_name}.md").resolve()
            try:
                ref_rel = target_ref_file.relative_to(resolved_ref_dir)
            except ValueError:
                raise ValueError(f"Path containment violation: Reference '{ref_name}' escapes references directory.")
            if ref_rel != Path(f"{ref_name}.md"):
                raise ValueError(f"Path containment violation: Reference '{ref_name}' escapes references directory.")

            target_unresolved = ref_dir / f"{ref_name}.md"
            if target_unresolved.is_symlink():
                raise ValueError(f"Path containment violation: Target reference '{ref_name}.md' is a symbolic link.")

    evals = None
    if "evals" in spec_data and spec_data["evals"] is not None:
        raw_evals = spec_data["evals"]
        if not isinstance(raw_evals, list):
            raise TypeError("Field 'evals' must be an array of evaluation items.")
        evals = []
        for i, item in enumerate(raw_evals):
            if not isinstance(item, dict):
                raise TypeError(f"Field 'evals[{i}]' must be an object.")
            eval_id = item.get("id")
            if not isinstance(eval_id, str):
                raise TypeError(f"Field 'evals[{i}].id' must be a non-empty string.")
            if len(eval_id.strip()) == 0:
                raise ValueError(f"Field 'evals[{i}].id' must be a non-empty string.")

            if "description" in item and item["description"] is not None and not isinstance(item["description"], str):
                raise TypeError(f"Field 'evals[{i}].description' must be a string.")

            raw_assertions = item.get("assertions")
            if not isinstance(raw_assertions, list):
                raise TypeError(f"Field 'evals[{i}].assertions' must be a non-empty array of assertion objects.")
            if len(raw_assertions) == 0:
                raise ValueError(f"Field 'evals[{i}].assertions' must be a non-empty array of assertion objects.")

            for j, assertion in enumerate(raw_assertions):
                if not isinstance(assertion, dict):
                    raise TypeError(f"Field 'evals[{i}].assertions[{j}]' must be an object.")
                pattern = assertion.get("pattern")
                if not isinstance(pattern, str):
                    raise TypeError(f"Field 'evals[{i}].assertions[{j}].pattern' must be a non-empty string.")
                if len(pattern.strip()) == 0:
                    raise ValueError(f"Field 'evals[{i}].assertions[{j}].pattern' must be a non-empty string.")
                if "required" in assertion and assertion["required"] is not None and not isinstance(assertion["required"], bool):
                    raise TypeError(f"Field 'evals[{i}].assertions[{j}].required' must be a boolean.")
            evals.append(item)

    skill_path.mkdir(parents=True, exist_ok=True)

    # 1. Generate SKILL.md
    frontmatter = _serialize_frontmatter(name, description)
    lines = [
        "---",
        frontmatter,
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
        f"- Target Hosts: {', '.join(target_hosts if target_hosts else ['agent-skills', 'chatgpt', 'codex', 'claude-code'])}",
        f"- Freedom Level: {freedom_level}",
        ""
    ])

    (skill_path / "SKILL.md").write_text("\n".join(lines), encoding="utf-8")

    # 2. Generate references
    if ref_entries:
        ref_dir.mkdir(exist_ok=True)
        for ref_name, ref_content in ref_entries:
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
