import { appendFile, mkdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { computeDedupeKey } from './crm';
import { maybeBackupLeads } from './lead-delivery';
import {
  appendSupabaseLead,
  findSupabaseDuplicate,
  readSupabaseLeads,
  usesSupabaseLeads,
} from './supabase-leads';

/**
 * Серверная сторона лида: хранение + идемпотентность.
 *
 * Работает без единой настройки (пишет в .data/leads.jsonl). Запись идёт
 * ДО любой доставки — сбой Telegram/webhook не теряет заявку (LEADS-DURABILITY-001).
 * Доставка и её outbox-ledger живут в ./lead-delivery.
 */

export interface StoredLead {
  kind: 'result' | 'contact' | 'whatsapp' | 'season';
  exam: 'sat' | 'ielts';
  runId: string;
  name?: string;
  phone?: string;
  grade?: string;
  target?: string;
  plannedWhen?: string;
  band?: string;
  level?: string;
  correct?: number;
  total?: number;
  strongest?: string;
  weakest?: string;
  elapsedMin?: number;
  utm?: Record<string, string>;
  receivedAt: string;
  ip: string;
  /** Заполняется сервером для идемпотентности повторной отправки. */
  dedupeKey?: string;
}

const LEADS_DIR = process.env.ASHYQ_LEADS_DIR ?? path.join(process.cwd(), '.data');
const LEADS_FILE = path.join(LEADS_DIR, 'leads.jsonl');

const DEDUPE_WINDOW_MS = 24 * 60 * 60_000;

export { computeDedupeKey };

export async function readStoredLeads(): Promise<StoredLead[]> {
  if (usesSupabaseLeads()) return readSupabaseLeads();

  try {
    const raw = await readFile(LEADS_FILE, 'utf8');
    const result: StoredLead[] = [];
    for (const line of raw.split('\n').filter(Boolean)) {
      try {
        result.push(JSON.parse(line) as StoredLead);
      } catch {
        // Одна повреждённая строка не блокирует остальные записи.
      }
    }
    return result;
  } catch {
    return [];
  }
}

/**
 * JSONL, а не JSON-массив: дозапись одной строкой атомарна и не портит файл,
 * если два запроса пришли одновременно.
 */
export async function appendLead(lead: StoredLead): Promise<void> {
  if (usesSupabaseLeads()) {
    await appendSupabaseLead(lead);
    return;
  }

  try {
    await mkdir(LEADS_DIR, { recursive: true });
    await appendFile(LEADS_FILE, `${JSON.stringify(lead)}\n`, 'utf8');
    // Ежедневная копия — best-effort, не задерживает и не ломает приём.
    void maybeBackupLeads(LEADS_FILE);
  } catch {
    // read-only FS (serverless) — тогда единственный канал это deliverLead
  }
}

/** Повторная отправка идемпотентна: тот же ключ в пределах окна — это дубль. */
export async function findRecentDuplicate(lead: StoredLead): Promise<boolean> {
  const cutoff = Date.now() - DEDUPE_WINDOW_MS;
  if (usesSupabaseLeads()) {
    return findSupabaseDuplicate(lead, new Date(cutoff).toISOString());
  }

  let raw: string;
  try {
    raw = await readFile(LEADS_FILE, 'utf8');
  } catch {
    return false;
  }
  for (const line of raw.split('\n')) {
    if (!line.includes(lead.dedupeKey ?? '')) continue;
    try {
      const parsed = JSON.parse(line) as StoredLead;
      if (parsed.dedupeKey !== lead.dedupeKey) continue;
      if (Date.parse(parsed.receivedAt) >= cutoff) return true;
    } catch {
      // повреждённая строка не считается дублем
    }
  }
  return false;
}
