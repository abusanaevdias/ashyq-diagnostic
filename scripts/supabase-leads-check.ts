import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const root = process.cwd();
const migration = readFileSync(
  join(root, 'supabase', 'migrations', '20260914000200_crm_leads.sql'),
  'utf8',
).toLowerCase();
const adapter = readFileSync(join(root, 'src', 'lib', 'supabase-leads.ts'), 'utf8');
const failures: string[] = [];

for (const table of ['crm_leads', 'crm_events', 'crm_delivery_entries']) {
  if (!migration.includes(`create table if not exists public.${table}`)) {
    failures.push(`missing table ${table}`);
  }
  if (!migration.includes(`alter table public.${table} enable row level security`)) {
    failures.push(`RLS not enabled for ${table}`);
  }
}

for (const fragment of [
  'revoke all on public.crm_leads, public.crm_events, public.crm_delivery_entries from public, anon, authenticated',
  'grant select, insert on public.crm_leads, public.crm_events, public.crm_delivery_entries to service_role',
]) {
  if (!migration.includes(fragment)) failures.push(`missing privilege invariant: ${fragment}`);
}

if (!adapter.startsWith("import 'server-only';")) failures.push('adapter must be server-only');
if (!adapter.includes("ASHYQ_LEADS_PROVIDER !== 'supabase'")) failures.push('adapter must be opt-in');
if (!adapter.includes('ASHYQ_SUPABASE_SERVICE_ROLE_KEY')) failures.push('service-role configuration missing');
if (/NEXT_PUBLIC_/i.test(adapter)) failures.push('server credentials must never use NEXT_PUBLIC variables');
if (!adapter.includes("cache: 'no-store'")) failures.push('REST reads must disable caching');

if (failures.length > 0) {
  console.error(`Supabase leads check failed:\n- ${failures.join('\n- ')}`);
  process.exit(1);
}

console.log('Supabase leads check PASS: opt-in server adapter, 3 RLS tables, restricted grants.');
