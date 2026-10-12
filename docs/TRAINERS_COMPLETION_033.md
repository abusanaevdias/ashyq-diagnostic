# Trainer completion: release contract and engineering loops

Owner: Codex /root; started 2026-10-13. Goal remains active until the whole contract is satisfied. A released slice is not completion of the goal.

## Product boundary

Russian-speaking senior school pupils. IELTS: grammar and argument development; SAT: interpreting conditions and choosing evidence. All public content is original synthetic practice. Prepared examples remain public; own IELTS essays retain enrolled-student/teacher authorization. No learner text/audio goes to an external provider without the existing explicit consent and server authorization. No numerical band for arbitrary responses without a calibrated evaluator.

## Competitive baseline, inspected 2026-10-13

Engnovate public pages offer own-essay input, four-criterion feedback, original/polished comparison, Word export and premium progress tracking; Speaking evaluation and writing improvement exercises also exist. This records advertised/visible capabilities, not an independent accuracy benchmark or evidence of learning gain.

- https://engnovate.com/ielts-writing-task-2-essay-checker/
- https://engnovate.com/ielts-speaking-part-2-answer-checker/
- https://engnovate.com/writing-improvement-exercises/

ASHYQ's intended value: preserve independent reasoning, disclose help, require repair, then a fresh transfer task. Competitive readiness needs reliable repeated use as well as this learning sequence.

## Definition of Done for the whole goal

1. All ten catalog trainers and Writing micropractice complete their attempt/reveal/repair/transfer or justified equivalent flow; first and post-feedback attempts remain distinguishable.
2. Optional local checkpoints, restart/resume, history and export are reliable; account/device scope and audio limitations are visible. Corrupt, outdated, oversize and unavailable storage fail safely. No silent draft replacement.
3. Authored bank covers the agreed launch plan with reviewed keys, acceptable alternatives, difficulty/skill tags and fresh transfer variants. Draft authoring is not methodological approval.
4. Evidence-linked feedback and wrong-answer repair work; unsupported free-text judgments are explicitly unknown. Results distinguish objective checks, self-assessment and provider feedback.
5. Learner can find the next suitable practice and revisit weaknesses without manufactured mastery/band gains.
6. Own-work workflow is usable; provider integration has configured bounded credentials, consent/authorization, budget controls, error handling and evaluated accuracy before activation. Missing credentials cannot be disguised as a completed AI service.
7. Speaking recording/download, real-device acceptance and Listening assets/fallback are verified with permission; no automatic microphone activation.
8. Mobile/keyboard/a11y, unit/integration/E2E and release checks pass. Reviewed feature commit, PR, deployment and production flow are evidenced.
9. Teacher/class integration preserves RLS and existing access contracts; no unrelated ownership takeover.

## Ordered slices

- Loop 1: reusable validated checkpoints/history/export across trainers.
- Loop 2: meaningful objective outcome summaries, review queue and next-practice navigation.
- Loop 3: expanded authored banks with item-level adversarial review and content publication status.
- Loop 4: own-work feedback/recording capabilities and remaining full-launch gates.
- Loop 5: release audit against every row above; release only verified slices.

## Loop journal

### 0 — baseline

Read ledger, fetched remote, inspected branches/worktrees/open PRs, published task claim before product changes. Fresh base a0b179a. Active unrelated owners preserved. All ten catalog sections are small published pilots; most lose work on refresh. Own essay already restores tab-local work, AI disabled pending provider setup. First author batch has 12 DRAFT units; no owner approval was received.

### 1 — checkpoints (local verification passed; release pending)

Failure corpus: corrupt JSON; wrong trainer/version; invalid phases and array indices; incomplete result state; prototype keys; huge text; storage denial/quota; previous checkpoint on load; repeated completion; account change; second-tab concurrent update; audio URL/timer restoration; export failure. Record actual commands and outcomes before closing the slice.

Built optional account-scoped checkpoints across all eleven exercise components; explicit resume/replace, twenty-entry deduplicated history, JSON download and confirmed local file import, shared-device disclosure and identity-change remount boundary. Web Locks serialize writes across tabs and stale revisions stop autosave. Browsers without Web Locks can export work but cannot enable local saving. A visible saved/pending indicator and beforeunload warning disclose queued writes. This is local browser persistence, not cloud synchronization, authentication or achievement verification.

Adversarial defects fixed:

