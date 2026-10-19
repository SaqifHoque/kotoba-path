#!/bin/sh
set -eu
cd "$(dirname "$0")/.."
home_test_dir="$(mktemp -d)"
trap 'rm -rf "$home_test_dir"' EXIT
./node_modules/.bin/tsc src/app/features/home/study-home.ts --outDir "$home_test_dir" --module commonjs --target ES2022 --skipLibCheck --strict
node tools/test-home.cjs "$home_test_dir/home/study-home.js"
