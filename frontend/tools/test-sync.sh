#!/bin/sh
set -eu
cd "$(dirname "$0")/.."
sync_test_dir="$(mktemp -d)"
./node_modules/.bin/tsc src/app/features/learn/study-progress.ts --outDir "$sync_test_dir" --module commonjs --target ES2022 --skipLibCheck --strict
node tools/test-sync.cjs "$sync_test_dir/study-progress.js"
