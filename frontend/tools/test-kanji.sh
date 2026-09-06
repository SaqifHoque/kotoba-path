#!/bin/sh
set -eu
cd "$(dirname "$0")/.."
kanji_test_dir="$(mktemp -d)"
tsc src/app/features/learn/kanji-engine.ts --outDir "$kanji_test_dir" --module commonjs --target ES2022 --skipLibCheck --strict
node tools/test-kanji-engine.cjs "$kanji_test_dir/kanji-engine.js"
