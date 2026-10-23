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
- No service-role key is used by this feature. No external AI request or AI token cost for recommendations.
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

Until then: keep PR draft and describe cloud feature as prepared, not released. Existing TRAINERS-COMPLETE-033 teacher/provider/device gates remain separate.
