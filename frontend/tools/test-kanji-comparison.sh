#!/bin/sh
set -eu
cd "$(dirname "$0")/.."
comparison_test_dir="$(mktemp -d)"
trap 'rm -rf "$comparison_test_dir"' EXIT
./node_modules/.bin/tsc src/app/features/associations/kanji-comparison.ts --outDir "$comparison_test_dir" --module commonjs --target ES2022 --skipLibCheck --strict
node tools/test-kanji-comparison.cjs "$comparison_test_dir"
