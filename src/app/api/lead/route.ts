import { NextResponse } from 'next/server';
import { appendLead, deliverLead, type StoredLead } from '@/lib/lead-server';
import { normalizePhone, toInternationalKz } from '@/lib/lead';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Приём лида с экрана результата.
 *
 * Публичный незащищённый endpoint, поэтому вход обрезается жёстко:
 * лимит размера тела, whitelist полей, потолок длины каждой строки
 * и rate limit по IP. Ответ никогда не возвращает сохранённые данные.
 */

const MAX_BODY_BYTES = 4_000;
const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX = 12;
/**
 * Глобальный потолок. Лимит по IP опирается на x-forwarded-for, который
 * клиент может подделать, если приложение стоит без доверенного прокси —
 * тогда единственной защитой от флуда остаётся этот общий счётчик.
 */
const GLOBAL_LIMIT_PER_MIN = 120;

const hits = new Map<string, number[]>();
let globalHits: number[] = [];

function clientIp(req: Request): string {
  const fwd = req.headers.get('x-forwarded-for');
  if (fwd) return fwd.split(',')[0].trim();
  return req.headers.get('x-real-ip') ?? 'unknown';
}

function rateLimited(ip: string): boolean {
  const now = Date.now();
  const recent = (hits.get(ip) ?? []).filter((t) => now - t < RATE_LIMIT_WINDOW_MS);
  recent.push(now);
  hits.set(ip, recent);

  // не даём Map расти бесконечно на долгоживущем процессе
  if (hits.size > 5_000) {
    for (const [key, times] of hits) {
      if (times.every((t) => now - t >= RATE_LIMIT_WINDOW_MS)) hits.delete(key);
    }
  }

  return recent.length > RATE_LIMIT_MAX;
}

function globallyFlooded(): boolean {
  const now = Date.now();
  globalHits = globalHits.filter((t) => now - t < RATE_LIMIT_WINDOW_MS);
  globalHits.push(now);
  return globalHits.length > GLOBAL_LIMIT_PER_MIN;
}

function str(value: unknown, max: number): string | undefined {
  if (typeof value !== 'string') return undefined;
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  return trimmed.slice(0, max);
}

function num(value: unknown): number | undefined {
  if (typeof value !== 'number' || !Number.isFinite(value)) return undefined;
  return Math.round(value);
}

function parseUtm(value: unknown): Record<string, string> | undefined {
  if (!value || typeof value !== 'object') return undefined;
  const src = value as Record<string, unknown>;
  const out: Record<string, string> = {};
  for (const key of ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term']) {
    const v = str(src[key], 120);
    if (v) out[key] = v;
  }
  return Object.keys(out).length > 0 ? out : undefined;
}

export async function POST(req: Request) {
  const ip = clientIp(req);
  if (globallyFlooded() || rateLimited(ip)) {
    return NextResponse.json({ ok: false }, { status: 429 });
  }

  const raw = await req.text();
  if (raw.length > MAX_BODY_BYTES) {
    return NextResponse.json({ ok: false }, { status: 413 });
  }

  let body: Record<string, unknown>;
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) throw new Error('bad shape');
    body = parsed as Record<string, unknown>;
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  const kind = body.kind;
  if (kind !== 'result' && kind !== 'contact' && kind !== 'whatsapp') {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  const exam = body.exam;
  if (exam !== 'sat' && exam !== 'ielts') {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  const phoneRaw = str(body.phone, 32);
  const phoneDigits = phoneRaw ? toInternationalKz(normalizePhone(phoneRaw)) : undefined;
  if (phoneDigits && (phoneDigits.length < 10 || phoneDigits.length > 15)) {
    return NextResponse.json({ ok: false, error: 'phone' }, { status: 400 });
  }

  // контактный лид без единого способа связи бессмысленен
  if (kind === 'contact' && !phoneDigits) {
    return NextResponse.json({ ok: false, error: 'phone' }, { status: 400 });
  }

  const lead: StoredLead = {
    kind,
    exam,
    runId: str(body.runId, 64) ?? 'unknown',
    name: str(body.name, 80),
    phone: phoneDigits,
    grade: str(body.grade, 24),
    target: str(body.target, 24),
    plannedWhen: str(body.plannedWhen, 24),
    band: str(body.band, 32),
    level: str(body.level, 32),
    correct: num(body.correct),
    total: num(body.total),
    strongest: str(body.strongest, 80),
    weakest: str(body.weakest, 80),
    elapsedMin: num(body.elapsedMin),
    utm: parseUtm(body.utm),
    receivedAt: new Date().toISOString(),
    ip,
  };

  await appendLead(lead);
  // доставка в Telegram/вебхук не должна задерживать ответ ученику
  void deliverLead(lead);

  return NextResponse.json({ ok: true });
}
