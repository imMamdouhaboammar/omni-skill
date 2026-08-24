#!/usr/bin/env python3
"""Static portability checks for Agent Skills and plugin wrappers."""

from __future__ import annotations

import argparse
import json
import re
from pathlib import Path

NAME_RE = re.compile(r"^[a-z0-9]+(?:-[a-z0-9]+)*$")
SECRET_RE = re.compile(
    r"(sk-[A-Za-z0-9_-]{16,}|ANTHROPIC_API_KEY\s*=|OPENAI_API_KEY\s*=|BEGIN (?:RSA |EC )?PRIVATE KEY)"
)
ABSOLUTE_PERSONAL_RE = re.compile(
    r"(/(?:Users|home)/[^\s/]+|[A-Za-z]:[/\\]+(?:Users|home)[/\\]+[^\s/\\]+)"
)
PROCESS_HINT_RE = re.compile(
    r"\b(first|then|next|finally|step\s+\d+|after that|before you)\b", re.I
)
KNOWN_TARGETS = {"agent-skills", "chatgpt", "codex", "claude-code"}


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
        elif in_description and (line.startswith(" ") or line.startswith("\t")):
            description_lines.append(line.strip())
        elif line and not line.startswith(" "):
            in_description = False
    description = " ".join(description_lines).strip() or None
    return name, description


def check_skill(skill_dir: Path) -> list[dict]:
    findings = []
    skill_md = skill_dir / "SKILL.md"
    if not skill_md.is_file():
        return [{"severity": "error", "code": "SKILLMD_MISSING", "message": "SKILL.md is missing"}]

    text = skill_md.read_text(encoding="utf-8", errors="replace")
    name, description = parse_frontmatter(text)

    if not name or not NAME_RE.fullmatch(name):
        findings.append({"severity": "error", "code": "NAME_INVALID", "message": "frontmatter name is missing or not kebab-case"})
    if name and skill_dir.name != name:
        findings.append({"severity": "error", "code": "FOLDER_NAME_MISMATCH", "message": "folder name does not match skill name"})
    if not description:
        findings.append({"severity": "error", "code": "DESCRIPTION_MISSING", "message": "description is missing"})
    elif len(description) > 1024:
        findings.append({"severity": "error", "code": "DESCRIPTION_TOO_LONG", "message": "description exceeds 1024 characters"})
    elif PROCESS_HINT_RE.search(description):
        findings.append({"severity": "warning", "code": "DESCRIPTION_PROCESS_HINT", "message": "description may contain workflow sequencing"})

    if len(text.splitlines()) >= 500:
        findings.append({"severity": "warning", "code": "BODY_LARGE", "message": "SKILL.md is 500 lines or more"})

    for path in skill_dir.rglob("*"):
        if path.is_dir():
            continue
        rel = path.relative_to(skill_dir)
        content = path.read_text(encoding="utf-8", errors="ignore") if path.suffix.lower() in {
            ".md", ".py", ".json", ".yaml", ".yml", ".txt"
        } else ""
        if SECRET_RE.search(content):
            findings.append({"severity": "error", "code": "SECRET_SHAPED_CONTENT", "message": f"secret-shaped content in {rel}"})
        if ABSOLUTE_PERSONAL_RE.search(content):
            findings.append({"severity": "warning", "code": "PERSONAL_ABSOLUTE_PATH", "message": f"personal absolute path in {rel}"})
        parts = rel.parts
        if parts and parts[0] == "references" and len(parts) > 2:
            findings.append({"severity": "warning", "code": "DEEP_REFERENCE", "message": f"reference nesting exceeds one level: {rel}"})

    return findings


def resolve_inside(root: Path, raw: str) -> tuple[bool, Path]:
    if not isinstance(raw, str) or not raw.startswith("./"):
        return False, root
    candidate = (root / raw[2:]).resolve()
    try:
        candidate.relative_to(root.resolve())
    except ValueError:
        return False, candidate
    return True, candidate


