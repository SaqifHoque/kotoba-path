#!/bin/sh
set -eu
cd "$(dirname "$0")/.."
review_test_dir="$(mktemp -d)"
trap 'rm -rf "$review_test_dir"' EXIT
./node_modules/.bin/tsc src/app/features/reviews/review-session.ts src/app/features/learn/answer-checker.ts --outDir "$review_test_dir" --module commonjs --target ES2022 --skipLibCheck --strict
node tools/test-review-session.cjs "$review_test_dir"
