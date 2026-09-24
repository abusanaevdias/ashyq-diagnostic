# Writing trainer pilot: adversarial review

Reviewed the synthetic IELTS Task 2 learner flow against the product promise: independent discovery, honest feedback, staged revision, and useful final comparison.

| Failure hypothesis | Evidence and change |
| --- | --- |
| A learner can reveal the grammar answer immediately without attempting a search. | The first browser pass found an enabled check button. It now requires a changed sentence, with a separate explicit “I found no errors” exit so a learner who tried but found nothing is not trapped. |
| A learner's valid alternative is treated as wrong or earns a fabricated score. | Exact authored variants are the only automatic matches. Other variants are labelled for teacher review and retained in the final report. Practice scores change only after an authored improvement is applied to the working essay. |
| The report hides a learner's original work after advancing. | The browser pass exposed inaccessible prior drafts. The report now includes unapplied grammar and paragraph drafts. Back navigation also lets the learner revisit comparisons and apply a prepared example later. |
| Going back makes a completed lesson appear to lose progress. | Session state now tracks the furthest stage separately from the current stage. The progress bar remains at the furthest stage while the current stage is named explicitly. |
| A Task 2 example is too short to model the format. | The original essays were 213 and 178 words. Both are now above 250 words (262 and 261 words in the page UI). |
| The improved essay may fall below the Task 2 word target. | The second case dropped to 248 words after all authored examples were applied. Its lexical example now keeps the fully revised essay above 250 words while adding a concrete point about each student's role. |
| A score changes without an explanation of the relevant writing skill. | Each final criterion card now says which authored change caused the movement; grammar notes that range of structures was not separately assessed. |
| The learner cannot see how to start without scrolling. | The opening section was shortened and gained a direct link to the active exercise. |
| Sentence hit areas are too small for touch. | The first review only inspected the React component and missed the CSS geometry. Sentence buttons now have a 44px minimum height and wrap safely within the essay pane. |
| The mobile step list hides later criteria behind a horizontal scrollbar. | A 390px browser pass found this. The five stages now form a two-column grid on narrow screens, with the report occupying the last full row. |
| Advancing from a long round lands halfway through the next one. | The browser stayed at the old document scroll position and showed the middle of the final diff. Stage changes now scroll to the exercise start and focus its heading. |
| A correct but unapplied grammar edit is labelled as an unrecognized alternative in the report. | Report labels now distinguish a recognized edit, an edit without a marked issue, and one requiring teacher review. |
| Real learner text is sent to an external provider or persisted. | The route is a static client exercise with two invented case files. No API route, browser storage, LMS read/write, or AI call was added. |

## Design reference check

- 21st.dev search surfaced [Onboarding Stepper Progress](https://21st.dev/@shadcnspace/components/progress-02), with a step count, progress bar, and back/next controls. We kept ASHYQ tokens and its existing shell, and added reversible navigation to the in-page exercise instead of installing the reference's additional UI dependencies.
- Mobbin's MCP returned a paid-plan requirement, so no Mobbin flow screenshot was available for inspection. The [public pattern catalogue](https://mobbin.com/) lists progress indicators and starting/completing journeys; those broad patterns were considered, but no specific app flow is claimed as a source.
- `21st review src/components/writing/WritingTrainer.tsx` returned zero deterministic findings after the navigation refinements.

## Remaining limits

- Scores are authored practice estimates for these two cases, not live IELTS assessment. The band movement is a property of the revised case essay, not proof that a learner improved independently.
- An unrecognized but valid free-text revision still requires a teacher. This pilot does not grade it.
- A 390px browser pass covered the task, step list and grammar exercise. Other narrow-screen states remain worth a later dedicated pass.
- The learner's session is discarded on reload. A later class-integrated version needs consent, privacy rules, persistence, and teacher moderation before using real submissions.
