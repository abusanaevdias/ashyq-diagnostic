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

Not evidenced yet: deployed checkpoint flow; actual account-switch E2E; every intermediate/completed state of the other ten scenarios; real microphone/codec/device acceptance; deletion during a pending write. No global readiness or competitor parity claim follows from this slice. The next cycle adds useful objective summaries and a review queue, then expands the authored bank behind its publication gate.