def check_openai_plugin(plugin_root: Path) -> list[dict]:
    findings = []
    manifest_dir = plugin_root / ".codex-plugin"
    manifest = manifest_dir / "plugin.json"
    if not manifest.is_file():
        return [{"severity": "error", "code": "OPENAI_MANIFEST_MISSING", "message": ".codex-plugin/plugin.json is missing"}]

    extras = [p.name for p in manifest_dir.iterdir() if p.name != "plugin.json"]
    if extras:
        findings.append({"severity": "error", "code": "OPENAI_MANIFEST_DIR_EXTRA", "message": f"only plugin.json may be in .codex-plugin/: {extras}"})

    try:
        data = json.loads(manifest.read_text(encoding="utf-8"))
    except Exception as exc:
        return [{"severity": "error", "code": "OPENAI_MANIFEST_JSON", "message": f"invalid plugin.json: {exc}"}]

    for key in ("name", "version", "description"):
        if not isinstance(data.get(key), str) or not data[key].strip():
            findings.append({"severity": "error", "code": f"OPENAI_{key.upper()}_MISSING", "message": f"plugin.json {key} is required"})

    skills = data.get("skills")
    ok, path = resolve_inside(plugin_root, skills) if skills is not None else (False, plugin_root)
    if not ok or not path.is_dir():
        findings.append({"severity": "error", "code": "OPENAI_SKILLS_PATH", "message": "skills must be a package-relative existing directory"})

    interface = data.get("interface", {})
    if interface and not isinstance(interface, dict):
        findings.append({"severity": "error", "code": "OPENAI_INTERFACE_TYPE", "message": "interface must be an object"})
        interface = {}
    for field in ("composerIcon", "logo"):
        if field in interface:
            ok, path = resolve_inside(plugin_root, interface[field])
            if not ok or not path.is_file():
                findings.append({"severity": "error", "code": f"OPENAI_{field.upper()}_PATH", "message": f"{field} path does not resolve inside plugin"})

    for prompt in interface.get("defaultPrompt", []) if isinstance(interface.get("defaultPrompt", []), list) else []:
        if not isinstance(prompt, str) or len(prompt) > 128:
            findings.append({"severity": "error", "code": "OPENAI_DEFAULT_PROMPT", "message": "each defaultPrompt must be a string of at most 128 characters"})

    return findings


def check_claude_plugin(plugin_root: Path) -> list[dict]:
    manifest = plugin_root / ".claude-plugin" / "plugin.json"
    if not manifest.is_file():
        return [{"severity": "warning", "code": "CLAUDE_MANIFEST_MISSING", "message": ".claude-plugin/plugin.json is missing"}]
    try:
        json.loads(manifest.read_text(encoding="utf-8"))
    except Exception as exc:
        return [{"severity": "error", "code": "CLAUDE_MANIFEST_JSON", "message": f"invalid Claude plugin.json: {exc}"}]
    return []


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("skill_dir", type=Path)
    parser.add_argument("--targets", default="agent-skills", help="comma-separated targets")
    parser.add_argument("--plugin-root", type=Path, default=None)
    args = parser.parse_args()

    targets = [item.strip() for item in args.targets.split(",") if item.strip()]
    unknown = [item for item in targets if item not in KNOWN_TARGETS and not item.startswith("custom:")]
    if unknown:
        raise SystemExit(f"Unknown target(s): {', '.join(unknown)}")

    findings = check_skill(args.skill_dir)
    plugin_root = args.plugin_root
    if plugin_root:
        if "chatgpt" in targets or "codex" in targets:
            findings.extend(check_openai_plugin(plugin_root))
        if "claude-code" in targets:
            findings.extend(check_claude_plugin(plugin_root))

    errors = sum(1 for item in findings if item["severity"] == "error")
    warnings = sum(1 for item in findings if item["severity"] == "warning")
    result = {
        "skill": str(args.skill_dir),
        "targets": targets,
        "errors": errors,
        "warnings": warnings,
        "findings": findings,
        "pass": errors == 0,
    }
    print(json.dumps(result, indent=2))
    raise SystemExit(1 if errors else 0)


if __name__ == "__main__":
    main()
