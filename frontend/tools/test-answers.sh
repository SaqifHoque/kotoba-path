#!/bin/sh
set -eu
cd "$(dirname "$0")/.."
answer_test_dir="$(mktemp -d)"
trap 'rm -rf "$answer_test_dir"' EXIT
./node_modules/.bin/tsc src/app/features/forge/forge-engine.ts --outDir "$answer_test_dir" --module commonjs --target ES2022 --skipLibCheck --strict
node tools/test-answers.cjs "$answer_test_dir"
