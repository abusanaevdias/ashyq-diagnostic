/** Explicit, opt-in provider smoke check with invented fixtures and simulated teacher auth.
 * This does not verify Supabase configuration or exercise real learner records.
 */
import { JEV_SYNTHETIC_FIXTURES } from '../src/lib/jev/fixtures';
import { handleJevSyntheticRequest } from '../src/lib/jev/synthetic-server';

const ids = [
  'museum-contrast',
  'sunday-hours',
  'two-reasons',
  'extra-detail',
  'acceptable-answer',
  'instruction-in-answer',
] as const;
const requestedIds = process.argv.slice(2);
const selectedIds = requestedIds.length ? requestedIds : [...ids];
const teacherId = '11111111-1111-4111-8111-111111111111';

if (selectedIds.some((id) => !ids.includes(id as (typeof ids)[number]))) {
  console.error('Unknown synthetic fixture ID. Use one of the fixed Jev provider smoke IDs.');
  process.exit(1);
}

if (process.env.JEV_LIVE_SMOKE !== '1' || !process.env.ASHYQ_JEV_API_KEY) {
  console.error('Set JEV_LIVE_SMOKE=1 and ASHYQ_JEV_API_KEY to run the invented-fixture smoke check.');
  process.exit(1);
}

const env = {
  ASHYQ_JEV_SYNTHETIC_PILOT: '1',
  ASHYQ_JEV_PILOT_TEACHER_IDS: teacherId,
  ASHYQ_JEV_API_KEY: process.env.ASHYQ_JEV_API_KEY,
  ASHYQ_JEV_MODEL: process.env.ASHYQ_JEV_MODEL ?? 'jev-latest',
  ASHYQ_SUPABASE_SERVICE_ROLE_KEY: 'synthetic-only',
  NEXT_PUBLIC_AUTH_PROVIDER: 'supabase',
  NEXT_PUBLIC_SUPABASE_URL: 'https://supabase.invalid',
  NEXT_PUBLIC_SUPABASE_ANON_KEY: 'synthetic-only',
};

const fetchImpl: typeof fetch = async (input, init) => {
  const url = String(input);
  if (url.endsWith('/auth/v1/user')) return Response.json({ id: teacherId });
  if (url.includes('/rest/v1/profiles?')) return Response.json([{ role: 'teacher' }]);
  if (url.endsWith('/rest/v1/rpc/check_rate_limit')) return Response.json(true);
  if (url === 'https://api.typesafe.ai/v1/systemone') return fetch(input, init);
  throw new Error('Unexpected endpoint in synthetic smoke check');
};

async function main() {
  let failures = 0;
  for (const id of selectedIds) {
    const fixture = JEV_SYNTHETIC_FIXTURES.find((entry) => entry.id === id);
    if (!fixture) throw new Error(`Missing fixture: ${id}`);
    const request = new Request(`http://localhost/api/jev/synthetic?fixture=${id}`, {
      method: 'POST',
      headers: { Authorization: 'Bearer synthetic.teacher.token' },
    });
    const response = await handleJevSyntheticRequest(request, env, fetchImpl);
    const result = (await response.json()) as { code?: string; error?: string };
    const matchesIllustration = result.code === fixture.illustrativeLabel;
    if (!response.ok || !matchesIllustration) failures += 1;
    console.log(`${id}: HTTP ${response.status}; Jev=${result.code ?? result.error}; illustration=${fixture.illustrativeLabel}; match=${matchesIllustration}`);
  }
  console.log(`Jev synthetic live smoke: ${selectedIds.length - failures}/${selectedIds.length} match illustrative labels`);
  if (failures) process.exitCode = 1;
}

main().catch(() => {
  // Do not print provider responses, token, or request bodies.
  console.error('Jev synthetic live smoke stopped before completion.');
  process.exitCode = 1;
});
