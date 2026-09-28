# Jev error-copilot proposal

## Current slice

/teacher/jev-preview is an interaction prototype with the existing
client-side teacher UI guard. Its eight examples and illustrative labels are
invented, and the page stores a teacher choice only in component state. A
separate, disabled-by-default `/api/jev/synthetic` endpoint can ask Jev about
one of those fixed examples after Supabase teacher verification and an explicit
teacher allowlist. It does not read an LMS submission, change a grade, write to
a repository, or send anything to a student. See the
[synthetic pilot design](superpowers/specs/2026-09-23-jev-synthetic-pilot-design.md).
Paid requests use the existing Supabase `check_rate_limit` RPC for a shared
20-call-per-teacher daily budget and fail closed if that RPC is unavailable.

The preview demonstrates three useful teacher decisions:

- confirm the proposed error type;
- replace it with another type;
- mark the evidence insufficient.

The final product should classify the observable answer problem. It should not
claim to know a learner's mental state from a single answer. For example,
"the answer reverses the contrast in the sentence" is observable; "the student
was careless" is not.

## Recommended first live slice

Start with short, teacher-created or approved text questions with one answer
and a rubric. Before any live provider call:

1. Agree on a small, versioned taxonomy with teachers. Keep "unclear / more
   than one plausible cause" as a valid outcome. Treat the labels in the
   prototype as examples, not the final taxonomy.
2. Use deterministic checks for objective cases (missing required part, exact
   answer mismatch, word limit). Use Jev only for the remaining structured
   choice between teacher-approved labels.
3. Show one proposed label and, where the API supports a useful calibrated
   decision score, a score that has been checked against a held-out dataset.
   Otherwise omit the number. Always let the teacher confirm, change, or
   abstain.
4. Keep the suggestion separate from the teacher's final label. Never use it
   to set points, publish a result, or message a student automatically.
5. Begin with fixed synthetic fixtures. Real student text is a separate launch
   gate requiring privacy, contract, data-location, retention, and under-18
   suitability review.

Jev is positioned by TypeSafe as a structured-decision model rather than a
free-text writer. Its current API documentation describes POST /v1/systemone
and typed choice, yes/no (Noul), and score question schemas; use a choice
among an agreed taxonomy for this task, not a generated paragraph. A
deterministic local mapping can turn the returned label into a teacher-authored
rubric hint. See the [API docs](https://api.typesafe.ai/docs) and TypeSafe's
[Jev announcement](https://typesafe.ai/blog/introducing-system-one-models-and-jev).

## Server and data boundary for a future provider call

- Browser sends only a submission identifier. It does not send its own
  assignment prompt, answer, role, teacher ID, or class ID as authoritative
  context.
- A server route validates the bearer token, teacher role, and ownership of the
  assignment's class; it then fetches the minimum allowed prompt, rubric, and
  answer using an authorization-aware server path.
- Put the TypeSafe key and model configuration in server-only environment
  variables. Do not add NEXT_PUBLIC_* secrets or a browser-to-TypeSafe call.
- Exclude names, emails, account IDs, attachments, and unrelated conversation.
  Treat the answer as untrusted data: quote/structure it as content, keep the
  allowed labels fixed, expose no tools/actions, and test prompt-like answers.
  Bound input size and use a timeout. Return unavailable for config, network,
  or provider failures; reserve unclear/abstain for valid responses where the
  evidence does not support one label. Track those states separately.
- Keep provider input out of application logs. Do not persist raw provider
  prompts or outputs by default. If decisions are later stored, use separate
  fields/records for the model suggestion and the teacher decision, with RLS,
  audit fields, and an explicit retention policy.
- Keep the feature flag off by default. A missing key must not break normal
  LMS health or grading.

The existing LMS route guard currently checks roles in the client. It is
sufficient only for this data-free preview. A real endpoint needs independent
server-side authorization and must not reuse the CRM admin guard.

## Evaluation gate

Before enabling suggestions for real work, assemble a teacher-reviewed
evaluation set and split it by assignment (and, where applicable, learner) to
avoid near-duplicate leakage. Report:

- per-label precision and recall, macro-F1, and confusion pairs;
- abstention/coverage rate and teacher edit/decline rate;
- calibration for any displayed confidence score;
- median review time with and without the suggestion.

Choose any auto-display threshold from this evaluation, not from a vendor
confidence value alone. Ship initially as a synthetic-only shadow preview,
then to a small teacher cohort only after privacy and authorization gates pass.
The suggestion must remain advisory throughout.

## Other useful integrations

1. **Rubric prefill.** Map a confirmed error type to a short, teacher-written
   feedback snippet and rubric row. The teacher edits and sends it.
2. **Review queue triage.** Group submissions by skill or rubric area and put
   likely high-impact or repeat patterns near the top. Do not reorder by a
   speculative judgment about a student's ability.
3. **Class-level lesson prep.** Summarize only teacher-confirmed categories
   across enough submissions, then link the teacher to an approved exercise.
   Suppress small groups and never expose one student's label to classmates.
4. **Targeted practice.** Recommend existing ASHYQ exercises linked to
   confirmed categories. Start with a teacher assignment action; later student
   practice can be opt-in and should not affect grades.
5. **Learning trend view.** After repeated teacher confirmations, show a
   private skill trend with sample count and the underlying reviewed examples.
   Do not turn a one-answer guess into a persistent student profile.
6. **Deterministic-first review.** Use local rule checks for answer keys,
   required clauses, numeric tolerance, and word limits; use Jev where the
   decision is genuinely ambiguous and the taxonomy has a defensible label.

Jev is not the first choice for open-ended written feedback because its
documented strength is typed decisions, not free-text generation. A later
feedback integration should use approved snippets or a separate, reviewed
generation service.

## External data terms to resolve

The current TypeSafe privacy policy says its services are not directed to
children under 18 and describes U.S. hosting. TypeSafe publishes a DPA, but
that alone does not establish that transmitting ASHYQ learner work is
appropriate. The currently posted Master Customer Agreement also allows
perpetual processing of any Customer Data (which includes Input and Output)
to derive or generate Telemetry; the agreement defines Telemetry to include
hashes, summary statistics, and classifications, and permits broad processing
of Telemetry. Do not assume raw answers are outside that scope. The DPA says it
controls conflicts for personal data and limits processing to documented
instructions, so the MCA alone does not settle how identifiable learner work
may be processed. Review the executed Order and incorporated DPA, and clarify
input/output deletion, answer-derived telemetry, retention, and suitability
for the learners before sending real text. Confirm applicable consent and
notice requirements and data location before enabling real learner data. See
the
[privacy policy](https://typesafe.ai/legal/privacy-policy),
[data-processing addendum](https://typesafe.ai/legal/data-processing), and
[master customer agreement](https://typesafe.ai/legal/mca). These documents
are vendor materials, not a substitute for ASHYQ's review.
