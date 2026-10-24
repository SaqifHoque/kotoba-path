#!/bin/sh
set -eu
cd "$(dirname "$0")/.."
forecast_test_dir="$(mktemp -d)"
trap 'rm -rf "$forecast_test_dir"' EXIT
./node_modules/.bin/tsc src/app/features/home/review-forecast.ts --outDir "$forecast_test_dir" --module commonjs --target ES2022 --skipLibCheck --strict
TZ=Asia/Tokyo node tools/test-forecast.cjs "$forecast_test_dir/home/review-forecast.js"
TZ=America/New_York node tools/test-forecast.cjs "$forecast_test_dir/home/review-forecast.js"
