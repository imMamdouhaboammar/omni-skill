#!/usr/bin/env python3
"""Build and calculate Homebrew release tarball checksums."""

import hashlib
import re
import sys
import tarfile
from pathlib import Path

def package_homebrew_release(root: Path, version: str) -> tuple[Path, str]:
    dist_dir = root / "dist"
    dist_dir.mkdir(exist_ok=True)
    tar_path = dist_dir / f"omni-skill-{version}.tar.gz"

    print(f"Creating release tarball: {tar_path}")
    with tarfile.open(tar_path, "w:gz") as tar:
        for item in [
            "packages",
            "skills",
            "assets",
            "examples",
            ".agents",
            ".claude-plugin",
            ".codex-plugin",
            "package.json",
            "tsconfig.json",
            "README.md",
            "LICENSE",
            "SPECIFICATION.md",
            "PRIVACY.md",
            "TERMS.md",
            "SUPPORT.md"
        ]:
            p = root / item
            if p.exists():
                tar.add(p, arcname=f"omni-skill-{version}/{item}")

    sha256 = hashlib.sha256(tar_path.read_bytes()).hexdigest()
    print(f"Release Tarball SHA256: {sha256}")

    # Update Formula
    formula_file = root / "Formula" / "omni-skill.rb"
    if formula_file.exists():
        content = formula_file.read_text(encoding="utf-8")
        content = re.sub(r'sha256\s+"[a-f0-9]+"', f'sha256 "{sha256}"', content)
        content = re.sub(r'v\d+\.\d+\.\d+\.tar\.gz', f'v{version}.tar.gz', content)
        formula_file.write_text(content, encoding="utf-8")
        print(f"Updated Formula/omni-skill.rb with new SHA256: {sha256}")

    return tar_path, sha256

if __name__ == "__main__":
    root_dir = Path(__file__).resolve().parent.parent
    ver = "5.0.0"
    if len(sys.argv) > 1:
        ver = sys.argv[1]
    package_homebrew_release(root_dir, ver)
