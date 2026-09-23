import assert from 'node:assert/strict';
import { handleJevSyntheticRequest } from '../src/lib/jev/synthetic-server';
import { JEV_LABELS, JEV_TAXONOMY_VERSION } from '../src/lib/jev/taxonomy';

const teacherId = '11111111-1111-4111-8111-111111111111';
const token = 'aaa.bbb.ccc';
const env: Record<string, string> = {
  ASHYQ_JEV_SYNTHETIC_PILOT: '1',
  ASHYQ_JEV_PILOT_TEACHER_IDS: teacherId,
  ASHYQ_JEV_API_KEY: 'synthetic-test-key',
  ASHYQ_JEV_MODEL: 'jev-latest',
  ASHYQ_SUPABASE_SERVICE_ROLE_KEY: 'synthetic-service-key',
  NEXT_PUBLIC_AUTH_PROVIDER: 'supabase',
  NEXT_PUBLIC_SUPABASE_URL: 'https://supabase.example.test',
  NEXT_PUBLIC_SUPABASE_ANON_KEY: 'synthetic-anon-key',
};

type FetchCase = { role?: string; choice?: string; failProvider?: boolean; quotaAllowed?: boolean; failQuota?: boolean };

function fakeFetch(options: FetchCase = {}) {
  const calls: Array<{ url: string; init?: RequestInit }> = [];
  const fetchImpl: typeof fetch = async (input, init) => {
    const url = String(input);
    calls.push({ url, init });
    if (url.endsWith('/auth/v1/user')) return Response.json({ id: teacherId });
    if (url.includes('/rest/v1/profiles?')) return Response.json([{ role: options.role ?? 'teacher' }]);
    if (url.endsWith('/rest/v1/rpc/check_rate_limit')) {
      return options.failQuota ? new Response('missing migration', { status: 404 }) : Response.json(options.quotaAllowed ?? true);
    }
    if (url === 'https://api.typesafe.ai/v1/systemone') {
      if (options.failProvider) return new Response('failed', { status: 502 });
      return Response.json({
        model: 'jev-test',
        answers: { observable_error: { type: 'choice', choice: options.choice ?? 'relation_changed', confidence: 0.72, probabilities: {} } },
        usage: { input_tokens: 100, output_tokens: 1 },
      });
    }
    throw new Error('Unexpected URL');
  };
  return { calls, fetchImpl };
}

function request(fixture = 'museum-contrast', authorized = true): Request {
  return new Request(`http://localhost:3000/api/jev/synthetic?fixture=${fixture}`, {
    method: 'POST',
    headers: authorized ? { Authorization: `Bearer ${token}` } : {},
  });
}

