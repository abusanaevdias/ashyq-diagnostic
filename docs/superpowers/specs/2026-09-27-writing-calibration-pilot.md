# Writing Task 2: teacher calibration worksheet (synthetic pilot)

## Purpose

Give the pilot teacher a way to challenge the trainer's authored practice estimates using the **whole** original and fully revised synthetic essays. The worksheet is a review instrument, not a scoring engine. It does not establish that the two cases have accurate IELTS bands.

The four areas follow the [official IELTS Writing Task 2 band descriptors](https://ielts.org/cdn/ielts-guides/ielts-writing-band-descriptors.pdf): Task Response, Coherence and Cohesion, Lexical Resource, and Grammatical Range and Accuracy. The teacher should use the official document for a judgment; the on-screen prompts are short navigation cues, not copied descriptors.

## Flow

1. Choose one of the two authored cases. Both versions are shown as A and B with the same prompt; the screen does not reveal the trainer's estimates yet. A is the original and B is the fully revised authored example.
2. For **each version and criterion**, the teacher records a provisional criterion value or "insufficient evidence", a verbatim excerpt from that version, and a short whole-essay rationale. The excerpt must occur in the displayed version. One excerpt is only an anchor; the teacher must still inspect the complete response.
3. A progress count reports complete judgments out of eight. Empty or invalid evidence cannot unlock the comparison. The page keeps drafts only in memory, confirms before switching cases or clearing, and does not read or write LMS, browser storage, an API, or an AI provider.
4. After eight complete judgments, reveal which version is original/revised and compare **direction** of the teacher's provisional change with the authored demonstration movement. A mismatch means the case should be reviewed, not that the teacher is wrong. "Insufficient evidence" remains visible and cannot be interpreted as agreement.
5. The teacher can download or copy a JSON record containing only the synthetic case ID, version labels, criterion judgments, excerpts, rationales, and authored comparison. A collapsed read-only JSON field provides manual copy when browser download or clipboard access is unavailable. The app does not upload or retain it.

## Interpretation limits

- One pilot teacher can identify unclear examples and score claims. This cannot calibrate an automatic model or validate an IELTS band.
- An authored 5.5 → 6.0 step in the learner trainer is a demonstration state. It is not an examiner verdict. The worksheet must never overwrite that value or score a learner's free text.
- Before any free-essay scoring: collect independently annotated **whole** original/revised responses, assess inter-rater disagreement and held-out cases, settle privacy and under-18 data handling, and define a no-score fallback when evidence is insufficient.
- The existing learner trainer and Jev preview remain synthetic-only. This worksheet introduces no real learner submissions or external data transfer.

## Adversarial checks

| Failure hypothesis | Guard |
| --- | --- |
| Authored 5.5 → 6.0 anchors the teacher before they judge. | Show A/B and hide authored values until eight complete judgments. |
| A teacher enters a paraphrase instead of textual evidence. | Require the excerpt to match the displayed version after whitespace normalization. |
| A single corrected sentence is treated as proof of a whole criterion band. | Ask for a full-response rationale separately from the excerpt and state that the excerpt is an anchor only. |
| A teacher cannot keep the work because there is no persistence. | Offer local JSON download after the comparison; never transmit it. |
| The in-app browser does not surface the generated download. | Offer a clipboard action and a selectable read-only JSON field as local fallback. |
| A mismatched judgment is treated as an error by the teacher. | Label it as a case-review signal and keep both judgments intact. |
| Reload, case switch, or reset loses work without warning. | Explain page-only state and confirm destructive in-page changes. |
