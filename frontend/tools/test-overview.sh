#!/bin/sh
set -eu
cd "$(dirname "$0")/.."
overview_test_dir="$(mktemp -d)"
trap 'rm -rf "$overview_test_dir"' EXIT
./node_modules/.bin/tsc src/app/features/study/study-overview.ts --outDir "$overview_test_dir" --module commonjs --target ES2022 --skipLibCheck --strict
node tools/test-overview.cjs "$overview_test_dir"
