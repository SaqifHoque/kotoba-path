#!/bin/sh
set -eu
cd "$(dirname "$0")/.."
practice_test_dir="$(mktemp -d)"
trap 'rm -rf "$practice_test_dir"' EXIT
./node_modules/.bin/tsc src/app/features/reviews/mistake-practice.ts --outDir "$practice_test_dir" --module commonjs --target ES2022 --skipLibCheck --strict
node tools/test-mistake-practice.cjs "$practice_test_dir"
