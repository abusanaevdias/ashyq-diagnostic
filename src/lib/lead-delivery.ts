import 'server-only';
import { appendFile, copyFile, mkdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import type { StoredLead } from './lead-server';
import {
  computeDedupeKey,
  isRetryDue,
  type DeliveryChannel,
  type DeliveryLedgerEntry,
} from './crm';
import {
  appendSupabaseDelivery,
  readSupabaseDeliveries,
  usesSupabaseLeads,
} from './supabase-leads';
import { leadKeyboard } from './telegram-bot';

/**
 * Надёжная доставка лида (LEADS-DURABILITY-001).
 *
 * Лид всегда сначала пишется в хранилище, поэтому сбой Telegram/webhook
 * не теряет заявку. Каждая попытка фиксируется в outbox-ledger
 * (`.data/lead-deliveries.jsonl`, append-only): по паре key+channel
 * актуальна последняя запись. Неудачные доставки ретраятся автоматически
 * при чтении CRM-снапшота (политика isRetryDue) и вручную из CRM.
 */

function dataFile(name: string): string {
  const directory = process.env.ASHYQ_LEADS_DIR ?? path.join(process.cwd(), '.data');
  return path.join(/* turbopackIgnore: true */ directory, name);
}

const DELIVERIES_FILE = dataFile('lead-deliveries.jsonl');
const FETCH_TIMEOUT_MS = 10_000;
const BACKUP_INTERVAL_MS = 24 * 60 * 60_000;
const BACKUP_KEEP = 14;

export async function readDeliveryLedger(): Promise<DeliveryLedgerEntry[]> {
  if (usesSupabaseLeads()) return readSupabaseDeliveries();

  try {
    const raw = await readFile(DELIVERIES_FILE, 'utf8');
    const result: DeliveryLedgerEntry[] = [];
    for (const line of raw.split('\n').filter(Boolean)) {
      try {
        result.push(JSON.parse(line) as DeliveryLedgerEntry);
      } catch {
        // повреждённая строка не блокирует остальные записи
      }
    }
    return result;
  } catch {
    return [];
  }
}

async function appendDeliveryEntry(entry: DeliveryLedgerEntry): Promise<void> {
  try {
    if (usesSupabaseLeads()) {
      await appendSupabaseDelivery(entry);
      return;
    }
    await mkdir(path.dirname(DELIVERIES_FILE), { recursive: true });
    await appendFile(DELIVERIES_FILE, `${JSON.stringify(entry)}\n`, 'utf8');
  } catch {
    // read-only FS — приложение продолжает работать без ledger
  }
}

function examLabel(exam: StoredLead['exam']): string {
  return exam === 'sat' ? 'SAT' : 'IELTS';
}

export function leadToText(lead: StoredLead): string {
  const lines: string[] = [];

  lines.push(
    lead.kind === 'season'
      ? `🔴 ЗАЯВКА НА СЕЗОН · ${examLabel(lead.exam)}`
      : lead.kind === 'contact'
      ? `🔴 НОВОЕ ОБРАЩЕНИЕ · ${examLabel(lead.exam)}`
      : lead.kind === 'whatsapp'
        ? `🟡 Ушёл в WhatsApp · ${examLabel(lead.exam)}`
        : `⚪️ Прошёл диагностику · ${examLabel(lead.exam)}`,
  );

  if (lead.name) lines.push(`Имя: ${lead.name}`);
  if (lead.phone) lines.push(`Телефон: +${lead.phone}`);
  if (lead.grade) lines.push(`Класс: ${lead.grade}`);

  if (lead.band) lines.push(`Результат: ${lead.band}`);
  if (lead.correct !== undefined && lead.total !== undefined) {
    lines.push(`Верно: ${lead.correct}/${lead.total}`);
  }
  if (lead.target) lines.push(`Цель: ${lead.target}`);
  if (lead.plannedWhen) lines.push(`Сдаёт: ${lead.plannedWhen}`);
  if (lead.weakest) lines.push(`Слабее всего: ${lead.weakest}`);
  if (lead.elapsedMin !== undefined) lines.push(`Время: ${lead.elapsedMin} мин`);

  if (lead.utm?.utm_campaign) lines.push(`Кампания: ${lead.utm.utm_campaign}`);
  if (lead.utm?.utm_source) lines.push(`Источник: ${lead.utm.utm_source}`);

  if (lead.phone) {
    lines.push('');
    lines.push(`Написать: https://wa.me/${lead.phone}`);
  }

  return lines.join('\n');
}

async function sendToTelegram(lead: StoredLead): Promise<void> {
  // этапы и «Открыть в CRM»; кривая настройка даёт сообщение без кнопок, а не HTTP 400
  await sendTelegramText(leadToText(lead), leadKeyboard(lead.runId));
}

/** Сообщение в чат заявок (и тему форума, если задана). Без настроек — ничего не делает. */
export async function sendTelegramText(text: string, replyMarkup?: unknown): Promise<void> {
  const token = process.env.ASHYQ_TELEGRAM_BOT_TOKEN;
  const chatId = process.env.ASHYQ_TELEGRAM_CHAT_ID;
  if (!token || !chatId) return;

  const response = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: chatId,
      // тема супергруппы-форума; без неё сообщение уходит в General
      message_thread_id: process.env.ASHYQ_TELEGRAM_THREAD_ID ? Number(process.env.ASHYQ_TELEGRAM_THREAD_ID) : undefined,
      text,
      disable_web_page_preview: true,
      reply_markup: replyMarkup,
    }),
    signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
  });
  if (!response.ok) throw new Error(`telegram HTTP ${response.status}`);
}

