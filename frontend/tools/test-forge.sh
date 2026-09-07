#!/bin/sh
set -eu
cd "$(dirname "$0")/.."
forge_test_dir="$(mktemp -d)"
./node_modules/.bin/tsc src/app/features/forge/forge-engine.ts --outDir "$forge_test_dir" --module commonjs --target ES2022 --skipLibCheck --strict
node tools/test-forge.cjs "$forge_test_dir/forge/forge-engine.js"