- Initial schema used the wrong second essay ID and required a Task 1 transfer attempt too early: aligned the validators with real state transitions.
- Restoring the Math timer mixed epoch and monotonic clocks, and could imply a complete duration after a resumed attempt: restored attempts now omit the duration; new uninterrupted attempts still measure it.
- A revision check alone had a read/write race between simultaneous tabs: added a shared Web Lock around validation and mutation.
- The first asynchronous saving implementation cancelled queued writes on unmount and offered no pending indication: preserve queued writes, display save completion and warn before unloading during a write. Tests wait for the actual saved indicator before asserting reload durability.
- Raw quota exceptions were in English: show a Russian recovery message and keep JSON export usable.
- Limits called bytes initially counted JavaScript characters: enforce UTF-8 byte size.

Evidence (2026-10-13): `npm run lint`, `npm run typecheck`, `npm run build` (152 routes) PASS; `BASE_URL=http://127.0.0.1:3043 npm run check:tokens` PASS, 9/9 checks/80 existing runtime screens; `21st review src/components/trainers/TrainerCheckpoint.tsx --json` PASS before the final lock/pending refinements, rerun required for release. `node scripts/speaking-recorder-review.mjs` PASS, eight synthetic extracted-source scenarios only. `npx tsx scripts/trainer-checkpoint-check.ts` PASS against the production build: eleven initial save/reload/explicit-resume/download flows and widths 320/390/768/1440; malformed state/version/trainer; complete Reading wrong-first-answer → repair → fresh transfer → archive → file restore; archive deduplication; sequential and simultaneous competing tabs; quota failure and export fallback; expanded file UI at 320; axe on history and checkpoint error states; no uncaught page errors on observed pages. Screenshots and synthetic exports are local `artifacts/trainers-complete-033/`.

Additional local evidence: guest → account A → account B → sign-out E2E passes with isolated LocalDemo fixtures; drafts remount and storage namespaces stay separate. This does not validate Supabase authorization or RLS. No global readiness or competitor parity claim follows from this slice.

### 2 — outcomes and next practice (local verification passed)

Added evidence-based summaries for all eleven types, explicit first/repair/fresh-transfer labels, a repeat queue based on the latest saved completed work and IELTS/SAT/saved-only filters. Unknown free-text alternatives and Speaking self-assessment do not become incorrect answers or scores. Listening labels disclose text mode and help. Drill completion IDs must be known and unique. First-answer mistakes remain visible even when the transfer answer succeeds; a correct choice with irrelevant evidence still requires review.

`npx tsx scripts/trainer-outcome-check.ts` PASS: eleven defaults/completions, authored closed-answer keys, duplicate features/IDs, evidence mismatch, fresh-transfer behavior, text/help disclosure and unknown/self-assessed results. Checkpoint E2E additionally passes review queue/filter/empty-state/axe checks. Source review found and fixed an over-specific heading that incorrectly described Writing grammar review as a fresh-example result. These are practice recommendations, not inferred mastery or calibrated adaptive testing.

### 3 — content review gate (local verification passed; bank expansion remains)

Imported the existing twelve original batch-01 DRAFT units into versioned source data, preserving their wording and unapproved status. Added a reproducible importer/content SHA-256 and `/trainers/material-review`, teacher/author navigation, key reveal, explicit attestation before a recommendation, required comments for revision, unsaved-unit-navigation guard and partial JSON export. Decisions are browser/account scoped and never publish source material. The page uses the existing role UI guard; it is not a new server authorization boundary. The source contains only synthetic author materials, no learner data or private documents, and is not represented as secret.

`npx tsx scripts/trainer-draft-review-check.ts` PASS: fingerprint integrity, stale/wrong-account/malformed decisions, attestation, revision comment, unsaved navigation, partial export, role UI, account reset, 320/390/768/1440 and axe. Nested select labels initially included option text in the accessible name; explicit label/control associations fixed the issue. Content remains DRAFT. The twelve units are the existing first author batch, not twelve newly published exercises and not the full 100-unit target.

### 4 — Speaking browser recording (local verification passed; real devices remain)

Added audio download with MIME-appropriate extensions and truthful restored-recording provenance. Real browser execution exposed two pre-existing configuration defects: global `microphone=()` prevents a physical microphone request; absent `media-src blob:` prevents playback of locally recorded audio. A narrow `/trainers/speaking-second-take` header exception permits same-origin microphone access and self/blob media while keeping camera/geolocation disabled and connect-src unchanged. Task scope was amended and pushed to main (`e59ded7`) before editing configuration. Entering Speaking uses a new document, because Next soft navigation cannot apply a different document Permissions Policy. Other direct-route response policies remain restrictive.