async function sendToWebhook(lead: StoredLead): Promise<void> {
  const url = process.env.ASHYQ_LEAD_WEBHOOK_URL;
  if (!url) return;
  // операторская настройка, но https обязателен: телефон не должен идти открытым текстом
  if (!url.startsWith('https://')) return;

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...lead, text: leadToText(lead) }),
    signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
  });
  if (!response.ok) throw new Error(`webhook HTTP ${response.status}`);
}

async function attemptChannel(channel: DeliveryChannel, lead: StoredLead): Promise<void> {
  if (channel === 'telegram') await sendToTelegram(lead);
  else await sendToWebhook(lead);
}

/** Канал без настроек не участвует в доставке и не попадает в ledger. */
function channelConfigured(channel: DeliveryChannel): boolean {
  if (channel === 'telegram') {
    return Boolean(process.env.ASHYQ_TELEGRAM_BOT_TOKEN && process.env.ASHYQ_TELEGRAM_CHAT_ID);
  }
  const url = process.env.ASHYQ_LEAD_WEBHOOK_URL;
  return Boolean(url && url.startsWith('https://'));
}

async function recordAttempt(
  lead: StoredLead,
  channel: DeliveryChannel,
  previousAttempts: number,
): Promise<void> {
  try {
    await attemptChannel(channel, lead);
    await appendDeliveryEntry({
      id: randomUUID(),
      key: computeDedupeKey(lead),
      runId: lead.runId,
      channel,
      status: 'sent',
      attempts: previousAttempts + 1,
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    // без ASHYQ_ADMIN_KEY ledger не виден в CRM — причина должна быть хотя бы в логе хостинга
    console.error(`[ashyq lead] ${channel} delivery failed:`, error instanceof Error ? error.message : error);
    await appendDeliveryEntry({
      id: randomUUID(),
      key: computeDedupeKey(lead),
      runId: lead.runId,
      channel,
      status: 'failed',
      attempts: previousAttempts + 1,
      lastError: error instanceof Error ? `${error.message}`.slice(0, 200) : 'unknown',
      updatedAt: new Date().toISOString(),
    });
  }
}

/**
 * Доставка «тихих» лидов (kind: 'result') в мессенджер выключена по умолчанию:
 * иначе телефон Ashyq будет звенеть на каждого зашедшего. Включается
 * ASHYQ_NOTIFY_ALL=1, когда нужно следить за воронкой в реальном времени.
 * Канал без настроек не даёт записей в ledger — нечего ни показывать, ни ретраить.
 */
export async function deliverLead(lead: StoredLead): Promise<void> {
  const notifyAll = process.env.ASHYQ_NOTIFY_ALL === '1';
  if (lead.kind === 'result' && !notifyAll) return;

  const ledger = await readDeliveryLedger();
  const previous = (channel: DeliveryChannel): number => {
    const key = computeDedupeKey(lead);
    return ledger
      .filter((entry) => entry.key === key && entry.channel === channel)
      .reduce((max, entry) => Math.max(max, entry.attempts), 0);
  };

  const channels: DeliveryChannel[] = (['telegram', 'webhook'] as const).filter(channelConfigured);
  await Promise.allSettled(channels.map((channel) => recordAttempt(lead, channel, previous(channel))));
}

/**
 * Повтор неудачных доставок. runId '*' — все лиды (авто-retry при чтении
 * CRM-снапшота, соблюдает политику isRetryDue); конкретный runId + force —
 * ручной повтор из CRM (кнопка, бьёт сразу). Возвращает число попыток.
 */
export async function retryFailedDeliveries(
  runId: string,
  leads: StoredLead[],
  options: { force?: boolean } = {},
): Promise<number> {
  const ledger = await readDeliveryLedger();
  const now = Date.now();
  const latestFailed = new Map<string, DeliveryLedgerEntry>();
  for (const entry of ledger) {
    if (entry.status !== 'failed') continue;
    if (runId !== '*' && entry.runId !== runId) continue;
    const composite = `${entry.key}|${entry.channel}`;
    const current = latestFailed.get(composite);
    if (!current || entry.updatedAt >= current.updatedAt) latestFailed.set(composite, entry);
  }

  let performed = 0;
  for (const entry of latestFailed.values()) {
    if (
      !options.force &&
      !isRetryDue(
        {
          channel: entry.channel,
          status: entry.status,
          attempts: entry.attempts,
          updatedAt: entry.updatedAt,
        },
        now,
      )
    ) {
      continue;
    }

    const lead = leads.find((item) => computeDedupeKey(item) === entry.key);
    if (!lead) continue;

    await recordAttempt(lead, entry.channel, entry.attempts);
    performed += 1;
  }
  return performed;
}

/**
 * Ежедневный backup лидов: раз в сутки копия leads.jsonl уходит в
 * `.data/backups/`, хранятся последние BACKUP_KEEP файлов. Best-effort:
 * на read-only FS просто пропускается. Маркер — переименованный tmp-файл,
 * чтобы параллельные запросы не устроили гонку копий.
 */
export async function maybeBackupLeads(leadsFile: string): Promise<void> {
  try {
    const backupDir = path.join(path.dirname(leadsFile), 'backups');
    const marker = path.join(backupDir, '.last-backup');
    const now = Date.now();
    let last = 0;
    try {
      last = Number((await readFile(marker, 'utf8')).trim()) || 0;
    } catch {
      /* первый запуск */
    }
    if (now - last < BACKUP_INTERVAL_MS) return;

    await mkdir(backupDir, { recursive: true });
    const stamp = new Date(now).toISOString().replace(/[:.]/g, '-').slice(0, 19);
    await copyFile(leadsFile, path.join(backupDir, `leads-${stamp}.jsonl`));
    await appendFile(marker, String(now), 'utf8');

    const fs = await import('node:fs/promises');
    const all = await fs.readdir(backupDir);
    const backups = all.filter((name) => name.startsWith('leads-')).sort();
    for (const stale of backups.slice(0, Math.max(0, backups.length - BACKUP_KEEP))) {
      await fs.unlink(path.join(backupDir, stale)).catch(() => {});
    }
  } catch {
    // бэкап никогда не ломает приём заявок
  }
}
