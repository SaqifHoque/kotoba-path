#!/bin/sh
set -eu
cd "$(dirname "$0")/.."
memory_test_dir="$(mktemp -d)"
trap 'rm -rf "$memory_test_dir"' EXIT
./node_modules/.bin/tsc src/app/features/memory/personal-memory.ts --outDir "$memory_test_dir" --module commonjs --target ES2022 --skipLibCheck --strict
node tools/test-memory.cjs "$memory_test_dir"
