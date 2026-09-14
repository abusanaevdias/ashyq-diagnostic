import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const root = process.cwd();
const migration = readFileSync(
  join(root, 'supabase', 'migrations', '20260914000100_foundation.sql'),
  'utf8',
).toLowerCase();
const seed = readFileSync(join(root, 'supabase', 'seed.sql'), 'utf8').toLowerCase();

const tables = [
  'profiles', 'classes', 'class_members', 'lessons', 'assignments',
  'submissions', 'submission_comments', 'blog_posts', 'seasons',
  'season_participants', 'season_teams', 'season_team_members', 'match_days',
  'match_submissions', 'season_point_entries',
];

const failures: string[] = [];
for (const table of tables) {
  if (!migration.includes(`create table if not exists public.${table}`)) {
    failures.push(`missing table ${table}`);
  }
  if (!migration.includes(`alter table public.${table} enable row level security`)) {
    failures.push(`RLS not enabled for ${table}`);
  }
}

const requiredFragments = [
  'set search_path = \'\'',
  'revoke all on public.profiles, public.classes',
  'revoke all on function public.grade_submission',
  'revoke all on function public.review_match_submission',
  'create trigger enforce_weekly_cap',
  'create trigger enforce_team_member',
  'create trigger enforce_team_record',
  'create trigger enforce_match_submission',
  'pg_advisory_xact_lock',
  'create policy blog_public_read',
  'create policy match_submissions_create',
  'create or replace function public.season_leaderboard',
  'grant insert (match_day_id, team_id, answer, submitted_by, submitted_at)',
];
for (const fragment of requiredFragments) {
  if (!migration.includes(fragment)) failures.push(`missing security invariant: ${fragment}`);
}

if (/raw_user_meta_data\s*->>\s*'role'/.test(migration)) {
  failures.push('signup trigger must never trust role from user metadata');
}
if (/grant\s+all\s+on\s+(table|all tables)/.test(migration)) {
  failures.push('broad GRANT ALL found');
}
if (/revoke\s+all\s+on\s+all\s+(tables|functions)\s+in\s+schema/.test(migration)) {
  failures.push('schema-wide revoke found; foundation must not change unrelated objects');
}
if (/\b(insert|update|delete)\s+into\b/.test(seed) || /@/.test(seed)) {
  failures.push('seed must remain data-free until synthetic identities are approved');
}

if (failures.length > 0) {
  console.error(`Supabase schema check failed:\n- ${failures.join('\n- ')}`);
  process.exit(1);
}

console.log(`Supabase schema check PASS: ${tables.length} tables, RLS and privilege invariants present.`);
