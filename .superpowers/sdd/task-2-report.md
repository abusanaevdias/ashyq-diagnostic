# MOCK-SCHEMA-001 / Task 2 report

Status: DONE_WITH_CONCERNS

Implemented on `codex/mock-schema`:

- `supabase/migrations/20260921000100_mock_tests.sql` creates the isolated
  metadata, attempt, review, action and audit schema; private answer-key and
  evaluation tables; RLS, grants, generic Assignment/Submission defenses,
  triggers and the planned RPC names.
- The migration seeds exactly 48 metadata identities and taxonomy labels. It
  intentionally seeds no Cambridge materials, answer keys or Band entries.
- `supabase/tests/mock_tests.test.sql` adds transaction-scoped pgTAP smoke
  assertions for tables, RLS, RPCs, metadata count and empty key/Band tables.
- `scripts/mock-schema-check.ts` checks all 17 public tables, 15 RPCs, RLS,
  private-table revokes, SECURITY DEFINER search paths and generic-submission
  protections.
- `docs/SUPABASE_FOUNDATION.md` records the private-key boundary, legal and
  methodist hold, local verification sequence and service-role finalizer.

Verified:

```text
npx tsx scripts/mock-schema-check.ts  PASS
git diff --check                       PASS
```

Blocked verification (not claimed as passing): Docker Desktop's Linux engine
was unavailable, so `supabase start`, `db reset --local`, `db lint --local`
and `test db --local` could not run. The SQL must be reset/linted and the
pgTAP suite expanded to full role/RPC flows against a local Supabase instance
before merge or any hosted apply.

Review concerns:

- The large SECURITY DEFINER RPC slice is statically checked but unexecuted;
  review it with PostgreSQL before integration.
- `admin_import_mock_template` deliberately refuses payloads until the
  untracked, validated server-side importer contract is implemented; this
  preserves the no-key-in-git constraint but is not a completed import flow.

Controller review (2026-09-22): **CHANGES_REQUIRED; do not merge/apply this migration.**

1. `mock_attempts` and `mock_answers` have direct authenticated SELECT grants
   and owner RLS, exposing `raw_score`, `estimated_band`, and `is_correct` before
   teacher publication. RPC `submit_mock_attempt` also returns the score to the
   student. Use a safe projection/view or column privileges and a redacted RPC
   response; verify with a student-role pgTAP test.
2. `finalize_expired_mock_attempts` invokes `submit_mock_attempt`, whose lookup
   requires `student_id = auth.uid()`. A service-role scheduler has no student
   UID, so expiration cannot finalize attempts. Extract a private grader that
   locks an attempt and can be called by both authenticated submit and the
   service-only finalizer.
3. `start_mock_attempt` selects `ma.*, a.*` into only the `ma` row variable;
   the declared `a` row variable is never populated. Correct the two-target
   SELECT and test start, deadline, membership, and attempt limit in Postgres.
4. `admin_import_mock_template` always raises, leaving no path to create a
   published version and keys; the assignment workflow cannot become usable.
   Implement a validated service-only import in a separate reviewed step.
5. `override_mock_answer` permits changes after publication, does not update
   the attempt raw score, and is not bound to an active review. That violates
   immutable attempts and makes published data inconsistent.
6. `upsert_mock_error_reviews` checks the review owner but never validates that
   each `answerId` belongs to the review's attempt. A teacher can attach an
   unrelated answer to another review. Add an explicit same-attempt check.
7. SQL grading ignores `mock_template_questions.word_limit`; the TS domain
   rejects over-limit answers. Align both paths and test the case.
8. SQL taxonomy codes do not match `src/lib/mocks/catalog.ts`; align stable
   codes before the Supabase adapter/UI is written.

The static checker currently verifies object-name presence, not executable
security behavior. The pgTAP file contains only smoke tests; the role/RPC
matrix required by Task 2 is still missing. These are review findings, not
claims of a passed database test.
