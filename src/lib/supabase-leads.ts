import 'server-only';
import type { CrmEvent, DeliveryLedgerEntry } from './crm';
import type { StoredLead } from './lead-server';
import { resolveLeadsStorage } from './env';

type Row<T> = { payload: T };

// Выбор хранилища — один на весь сервер: /api/health и запись заявок не могут разойтись (LEADS-VERCEL-001)
function config(): { url: string; key: string } | null {
  const storage = resolveLeadsStorage(process.env);
  if (storage.provider !== 'supabase') return null;
  const { url, key } = storage;
  if (!url || !key) throw new Error('Supabase lead storage requires a URL and a service role key (ASHYQ_SUPABASE_* or the Vercel integration SUPABASE_*)');
  if (!url.startsWith('https://') && !/^http:\/\/(127\.0\.0\.1|localhost)(:\d+)?$/.test(url)) {
    throw new Error('Supabase URL must use HTTPS outside localhost');
  }
  return { url, key };
}

export function usesSupabaseLeads(): boolean {
  return resolveLeadsStorage(process.env).provider === 'supabase';
}

async function rest<T>(path: string, init?: RequestInit): Promise<T> {
  const active = config();
  if (!active) throw new Error('Supabase lead provider is disabled');
  const response = await fetch(`${active.url}/rest/v1/${path}`, {
    ...init,
    headers: {
      apikey: active.key,
      Authorization: `Bearer ${active.key}`,
      'Content-Type': 'application/json',
      ...(init?.headers ?? {}),
    },
    signal: AbortSignal.timeout(10_000),
    cache: 'no-store',
  });
  if (!response.ok) throw new Error(`Supabase REST ${response.status}`);
  const body = await response.text();
  return body ? JSON.parse(body) as T : undefined as T;
}

/**
 * Общий лимит частоты через RPC check_rate_limit (LEAD-RATELIMIT-001): один счётчик
 * на все инстансы Vercel. true — в пределах лимита. Fail-open: при недоступности
 * базы пропускаем — потерять клиента хуже, чем пропустить немного спама.
 */
export async function checkSupabaseRateLimit(key: string, windowSeconds: number, max: number): Promise<boolean> {
  if (!config()) return true;
  try {
    const allowed = await rest<boolean>('rpc/check_rate_limit', {
      method: 'POST',
      body: JSON.stringify({ p_key: key, p_window_seconds: windowSeconds, p_max: max }),
    });
    return allowed !== false;
  } catch {
    return true;
  }
}

/**
 * PostgREST отдаёт не больше 1000 строк за запрос (max-rows): без постраничного чтения
 * CRM видела только первые 1000 записей по возрастанию даты — новые лиды пропадали.
 */
async function readAllPayloads<T>(query: string): Promise<T[]> {
  const out: T[] = [];
  for (let offset = 0; ; offset += PAGE) {
    const rows = await rest<Array<Row<T>>>(`${query}&limit=${PAGE}&offset=${offset}`);
    out.push(...rows.map((row) => row.payload));
    if (rows.length < PAGE) return out;
  }
}
const PAGE = 1000;

export async function appendSupabaseLead(lead: StoredLead): Promise<void> {
  await rest('crm_leads', { method: 'POST', headers: { Prefer: 'return=minimal' }, body: JSON.stringify({
    run_id: lead.runId, dedupe_key: lead.dedupeKey, kind: lead.kind, exam: lead.exam,
    payload: lead, received_at: lead.receivedAt,
  }) });
}

export async function readSupabaseLeads(): Promise<StoredLead[]> {
  return readAllPayloads<StoredLead>('crm_leads?select=payload&order=received_at.asc,id.asc');
}

export async function findSupabaseDuplicate(lead: StoredLead, cutoff: string): Promise<boolean> {
  const key = encodeURIComponent(lead.dedupeKey ?? '');
  const since = encodeURIComponent(cutoff);
  const rows = await rest<Array<{ id: string }>>(`crm_leads?select=id&dedupe_key=eq.${key}&received_at=gte.${since}&limit=1`);
  return rows.length > 0;
}

export async function readSupabaseEvents(): Promise<CrmEvent[]> {
  return readAllPayloads<CrmEvent>('crm_events?select=payload&order=created_at.asc,id.asc');
}

export async function appendSupabaseEvents(events: CrmEvent[]): Promise<void> {
  await rest('crm_events', { method: 'POST', headers: { Prefer: 'return=minimal' }, body: JSON.stringify(events.map((event) => ({
    id: event.id, run_id: event.runId, payload: event, created_at: event.createdAt,
  }))) });
}

export async function readSupabaseDeliveries(): Promise<DeliveryLedgerEntry[]> {
  return readAllPayloads<DeliveryLedgerEntry>('crm_delivery_entries?select=payload&order=updated_at.asc,id.asc');
}

export async function appendSupabaseDelivery(entry: DeliveryLedgerEntry): Promise<void> {
  await rest('crm_delivery_entries', { method: 'POST', headers: { Prefer: 'return=minimal' }, body: JSON.stringify({
    id: entry.id, run_id: entry.runId, dedupe_key: entry.key, channel: entry.channel,
    payload: entry, updated_at: entry.updatedAt,
  }) });
}
