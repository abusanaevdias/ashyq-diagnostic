#!/usr/bin/env bash
# Cuts the rendered strip into seven Instagram-ready slides and snapshots each held final frame.
#   1) python3 scripts/build.py
#   2) npx hyperframes render -o export/carousel-all.mp4 --fps 30 --quality looks
#   3) bash scripts/export.sh
set -euo pipefail
cd "$(dirname "$0")/.."
SLIDE=6   # seconds per slide, see DUR in scripts/build.py
FPS=30
for i in 1 2 3 4 5 6 7; do
  n=$(printf %02d "$i")
  # re-encode so every slide is an exact 180-frame clip that starts on a clean frame
  ffmpeg -hide_banner -loglevel error -y -ss "$(( (i - 1) * SLIDE ))" -i export/carousel-all.mp4 \
    -frames:v $(( SLIDE * FPS )) -an -c:v libx264 -preset slow -crf 16 -pix_fmt yuv420p -movflags +faststart \
    "export/slide-$n.mp4"
done
# lossless PNG of the held final frame of each slide (0.1 s before the end)
rm -rf snapshots
at=$(for i in 1 2 3 4 5 6 7; do printf "%s," "$(python3 -c "print($i*$SLIDE-0.1)")"; done)
npx --yes hyperframes@0.8.90 snapshot --no-end --describe false --at "${at%,}" >/dev/null
i=1
for f in $(ls snapshots/frame-*-at-*.png | sort -t- -k2 -n); do
  cp "$f" "export/slide-$(printf %02d "$i").png"; i=$((i + 1))
done
