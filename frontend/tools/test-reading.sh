#!/bin/sh
set -eu
cd "$(dirname "$0")/.."
reading_test_dir="$(mktemp -d)"
trap 'rm -rf "$reading_test_dir"' EXIT
./node_modules/.bin/tsc src/app/features/reading/reading-session.ts src/app/features/reading/starter-reading.ts --outDir "$reading_test_dir" --module commonjs --target ES2022 --skipLibCheck --strict
node tools/test-reading.cjs "$reading_test_dir"
