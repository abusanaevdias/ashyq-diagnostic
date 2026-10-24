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
