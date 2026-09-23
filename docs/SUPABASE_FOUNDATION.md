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

## LMS data and files (SUPABASE-LMS-001)

With `NEXT_PUBLIC_AUTH_PROVIDER=supabase` the learning layer reads and writes
the foundation tables through `src/lib/lms/supabase-repos.ts` (same `Repos`
interface as the demo, loaded as a separate chunk). Class joins and grading go
through the `join_class` / `grade_submission` RPCs; every other rule is RLS.
Profile rows are visible only to the user and people in a class they share.
Teacher access follows the current database role, so changing a teacher to a
student revokes access to classes they previously managed. A grade cannot be
null, and an assignment's maximum cannot be lowered below a published grade.
Until authors publish their own posts, the four demo articles from
`src/data/blog.ts` stay visible as a fallback.

Files live in the private Storage bucket `lms-files` (2 MB per file, like the
LMS spec). Objects are stored under `<owner uid>/<id>-<ascii name>` — Storage
rejects non-ASCII keys, so the original name is kept in the material title and
restored on download. Owners can upload only into their own folder. Other
users can read a file only when that exact file is attached to a lesson in a
class they belong to or to a submission in a class they teach; a shared teacher
or student account does not expose files from its other classes. Referenced
files cannot be deleted through Storage until detached. The app hands out
10-minute signed links. These rules are enforced by migration
`20260923000100_lms_group_access.sql`.

```powershell
npx tsx scripts/supabase-lms-check.ts     # two teachers/students, profile and result isolation
npx tsx scripts/supabase-files-check.ts   # linked files, cross-class denial, 2 MB
```

The CI database job starts a fresh local Supabase project, reapplies every
migration, runs `db lint` and pgTAP, then checks the LMS repositories and Storage
policies using authenticated clients. Never point these integration checks at
the production project.

## Championship (SUPABASE-SEASON-001)

The season UI computes standings from a whole `SeasonData` document, so the
database serves it through one role-redacted RPC, `season_snapshot()`:
organizers get everything; students get public data plus their own `userId`,
their team's answers and the reasons for their own points; anonymous visitors
get aliases, teams, Match Days and points without reasons, answers or the
Match Day brief. Composite actions are atomic RPCs: `create_season_team`
(exactly five members, captain from the roster), `add_season_participant`
(optional link to a student account by email — without it the student has no
Season HQ) and `review_match_and_award` (review plus capped «Команда» points
for each member in one transaction, week computed like `weekOf`). A trigger
lets only the captain submit or edit a Match Day answer, and only while the
match is live. Appeals are out of scope until the rules are decided.

```powershell
npx tsx scripts/supabase-season-check.ts   # organizer/captain/member/anon
```

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
