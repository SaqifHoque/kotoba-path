#!/bin/sh
set -eu
cd "$(dirname "$0")/.."
quest_test_dir="$(mktemp -d)"
trap 'rm -rf "$quest_test_dir"' EXIT
./node_modules/.bin/tsc src/app/features/quests/study-quests.ts src/app/features/chapters/chapter-progress.ts src/app/features/chapters/starter-chapter.ts --outDir "$quest_test_dir" --module commonjs --target ES2022 --skipLibCheck --strict
node tools/test-quests.cjs "$quest_test_dir"
