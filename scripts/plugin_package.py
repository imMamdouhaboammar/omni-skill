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
SKIP_NAMES = {'.DS_Store', 'Thumbs.db'}


def safe_path(root: Path, value: str) -> Path:
    if not isinstance(value, str) or not value.startswith('./') or value != value.strip():
        raise ValueError(f'Invalid package-relative path: {value!r}')
    if '\\' in value or any(ord(c) < 32 for c in value) or '..' in PurePosixPath(value).parts:
        raise ValueError(f'Unsafe path: {value!r}')
    p = root / value[2:]
    if p.is_symlink() or root.resolve() not in p.resolve().parents or not p.is_file():
        raise ValueError(f'Missing or unsafe file: {value}')
    return p


def inventory(root: Path) -> list[Path]:
    result = [root / f for f in PUBLIC_FILES]
    for d in PUBLIC_DIRS:
        base = root / d
        if base.is_symlink() or not base.is_dir():
            raise ValueError(f'Missing or symlink directory: {d}')
        for p in base.rglob('*'):
            rel = p.relative_to(root)
            if p.is_symlink():
                raise ValueError(f'Symlink cannot be packaged: {rel}')
            if any(part in SKIP_DIRS for part in rel.parts) or p.name in SKIP_NAMES or p.suffix == '.pyc':
                continue
            if p.is_file():
                if p.name.startswith('.env') or p.suffix in {'.pem', '.key', '.p12'}:
                    raise ValueError(f'Secret-shaped file: {rel}')
                result.append(p)
    folded = set()
    for p in result:
        if p.is_symlink() or not p.is_file():
            raise ValueError(f'Invalid public file: {p}')
        rel = p.relative_to(root).as_posix()
        if '\\' in rel or any(ord(c) < 32 for c in rel) or len(rel) > 1024:
            raise ValueError(f'Unsafe member name: {rel!r}')
        if rel.casefold() in folded:
            raise ValueError(f'Case-colliding path: {rel}')
        folded.add(rel.casefold())
    return sorted(result, key=lambda p: p.relative_to(root).as_posix())


def validate(root: Path) -> dict:
    root = root.resolve()
    data = json.loads((root / 'plugin.json').read_text())
    legacy = json.loads((root / '.codex-plugin/plugin.json').read_text())
    ext = data['extensions']['com.openai']
    if data.get('$schema') != 'https://agent-plugins.org/schemas/1.0.0/plugin.schema.json':
        raise ValueError('Portable Agent Plugins schema is required')
    if not re.fullmatch(r'\d+\.\d+\.\d+', data['version']):
        raise ValueError('Explicit stable semver is required')
    for k in ('name', 'version', 'description', 'author'):
        if data[k] != legacy[k]:
            raise ValueError(f'Manifest drift: {k}')
    if ext['interface'] != legacy['interface']:
        raise ValueError('Manifest presentation drift')
    for manifest in (data, legacy):
        if any(manifest.get(k) is not None for k in ('apps', 'mcpServers')):
            raise ValueError('This public package is skills-only')
        nested = manifest.get('extensions', {}).get('com.openai', {})
        if nested.get('apps') is not None:
            raise ValueError('Public app binding is forbidden')
    for name in ('.app.json', '.mcp.json', 'mcp.json'):
        if (root / name).exists():
            raise ValueError(f'Unexpected integration config: {name}')
    if set(p.name for p in (root / '.codex-plugin').iterdir()) != {'plugin.json'}:
        raise ValueError('Compatibility directory must contain only plugin.json')
    if set(p.name for p in (root / 'skills').iterdir() if p.is_dir()) != set(PUBLIC_SKILLS):
        raise ValueError('Public skill inventory changed; review the boundary first')
    i = ext['interface']
    for key, limit in (('displayName', 30), ('shortDescription', 30), ('longDescription', 4000)):
        if not isinstance(i[key], str) or not 0 < len(i[key]) <= limit:
            raise ValueError(f'Invalid listing length: {key}')
    if i['category'] != 'Developer Tools':
        raise ValueError('Incorrect primary category')
    for key in ('logo', 'composerIcon'):
        asset = safe_path(root, i[key])
        # Verify the PNG signature and IHDR dimensions without a graphics dependency.
        raw = asset.read_bytes()
        minimum = 256 if key == 'logo' else 48
        if raw[:8] != b'\x89PNG\r\n\x1a\n' or raw[12:16] != b'IHDR':
            raise ValueError(f'Expected PNG branding: {key}')
        width, height = int.from_bytes(raw[16:20], 'big'), int.from_bytes(raw[20:24], 'big')
        if not minimum <= width <= 4096 or width != height or len(raw) > 5 * 1024 * 1024:
            raise ValueError(f'Invalid square branding: {key}')
    safe_path(root, ext['onboardingSkill'])
    for slug in PUBLIC_SKILLS:
        text = (root / 'skills' / slug / 'SKILL.md').read_text()
        if not text.startswith('---\n') or f'name: {slug}\n' not in text.split('\n---', 1)[0]:
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
