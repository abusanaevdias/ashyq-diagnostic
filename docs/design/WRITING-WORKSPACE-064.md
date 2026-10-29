# Writing workspace concept,2026-10-27

Preview only: no product edits, task claim or publication. Current mainfd47ae3
and HANDOFF unchanged;033 remains blocked,057 separate. Actual canonical practice
UI inspected at390x844: selecting a sentence leaves the textarea top2183px below
the viewport top at that observed scroll position. The essay is a long button
paragraph sequence; edit panel follows the complete essay. Core pain is physical
separation of selection, attempt and review, not lack of decorative graphics.

## Brief
Russian-speaking IELTS candidates. Continue approved Writing entrance identity
into the lesson. The job is to keep the learner in the essay while editing one
sentence, preserve attempts before explanation, and make correctness/unknown state
explicit. No bank/key/scoring/storage/provider changes inferred from concept.

## Three territories
A. Margin proof / writer's material: editor opens at the selected sentence;
review occupies the same location. Anchor: actual gap between essay and editor.
Originality/fit/feasibility/portability4/5/4/3.
B. Spotlight / work process: single sentence zooms into an isolated writing room;
rest of essay behind a sheet.4/3/4/4; loses argumentative context and backtracking.
C. Parallel drafts / formal system: permanent before/after split document.
3/4/4/4; mobile becomes a tab puzzle and initial before/after risks answer leakage.
Pick A. One document, nearby work, no gratuitous teaching dashboard.

## Concept card
Idea: Правка рядом с мыслью.
Metaphor: edit and annotation in a writer's manuscript.
Signature: selected sentence expands into its editor; the same region becomes
review after explicit checking. Nearby explanation belongs to the sentence.
Emotion: I know where I am editing and what the next action is.
Motion verb: unfold in place.
Screenshot: essay paragraph with selected sentence, adjacent user draft and one
clear Check My Edits action; no pre-check success/error badge.

## System and flow
Existing real ASHYQ logo/header; approved Onest/system normal-width sans.
Existing offwhite/ink/scarlet/surface tokens,28px main sheet, quiet rules;
red primary accent, neutral sentence selection before check, success/error states
only from existing verified outcomes. No invented IELTS scores or improvement.
Main text17-18px/1.6, title32-40px/1.1, local labels13px legible contrast.

Phone: compact lesson title, visible current criterion and access to all stages;
question remains accessible in a disclosure, initially open when entering the
lesson. The concept editing view can show it manually collapsed after reading.
Essay title explicitly separates prompt from response. Full essay stays available;
only one local editor open at a time, switching retains draft buffers. Checked
results appear in place with an explicit correct/needs-review/ungraded verdict,
original attempt and explanation. No marking original mistakes before checking.

Desktop: essay main column and margin edit/review rail aligned with current
sentence. Phone editor is inline, not a fixed bottom sheet. Keep keyboard/input
visible, no forced smooth scrolling while typing. Contextual navigation must
preserve original state-machine locks, same-document text, source ordering,
multiple-edit checks, skip-search action, explicit apply buttons and all four
rubric stages plus final report. Preserve save/export/restore controls, opt-in,
limits and authored-fixture score caveats. Never equate saved with checked.

Motion: FLIP-style local continuity300-400ms, no scroll hijack; on check, selected
text stays put and explanation joins it. Idle only tiny current-step accent,
never move text/caret or rotate feedback. Pause/reduced-motion static equivalent.
Preserve all progress/score semantics; no new score logic in visual layer.

Preview uses a short independently invented paragraph and an unverified synthetic
student draft, explicitly labelled as a concept. It is not a screenshot, real user
submission or an existing teaching-case key. Initial preview has no correctness
claim. Review-state proposal needs verified authored feedback at implementation.

Genericness pass: removed giant hero, chart/score cards, floating toolbars,
confetti and extra illustration. The work itself is the visual composition.

Need visual approval then fresh ownership reconciliation before product claim.
Static images do not certify accessibility, keyboard behavior, motion or FPS.

## Image review
Independent image-only critique found the inline editing/unchecked status clear,
but English body and draft too small when scaled to390px. V2 enlarges the reading
and input type and wraps sentences. Screen-keyboard behavior remains a future
implementation acceptance gate. Built-in imagegen with actual published063
entrance as identity reference, followed by targeted typography edit. No product
code or runtime changed. Real existing logo/assets/tokens remain authoritative.

## Approved implementation064

