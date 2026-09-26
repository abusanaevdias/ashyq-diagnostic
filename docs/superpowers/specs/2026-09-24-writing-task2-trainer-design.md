# IELTS Academic Task 2 writing trainer — synthetic pilot

## Purpose and scope

Let a learner discover and repair weaknesses in an essay before seeing a model revision. The first pilot uses two original, invented Task 2 prompts and essays with authored issue maps. It reads no LMS submissions, stores nothing beyond the current page state, and sends no text to an AI provider. The user approved Task 2 and test material as the first slice; arbitrary learner essays and live assessment are later work.

The four focus areas follow the IELTS Writing criteria: Task Response, Coherence and Cohesion, Lexical Resource, and Grammatical Range and Accuracy. Displayed numbers are **practice estimates for the authored case**, never an official IELTS band or a prediction for the learner.

## Learner flow

1. Choose one of two invented essays. See the original prompt, essay, four authored baseline estimates, and a clear note about the practice-only score.
2. Grammar discovery comes first. The essay is shown as selectable sentences without error highlighting. The learner marks a sentence, writes a correction, and continues; clean sentences can be selected too. The system does not reveal correctness until the learner chooses to check.
3. Checking reveals authored target issues, valid sample revisions and explanations. It distinguishes found, missed, and unnecessary changes. A learner's alternative phrasing may be valid even when the narrow pilot cannot recognize it; the UI says that it needs teacher review and does not mark it wrong.
4. The learner continues through Task Response, Coherence and Cohesion, and Lexical Resource. Each round has a concrete paragraph-level revision prompt. The learner writes first, compares with an authored example, and may then write a separate second version informed by the explanation. The first attempt stays fixed for comparison. The second attempt is optional and remains editable on back navigation.
5. The page keeps an original and a working version. A simple diff shows what changed. A correction matching an authored accepted variant can be applied directly; any other wording remains an unverified alternative. The second free-text attempt is kept for teacher discussion and is never applied or scored automatically. Criterion estimates change only after a verified authored improvement has actually been applied.
6. The final view shows the two essay versions, criterion changes, the source of each applied change (accepted learner wording or prepared example), found/missed issues, first and second learner attempts grouped by criterion, and a next-practice prompt. Restarting or switching essays discards the in-memory session with an explicit confirmation if edits exist.

## Scoring and feedback contract

- Baseline and improvement values are authored per case and per criterion. Each verified learner revision or deliberately applied example adds only its predeclared criterion step, capped by the case's authored ceiling.
- An unrecognized free-text revision is preserved for comparison but does not automatically change the estimate. The learner may compare with, and deliberately apply, the authored example.
- The criterion can remain at the same estimated band even if wording improves. Progress counts (issues found, examples applied) stay separate from practice bands.
- Sample revisions are examples, not a unique ideal essay. Preserve the learner's argument rather than replace the whole essay with a generic model answer.
- The final report explains why any estimate changed; it does not claim exam equivalence or teacher approval.

## Data and UI boundaries

- `cases.ts` contains only original authored prompts, essays, targets, explanations, and baseline/ceiling estimates. No Cambridge passage, exam answer, real learner data, or provider key.
- `engine.ts` contains pure session helpers for stages, revisions, reveals, and applied improvements. It never reads browser storage or network state.
- `WritingTrainer.tsx` owns page-local state, input, focus, and presentation. The route is noindex and clearly labelled as a prototype.
- The first entry point is a direct `/writing/trainer` page. Future integration with class assignments requires a separate privacy and scoring design.

## Failure and edge states

- Empty or unchanged revision: keep the input and explain what action is needed.
- A learner who searched but found nothing can explicitly reveal the grammar review; this is recorded as zero independently found issues.
- Edit of a clean sentence: record as an unnecessary change without reducing an IELTS estimate.
- Text different from the authored example: show it as an unverified alternative, with no automatic penalty or reward.
- Reload or leave: no persistence; the page warns that drafts are local to the open page.
- Back navigation preserves the furthest stage and lets a learner revisit comparisons and apply examples after viewing the report.
- Keyboard and mobile: all sentence controls are buttons, edit fields are labelled, feedback is announced, controls have 44 px targets, and the layout stacks at narrow widths.

## Pilot success signals

Observe whether a learner understands the sequence, finds issues before reveal, can explain the sample changes, and can make a better revision on a fresh prompt. Count independent discoveries separately from score movement. A later free-essay phase needs teacher-rated examples and evaluation against IELTS descriptors before any automatic criterion score is trusted.

## Calibration gate for a later free-essay version

The [official IELTS Writing Task 2 descriptors](https://ielts.org/cdn/ielts-guides/ielts-writing-band-descriptors.pdf) describe the complete response. A single corrected sentence or paragraph is useful practice evidence, but does not establish a new band for an entire criterion. The current `5.5 → 6.0` values are authored demonstration states for the two fixed essays; they are not calibrated predictions.

Before evaluating a learner's own essay, ask a teacher to annotate the **whole original and revised response** for each area:

| Area | Evidence to review beyond this pilot's marked span |
| --- | --- |
| Task Response | Both sides of the prompt, a relevant position, development and support across the complete essay. |
| Coherence and Cohesion | Overall progression, paragraph structure, logical links, reference and substitution throughout. |
| Lexical Resource | Range, precision, appropriacy, word formation and spelling across the response. |
| Grammatical Range and Accuracy | Variety of simple and complex structures, accuracy and punctuation across the response. |

Record the teacher's criterion judgment, cited text spans, and uncertainty separately from the learner's number of self-discovered issues and from any Jev suggestion. Review whether the fully revised response still meets the Task 2 minimum of 250 words. Compare the teacher's before/after judgments on held-out essays before proposing any automatic numeric change. If the evidence is insufficient or teachers disagree, show the explanation and request review without changing the estimate. Never derive an official Writing score from the four practice numbers, since Task 1 and Task 2 are assessed together and Task 2 has greater weight in the actual test.
