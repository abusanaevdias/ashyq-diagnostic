import 'server-only';
import { appendFile, mkdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { readStoredLeads } from './lead-server';
import { buildCrmSnapshot, enrolledText, type CrmEvent, type CrmSnapshot } from './crm';
import { readDeliveryLedger, retryFailedDeliveries, sendTelegramText } from './lead-delivery';
import { crmLink } from './telegram-bot';
import {
  appendSupabaseEvents,
  readSupabaseEvents,
  usesSupabaseLeads,
} from './supabase-leads';

function dataFile(name: string): string {
  const directory = process.env.ASHYQ_LEADS_DIR ?? path.join(process.cwd(), '.data');
  return path.join(/* turbopackIgnore: true */ directory, name);
}

async function readJsonLines<T>(file: string): Promise<T[]> {
  try {
    const raw = await readFile(file, 'utf8');
    const result: T[] = [];
    for (const line of raw.split('\n').filter(Boolean)) {
      try {
        result.push(JSON.parse(line) as T);
      } catch {
        // Одна повреждённая строка не блокирует остальные записи.
      }
    }
    return result;
  } catch {
    return [];
  }
}

export async function readCrmSnapshot(): Promise<CrmSnapshot> {
  const [leads, events] = await Promise.all([
    readStoredLeads(),
    usesSupabaseLeads()
      ? readSupabaseEvents()
      : readJsonLines<CrmEvent>(dataFile('crm-events.jsonl')),
  ]);

  // Автоматический повтор неудачных доставок (по политике isRetryDue):
  // оператор открывает CRM — застрявшие заявки получают ещё одну попытку.
  try {
    await retryFailedDeliveries('*', leads);
  } catch {
    // retry не должен ломать чтение снапшота
  }

  const deliveries = await readDeliveryLedger();
  return buildCrmSnapshot(leads, events, deliveries);
}

/** Ручной повтор из CRM (кнопка «Повторить доставку»): бьёт сразу, без backoff. */
export async function retryRunDeliveries(runId: string): Promise<void> {
  const leads = await readStoredLeads();
  await retryFailedDeliveries(runId, leads, { force: true });
}

export async function appendCrmEvents(events: CrmEvent[]): Promise<void> {
  if (events.length === 0) return;
  // Все смены этапа (CRM на сайте и кнопки в Telegram) идут сюда — одна точка для уведомления
  const enrolledIds = new Set(events.filter((event) => event.type === 'stage_change' && event.stage === 'enrolled').map((event) => event.runId));
  const before = enrolledIds.size > 0 ? await readCrmSnapshot() : null;
  await writeCrmEvents(events);
  if (!before) return;

  const after = await readCrmSnapshot();
  for (const record of after.records) {
    if (!enrolledIds.has(record.runId)) continue;
    // повторное нажатие «Зачислен» у уже зачисленного — не праздник второй раз
    if (before.records.find((item) => item.runId === record.runId)?.stage === 'enrolled') continue;
    const url = crmLink(record.runId);
    try {
      await sendTelegramText(enrolledText(record), url ? { inline_keyboard: [[{ text: 'Открыть в CRM', url }]] } : undefined);
    } catch {
      // уведомление не должно откатывать смену этапа
    }
  }
}

async function writeCrmEvents(events: CrmEvent[]): Promise<void> {
  if (usesSupabaseLeads()) {
    await appendSupabaseEvents(events);
    return;
  }
  const file = dataFile('crm-events.jsonl');
  await mkdir(path.dirname(file), { recursive: true });
  await appendFile(file, `${events.map((event) => JSON.stringify(event)).join('\n')}\n`, 'utf8');
}
