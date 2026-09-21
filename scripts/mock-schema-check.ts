import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const migration = readFileSync(join(process.cwd(), 'supabase/migrations/20260921000100_mock_tests.sql'), 'utf8').toLowerCase();
const requiredTables = ['mock_templates','mock_template_versions','mock_template_questions','mock_band_scales','mock_band_scale_entries','mock_question_types','mock_skills','mock_causes','mock_action_templates','mock_assignments','mock_accommodations','mock_attempts','mock_answers','mock_review_versions','mock_error_reviews','mock_action_items','mock_audit_events'];
const requiredRpcs = ['create_mock_assignment','publish_mock_assignment','set_mock_accommodation','start_mock_attempt','save_mock_answers','submit_mock_attempt','begin_mock_review','upsert_mock_error_reviews','override_mock_answer','publish_mock_review','reopen_mock_attempt','get_mock_result','complete_mock_action','finalize_expired_mock_attempts','admin_import_mock_template'];
const failures: string[] = [];
for (const table of requiredTables) {
  if (!migration.includes(`create table if not exists public.${table}`)) failures.push(`missing table ${table}`);
  if (!migration.includes(`alter table public.${table} enable row level security`)) failures.push(`RLS missing for ${table}`);
}
for (const rpc of requiredRpcs) {
  if (!migration.includes(`function public.${rpc}`)) failures.push(`missing RPC ${rpc}`);
}
for (const privateTable of ['private.mock_answer_keys', 'private.mock_answer_evaluations']) {
  if (!migration.includes(`create table if not exists ${privateTable}`)) failures.push(`missing private table ${privateTable}`);
}
if (!migration.includes('revoke all on private.mock_answer_keys, private.mock_answer_evaluations')) failures.push('missing private-table revoke');
if ((migration.match(/security definer set search_path = ''/g) ?? []).length < requiredRpcs.length) failures.push('all RPCs must be SECURITY DEFINER with empty search_path');
for (const fragment of ['revoke all on function public.create_mock_assignment','public.start_mock_attempt(uuid)','enforce_no_generic_mock_submission','not exists (select 1 from public.mock_assignments ma']) {
  if (!migration.includes(fragment)) failures.push(`missing security invariant: ${fragment}`);
}
if (/insert\s+into\s+private\.mock_answer_keys/i.test(migration)) failures.push('migration must not seed answer keys');
if (failures.length) { console.error(`Mock schema check failed:\n- ${failures.join('\n- ')}`); process.exit(1); }
console.log(`Mock schema check PASS: ${requiredTables.length} tables, ${requiredRpcs.length} RPCs, RLS/private-key invariants.`);
