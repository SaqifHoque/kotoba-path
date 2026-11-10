#!/bin/sh
set -eu
cd "$(dirname "$0")/.."
guided_test_dir="$(mktemp -d)"
trap 'rm -rf "$guided_test_dir"' EXIT
./node_modules/.bin/tsc src/app/features/chapters/guided-lesson.ts src/app/features/chapters/starter-chapter.ts src/app/features/settings/progress-backup.ts --outDir "$guided_test_dir" --module commonjs --target ES2022 --skipLibCheck --strict
node tools/test-guided.cjs "$guided_test_dir"
