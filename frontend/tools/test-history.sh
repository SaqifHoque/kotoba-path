#!/bin/sh
set -eu
cd "$(dirname "$0")/.."
history_test_dir="$(mktemp -d)"
trap 'rm -rf "$history_test_dir"' EXIT
./node_modules/.bin/tsc src/app/features/learn/review-history.ts --outDir "$history_test_dir" --module commonjs --target ES2022 --skipLibCheck --strict
node tools/test-history.cjs "$history_test_dir/review-history.js"
