#!/bin/sh
set -eu
cd "$(dirname "$0")/.."
pacing_test_dir="$(mktemp -d)"
trap 'rm -rf "$pacing_test_dir"' EXIT
./node_modules/.bin/tsc src/app/features/pacing/study-pacing.ts --outDir "$pacing_test_dir" --module commonjs --target ES2022 --skipLibCheck --strict
node tools/test-pacing.cjs "$pacing_test_dir"
