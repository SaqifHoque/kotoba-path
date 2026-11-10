#!/bin/sh
set -eu
cd "$(dirname "$0")/.."
association_test_dir="$(mktemp -d)"
trap 'rm -rf "$association_test_dir"' EXIT
./node_modules/.bin/tsc src/app/features/associations/association-index.ts src/app/features/associations/association-search.ts src/app/features/learn/curriculum-manifest.ts src/app/features/study/study-overview.ts --outDir "$association_test_dir" --module commonjs --target ES2022 --skipLibCheck --strict
node tools/test-associations.cjs "$association_test_dir"