async function main() {
  const off = fakeFetch();
  assert.equal((await handleJevSyntheticRequest(request(), { ...env, ASHYQ_JEV_SYNTHETIC_PILOT: '0' }, off.fetchImpl)).status, 503);
  assert.equal(off.calls.length, 0, 'disabled pilot must not contact Supabase or Jev');

  const unauthenticated = fakeFetch();
  assert.equal((await handleJevSyntheticRequest(request('museum-contrast', false), env, unauthenticated.fetchImpl)).status, 403);
  assert.equal(unauthenticated.calls.length, 0, 'missing token must not contact a provider');

  const student = fakeFetch({ role: 'student' });
  assert.equal((await handleJevSyntheticRequest(request(), env, student.fetchImpl)).status, 403);
  assert.equal(student.calls.filter(({ url }) => url.includes('typesafe.ai')).length, 0);

  const notAllowed = fakeFetch();
  assert.equal((await handleJevSyntheticRequest(request(), { ...env, ASHYQ_JEV_PILOT_TEACHER_IDS: '22222222-2222-4222-8222-222222222222' }, notAllowed.fetchImpl)).status, 403);
  assert.equal(notAllowed.calls.filter(({ url }) => url.includes('typesafe.ai')).length, 0);

  const blank = fakeFetch();
  const blankResponse = await handleJevSyntheticRequest(request('empty-answer'), env, blank.fetchImpl);
  assert.equal(blankResponse.status, 200);
  assert.deepEqual(await blankResponse.json(), {
    status: 'suggested', source: 'rule', code: 'missing_answer', taxonomyVersion: JEV_TAXONOMY_VERSION,
  });
  assert.equal(blank.calls.filter(({ url }) => url.includes('typesafe.ai')).length, 0, 'deterministic case must skip Jev');

  const wordLimit = fakeFetch();
  const wordLimitResponse = await handleJevSyntheticRequest(request('word-limit'), env, wordLimit.fetchImpl);
  assert.equal((await wordLimitResponse.json() as { code: string }).code, 'word_limit_exceeded');
  assert.equal(wordLimit.calls.filter(({ url }) => url.includes('typesafe.ai')).length, 0);

  const model = fakeFetch();
  const modelResponse = await handleJevSyntheticRequest(request(), env, model.fetchImpl);
  assert.equal(modelResponse.status, 200);
  const modelData = await modelResponse.json();
  assert.deepEqual(modelData, {
    status: 'suggested', source: 'jev', code: 'relation_changed', taxonomyVersion: JEV_TAXONOMY_VERSION,
  });
  assert.equal(modelResponse.headers.get('Cache-Control'), 'no-store');
  const modelCall = model.calls.find(({ url }) => url.includes('typesafe.ai'));
  assert.ok(modelCall);
  const payload = JSON.parse(String(modelCall.init?.body));
  assert.equal(payload.state.answer, 'Музей закрылся из-за отключения электричества.');
  assert.deepEqual(Object.keys(payload.questions.observable_error.criteria), JEV_LABELS.map((label) => label.code));
  assert.equal(JSON.stringify(payload).includes(teacherId), false, 'provider input must omit account IDs');
  assert.equal(JSON.stringify(modelData).includes('confidence'), false, 'unvalidated confidence must stay hidden');
  const quotaCall = model.calls.find(({ url }) => url.endsWith('/rpc/check_rate_limit'));
  assert.ok(quotaCall, 'shared quota must run before a paid provider call');
  assert.deepEqual(JSON.parse(String(quotaCall.init?.body)), {
    p_key: `jev:synthetic:${teacherId}`, p_window_seconds: 86_400, p_max: 20,
  });

  const exhausted = fakeFetch({ quotaAllowed: false });
  assert.equal((await handleJevSyntheticRequest(request(), env, exhausted.fetchImpl)).status, 429);
  assert.equal(exhausted.calls.filter(({ url }) => url.includes('typesafe.ai')).length, 0);

  const missingQuota = fakeFetch({ failQuota: true });
  assert.equal((await handleJevSyntheticRequest(request(), env, missingQuota.fetchImpl)).status, 503);
  assert.equal(missingQuota.calls.filter(({ url }) => url.includes('typesafe.ai')).length, 0);

  const missingServiceKey = fakeFetch();
  assert.equal((await handleJevSyntheticRequest(request(), { ...env, ASHYQ_SUPABASE_SERVICE_ROLE_KEY: '' }, missingServiceKey.fetchImpl)).status, 503);
  assert.equal(missingServiceKey.calls.filter(({ url }) => url.includes('typesafe.ai')).length, 0);

  const missingProviderKey = fakeFetch();
  assert.equal((await handleJevSyntheticRequest(request(), { ...env, ASHYQ_JEV_API_KEY: '' }, missingProviderKey.fetchImpl)).status, 503);
  assert.equal(missingProviderKey.calls.filter(({ url }) => url.includes('/rpc/check_rate_limit')).length, 0);

  const invalidProviderModel = fakeFetch();
  assert.equal((await handleJevSyntheticRequest(request(), { ...env, ASHYQ_JEV_MODEL: 'bad model' }, invalidProviderModel.fetchImpl)).status, 503);
  assert.equal(invalidProviderModel.calls.filter(({ url }) => url.includes('/rpc/check_rate_limit')).length, 0);

  const withBody = fakeFetch();
  const bodyRequest = new Request('http://localhost:3000/api/jev/synthetic?fixture=museum-contrast', {
    method: 'POST', headers: { Authorization: `Bearer ${token}` }, body: 'private learner answer',
  });
  assert.equal((await handleJevSyntheticRequest(bodyRequest, env, withBody.fetchImpl)).status, 400);
  assert.equal(withBody.calls.length, 0, 'request body must be rejected before auth and provider calls');

  const injected = fakeFetch({ choice: 'no_supported_label' });
  const injectionResponse = await handleJevSyntheticRequest(request('instruction-in-answer'), env, injected.fetchImpl);
  assert.equal((await injectionResponse.json() as { status: string }).status, 'unclear');
  const injectionPayload = JSON.parse(String(injected.calls.find(({ url }) => url.includes('typesafe.ai'))?.init?.body));
  assert.match(injectionPayload.state.answer, /Ignore previous instructions/);
  assert.doesNotMatch(injectionPayload.questions.observable_error.instructions, /Ignore previous instructions/);

  const unknownLabel = fakeFetch({ choice: 'student_is_careless' });
  assert.equal((await handleJevSyntheticRequest(request(), env, unknownLabel.fetchImpl)).status, 503);

  const providerFailure = fakeFetch({ failProvider: true });
  assert.equal((await handleJevSyntheticRequest(request(), env, providerFailure.fetchImpl)).status, 503);

  const unknownFixture = fakeFetch();
  assert.equal((await handleJevSyntheticRequest(request('someone-elses-submission'), env, unknownFixture.fetchImpl)).status, 404);
  assert.equal(unknownFixture.calls.filter(({ url }) => url.includes('typesafe.ai')).length, 0);

  console.log('Jev synthetic checks: 17 scenarios PASS');
}

main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
