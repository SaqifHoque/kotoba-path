#!/bin/sh
set -eu
cd "$(dirname "$0")/.."
library_test_dir="$(mktemp -d)"
trap 'rm -rf "$library_test_dir"' EXIT
./node_modules/.bin/tsc src/app/features/memory/memory-library.ts --outDir "$library_test_dir" --module commonjs --target ES2022 --skipLibCheck --strict
node tools/test-memory-library.cjs "$library_test_dir"
