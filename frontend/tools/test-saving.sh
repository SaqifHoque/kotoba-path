#!/bin/sh
set -eu
cd "$(dirname "$0")/.."
saving_test_dir="$(mktemp -d)"
trap 'rm -rf "$saving_test_dir"' EXIT
./node_modules/.bin/tsc src/app/features/settings/progress-backup.ts src/app/features/settings/save-status.ts --outDir "$saving_test_dir" --module commonjs --target ES2022 --skipLibCheck --strict
node tools/test-saving.cjs "$saving_test_dir"
