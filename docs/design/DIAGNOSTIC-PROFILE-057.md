# DIAGNOSTIC-PROFILE-057 — diagnostic → profile → targeted practice

## Product contract

The baseline answers a narrow question: **what did this person answer in this specific short diagnostic, and which published exercise is a reasonable next step?** It does not certify ability, infer a cause from every wrong answer, or change an original score after practice.

1. The visitor completes IELTS (12 questions) or SAT (16).
2. Result shows an evidence-based next exercise; registration is optional for public practice.
3. “Сохранить результат в моём профиле” stages only this selected run locally. The DTO excludes lead/contact/UTM fields.
4. Login/signup keeps the internal return path. Email confirmation may require returning to the original browser; no silent cross-browser transfer is promised before upload.
5. Profile previews the specific exam/date/result and asks the signed-in email owner to confirm. Login itself does not import anything.
6. After server-confirmed save the frozen baseline is available to its owner on another device. Demo mode explicitly remains local. Failed requests preserve the staged run for retry.
7. Profile shows up to three priorities with wrong/skipped/total counts, supporting question IDs and small-sample caveats. Unsupported themes remain visible in original answers; the system does not invent a matching trainer.
8. Practice on this browser is shown separately, only for the current account and records saved after the baseline. A matching new-example check is not called mastery or an independent examination.
9. Own baseline can be deleted; original browser diagnostic and practice history are separate copies.

## Data and ownership

- Version 1 snapshot freezes canonical question metadata, prompt, selected-answer label, answer key, tags and checks. Future bank edits do not regrade stored baselines.
- API rebuilds snapshots from whitelisted, validated question IDs/answers and the canonical bank; browser-supplied score fields are ignored.
- Existing engine scoring, CRM lead handling and original local run/history keys are unchanged.
- Private table uses globally unique run ID, owner-only SELECT/INSERT/DELETE and no authenticated UPDATE. No anonymous or teacher bypass.
- JWT is checked through Supabase Auth; expected actor must match the verified user before database access. This closes the raw-token/cached-profile account-switch interval.
- Same-owner same-snapshot retries are idempotent; changed payload or another owner returns a generic conflict. No upsert.
- Table shape validation fails closed, including JSON version type and safe integer dates. Authenticated direct REST writes still represent self-assessments, **not server-certified achievements**.
- Ordinary application routes use only the owner JWT and public anon key. A separately gated server-build operational runner uses service role solely to delete its disposable acceptance users; it never exports credentials to the app/client. No external AI request or AI token cost for recommendations.
- Pending result can be inspected on a shared browser; it is not account-private until confirmed upload. Explicit decline/clear-site-data removes the pending copy.

## Adversarial review

Read-only independent reviewer found and implementation corrected:

- IELTS count mismatch (12 versus SAT16).
- Cached profile versus refreshed JWT account-switch race.
- SQL CHECK null permissiveness / malformed own snapshots poisoning the list.
- String JSON version versus numeric reader version.
- Unsafe dates causing display failure.

Final source review reported no further confirmed blocker in those changes. This is **source evidence**, not live RLS acceptance.

## Engineering evidence

- TypeScript and targeted ESLint passed during implementation.
- Production build passed; final exact-head receipt recorded in PR/HANDOFF.
- CUA mobile walkthrough on synthetic local IELTS: two answered wrong, ten skipped; complete → selected transfer → demo sign-in → explicit email confirmation → saved baseline and T/F/NG recommendation. No real student data was used.
- Reload retained the baseline and recommendation in the same demo browser. Actual mobile DOM width/scrollWidth: 375/375. Original screenshots: `diagnostic-profile-057-mobile.jpg` and `diagnostic-profile-057-answers-mobile.jpg` in this directory. Independent image reviewer found no blocker in the pictured areas; this does not validate backend or a physical phone.
- No new test suite was added or manually executed.

## Required cloud activation — NOT COMPLETE

At implementation time the Supabase connector was not installed/connected and the CLI had no access token. `DIAGNOSTIC_PROFILE_ENABLED` stays false by default. No remote schema or RLS verification is claimed.

Before production activation:

1. Connect the intended Supabase project and reconcile its migration history.
2. Apply `supabase/migrations/20261023000100_diagnostic_profile.sql` to the correct project.
3. With real authenticated A/B and anonymous sessions, verify own read/write/delete, other-owner denial, duplicate retry, changed-payload conflict, no UPDATE, malformed snapshot rejection and account-switch expectation guard.
4. Verify signup/email-confirmation/return on the actual auth provider, network retry and refresh/new-device persistence with disposable diagnostic data.
5. Set server `DIAGNOSTIC_PROFILE_ENABLED=true` only after acceptance. Deploy verified code, then verify canonical public profile flow.

