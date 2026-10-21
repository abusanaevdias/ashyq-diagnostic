# Native redesign completion 052

## Brief and design decision

Continue the owner-approved ASHYQ cream/ink/red concept from PUBLIC-REDESIGN-051.
Keep Next.js App Router and the existing CSS Modules: the product already has real
diagnostic, teaching and persistence flows. This is a continuation of an approved
concept, not a replacement concept or a parallel demo app.

The signature motion remains the native service artwork and service rail. Teaching
and account screens stay quiet while answers, source text and controls are in use.
They use the same typography, paper surfaces, clear state and pill navigation.
No new ambient animation is put behind a student's work.

## Coverage

| Family | Presentation changes |
| --- | --- |
| Diagnostic setup | Matching paper options and a labelled four-stage journey; the existing two setup questions and callbacks remain |
| Diagnostic questions | Selected-answer status, separate answered/current counts, progress based on answered questions, matching question/material cards |
| Diagnostic result/review | Early actual review action, journey marker and distinct correct/wrong/skipped article borders; original keys and explanations |
| Eleven public trainers | Shared CSS Module composition for actual working pages, readable controls/headings and card rhythm; 051's separate answer/evidence feedback retained |
| Writing intro | Same shared learning typography and controls; actual illustrated instructions and start actions retained |
| Library chapters | Paper stage chooser, larger stage labels/links, matching essay/review surfaces; narrower desktop sidebar remains compact |
| Course lessons | Shared learning presentation for the existing locked/free course index and reader |
| Program | Actual approved IELTS/SAT/mentoring service artwork and package card, with the existing single motion controller and all existing program sections |
| About/community/contacts | Literal HTML editorial posters; no synthetic new learner results or unreadable red-on-red word treatment |
| FAQ/search/press/progress/legal | Scoped secondary-page heading, spacing, controls and surface system; original data, metadata and actions |
| Season | Matching heading/card surfaces and approved shell for the existing participant route; fixture disclaimers and real role checks untouched |
| Login/student/teacher/author | Existing LmsShell gains role-derived navigation and scoped workspace type/forms/cards; actual guards and repositories remain |
| System 404 | Same brand shell and readable native error composition; original metadata and destinations |

Blog composition is owned by BLOG-REDESIGN-001. Career composition/engine and CRM
are separately owned review areas. Their code is not taken over here. No provider,
source-bank, schema, package or CI configuration change is part of this slice.

## Interaction details

- Diagnostic selections do not reveal correctness before Finish.
- Header progress represents answered questions; current question remains separate.
- Open map/confirmation sheets suspend quiz answer/navigation shortcuts.
- A shared dialog-focus hook traps Tab within the open sheet, supports Escape,
  restores the invoking control when still connected and restores body scrolling.
  It does not refocus the confirm button on every elapsed-time render.
- Workspace links come from the existing roleLinks function. They do not grant
  permissions or render protected page data.
- Text-entry status is visual context, not a live announcement on every keystroke.
- Source text, option order, result records, import/export, storage formats and
  consent remain under their existing implementations.

## Assets

Additional IconPark TwoTone glyphs use the same pinned Iconify icon-sets revision
`d18201500d74a8bb6d5089e844e60e694b770018`, Apache-2.0 license already retained in
`public/design/ICONPARK-LICENSE`. Only the selected bodies are included. Original
ASHYQ brand spark and directional arrow remain brand primitives. No package added.

## Review and evidence boundary

Independent adversarial source review found no auth/storage/scoring changes and
no duplicate service IDs. Its narrow-sidebar and live-status comments were addressed.
The final dialog/icon/presentation delta passed a separate follow-up source review without a proven blocker.

Local lint and production compilation are engineering checks. CUA inventory was
empty and opening an in-app tab returned `Browser is not available: iab`. No new
manual screenshot, physical iPhone, screen-reader, authenticated visual acceptance,
or fresh award-quality score can be claimed from source or compilation.

Existing automatic PR CI is authoritative only for the exact head it runs. Its
results and screenshots are to be recorded in the PR. Do not weaken checks to make
the redesign pass. Do not infer a complete human/device/accessibility certificate.

The preview-only instruction remains: no product merge or deployment. This slice
is stacked on draft PR172, whose exact e4eecf6 CI39675932678 passed. That earlier
result does not prove the successor changes pass. Repeat Reading stage return and
mobile/keyboard workspace views when a real browser is available.

First successor CI39681654890 on514d42f passed lint/typecheck/build but stopped at
162/164 basic checks: About/Community image counts fell after the HTML poster
replacement. The original labelled illustrations are restored as visible companion
figures; poster text remains separate and readable. Existing checks are unchanged.
Later gates are not inferred from this failed run; final exact-head CI is tracked
in the successor PR.

A fresh critic inspected five actual mobile CI screenshots. Map states now have
explicit current/answered/unanswered wording and a neutral answered border; Continue
is the primary action. Review header is static so it cannot overlap the reading
cards; the existing return controls remain at both ends. Wrong/skipped answers open
their source material by default. Program has an early real anchor to service
selection; Progress explicitly labels chart points as range midpoints. No scoring
or persistence changed. The screenshot review does not prove live keyboard/motion
behaviour or the restored companion-photo layout.

Source reconciliation also found stage callbacks do not reset viewport position.
Journey entry now focuses its h1 and returns to the top only when entering a
stage/setup step. Question navigation similarly focuses its count and resets the
view only when question.id changes. Timer ticks and answer edits do not trigger
these effects. This presentation correction does not modify run state or storage.

Second CI39684872184 on a439f1a passed functional gates but failed the unchanged
token gate7/9: 23 source radius literals/custom references and runtime14px/18px
outside the registered scale. The CSS now uses the existing radius tokens directly;
14/18/22px were aligned to16/20/24px. No token or audit allowlist changed. The
accessibility/performance gate had not run, so its success is not inferred.

Second fresh stills review found no visible clipping/overlap/action blocker in the
five updated captures. It caught two pre-existing result-copy contradictions: the
gap flag also covers targets below band.low, and an empty weakest list should not
be titled "Стоит подтянуть". Labels now say "диапазон не ниже цели" and "По этим
заданиям" in those existing branches. gapToTarget and all calculations are unchanged.

CI39686437814 on3b7c8ee stopped163/164 because the existing perfect-IELTS gap check
expected the old, inaccurate phrase. Its single assertion is updated to require
the corrected text AND a numeric Gap0; the old assertion accepted the old phrase
OR any approximate positive gap. No test was added or manually run, and no threshold
or workflow changed. All scoring code and the fixture's target7.0/range7.5–9.0 stay
unchanged. Final exact-head run remains authoritative.
