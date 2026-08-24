#!/usr/bin/env python3
"""Compile a JSON SkillSpec into an Agent Skills-compatible scaffold."""

from __future__ import annotations

import argparse
import json
import re
from pathlib import Path

NAME_RE = re.compile(r"^[a-z0-9]+(?:-[a-z0-9]+)*$")
VALID_FREEDOM = {"low", "medium", "high"}
KNOWN_HOSTS = {"agent-skills", "chatgpt", "codex", "claude-code"}


def load_spec(path: Path) -> dict:
    data = json.loads(path.read_text(encoding="utf-8"))
    if not isinstance(data, dict):
        raise ValueError("SkillSpec root must be an object")
    return data


def as_nonempty_list(value, field: str, minimum: int = 1) -> list:
    if not isinstance(value, list) or len(value) < minimum:
        raise ValueError(f"{field} must be a list with at least {minimum} item(s)")
    if any(not isinstance(item, str) or not item.strip() for item in value):
        raise ValueError(f"{field} must contain non-empty strings")
    return [item.strip() for item in value]


def validate_spec(spec: dict) -> None:
    name = spec.get("name")
    if not isinstance(name, str) or not NAME_RE.fullmatch(name):
        raise ValueError("name must be kebab-case")

    for field in ("purpose", "baseline_failure"):
        value = spec.get(field)
        if not isinstance(value, str) or not value.strip():
            raise ValueError(f"{field} is required")

    triggers = spec.get("triggers")
    if not isinstance(triggers, dict):
        raise ValueError("triggers must be an object")
    as_nonempty_list(triggers.get("positive"), "triggers.positive", 3)
    as_nonempty_list(triggers.get("negative"), "triggers.negative", 2)

    as_nonempty_list(spec.get("outputs"), "outputs")
    hosts = as_nonempty_list(spec.get("host_targets"), "host_targets")
    for host in hosts:
        if host not in KNOWN_HOSTS and not host.startswith("custom:"):
            raise ValueError(
                f"unsupported host target {host!r}; use custom:<name> for unknown hosts"
            )

    workflow = spec.get("workflow")
    if not isinstance(workflow, list) or not workflow:
        raise ValueError("workflow must contain at least one step")
    for index, step in enumerate(workflow, start=1):
        if not isinstance(step, dict):
            raise ValueError(f"workflow[{index}] must be an object")
        for field in ("action", "why", "freedom"):
            value = step.get(field)
            if not isinstance(value, str) or not value.strip():
                raise ValueError(f"workflow[{index}].{field} is required")
        if step["freedom"] not in VALID_FREEDOM:
            raise ValueError(
                f"workflow[{index}].freedom must be low, medium, or high"
            )

    evals = spec.get("evals")
    if not isinstance(evals, list) or len(evals) < 3:
        raise ValueError("evals must contain at least 3 cases")
    for index, case in enumerate(evals, start=1):
        if not isinstance(case, dict):
            raise ValueError(f"evals[{index}] must be an object")
        if not isinstance(case.get("prompt"), str) or not case["prompt"].strip():
            raise ValueError(f"evals[{index}].prompt is required")
        if not isinstance(case.get("should_trigger"), bool):
            raise ValueError(f"evals[{index}].should_trigger must be boolean")


def build_description(spec: dict) -> str:
    explicit = spec.get("description")
    if isinstance(explicit, str) and explicit.strip():
        description = " ".join(explicit.split())
    else:
        positives = spec["triggers"]["positive"][:4]
        negatives = spec["triggers"]["negative"][:2]
        description = (
            f"{spec['purpose'].strip()}. Use when users ask to "
            + "; ".join(positives)
            + ". Do NOT use for "
            + "; ".join(negatives)
            + "."
        )
    if len(description) > 1024:
        raise ValueError("compiled description exceeds 1024 characters")
    if "<" in description or ">" in description:
        raise ValueError("description may not contain angle brackets")
    return description


def yaml_fold(value: str, indent: int = 2) -> str:
    words = value.split()
    lines, current = [], ""
    for word in words:
        candidate = word if not current else f"{current} {word}"
        if len(candidate) > 86 and current:
            lines.append(current)
            current = word
        else:
            current = candidate
    if current:
        lines.append(current)
    prefix = " " * indent
    return "\n".join(prefix + line for line in lines)


