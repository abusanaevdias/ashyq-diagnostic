# Speaking Second Take: adversarial review

## Scope and data boundary

Original Part 2 style prompts. Prepare, record locally, mark moments while
listening, reflect on four criteria, write a repair plan, repeat the prompt, then
try a fresh prompt. No server upload, external AI, transcription or band.

The browser asks for microphone access only after the learner explicitly presses
the recording button. MediaRecorder chunks become a local Blob URL in memory.
No fetch, storage or telemetry payload receives audio, notes or observations.
Refreshing loses the work; the entry screen explains this. A separate no-audio
path supports spoken self-practice and written reflection without claiming an
audio duration or measured speech quality.

## Adversarial cases addressed in code

- Permission can arrive after cancellation or navigation. A request generation
  invalidates late responses and stops their newly granted media tracks.
- A recorder can fail or produce an empty recording. It returns an error and
  offers retry/fallback rather than recording a successful take.
- Microphone tracks must not remain active after recording, cancellation or
  unmount. Each exit releases tracks and invalidates callbacks.
- Browser timers can be delayed in background tabs. The target is disclosed as
  two minutes; actual elapsed recording time is retained, not clipped to a fake
  120 seconds. Timing ends when stop is requested, not after encoding completes.
- More than one playback can confuse comparison. Starting one audio pauses all
  other audio in this trainer; moving stages pauses playback.
- Blob URLs can leak or be revoked while audio is playing. Restart pauses audio,
  then revokes the previous URLs; unmount revokes all retained URLs.
- Fewer learner markers or a longer recording do not establish improvement.
  Comparison labels counts as learner observations and duration as recording
  session time, not speech time. No automatic pause/grammar/pronunciation metrics.
- Repeating a familiar answer can reward rehearsal. A third attempt uses a fresh
  prompt and retains independent self-review and plan.
- Missing reflection cannot become an implicit positive rating. All four
  criteria, a plan and an explicit self-review confirmation are required.
  Learners may explicitly acknowledge no separate marked moments.
- Free notes and plans are self-reports, not automatic diagnoses. No band or
  mastery result is inferred from the selected ratings.

## Verification boundary

Local build, targeted ESLint, TypeScript, 21st review and token audit 9/9 passed.
Browser replay completed three independent no-audio reviews with preserved
observations/ratings/plans, guards, an actual 60-second preparation transition
without automatic microphone activation, early preparation finish, and a readable
390 px final comparison without document overflow.

`node scripts/speaking-recorder-review.mjs` extracts the actual component handlers
and runs eight synthetic scenarios: late permission after cancellation, normal
stop with delayed encoding, timed stop, active cancellation, empty recording,
permission rejection, recorder error and unmount cleanup. All eight passed.
The fixture does not access any real microphone or validate browser codecs.

CI and production checks are recorded in the release ledger.
Agent QA does not enable the user's microphone without explicit permission.
Real microphone recording, permission rejection/retry, mobile Safari encoding
and two-minute recorder auto-stop require a learner/device acceptance check;
do not call these paths empirically verified based on code inspection alone.

Format source: https://ielts.org/take-a-test/test-types/ielts-academic-test/ielts-academic-format-speaking

The pilot uses up to one minute of preparation and a two-minute target, with
explicitly available shortened practice. These two original topics do not
represent full IELTS Speaking or all topic types.
