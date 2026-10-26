#!/usr/bin/env bash
# Copy to one user-selected destination; never probe or replace agent settings.
set -euo pipefail
if [ "$#" -ne 1 ]; then
  echo 'Usage: bash install.sh <new-skill-directory>' >&2
  exit 2
fi
SOURCE_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd -P)"
if [ -e "$1" ] || [ -L "$1" ]; then
  echo 'Destination exists; refusing to replace it.' >&2
  exit 1
fi
PARENT_DIR="$(cd -- "$(dirname -- "$1")" && pwd -P)"
DESTINATION="$PARENT_DIR/$(basename -- "$1")"
case "$DESTINATION/" in
  "$SOURCE_DIR/"*) echo 'Destination must be outside the source.' >&2; exit 1 ;;
esac
cp -R -- "$SOURCE_DIR" "$DESTINATION"
printf 'Installed at %s\n' "$DESTINATION"
