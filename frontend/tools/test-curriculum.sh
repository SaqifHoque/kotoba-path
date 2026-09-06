#!/bin/sh
set -eu
cd "$(dirname "$0")/.."
curriculum_test_dir="$(mktemp -d)"
tsc src/app/features/learn/kanji-curriculum.ts --outDir "$curriculum_test_dir" --module commonjs --target ES2022 --skipLibCheck --strict
node tools/test-curriculum.cjs "$curriculum_test_dir/kanji-curriculum.js"
node tools/generate-kanji-curriculum.mjs --check
