#!/bin/sh
set -eu
cd "$(dirname "$0")/.."
foundation_test_dir="$(mktemp -d)"
trap 'rm -rf "$foundation_test_dir"' EXIT
./node_modules/.bin/tsc src/app/features/learn/curriculum-manifest.ts src/app/features/settings/progress-backup.ts --outDir "$foundation_test_dir" --module commonjs --target ES2022 --skipLibCheck --strict
node tools/test-foundation.cjs "$foundation_test_dir"
