# Animated Instagram carousels — house rules

Rules every animated carousel in `artifacts/hyperframes-carousel-*` follows. Read before building a new one.

## Poster frame (owner's rule, 2026-09-30)

Instagram takes the **first frame** of a video slide as its preview. A slide that animates in from an
empty grid therefore looks blank in the feed and in the profile grid. So every exported slide **opens on
its own finished last frame, held for 150–250 ms** (we use 6 frames = 200 ms at 30 fps), and only then
the animation plays from the start.

- Implemented once in `scripts/export.sh` (`POSTER=6`): the last frame of the slide is taken from the
  render and prepended, so each `slide-NN.mp4` is 6 + 180 = 186 frames (6.2 s).
- Check after export: frame 0 of every slide must equal its final frame (PSNR ≳ 40 dB) and show all content.
- Never design a slide whose finished state is incomplete — the last frame is also the preview.

## Format

- 1080×1440 (3:4), 30 fps, H.264 yuv420p, no audio track; 7 slides × 6 s of animation.
- Key content ≥ 90 px from every edge; red ≤ ~15 % of the frame; design tokens v3 (see any carousel `BRIEF.md`).
- Deliverables: `export/slide-01…07.mp4`, `export/slide-01…07.png` (held final frame), `export/carousel-all.mp4`.

## Honesty

- Product facts only from code/specs (`club-offer.ts`, `DiagnosticV3.tsx`, `career/*`, `writing-trainer/*`, FREE-LIBRARY-025).
- Exam facts only from official IELTS sources, quoted in the project's `BRIEF.md`.
- No price (period unconfirmed), no score guarantees, no unaudited counts, no invented statistics; Компас keeps the MBTI® footnote.

## Workflow

**Topics are always agreed with the owner first** (owner, 2026-09-30: «Темы согласовывать надо»): offer a short list of
concepts and wait for the owner's choice — never pick topics on your own, even when asked for «ещё». Once the topic is chosen,
the plan and sketches need no separate approval («можешь уже не спрашивать»): go straight through. Intent → `BRIEF.md` / `STORYBOARD.md` → `scripts/build.py` →
`npx hyperframes check` → render → `bash scripts/export.sh` → review first and last frames → ledger row in `HANDOFF.md` → commit.
