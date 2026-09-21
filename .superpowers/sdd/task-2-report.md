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
