#!/bin/sh
set -eu
cd "$(dirname "$0")/.."
practice_test_dir="$(mktemp -d)"
./node_modules/.bin/tsc src/app/features/learn/practice-engine.ts --outDir "$practice_test_dir" --module commonjs --target ES2022 --skipLibCheck --strict
./node_modules/.bin/tsc src/app/features/learn/proficiency.ts --outDir "$practice_test_dir" --module commonjs --target ES2022 --skipLibCheck --strict
node tools/test-practice.cjs "$practice_test_dir/practice-engine.js" "$practice_test_dir/kanji-engine.js"
node tools/test-proficiency.cjs "$practice_test_dir/proficiency.js"
