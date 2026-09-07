#!/bin/sh
set -eu
cd "$(dirname "$0")/.."
test_dir="$(mktemp -d)"
trap 'rm -rf "$test_dir"' EXIT
./node_modules/.bin/tsc src/app/features/learn/proficiency.ts --outDir "$test_dir" --module commonjs --target ES2022 --skipLibCheck --strict
node tools/test-proficiency.cjs "$test_dir/proficiency.js"
