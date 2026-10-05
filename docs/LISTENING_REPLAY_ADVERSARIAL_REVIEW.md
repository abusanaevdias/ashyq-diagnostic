# Listening Prediction & Replay: review of the public pilot

## Scope and provenance

Two original scenarios, each with a distinct transfer script: changed weekday and required plural equipment. All English scripts are authored for ASHYQ in `src/lib/listening-replay/cases.ts`; no official IELTS audio or questions. Eight WAV files were synthesized locally with Windows System.Speech, Microsoft Zira Desktop, rate -1. Four full clips are approximately 26–27 seconds; four isolated clue clips are 8–10 seconds. Synthetic voice is disclosed in the UI. This is a short learning pilot, not an IELTS simulation or a band estimate.

## Adversarial cases and decisions

- **Repeat before committing the first attempt:** no native audio controls; a custom first-play button becomes unavailable during playback, then the view moves to answer capture. Replay becomes available only after answer/confidence/self-observation are frozen. Refresh starts a new session; this is not an exam security mechanism.
- **Playback fails:** technical failure does not consume an attempt. A retry and explicit text fallback remain available. The async playback request is invalidated when leaving a scenario; late errors cannot update another round.
- **Learner needs to stop sound:** first recording can be stopped, but the report marks the attempt incomplete. Review playback can be stopped without navigation. Leaving/unmounting pauses the recording.
- **Sound unavailable or inaccessible:** text mode is available and explicitly marked as reading, not comparable listening evidence. No microphone, speech recognition, external AI, or learner uploads.
- **Hints make a guessed answer look independent:** the report states which help level was opened, not which help caused learning. It does not equate opening a replay with listening to it. After a failed repair, the next help level can be opened; masked text hides the actual target word.
- **Learner gives up even after full text:** the authored answer is disclosed after a failed attempt at the final level. Ending with an incorrect answer must report “not restored”, rather than success.
- **Correct answer hides a weak prediction:** answer, expected type, chosen cue, confidence, and self-observation are reported separately. The system does not claim to diagnose the actual error mechanism from these choices.
- **Single-label cue overconfidence:** the suggested cue is an instructional orienting word, not the only possible useful cue. No machine grade is given for the prediction/cue.
- **Synthetic voice mistaken for exam audio:** clear disclosure; no multi-speaker, accent diversity, adaptive progression, analytics, or claim of lasting improvement from two clips.

## Release checks

Local targeted ESLint, typecheck, production build, deterministic 21st review (0 findings), diff check and token audit (9/9) passed. Browser: missing prediction guard, initial playback lock, automatic end-to-answer transition, wrong initial weekday, self-observation, failed repair, isolated segment playback, masked transcript, correct repair and fresh text-mode transfer verified. Mobile result at 390px override had no horizontal overflow; stages focus their heading. Manual review found help transitions could drop keyboard focus when their button disappeared; the focus effect now includes help level. Revalidate that fix and early-stop/final-incorrect branches before release. No subjective claim about studio audio quality is made. Before expanding the bank, a teacher should validate scripts, distractors, pronunciation, clue segmentation and question wording with learners.

Follow-up browser review passed: early first-play stop, incorrect singular ending after full text, honest unfinished report, help-level heading focus, and separate first-attempt vs repair-text-fallback flags. The latter was found and corrected during review; repair text no longer reclassifies the original audio attempt.
