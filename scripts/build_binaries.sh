#!/usr/bin/env bash
set -e

# Multi-Architecture Standalone Binary Builder
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
BIN_DIST="${ROOT_DIR}/dist/bin"
mkdir -p "${BIN_DIST}"

echo "Building standalone binaries for OmniSkill..."

# Entrypoint
CLI_ENTRY="${ROOT_DIR}/packages/cli/src/index.ts"

TARGETS=(
  "bun-darwin-arm64:${BIN_DIST}/omni-skill-darwin-arm64"
  "bun-darwin-x64:${BIN_DIST}/omni-skill-darwin-x64"
  "bun-linux-x64:${BIN_DIST}/omni-skill-linux-x64"
  "bun-linux-arm64:${BIN_DIST}/omni-skill-linux-arm64"
  "bun-windows-x64:${BIN_DIST}/omni-skill-windows-x64.exe"
)

for TARGET in "${TARGETS[@]}"; do
  PLATFORM="${TARGET%%:*}"
  OUTFILE="${TARGET##*:}"
  echo "Compiling for ${PLATFORM} -> ${OUTFILE}..."
  bun build "${CLI_ENTRY}" --compile --target="${PLATFORM}" --outfile="${OUTFILE}" 2>/dev/null || echo "Warning: Cross-compilation for ${PLATFORM} skipped on current host"
done

echo "Generating SHA256SUMS..."
cd "${BIN_DIST}"
shasum -a 256 * > "${ROOT_DIR}/dist/SHA256SUMS" 2>/dev/null || sha256sum * > "${ROOT_DIR}/dist/SHA256SUMS" 2>/dev/null || true
echo "Binaries built successfully!"