The initial download implementation tried `fetch(blob:)`, blocked by connect-src. Fixed by retaining MIME metadata at recording creation and downloading its local URL without network permission changes. A test harness failure (`__name` serialization in injected TypeScript) was fixed in the fixture, not treated as a product microphone defect.

`npx tsx scripts/trainer-speaking-browser-check.ts` PASS against the production build: actual catalog entry, effective microphone policy, ordinary-route policy, no audio request before the record button, real Chromium MediaRecorder/Opus encoding from a generated Web Audio stream, 21,548 downloaded bytes / 1.32s decoded in the observed run, actual playback, track release, all three attempts, four result widths, axe and notes-only reload. This is synthetic browser codec/lifecycle evidence, not a real microphone, human speech, pronunciation accuracy, Safari/iOS or all-device acceptance. `node scripts/speaking-recorder-review.mjs` still passes all eight synthetic extracted-source scenarios.

### 5 — release checkpoint (merged; production verification pending)

PR #110 is attached to this task. First feature `9fd2790` passed full GitHub CI `38299615853` (14m32s). That run does not verify later outcomes/review/media changes; fresh final-head CI and deployment evidence are required. Final head `73eaab3` passed full GitHub CI `38304239402`; PR #110 merged as `8f6fdc0` on 2026-10-13 local time. Vercel production deployment is pending verification. Latest local production build has 153 routes. Latest 21st deterministic component review passed (25 files before the final navigation helper); final rerun is required.

Final local persistence audit: deletion uses the same Web Lock and invalidates queued writes with a generation counter; the confirm button is disabled while edits are waiting to save. A deliberately held lock reproduces a pending write, checks the deletion guard, then confirms deletion and reloads without record resurrection. Focused E2E passes this case. Import strips export formatting/metadata before applying the stored-record byte budget; duplicate history IDs are rejected.

Latest local checks on the release candidate: all four focused scripts PASS (`trainer-checkpoint-check`, `trainer-outcome-check`, `trainer-draft-review-check`, `trainer-speaking-browser-check`); lint/typecheck/build PASS; token audit PASS 9/9 / 80 screens; 21st review PASS 26 components; eight recorder source scenarios PASS. Checkpoint/script outputs and screenshots contain synthetic fixtures only and remain local artifacts.

Remaining whole-goal work: expanded reviewed authored banks; every trainer's complete fresh browser flow and intermediate restoration; own-work provider configuration/calibration and budget; assignments/class/RLS integration where appropriate; real-device audio acceptance; final release/production evidence. A shipped infrastructure slice does not complete the goal.

### 6 — second authored draft batch (local verification passed; not published)

Added six original synthetic modules in batch 02: two Listening pairs (corrected final quantities and supplied/bring distinctions), two Task 1 pairs (four charts, including a tie and an unobserved crossing date), and two Speaking scenarios with fresh transfer topics. Four complete Task 1 model responses contain 164/170/174/182 words. Listening scripts have exact replay excerpts and explicit accepted variants; audio assets have not been generated. Structured exercise data is retained for later adapters, but is not connected to published practice. Total draft bank is now eighteen modules, not eighteen approved or live additions. No numerical IELTS bands or learner data are included.

The review UI selects either batch, isolates decisions by batch/content hash/account, and guards unsaved changes before changing batches. Existing batch-01 storage remains compatible. The importer now rejects path-like batch IDs and retains optional structured exercise data rather than silently discarding it. An adversarial accessibility check exposed identical names on two chart-table scroll regions; distinct section/table labels fix the actual UI defect, including when keys are open.

`npx tsx scripts/trainer-draft-bank-check.ts` PASS: unique IDs, draft status/fingerprints, cross-batch decision isolation, replay excerpt/variant constraints, chart dimensions, independent arithmetic checks for all 24 chart statements (including the equal 2021 values), model response length, distinct Speaking topics. This validates supplied structure/arithmetic, not independent pedagogical quality. `npx tsx scripts/trainer-draft-review-check.ts` PASS against the latest production build: both unsaved-navigation guards, independent batch decisions, teacher/account reset, both batches at 320/390/768/1440, chart tables and axe with open keys. Lint/typecheck/build PASS (153 routes). Local mobile screenshot inspected at `artifacts/trainers-complete-033/draft-batch02-mobile.png`. Methodological approval and publication remain separate, unfulfilled gates.
