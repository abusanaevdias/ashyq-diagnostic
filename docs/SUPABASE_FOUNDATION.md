# Supabase foundation

This directory is the first reversible Supabase integration stage. It defines
the database contract, but does **not** switch the Next.js application away
from its current local demo repositories.

## What is included

- `profiles` linked to `auth.users`; signup metadata may set a display name and
  approved avatar token, never an application role;
- normalized LMS tables for classes, membership, lessons, assignments,
  submissions, comments and blog posts;
- normalized championship tables for seasons, participants, five-person teams,
  Match Days, submissions and the points ledger;
- RLS on every exposed table, explicit grants, private authorization helpers,
  safe class-join and grading/review RPCs, plus a public leaderboard RPC that
  returns aliases rather than private names;
- database guards for consistent season/division links, the five-person team
  maximum and concurrency-safe weekly point caps (25/20/15/10/30 by category).
- pgTAP covers both schema structure and behavioral boundaries: signup role
  escalation, anonymous/private reads, student/teacher class access, weekly
  point caps, team size, and alias-only public leaderboard output.

The schema intentionally contains no diagnostic answers, real student
identities or committed demo accounts. CRM lead tables are empty by default
and are reachable only by the server-side service role.

## Optional lead persistence

Lead, CRM-event and delivery-ledger persistence can be switched from local
JSONL files to Supabase without changing the public API contracts:

```text
ASHYQ_LEADS_PROVIDER=supabase
ASHYQ_SUPABASE_URL=https://your-project.supabase.co
ASHYQ_SUPABASE_SERVICE_ROLE_KEY=server-only-secret
```

If `ASHYQ_LEADS_PROVIDER` is absent, the existing `.data/*.jsonl` storage is
used unchanged. When Supabase is selected, missing credentials or failed
writes return a retryable server error instead of pretending that the lead was
saved. Never prefix the service-role key with `NEXT_PUBLIC_` or expose it in
browser code. Local HTTP is accepted only for `localhost` and `127.0.0.1`.

## Sign-in (SUPABASE-AUTH-001)

User decisions (2026-09-14): email + password; every new account is a
`student`, teacher/author roles are granted only by an admin (edit
`public.profiles.role` in Studio); users under 18 sign up themselves with a
parental-consent checkbox. The database enforces the consent rule: the
signup trigger rejects `is_minor` without `guardian_consent`, and the consent
timestamp lives in `private.signup_consents`, which the API cannot read.

```text
NEXT_PUBLIC_AUTH_PROVIDER=supabase
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321      # hosted: https://<project>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<ANON_KEY from `supabase status -o env`>
```

These are build-time values. The browser uses only the anon/publishable key;
the CSP `connect-src` is widened to the Supabase origin only when the URL is
set. Integration check against the local stack:

```powershell
$env:SUPABASE_ANON_KEY = '<ANON_KEY>'; $env:SUPABASE_SERVICE_ROLE_KEY = '<SERVICE_ROLE_KEY>'
npx tsx scripts/supabase-auth-check.ts
```

Until the LMS and championship adapters land, `NEXT_PUBLIC_AUTH_PROVIDER=supabase`
switches sign-in only; class, blog and season pages still need their repositories.

## Local verification

Requirements: Node.js, a running Docker-compatible engine and Supabase CLI.

```powershell
npx tsx scripts/supabase-schema-check.ts
npx tsx scripts/supabase-leads-check.ts
npx --yes supabase@latest start
npx --yes supabase@latest db reset --local
npx --yes supabase@latest db lint --local
npx --yes supabase@latest test db --local
```

Studio is available at `http://127.0.0.1:54323`. Stop only this project stack:

```powershell
npx --yes supabase@latest stop --project-id ashyq-diagnostic
```

Never run `db reset` without `--local` during development. The committed seed
is intentionally empty; production/student data must not be copied into it.
Use `--no-backup` only when you intentionally want to delete this local
project's development volumes.

On Windows, if Docker Desktop crashes before creating its Linux engine pipe,
check `com.docker.backend.exe.log` for stale AF_UNIX sockets. Preserve the
named socket files before restarting Docker; do not factory-reset Docker or
delete volumes merely to recover the engine.

## Hosted rollout (not part of this task)

1. Decide the sign-in method, invite flow, minor/guardian policy, data retention
   and who is allowed to grant teacher/author roles.
2. Create a separate Supabase project and record its database major version in
   `supabase/config.toml`.
3. Review migrations in a staging project, run policy tests as anon, student,
   teacher and author, then back up before `supabase db push`.
4. Configure the existing server-only lead adapter in staging and keep the
   service-role key outside every `NEXT_PUBLIC_*` variable.
5. Implement LMS and championship adapters behind their existing async
   repository interfaces, with an explicit resumable localStorage migration.
   Keep demo mode as rollback until parity and deletion/export flows are verified.

## Known boundaries

- A team can never exceed five members, but “exactly five before activation”
  needs an atomic team-creation RPC when the season adapter is implemented.
- Match timing, appeal handling, idempotent award commands and review-to-ledger
  transactions belong to `SEASON-BACKEND-001`.
- Runtime environment variables and deployment files are deliberately excluded
  because `DEPLOY-PREP-001` owns them.
- Docker was unavailable while this foundation was authored. The static checker
  and project gates run without it; `db reset`, lint and SQL policy tests remain
  mandatory before any hosted push.
