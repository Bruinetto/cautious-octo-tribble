#!/usr/bin/env bash
# Render a long/heavy composition in resumable chunks, then join them and add the music.
#   scripts/render_chunked.sh <CompositionId> <total_frames> <music.wav> <out.mp4> [chunk_frames]
# Finished chunks in out/parts/<id>/ are kept, so a re-run resumes where it stopped.
set -euo pipefail
ID=$1
TOTAL=$2
MUSIC=$3
OUT=$4
CHUNK=${5:-330}
BROWSER=${REMOTION_BROWSER:-/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell}
DIR=out/parts/$ID
mkdir -p "$DIR"
: > "$DIR/list.txt"
for ((a = 0; a < TOTAL; a += CHUNK)); do
  b=$((a + CHUNK - 1))
  ((b >= TOTAL)) && b=$((TOTAL - 1))
  part=$(printf '%s/%05d-%05d.mp4' "$DIR" "$a" "$b")
  if [[ ! -s $part ]]; then
    echo "rendering frames $a-$b"
    npx remotion render src/index.ts "$ID" "$part.tmp.mp4" --frames="$a-$b" --muted \
      --browser-executable="$BROWSER" --chrome-mode=headless-shell --gl=swangle --crf=18 --concurrency=4 >/dev/null
    mv "$part.tmp.mp4" "$part"
  fi
  echo "file '$(basename "$part")'" >> "$DIR/list.txt"
done
npx remotion ffmpeg -y -v error -f concat -safe 0 -i "$DIR/list.txt" -i "$MUSIC" \
  -map 0:v -map 1:a -c:v copy -c:a aac -b:a 256k -shortest -movflags +faststart "$OUT"
echo "done: $OUT"
