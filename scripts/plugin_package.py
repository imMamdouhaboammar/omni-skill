#!/usr/bin/env python3
"""Build the reviewed skills-only public package, never the whole repository.

No network, dependency install, source mutation, or directory publication.
"""
from __future__ import annotations
import argparse
import hashlib
import importlib.util
import json
from pathlib import Path, PurePosixPath
import re
import stat
import sys
import zipfile

PUBLIC_FILES = ('plugin.json', 'LICENSE', 'README.md', 'PRIVACY.md', 'TERMS.md', 'SUPPORT.md', 'docs/plugin-submission.md')
PUBLIC_DIRS = ('.codex-plugin', 'assets', 'skills')
PUBLIC_SKILLS = (
    'dont-it-yourself', 'host-workspace-operator', 'humanity-and-humanness',
    'integrate', 'measure-dont-guess', 'omni-skill', 'poteto-principles',
    'repo-craft-and-distribute', 'sandbox-python-executor', 'setup',
    'skill-architect', 'skill-authoring', 'skill-conductor',
    'skill-evaluator', 'skill-portability-compiler', 'writing',
)
SKIP_DIRS = {'__pycache__', '.pytest_cache', 'node_modules', '.git', 'tests'}
SKIP_NAMES = {'.DS_Store', 'Thumbs.db', 'test_smoke.py', 'test_security_scanner.py', 'test_viewer_accessibility.py'}
PUBLIC…1308 tokens truncated…n        if not text.startswith('---\n') or f'name: {slug}\n' not in text.split('\n---', 1)[0]:
            raise ValueError(f'Invalid skill identity: {slug}')
        for ref in re.findall(r'`([^`\n]+\.md)`', text):
            if '<' in ref or not ref.startswith(('references/', 'usecases/', '../')):
                continue
            target = (root / 'skills' / slug / ref).resolve()
            if root not in target.parents or not target.is_file():
                raise ValueError(f'Missing or escaped skill resource: {slug}/{ref}')
    inventory(root)
    return data


def build(root: Path, output: Path) -> dict:
    root, output = root.resolve(), output.resolve()
    if output == root or root in output.parents:
        raise ValueError('Write the archive outside the source tree')
    data = validate(root)
    members = inventory(root)
    # Reuse the repository's reviewed scanner rather than duplicating its rules.
    scanner_path = root / 'skills/omni-skill/scripts/scan_skill_security.py'
    spec = importlib.util.spec_from_file_location('omni_plugin_security', scanner_path)
    scanner = importlib.util.module_from_spec(spec)
    sys.modules[spec.name] = scanner
    spec.loader.exec_module(scanner)
    for slug in PUBLIC_SKILLS:
        report = scanner.scan_skill_directory(root / 'skills' / slug)
        if not report.passed:
            raise ValueError(f'Security gate rejected {slug}: risk {report.risk_score}')
    secret_spec = importlib.util.spec_from_file_location(
        'omni_plugin_portability', root / 'skills/omni-skill/scripts/validate_portability.py')
    secret_validator = importlib.util.module_from_spec(secret_spec)
    secret_spec.loader.exec_module(secret_validator)
    for member in members:
        content = member.read_bytes().decode('utf-8', errors='ignore')
        if secret_validator.SECRET_RE.search(content):
            raise ValueError(f'Secret content in public member: {member.relative_to(root)}')
        if member.relative_to(root).parts[0] != 'skills' and member.suffix in {'.md', '.json', '.svg'}:
            findings = scanner.scan_text(member.read_text(), member.relative_to(root).as_posix())
            if any(f.severity in (scanner.Severity.HIGH, scanner.Severity.CRITICAL) for f in findings):
                raise ValueError(f'Security gate rejected public member: {member.relative_to(root)}')
    output.parent.mkdir(parents=True, exist_ok=True)
    with zipfile.ZipFile(output, 'w', compression=zipfile.ZIP_DEFLATED, compresslevel=9) as archive:
        for p in members:
            name = p.relative_to(root).as_posix()
            info = zipfile.ZipInfo(name, (2020, 1, 1, 0, 0, 0))
            info.create_system = 3
            info.external_attr = (stat.S_IFREG | 0o644) << 16
            info.compress_type = zipfile.ZIP_DEFLATED
            archive.writestr(info, p.read_bytes(), compresslevel=9)
    return {'name': data['name'], 'version': data['version'], 'files': len(members),
            'sha256': hashlib.sha256(output.read_bytes()).hexdigest(), 'archive': str(output)}


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('root', type=Path)
    parser.add_argument('output', type=Path)
    args = parser.parse_args()
    try:
        print(json.dumps(build(args.root, args.output), indent=2))
    except (ValueError, KeyError, OSError, json.JSONDecodeError) as error:
        parser.exit(1, f'Plugin package rejected: {error}\n')
