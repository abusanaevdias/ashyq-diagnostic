# Diagnostic entry — Two Doors (059)

## Approved direction

User selected the red IELTS / black SAT concept, then explicitly removed the
Friday example because it could be mistaken for opening hours. The entry now
shows Reading selection strokes and a Listening waveform, with literal labels.
It is an exam chooser, not a quiz or a simulated personal result.

- Idea: choose the exam and understand what the short diagnostic covers.
- Signature: two adjacent colour fields; Reading, Listening and a separate SAT
  marker continue moving while the text and start actions stay still.
- Motion verb: scan and follow. No entrance delay, loader or forced presentation.
- Type: existing system font, normal width, weight 400 for hero/exam headings.
- Palette: existing `--bg`, `--ink`, `--red`, `--on-red`, `--on-dark` tokens.
- Desktop: short two-column introduction, then equal IELTS/SAT panels.
- Phone: introduction and duration first, then full-width stacked panels.
- Existing shared navigation and lower explanatory sections remain available.

## Ownership and contracts

Claim `ac4d1b6` was pushed to main before implementation. Same-root intro-only
split from 057; snapshot/result/finale/profile/signup/quiz/onboarding/storage,
scoring, auth, schema, provider flags, shared motion/navigation, dependencies and
CI are excluded. Question counts and section names come from existing EXAMS.
Native start buttons call the same `onSelect(exam)` callback. Existing run
continuation is explicit, including a finished-result action.

The full preliminary-estimate disclaimer remains; IELTS Writing and Speaking
are explicitly outside this diagnostic. No personal example score is invented.
Decorative graphics are hidden from assistive technology, while skill names,
scope, questions and buttons remain text.

## Motion implementation

Vector SVG; one existing locally served GSAP core and ticker, no new dependency.
ApprovedMotion remains the script owner and mounts before the doors. The entry
controller handles both an already-loaded core and its native script load event.
Its effect kills timelines and removes listeners/observer on unmount.

Each artwork pauses off screen, in a hidden tab, under system reduced motion or
the existing persisted pause preference. The visible pause button uses the
existing MotionToggle. Without scripts or IntersectionObserver the first frame
is complete. The SAT path never changes: only its separate marker moves.

## Adversarial review and acceptance

Initial independent source review found and corrected: Next Script duplicate-src
readiness could suppress animation after client navigation; Reading selection
could extend 25 SVG units beyond its line. One script owner now remains, and the
highlight is constrained to the literal stroke.

Build, lint, browser observations and independent visual review are recorded at
closeout. No new tests or test-suite runs are part of this slice. Full release
requires existing exact-head CI. Physical-device performance and official score
calibration cannot be inferred from browser viewport checks.

## Released 2026-10-24

- PR180: feature `b8b5ffb2c4098eec25562d303eea4d565e74300f`, exact-head
  CI40098079340 SUCCESS; merge `2440dbc42d0efa1ec283e6afdb390d7ce9a0fc66`.
- Existing CI: basic164/164, LMS91/91, season64/64, tokens9/9,
  72 responsive audits and36 Lighthouse routes. `/diagnostic` Lighthouse:
  performance99, accessibility100 (lab results, not physical-phone certification).
- Initial CI40097351324 found implicit black SVG fills. Explicit inherited
  `fill="none"` fixed the source; the release gate was not modified.
- Final local build157/TypeScript, full plus scoped lint and diff checks passed.
- Actual CUA320/390/768/1280: no positive horizontal overflow; native IELTS/SAT
  starts, synthetic saved IELTS setup continuation/reload, one GSAP core,
  client home-to-entry motion, manual pause/resume/reload persistence, offscreen
  freeze and visible keyboard focus observed. Start controls48px at320.
- Two independent actual-screenshot visual passes found no visual release blocker.
  No award, measured FPS or actual system reduced-motion runtime is claimed.
- Vercel Production7299433563 SUCCESS for the merge. Canonical `/diagnostic`
  HTTP200 includes the new heading and all three SVG markers, without Friday
  copy. Actual canonical390px page shows changing selection/marker and no
  horizontal overflow. Public page was left open for the user.
- Original screenshots, CI logs and acceptance receipt are retained locally in
  the implementation worktree under `.data/entry059/`; final production proof
  is `production-mobile.jpg`. They are evidence, not bundled UI assets.

Nonblocking future polish: provide a short exam-purpose explanation for undecided
visitors and clarify the SAT Russian eyebrow. Next safe design step is a trainer
catalog concept; obtain concept selection before edits and preserve033 gates.
Diagnostic result/profile/finale057 remains a separate unfinished owned task.

## Rounded-panel follow-up, 2026-10-24

User requested softer corners like the existing explanation artwork. Claim7ebea4a was published first. Scoped CSS uses existing --r-xxl (28px), adds16px grid gap and removes the obsolete mobile2px divider. No overflow clipping is introduced, so keyboard focus remains visible. Callbacks, text and motion implementation are unchanged. Local build157/TypeScript, lint and diff checks passed; actual screenshot review and exact-head CI are the follow-up release gates.


Follow-up released: PR181 feature `f230cc5367360227854bed77a9549abd9d0463eb`,
merge `030b13ef7e7c4fa600d38ec3ded10ce0cf10f2ed`. Exact-head CI40100253327
SUCCESS, including72 responsive audits and36 Lighthouse routes.
Vercel Production7299741320 SUCCESS. Canonical `/diagnostic` HTTP200 and
actual public390px DOM show both28px radii,16px gap and no positive horizontal
overflow. Actual production screenshot: `.data/entry059/rounded-production-mobile.jpg`.
Local320/390/1280 checks and independent complete-desktop/mobile/keyboard JPEG
review found no blocker. Focus is unclipped. No physical-phone/FPS acceptance
or result/profile057 completion is claimed. Next safe scope remains a separately
selected trainer-catalog concept;033 external launch gates are unchanged.
