#!/bin/sh
set -eu
cd "$(dirname "$0")/.."
chapter_test_dir="$(mktemp -d)"
trap 'rm -rf "$chapter_test_dir"' EXIT
./node_modules/.bin/tsc src/app/features/chapters/starter-chapter.ts src/app/features/learn/curriculum-manifest.ts src/app/features/forge/forge-engine.ts --outDir "$chapter_test_dir" --module commonjs --target ES2022 --skipLibCheck --strict
node tools/test-chapters.cjs "$chapter_test_dir"
