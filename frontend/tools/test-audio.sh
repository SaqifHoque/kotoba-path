#!/bin/sh
set -eu
cd "$(dirname "$0")/.."
audio_test_dir="$(mktemp -d)"
trap 'rm -rf "$audio_test_dir"' EXIT
./node_modules/.bin/tsc src/app/features/audio/audio-player.ts src/app/features/chapters/starter-chapter.ts src/app/features/forge/forge-engine.ts --outDir "$audio_test_dir" --module commonjs --target ES2022 --skipLibCheck --strict
node tools/test-audio.cjs "$audio_test_dir"
