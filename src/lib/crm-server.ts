import 'server-only';
import { appendFile, mkdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { readStoredLeads } from './lead-server';
import { buildCrmSnapshot, type CrmEvent, type CrmSnapshot } from './crm';
import { readDeliveryLedger, retryFailedDeliveries } from './lead-delivery';
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
  if (usesSupabaseLeads()) {
    await appendSupabaseEvents(events);
    return;
  }
  const file = dataFile('crm-events.jsonl');
  await mkdir(path.dirname(file), { recursive: true });
  await appendFile(file, `${events.map((event) => JSON.stringify(event)).join('\n')}\n`, 'utf8');
}