Keep PR draft until source, exact-head CI and actual UI acceptance pass. Initial disabled code delivery is not cloud acceptance. Only call cloud activated after the pinned operational migration/RLS and canonical receipts described below. Existing TRAINERS-COMPLETE-033 teacher/provider/device gates remain separate.


## Resumed operational activation2026-10-29
Main claime9e01cd permits a one-shot server-build runner. Authorized Vercel config identifies aozhoefgtfrdlllnmdkn; database host matches Auth project. Production sensitive variables cannot be pulled and are not exposed. Anonymous real table probe404/PGRST205 confirms missing migration, not absent credentials. No runtime flag has been enabled.

Runner scripts/diagnostic-profile-prepare.ts is skipped unless DIAGNOSTIC_PROFILE_PREPARE_SHA exactly equals the reviewed production VERCEL_GIT_COMMIT_SHA, VERCEL_ENV=production, exact PROJECT_REF and runtime gate all agree. It uses original migration only, verified TLS/project, bounded transactions and advisory lock, source-matched Auth trigger preflight, schema/grant/policy checks and tracked history when present. Privileged operations are separate from ordinary owner-JWT feature calls.

Real A/B Auth sessions exercise API/REST save/read/actor-switch/idempotency/immutability/cross-owner/anonymous/no-update/malformed/new-session/delete and persisted state. QA uses actual public signup of unique example.invalid identities only when the existing provider setting auto-confirms email; it never changes that setting, records no tokens/keys, and cleans only exact own IDs recovered by exact unique emails. Failed cleanup fails acceptance. A committed additive migration can remain after a later build failure; the old deployment remains active, and no table is automatically dropped.

Activation sequence: independent source/security review, full exact-head CI, merge initially disabled, pin that exact reviewed merge for one production redeploy, require real acceptance/cleanup receipt before production success, verify canonical flow, then remove operational SHA flag. Do not infer email delivery/real mailbox return, canonical physical-phone recording, external AI quality, or teacher approval from A/B synthetic runtime acceptance. Those remain distinct evidence requirements.

Primary operational references: https://node-postgres.com/features/ssl (connection-string SSL overrides); https://supabase.com/docs/reference/javascript/auth-admin-createuser (server-only admin and email_confirm). No hosted Auth confirmation setting is changed.


First complete isolated native UI capture40927433755 on a61f308 passed7states/21geometry records/28PNG (320/390/1280/full) with no reported overflow/serious-critical1280px axe failure. Fresh image-only reviewer found no blocker but identified overly confident legacy section labels/advice. Display now uses question counts and observed-answer wording, not ADVANCED or an unsupported reading-speed inference; thresholds/scoring/bank unchanged. Saved attempt date is repeated in wrapping text, demo pending copy omits real-email instructions, and profile anchor has more header clearance. New exact-head captures/CI required. Ops source reviewer accepted current runner after guard/cleanup/canonical/consent corrections; synthetic planned identity is logged before creation for hard-kill recovery, never its password/JWT. No production flag set yet.


Canonical acceptance follow-up: after the reviewed bootstrap deployment is active and anonymous canonical API returns401, the same pinned source can run once more with DIAGNOSTIC_PROFILE_ACCEPTANCE_MODE=canonical. Ordinary feature calls then use HTTPS on the fixed canonical owned domain (actual A/B JWTs, never service key); response private/no-store/Vary is checked. Direct RLS tests and exact cleanup still apply. The same source is redeployed after this receipt; remove PREPARE_SHA and mode afterward. This verifies actual production HTTP behavior, not real email delivery, browser UI across physical devices, or provider/teacher readiness.


Read-only live Auth settings2026-10-29: email provider enabled, signup enabled, mailer_autoconfirm=true. Runner now requires those same current settings and uses the ordinary anonymous signup endpoint for two synthetic adults, then real password sign-in and user-JWT profile/student-role read before baseline/RLS checks. Service key is used only for exact QA-user cleanup, not registration or feature calls. This is actual configured registration acceptance without changing confirmation/captcha/provider policy; if interactive confirmation is required later, the runner refuses and asks for separate evidence. No real mailbox delivery or ownership is claimed. Independent Gateway zero-priced-model probe returned403/customer_verification_required (balance0/used0); no purchase/top-up/provider flag activation. Original teacher report remains scoped recommendations, not standalone approval.