User approved implementation with Продолжай on2026-10-27; this section supersedes
preview-only boundary above. Claimf25e2e9 pushed before changes. Dedicated branch
and worktree own only public WritingTrainer TSX/CSS and this record. Authored
cases/keys, engine/scoring, checkpoint schema/hooks, own-text/auth/provider remain
unchanged. Original draft objects and explicit check/apply handlers are retained.

Editor renders at selected sentence. On check, every relevant original feedback
article renders once at its sentence, including missed/ungraded records. Original
summary/counts/limitations/report and all4 aspects remain. Selected checked
feedback receives focus without sending the learner to the former bottom list.
Visited-stage buttons permit only existing furthestStage; future stages disabled.
Question starts open and can be collapsed manually; score caveat remains explicit
in its disclosure summary. Existing save/restore/export remains accessible.

Phone uses inline editor, desktop uses sentence plus margin column. Pre-check
selection neutral; old touched underline removed. Found is green, missed red,
review/unnecessary/clean tags neutral. Existing study shell's pill radius and
16px control defaults initially won CSS specificity; scoped overrides restore16px
sentence radius and18px textarea. Long-sentence input min220/260px at narrow
sizes avoids observed internal scrolling. Caption gap corrected after visual QA.
Actual motion is a local300ms WAAPI opacity/5px entry, not a full-layout FLIP.
It does not run on typing. Pause/reduced preference and hidden-document changes
cancel it; cleanup removes all listeners. No perpetual motion beside the caret.

## Verification before PR

- Final lint no warnings, production build157 routes, diff check passed.
  No tests added or manually executed; exact-head existing CI required.
- Independent source review writing064_source_review: no blockers after neutral
  unknown-state tag and effect dependency corrections; keyed drafts/check/apply,
  existing scores/checkpoints, single feedback per relevant sentence, navigation
  locks, DOM/ARIA and motion cleanup reviewed. No reviewer edits/tests.
- Actual390px UI: before-check marker count0; two distinct drafts preserved on
  selection switching; opt-in save, reload and explicit Continue Saved recovered
  both. Native field-to-selected-sentence gap about106px. Before redesign the field
  sat2183px below the viewport top in the observed selection state. Final textarea18px,220px high and no internal scroll for the
  tested long sentence. Selection16px corners, neutral before check.
- Actual checking: own exact key match found; untouched keyed issue missed;
  edited unmarked sentence ungraded with no penalty. Explicit application uses
  own verified draft or authored example. Two applied grammar changes produce
  the original authored6.0 orientation; other criteria remain5.5 when no prepared
  revision is applied. These are fixture values, not learner bands or gain.
- Actual full flow through task/coherence/lexical comparison and report; arbitrary
  drafts remain ungraded/unapplied in report. Visited grammar return preserves
  applications. Initial future-stage buttons disabled. Keyboard Tab from input
  lands on Check with visible focus; browser warning/error log empty.
- Actual320/390/1280 no positive horizontal overflow;1280 sentence/editor form
  adjacent columns. Independent actual-image visual review and second narrow/
  desktop/missed/ungraded pass found no blockers after caption-gap correction.
- Local evidence .data/writing064/editor-mobile-verified.png,editor-narrow.png,
  editor-desktop.png,found-mobile.png,missed-mobile.png,ungraded-mobile.png and logs.

Limits: viewport emulation is not physical-phone/virtual-keyboard/FPS proof.
System reduced-motion runtime not forced; source handling reviewed. No new
provider/teacher/RLS readiness claim;033 and057 gates stay separate. Final CI,
merge and canonical production proof are still required before publication claim.

## Release2026-10-27

PR186 featurecea1bdcfed5b3b6bf912590fb1da5e98a5eb743f passed exact existing
CI40526283874 SUCCESS:164/164 basic checks, full existing LMS/season/token gates,
72 responsive audits and36 Lighthouse routes. Merge45d04a61b4dd3e5947ca161ad3d903bb7763368d
has identical scoped product source. Vercel Production7362459431 SUCCESS.

Canonical /writing/trainer/practice HTTP200. Actual public390px selected sentence
opens adjacent editor with18px textarea,16px sentence corner, no positive
horizontal overflow and no internal textarea scroll for tested long draft;
pre-check marker count0. Public autosave stayed off; temporary synthetic draft
was cleared after screenshot, leaving the selected empty editor for the user.
Proof .data/writing064/production-mobile.png in dedicated worktree. It contains
only a synthetic local UI draft of the public authored example.

No physical-phone keyboard/FPS, system-reduced-runtime, real-account/provider/RLS
acceptance claim. Next safe task user feedback or separately approved next concept.
Trainer033 and Diagnostic/Profile057 boundaries stay unchanged.
