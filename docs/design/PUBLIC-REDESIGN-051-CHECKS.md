# Local evidence — 21 October 2026

Native production build served only on `127.0.0.1:3451` from the dedicated
`codex/public-redesign-051` worktree. This is not a production deployment.
Final build used `NEXT_PUBLIC_SITE_URL=https://ashyq-diagnostic.vercel.app`.

## Tool and manual checks

- `npm run build -- --webpack`: exit 0, 157 generated routes; includes TypeScript.
- `npm run lint`: exit 0, no warnings.
- `npm run typecheck`: exit 0 on the earlier complete slice; final build also
  typechecked the subsequent presentation-only changes successfully.
- `git diff --check`: exit 0.
- No automated test suites added or manually run. Existing PR CI remains separate.
- No package, API, source-bank, provider, role, schema or RLS change.

Manual CUA checks of actual UI, with synthetic exercise data:

| Area | Observed result |
|---|---|
| Home H1 | Literal `ASHYQ. IELTS и SAT. Начните бесплатно.` |
| Home → IELTS, diagnostic → SAT | Real onboarding opens; Back returns to correct intro |
| Home animation after return | Native controller restarts, old controller unmounts |
| Home exercise | Wrong `help` gives explicit correction; reload retains it under its own key |
| Courses | SAT filter changes catalog and diagnosis target; All restores four services |
| Services | Permanent SAT curve; moving marker is independent; SVG globe has 3,488 land circles |
| Menu | Native course link navigates; no preview router |
| Manual motion pause | Paper transform unchanged across successive observations; toggle resumes |
| Library | Searching `талант` changes 42 results to the actual U02 material |
| Reading | FALSE + S3 gives correct-answer / wrong-evidence feedback, not a single ambiguous grade |
| Save/reload | Explicit opt-in save, reload, continue saved restores the mixed result and stage |
| Unsaved exit | After disabling save and changing reflection, Library opens exit warning; Stay retains page; folding then retrying opens warning again |
| Source/private boundaries | Independent source review: no grading/storage/auth/API or bank contract regression found |

At 320×740, measured page overflow was 0 on `/`, `/courses`, `/courses/ielts`,
`/mentoring`, `/all-inclusive`, `/trainers`, `/library`, `/diagnostic`.
At 390×844, reviewed home, course catalog, mentoring, trainer catalog, library,
diagnostic intro and Reading UI. Final home free-entry links end at 616/702px;
at 320×740 they end at 625/711px. Both remain on the first screen.

At 1440×1000, services rail activates with one pin spacer; rail height 837px.
Tab from IELTS action moves to SAT; after settling its whole card is visible
from y110 to y823 and focus is visible at y733–795. No horizontal page overflow.
At ordinary shorter desktop heights the native grid remains available.

Final observed home and mobile browser error logs were empty. These observations
do not establish full-site accessibility, FPS, Lighthouse results, physical iPhone
compatibility, real learner quality, or authenticated classroom isolation.

Final stills review found the Reading return link could be scrolled beneath the
sticky header on stage entry. Reading now scrolls to the stage's return controls,
then focuses its heading without a second scroll; a 155px top margin clears the
mobile header. The final build and source review cover this correction, but the
CUA browser inventory became empty on 22 October before its browser repeat.
The stored Reading screenshot therefore predates this last navigation fix;
it is evidence of feedback presentation, not of the corrected return position.
No answer or stage-transition rules changed. Repeat this check when the browser
is available; do not claim final visual acceptance from the old capture.

## First automatic PR run

Run `39672072400`, head `e66d0e5`: lint/typecheck/bank validation/build passed.
The initial end-to-end runner passed 161/164 assertions, then stopped the job:
library entry ended at675px on a664px-high emulated phone, landing had9px
horizontal overflow, and diagnostic copy lacked the explicit `не официальный`
wording expected by the preserved contract. Success of later gates is not
inferred from this failed run.

Corrections: compact only the short-phone first-fold rhythm, clip only the
decorative rotating HTML scene to its own frame, and explicitly retain
`не официальный балл IELTS или SAT` in the diagnostic limitation. Existing
checks are unchanged. Final automatic run is tracked on PR172.

## Screenshots

Unedited CUA viewport captures exported through the existing localhost-only
capture helper, then copied byte-for-byte into this directory:

- `native-051-home-desktop.jpg` — 1280×720, final native home.
- `native-051-home-mobile.jpg` — 390×844, final public free-entry hierarchy.
- `native-051-diagnostic-desktop.jpg` — 1280×720, actual two-skill IELTS intro.
- `native-051-feedback-mobile.jpg` — 390×844, restored synthetic Reading review.
- `native-051-mentoring-mobile.jpg` — 390×844, vector globe and native copy.
- `native-051-services-desktop.jpg` — 1440×1000, keyboard-focused scroll rail.

The first stills critic found no accidental horizontal crop but identified
caption, evidence specificity and small-copy problems. Those were corrected.
Final stills review is recorded in the task handoff. No jury acceptance claimed.

## Remaining boundaries

Implementation is a public presentation slice. Secondary public compositions,
diagnostic interiors and authenticated student/teacher workspaces are not all
ported. Blog is independently owned. Deployment/production merge is excluded
until authorized; teacher/provider/real-RLS/device launch gates remain separate.