def build_skill_md(spec: dict) -> str:
    description = build_description(spec)
    hosts = ", ".join(spec["host_targets"])
    outputs = "\n".join(f"- {item}" for item in spec["outputs"])
    invariants = spec.get("invariants") or []
    invariant_block = "\n".join(f"- {item}" for item in invariants) or "- None declared"

    workflow_rows = []
    for idx, step in enumerate(spec["workflow"], start=1):
        action = step["action"].replace("|", "\\|").strip()
        why = step["why"].replace("|", "\\|").strip()
        workflow_rows.append(
            f"| {idx} | {action} | {step['freedom']} | {why} |"
        )

    resources = spec.get("resources") or []
    resource_block = "\n".join(f"- {item}" for item in resources) or "- None required"

    tools = spec.get("tools") or []
    tool_block = "\n".join(f"- {item}" for item in tools) or "- No host-specific capability required"

    return f"""---
name: {spec['name']}
description: >
{yaml_fold(description, 2)}
---

# {spec['name']}

## Purpose

{spec['purpose'].strip()}

## Host targets

{hosts}

Treat tool names and package mechanics as host-specific. If a required capability is unavailable, report the gap instead of inventing a tool.

## Baseline failure

{spec['baseline_failure'].strip()}

## Required outputs

{outputs}

## Workflow

| Step | Action | Freedom | Why |
| ---: | --- | --- | --- |
{chr(10).join(workflow_rows)}

## Invariants

{invariant_block}

## Capabilities

{tool_block}

## Resources

{resource_block}

## Verification

Use the bundled `evals/evals.json`.

- verify intended prompts trigger
- verify near-miss prompts do not trigger
- grade observable assertions in positive cases
- keep host-specific evidence labeled by host
- do not claim an unexecuted host test passed

## Common mistakes

- Copying provider-specific tool names into a supposedly portable skill
- Putting the full workflow in frontmatter
- Raising freedom on high-consequence steps
- Replacing missing evidence with confident wording
- Porting by renaming one provider to another
"""


def build_eval_set(spec: dict) -> list[dict]:
    result = []
    for index, case in enumerate(spec["evals"], start=1):
        entry = {
            "name": case.get("name") or f"case-{index}",
            "query": case["prompt"].strip(),
            "should_trigger": case["should_trigger"],
        }
        expected = case.get("expected")
        if expected is not None:
            if not isinstance(expected, list) or any(
                not isinstance(item, str) or not item.strip() for item in expected
            ):
                raise ValueError(f"evals[{index}].expected must be a list of strings")
            entry["expected"] = [item.strip() for item in expected]
        result.append(entry)
    return result


def build_host_notes(spec: dict) -> str:
    lines = [
        "# Host notes",
        "",
        "Generated from SkillSpec. Re-check current host documentation before packaging.",
        "",
    ]
    for host in spec["host_targets"]:
        lines.extend([f"## {host}", ""])
        if host == "agent-skills":
            lines.append("Use the portable `SKILL.md` folder contract.")
        elif host in {"chatgpt", "codex"}:
            lines.append(
                "The skill body is portable. Plugin packaging, if requested, belongs outside "
                "the skill under `.codex-plugin/plugin.json` at the plugin root."
            )
        elif host == "claude-code":
            lines.append(
                "Keep Claude Code plugin/marketplace mechanics separate from the portable skill body."
            )
        else:
            lines.append(
                "Custom host: complete a host capability profile before claiming install or trigger compatibility."
            )
        lines.append("")
    return "\n".join(lines)


def compile_spec(spec_path: Path, out_dir: Path) -> Path:
    spec = load_spec(spec_path)
    validate_spec(spec)

    skill_dir = out_dir / spec["name"]
    (skill_dir / "evals").mkdir(parents=True, exist_ok=True)
    (skill_dir / "references").mkdir(parents=True, exist_ok=True)

    (skill_dir / "SKILL.md").write_text(build_skill_md(spec), encoding="utf-8")
    (skill_dir / "evals" / "evals.json").write_text(
        json.dumps(build_eval_set(spec), indent=2, ensure_ascii=False) + "\n",
        encoding="utf-8",
    )
    (skill_dir / "references" / "host-notes.md").write_text(
        build_host_notes(spec), encoding="utf-8"
    )
    (skill_dir / "skill-spec.json").write_text(
        json.dumps(spec, indent=2, ensure_ascii=False) + "\n", encoding="utf-8"
    )
    return skill_dir


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--spec", required=True, type=Path, help="SkillSpec JSON path")
    parser.add_argument("--out", required=True, type=Path, help="Output directory")
    parser.add_argument("--check", action="store_true", help="Validate only")
    args = parser.parse_args()

    spec = load_spec(args.spec)
    validate_spec(spec)
    if args.check:
        print(json.dumps({"valid": True, "name": spec["name"]}))
        return

    skill_dir = compile_spec(args.spec, args.out)
    print(json.dumps({"compiled": True, "path": str(skill_dir)}))


if __name__ == "__main__":
    main()
