# Speaking transcript and observable comparison — required continuation

Owner: Codex /root, TRAINERS-COMPLETE-033. Status: planned, not implemented or activated. Scope claim c163f3b was pushed to main on2026-10-15 before implementation. Existing local recording and notes remain available.

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
