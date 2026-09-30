#!/usr/bin/env bash
# Cuts the rendered strip into seven Instagram-ready slides and snapshots each held final frame.
#   1) python3 scripts/build.py
#   2) npx hyperframes render -o export/carousel-all.mp4 --fps 30 --quality looks
#   3) bash scripts/export.sh
# Instagram uses the first frame of a video slide as its preview, so every slide opens on a poster:
# its own finished last frame held for POSTER frames (6 = 200 ms), then the animation plays from the start.
set -euo pipefail
cd "$(dirname "$0")/.."
SLIDE=6    # seconds per slide, see DUR in scripts/build.py
FPS=30
POSTER=6   # poster hold in frames (150–250 ms rule, see artifacts/CAROUSELS.md)
FRAMES=$(( SLIDE * FPS ))
mkdir -p export/.poster
for i in 1 2 3 4 5 6 7; do
  n=$(printf %02d "$i")
  start=$(( (i - 1) * SLIDE ))
  # the slide's own last frame, taken from the render so colours match the animation exactly
  ffmpeg -hide_banner -loglevel error -y -i export/carousel-all.mp4 \
    -vf "select=eq(n\\,$(( i * FRAMES - 1 )))" -frames:v 1 "export/.poster/$n.png"
  ffmpeg -hide_banner -loglevel error -y \
    -framerate "$FPS" -loop 1 -t "$(python3 -c "print($POSTER/$FPS)")" -i "export/.poster/$n.png" \
    -ss "$start" -i export/carousel-all.mp4 \
    -filter_complex "[0:v]format=yuv420p,trim=end_frame=$POSTER,setpts=N/$FPS/TB[p];[1:v]format=yuv420p,trim=end_frame=$FRAMES,setpts=N/$FPS/TB[a];[p][a]concat=n=2:v=1:a=0[v]" \
    -map "[v]" -r "$FPS" -an -c:v libx264 -preset slow -crf 16 -pix_fmt yuv420p -movflags +faststart "export/slide-$n.mp4"
done
rm -rf export/.poster
# lossless PNG of the held final frame of each slide (0.1 s before the end)
rm -rf snapshots
at=$(for i in 1 2 3 4 5 6 7; do printf "%s," "$(python3 -c "print($i*$SLIDE-0.1)")"; done)
npx --yes hyperframes@0.8.90 snapshot --no-end --describe false --at "${at%,}" >/dev/null
i=1
for f in $(ls snapshots/frame-*-at-*.png | sort -t- -k2 -n); do
  cp "$f" "export/slide-$(printf %02d "$i").png"; i=$((i + 1))
done
rm -rf snapshots
