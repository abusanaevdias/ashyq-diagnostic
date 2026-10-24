# Reading feedback 058 — approved concept implementation

Owner: Codex /root. Claim f3e8eec published to origin/main before implementation. User approved the three-screen Reading concept on 2026-10-24. This is the first slice of the ordered design plan, not authorization to rewrite the other pages in parallel.

## Concept

Idea: See your result, understand it in the original passage, try the same rule on a new text.
Metaphor: The same annotated reading paper, rather than a stack of separate reports.
Signature: Frozen first response becomes an explicit verdict; literal passage/claim fragments receive matching marks on demand, with explanation alongside. The same TaskView remains mounted through attempt, review, repair and fresh task.
Emotion: Immediate certainty about the result, then understanding at the learner's own pace.
Motion verb: Reveal, underline, settle. No continuous movement around lesson text.
Screenshot: The original passage and statement side by side, precise emphasis, readable verdict and one clear next action.

## System and scope

- Existing Next App Router, React and scoped CSS Modules. Native View Transitions are optional progressive enhancement; no new dependencies.
- Existing cream/ink/red tokens, semantic success and existing font system. No global CSS/navigation/data/bank/auth/provider changes.
- Desktop: verdict with separate answer/evidence rows, passage left, statement/explanation right. Mobile: verdict first, then full text and statement/explanation in reading order. No artificial excerpt replacing the full source.
- 320ms named passage/question transitions. Generation guards invalidate queued callbacks on another transition, Back, restore and unmount. Unsupported API or reduced motion commits normally, with no animation. Controls stay available.
- 280ms local explanation reveal and token-based marker transitions. No text drift, autoplay, audio, loader, wheel interception or gesture requirement.

## Learning contracts

- Existing first/repair/fresh/result phases and checkpoint payload remain unchanged. Reveal openness is ephemeral presentation state; restoring a review starts with closed explanation.
- Category correctness is distinct from relevant evidence/area correctness. A correct category with wrong quote is not described as full success.
- NOT GIVEN always retains the whole passage and explicitly labels highlighted text as a relevant area, not proof of an absent fact.
- Marks use literal matches from the existing four authored public passages; a missing mapping falls back to the existing evidence sentence. No unsafe HTML or guessed offsets.
- Existing authored sentences, answer keys and accepted evidence IDs are untouched. The image concept's shortened example is not substituted for the actual task.
- First-attempt text has no highlighted answer. Fresh transfer has no old key/explanation/marks; repair is recorded and compared at the end. No mastery or band-gain claim.
- Existing mandatory own-reason selection and same-text repair remain; the mockup's direct New example action is adapted to retain that learning step.

## Review log

Independent ownership/source critic confirmed no active Reading PR and separation from active057 and BLOCKED033. Initial intermediate duplicate TaskView report was obsolete on reread; final source has one persistent TaskView.

Accepted findings: guard queued ViewTransition callbacks (skipTransition alone does not cancel the update), and remove old compact answer/explanation from fresh transfer. Both corrected. Native fallback and reduced-motion paths remain functional without animation.

## Evidence and release

Build, lint/type checking and final browser/CI evidence are recorded below at closeout. No test files or suites added or manually invoked. Existing repository CI runs its established release gates when a PR is opened. Human material approval/provider/RLS/physical-phone launch gates of033 remain unchanged.

### Released 2026-10-24

- PR179 feature478474e41b335db844e0bd8523b05c4e1f19f3b6, mergeb35e3ab489f059d9aa985186e6941d9c8e66fff2. Product source/package/design document match the verified feature head exactly; main differed only in the cleaned ownership ledger.
- Exact-head CI40046932234 SUCCESS20m17s: basic164/164, LMS91/91, season64/64, tokens9/9,72 responsive audits/36 Lighthouse routes. These common-site gates are not a full Reading-state or physical-device certificate.
- Local production build157, component ESLint, TypeScript and diff checks pass. No new test files or manual test-suite runs.
- Actual Chromium390px wrong-category/right-evidence verdict, in-text reveal, explicit local save/reload/restore, own reason, corrected repair, clean fresh text and correct final comparison observed. Fresh task: zero marks, zero checked inputs, no old correct-answer text, heading focus. One completed lesson added to history and visible from a new tab. Earlier wrong-category/wrong-evidence desktop flow also inspected.
- Two independent visual passes on original JPEGs; focused mobile fixes add the exact evidence quote beside explanation, focus the verdict, clarify evidence wording, keep hover dark and narrow the marked phrases. Final critic found no visible blocker in its two viewport crops, with full-page/motion/device limits stated.
- Original screenshots and detailed receipt retained in `C:/Users/Dias/Documents/ChatGPT/ashyq-reading-feedback-058/.data/reading058/`. Final verdict JPEG SHA2562997D7948820070AB2BBEA5BD6EDFB6870666A93E02FF70FE789F491A4A142AD; explanation4C8F8E4CC9167F8FFAB2F0F71CFBC26158E1F6C6211A6FAA9385679294484DEF.
- Vercel Production7292093099 SUCCESS for exact mergeb35e3ab. Canonical Reading HTTP200 and served `3w0ux4ksrok8_.js` contains the new verdict, quote and independent-transfer copy. Deployment success checked through both commit status and deployment status, not inferred from merge.
- Existing native replacement confirmation blocked CUA input and was not exposed through its dialog API; asynchronous user notice sent. Native reset acceptance, additional NOT GIVEN runtime, reduced-motion/fallback runtime, complete final-page crops and physical phone/FPS remain unclaimed. No corresponding source failure established; existing confirmation code is unchanged. Source critic accepted the NG and generation-guard branches.

Next safe slice: show the next ordered concept before implementing another page. Keep diagnostic-profile057, whole-trainer033 external acceptance and other owners separate.
