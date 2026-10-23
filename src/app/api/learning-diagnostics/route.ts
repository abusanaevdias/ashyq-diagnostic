import { NextResponse } from 'next/server';
import { freezeDiagnostic, isDiagnosticSnapshot } from '@/lib/diagnostic-profile/model';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
const reply = (body: unknown, status = 200) => NextResponse.json(body, { status, headers: { 'Cache-Control': 'private, no-store', Vary: 'Authorization' } });

async function context(request: Request) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, '');
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (process.env.DIAGNOSTIC_PROFILE_ENABLED !== 'true' || !url || !key) return { error: reply({ error: 'Сохранение диагностики в облачном профиле ещё не подключено. Ответы остаются в этом браузере; перенос можно повторить позже.' }, 503) };
  const authorization = request.headers.get('authorization') ?? '';
  if (!/^Bearer [A-Za-z0-9_.-]+$/.test(authorization) || authorization.length > 10000) return { error: reply({ error: 'Войди в аккаунт, чтобы открыть свои результаты.' }, 401) };
  const headers = { apikey: key, Authorization: authorization, 'Content-Type': 'application/json' };
  const auth = await fetch(`${url}/auth/v1/user`, { headers, cache: 'no-store', signal: AbortSignal.timeout(10000) });
  if (!auth.ok) return { error: reply({ error: 'Сессия истекла. Войди снова.' }, 401) };
  const user: unknown = await auth.json();
  if (!user || typeof user !== 'object' || !('id' in user) || typeof user.id !== 'string') return { error: reply({ error: 'Не удалось проверить аккаунт.' }, 401) };
  // The adapter can briefly lag the raw token during an account change. The
  // expectation never authorizes access; it only prevents a confirmed A action
  // from executing with a freshly switched B JWT.
  if (request.headers.get('x-expected-actor') !== user.id) return { error: reply({ error: 'Аккаунт изменился. Открой профиль заново и подтверди действие.' }, 409) };
  return { url, headers, owner: user.id };
}

async function body(request: Request): Promise<unknown> {
  if (!request.headers.get('content-type')?.startsWith('application/json')) throw new Error('Нужен JSON.');
  // Bound chunked bodies too; do not trust Content-Length.
  const reader = request.body?.getReader();
  if (!reader) throw new Error('Нет данных.');
  let length = 0;
  const chunks: Uint8Array[] = [];
  while (true) {
    const next = await reader.read();
    if (next.done) break;
    length += next.value.byteLength;
    if (length > 20000) { await reader.cancel(); throw new Error('Слишком много данных.'); }
    chunks.push(next.value);
  }
  return JSON.parse(Buffer.concat(chunks).toString('utf8'));
}

async function handle(request: Request, method: 'GET' | 'POST' | 'DELETE') {
  try {
    const ctx = await context(request);
    if (ctx.error) return ctx.error;
    const endpoint = `${ctx.url}/rest/v1/diagnostic_snapshots`;
    const fetchDb = (url: string, init?: RequestInit) => fetch(url, { ...init, headers: { ...ctx.headers, ...init?.headers }, cache: 'no-store', signal: AbortSignal.timeout(10000) });
    if (method === 'GET') {
      const response = await fetchDb(`${endpoint}?select=snapshot&order=finished_at.desc&limit=50`);
      if (!response.ok) return reply({ error: 'Не удалось загрузить облачные результаты. Попробуй позже.' }, 503);
      const rows = await response.json() as { snapshot: unknown }[];
      if (!rows.every(row => isDiagnosticSnapshot(row.snapshot))) return reply({ error: 'Не удалось прочитать формат сохранений.' }, 503);
      return reply(rows.map(row => row.snapshot));
    }
    const input = await body(request);
    if (method === 'DELETE') {
      const runId = input && typeof input === 'object' && 'runId' in input ? input.runId : null;
      if (typeof runId !== 'string' || !/^[a-z0-9-]{12,90}$/i.test(runId)) return reply({ error: 'Неверная попытка.' }, 400);
      const response = await fetchDb(`${endpoint}?run_id=eq.${encodeURIComponent(runId)}`, { method: 'DELETE' });
      return response.ok ? reply({ deleted: true }) : reply({ error: 'Не удалось удалить результат. Попробуй позже.' }, 503);
    }
    let snapshot;
    try { snapshot = freezeDiagnostic(input); }
    catch (error) { return reply({ error: error instanceof Error ? error.message : 'Неверные данные.' }, 400); }
    // No upsert: a completed baseline must never be overwritten.
    const response = await fetchDb(endpoint, { method: 'POST', headers: { Prefer: 'return=minimal' }, body: JSON.stringify({ run_id: snapshot.runId, owner_id: ctx.owner, finished_at: new Date(snapshot.finishedAt).toISOString(), snapshot }) });
    if (response.ok) return reply({ saved: true });
    if (response.status === 409) {
      // RLS returns nothing for another owner: same generic conflict, no disclosure.
      const existing = await fetchDb(`${endpoint}?run_id=eq.${encodeURIComponent(snapshot.runId)}&select=snapshot`);
      if (existing.ok) {
        const rows = await existing.json() as { snapshot: unknown }[];
        // JSONB property ordering is not stable; compare semantic JSON objects.
        const stable = (value: unknown): string => JSON.stringify(value, (_key, v) => v && typeof v === 'object' && !Array.isArray(v) ? Object.fromEntries(Object.entries(v).sort(([a], [b]) => a.localeCompare(b))) : v);
        if (rows.length === 1 && stable(rows[0].snapshot) === stable(snapshot)) return reply({ saved: true });
      }
      return reply({ error: 'Эта попытка недоступна для сохранения или уже сохранена с другим содержимым. Исходный результат не заменён.' }, 409);
    }
    return reply({ error: 'Облако не подтвердило сохранение. Ответы остались в браузере; повтори действие позже.' }, 503);
  } catch {
    return reply({ error: 'Запрос не завершён. Сохранение можно безопасно повторить.' }, 503);
  }
}
export const GET = (request: Request) => handle(request, 'GET');
export const POST = (request: Request) => handle(request, 'POST');
export const DELETE = (request: Request) => handle(request, 'DELETE');
