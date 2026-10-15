# Speaking transcript and observable comparison — required continuation

Owner: Codex /root, TRAINERS-COMPLETE-033. Status: contract/server adapter locally implemented and tested; UI/durability integration unfinished, not released or activated. Scope claim c163f3b was pushed to main on2026-10-15 before implementation. Existing local recording and notes remain available.

## Original requirement and verified gap

The supplied `C:/Users/Dias/Downloads/deep-research-report.md` Speaking scenario places transcript/feedback after independent listening, timeline markers and four self-ratings, before the repair plan, same-topic repetition and fresh third topic. Current `SpeakingSecondTake.tsx` explicitly excludes transcription and automatic observations. A finished recording interface does not satisfy that whole scenario. This is remaining implementation, in addition to real provider/device/teacher acceptance.

## Vertical slice and acceptance

1. Preserve the independent first self-review before any transcript/help. Keep exact first versus later feedback/repair provenance, same-topic take2 and fresh take3.
2. Add transcript inspection and exact textual observations, usable on a clearly labelled manually supplied transcript without credentials. Manual transcription is not verified speech, and it never acquires provider timings. Implement the actual provider adapter as well; manual mode does not replace it.
3. Keep external transcription disabled by default behind separate Speaking flags. Reuse the existing real Supabase pilot owner/IELTS role/class checks; explicit per-request audio consent. No real student audio in this work. No activation/env/key/account/migration changes.
4. Browser converts its own captured audio locally to canonical mono16kHz16-bit PCM WAV. Refuse overlong/undecodable audio rather than silently trimming it. Server validates actual WAV structure/bytes/frame duration at or below120s, independently of client duration/MIME. This caps provider audio minutes even for compressed malicious uploads. Preserve the original local recording/download.
5. New transcription endpoint checks disabled state, origin/auth/consent, actual bounded streamed body and strict multipart fields, persistent per-user/global RPC caps, a shared deadline and cancellation/busy cleanup. No server audio archive/log payload. Establish an explicit aggregate budget beside Writing before activation; never silently share/reset its existing quota.
6. Use a real OpenAI transcription adapter with word timestamps; no model examiner/band. Preserve returned text and validate bounded finite monotonic times against verified audio duration and matching word sequence. Unavailable/inconsistent timings remain unknown, not zero pauses. Do not label timestamp gaps as measured acoustic silence or fluency.
7. Show repeated words/phrases with exact text evidence, limited vocabulary counts and optional model-aligned gaps. These are observations of the transcript; recognition can omit repetitions or invent words. No automatic sentence-fragment/grammar/pronunciation diagnosis. Learner listens and decides what to repair.
8. Cancelling/changing take/audio/source/actor must prevent late transmission and response attachment. Require new consent, and protect the latest manual/imported work from asynchronous replacement.
9. Persist/export optional transcript text, source hash/provenance, original self-review and observations in source-bound public/bank metadata and Word/JSON. Keep legacy unknown records readable. Audio is still not in browser checkpoints/history/imports; refresh cannot restore it or its player. Retain byte limits/CAS/explicit replacement and meaningful unknown states.
10. Exercise real component/endpoint flows using isolated synthetic transport and generated local sound, including denied auth/consent, hanging/cancelled requests, malformed WAV/multipart/timestamps, quota, legacy/corrupt/reload/history/Word and keyboard/four-width axe. Verify exact feature CI/merge/deployment and canonical disabled/anonymous gates before release.

## Official API evidence inspected2026-10-15

- [OpenAI speech-to-text guide](https://developers.openai.com/api/docs/guides/speech-to-text): WAV accepted; `whisper-1` supports word timestamps with `verbose_json`. The narrower120s canonical-WAV limit above is our product/budget boundary, not the provider's maximum.
- [Transcription API schema](https://developers.openai.com/api/reference/resources/audio/subresources/transcriptions/methods/create): multipart transcription request, `timestamp_granularities[]=word`, returned word/start/end fields. This endpoint has no Responses `store` parameter; do not send one or copy its retention promise.
- [OpenAI data controls](https://developers.openai.com/api/docs/guides/your-data): endpoint-specific retention table distinguishes audio transcription from Responses. Recheck before activation; no claim about an actual account's controls, data region or evaluated accuracy follows from reading it.

No API-key setup tool is available in the current tool inventory. No real provider call, microphone capture, key discovery or account access occurred in this documentation step. Missing provider credentials and evaluation remain launch prerequisites, not reasons to leave the adapter/flow unimplemented.

## Backend slice verified locally

Actual POST handler exists at `/api/speaking/transcription`. Separate `SPEAKING_AI_ENABLED` and build-time `NEXT_PUBLIC_SPEAKING_AI_ENABLED` must both equal1; a nonblank `SPEAKING_AI_PILOT_EMAIL`, existing Supabase credentials/provider and OpenAI key are required. No actual environment files/flags were changed. Speaking identity is checked separately from `WRITING_AI_PILOT_EMAIL`; Writing keeps its original default checks.

Strict canonical WAV: mono16kHz PCM16,0.2–120s, maximum3840044 file bytes. Entire multipart body<=4000000 bytes; provider JSON<=256000 bytes. The55s shared deadline leaves headroom in the60s route; step caps and cancellation also bound pending reads. Fixed-provider multipart contains only file/model/language/response format/timestamp option and uses `take.wav`, not the learner filename. Incoming fields are only audio plus explicit consent. No application audio archive/log payload.

Persistent UTC-day caps are3/user and9/global in a separate `speaking-transcription` RPC namespace: at most6 user audio minutes or18 global minutes. Writing's4/user and12/global text requests remain unchanged. Provider failures can consume a reserved request; no automatic retry/refund. These are request/audio-duration bounds, not a project billing ceiling; a configured provider project budget and real RPC acceptance remain activation gates.

Adversarial actual-handler tests passed with wholly mocked transport and synthetic credentials: disabled/origin/auth/minor/role/class/UUID/separate email/consent/MIME/multipart/byte/duration gates, invalid inputs consume no provider quota, user/global quota, concurrent request and retry, cancellation at auth/reservation/body/provider/response, bounded JSON, unknown timing and a real55015ms total timeout followed by successful retry. Writing's original actual-handler suite also passed at35003ms after shared auth reuse. Pure schema/WAV/Unicode/evidence/nonmutation/bounds tests, focused lint/typecheck and production build pass; real dev/production-build endpoint returns503/no-store with default flags.

Initial cancellation testing exposed Node's async FormData body producer enqueueing into a closed stream. A local native runtime reproducer distinguishes generated multipart from actual wire bytes. Outbound provider multipart now uses a bounded byte buffer; incoming test fixtures use real HTTP wire bytes. The strict unhandled-rejection assertion remains and passes. The runtime itself was not patched or its failures ignored.

Manual/provider transcripts remain distinct; missing, malformed or text-mismatched word times are explicitly unavailable. Editing text invalidates derived alignment/rate. Exact text repetitions and a limited word list are observations, not automatic grammar, fluency or pronunciation judgments. UI/independent-review envelopes, browser conversion, persistence/reporting and feature acceptance remain to be implemented. Check actual codec padding at the120s boundary; do not silently trim an overlong recording or fabricate its duration.
