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
