# Jev: synthetic teacher pilot

Status: implementation design, 2026-09-23. This pilot contains invented answers only. The owner selected a one-teacher pilot and delegated the teacher-facing label wording. The taxonomy remains a draft until it is evaluated on teacher-annotated examples.

## Decision

Three paths were considered:

1. Keep the hand-authored screen. It demonstrates review, but never exercises the provider contract.
2. Add a server-only provider call for fixed invented examples. This tests the typed-choice integration while keeping learner work outside the provider. **Chosen.**
3. Classify real submissions now. That requires an approved taxonomy, class-specific server authorization, evaluation, and resolution of the executed data contract and learner privacy questions. This remains a later task.

## Scope and workflow

The teacher opens `/teacher/jev-preview`, selects one of eight invented examples, and sees an illustrative label. A teacher in the closed Supabase pilot can request a fresh suggestion. The browser sends only the fixture ID and its Supabase bearer token to `POST /api/jev/synthetic?fixture=<id>`. The server verifies the token against Supabase Auth, reads the current profile role, checks the teacher ID allowlist, loads the fixed fixture, and applies a deterministic rule for an empty answer or an explicit word limit. Other examples go to TypeSafe `POST /v1/systemone` as one choice question with a fixed list of labels. The browser receives a label code, source, status, and taxonomy version. It does not receive the provider probability. The teacher confirms, changes, or marks the suggestion unclear; the decision remains in page state.

The `synthetic-draft-2` taxonomy describes observable answer properties: changed logical relation, contradiction of source, missing required part, unsupported detail, and no supported label. Empty answer and word-limit excess are local rules. It does not infer motivation, attentiveness, ability, or other hidden causes. The existing mock-test cause taxonomy remains a separate teacher action; no automatic mapping writes into it.

## Configuration and contract

The endpoint fails closed unless `ASHYQ_JEV_SYNTHETIC_PILOT=1`, `NEXT_PUBLIC_AUTH_PROVIDER=supabase`, a comma-separated `ASHYQ_JEV_PILOT_TEACHER_IDS` allowlist, Supabase URL and anon key, a server-only `ASHYQ_SUPABASE_SERVICE_ROLE_KEY` or `SUPABASE_SERVICE_ROLE_KEY`, and `ASHYQ_JEV_API_KEY` are configured. The hosted Supabase project must also have the existing `check_rate_limit` RPC from migration `20260915000500_rate_limit.sql`; the handoff currently marks that migration as awaiting hosted application. `ASHYQ_JEV_MODEL` defaults to `jev-latest`. A live `GET /v1/models` with the disposable test key confirmed that this account can use `jev-latest` and `jev-preview` on 2026-09-23. These variables are configured on the server; the Jev and service-role keys are never `NEXT_PUBLIC_*`. No production environment is changed by this task.

The provider request uses `state` containing the invented source, question, rubric, and answer, and one `choice` question with fixed criteria. The server rejects unknown choice codes or malformed confidence, timeouts, and provider errors as unavailable. A valid `no_supported_label` becomes an unclear result. No raw input, output, token, or answer body is logged or persisted. The response has `Cache-Control: no-store`. The UI never uses the suggestion to grade, publish, or message a learner.

TypeSafe's current [OpenAPI schema](https://api.typesafe.ai/openapi.json) documents `POST /v1/systemone`, the `state` plus named `questions` request, `choice` criteria, and a typed answer. The [model announcement](https://typesafe.ai/blog/introducing-system-one-models-and-jev) describes Jev as a structured decision model. These are provider claims; ASHYQ accuracy is not established by them.

An opt-in `scripts/jev-provider-smoke.ts` exercises the actual server payload with simulated Supabase teacher checks and only the fixed invented fixtures. The disposable key was supplied only as a process environment variable; it is absent from the repository and local env files. A first six-fixture run matched the illustrative labels in five cases. The museum example had two overlapping errors; after changing it to retain the factual event and alter only the causal relation, a live retry returned the intended `relation_changed` label. This is an integration smoke check, not an accuracy estimate or proof of reliability.

## Failure and misuse cases

- A missing, expired, or non-teacher bearer token cannot reach Jev. Role is read on each request, so a revoked teacher role is not kept in an application cache.
- The client cannot supply prompt, rubric, answer, taxonomy, model name, or provider URL. Unknown fixture IDs fail before a provider call.
- Prompt-like text inside an invented answer remains `state.answer`, outside the decision instructions. The fixed response labels limit output shape, but model behavior still needs teacher-reviewed evaluation.
- If Jev or Supabase is unavailable, the teacher sees a neutral unavailable state and can review the manually authored example.
- Each non-rule request consumes one shared, atomic budget unit before Jev is called: at most 20 requests per teacher per 24-hour fixed window. A failed quota RPC fails closed; a consumed unit is not refunded when Jev fails. A wider cohort still needs usage monitoring and an explicit spending cap for the account.

## Next gates

Teachers must revise and approve the draft labels and annotate an evaluation set split by assignment and learner. Measure per-label precision/recall, macro-F1, abstention, teacher edit rate, and review time. Display a confidence number only after calibration on held-out examples. Before any real learner text is sent to Jev, review the executed TypeSafe contract and DPA, retention/telemetry, data location, notices and under-18 suitability; implement a separate server route that verifies assignment and class ownership before fetching minimal submission data. No current endpoint accepts a real submission ID.
