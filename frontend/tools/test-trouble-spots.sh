#!/bin/sh
set -eu
cd "$(dirname "$0")/.."
trouble_test_dir="$(mktemp -d)"
trap 'rm -rf "$trouble_test_dir"' EXIT
./node_modules/.bin/tsc src/app/features/reviews/trouble-spots.ts src/app/features/reviews/mistake-practice.ts --outDir "$trouble_test_dir" --module commonjs --target ES2022 --skipLibCheck --strict
node tools/test-trouble-spots.cjs "$trouble_test_dir"
