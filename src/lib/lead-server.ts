import { appendFile, mkdir } from 'node:fs/promises';
import path from 'node:path';

/**
 * Серверная сторона лида: хранение + доставка.
 *
 * Работает без единой настройки (пишет в .data/leads.jsonl), а при заданных
 * env-переменных дополнительно шлёт уведомление, чтобы Ashyq видел заявку
 * сразу, а не заходил в файл.
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
}

const LEADS_DIR = process.env.ASHYQ_LEADS_DIR ?? path.join(process.cwd(), '.data');
const LEADS_FILE = path.join(LEADS_DIR, 'leads.jsonl');

/**
 * JSONL, а не JSON-массив: дозапись одной строкой атомарна и не портит файл,
 * если два запроса пришли одновременно.
 */
export async function appendLead(lead: StoredLead): Promise<void> {
  try {
    await mkdir(LEADS_DIR, { recursive: true });
    await appendFile(LEADS_FILE, `${JSON.stringify(lead)}\n`, 'utf8');
  } catch {
    // read-only FS (serverless) — тогда единственный канал это deliverLead
  }
}

function examLabel(exam: StoredLead['exam']): string {
  return exam === 'sat' ? 'SAT' : 'IELTS';
}

function leadToText(lead: StoredLead): string {
  const lines: string[] = [];

  lines.push(
    lead.kind === 'season'
      ? `🔴 ЗАЯВКА НА СЕЗОН · ${examLabel(lead.exam)}`
      : lead.kind === 'contact'
      ? `🔴 НОВАЯ ЗАЯВКА · ${examLabel(lead.exam)}`
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

async function sendTelegram(lead: StoredLead): Promise<void> {
  const token = process.env.ASHYQ_TELEGRAM_BOT_TOKEN;
  const chatId = process.env.ASHYQ_TELEGRAM_CHAT_ID;
  if (!token || !chatId) return;

  await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: chatId,
      text: leadToText(lead),
      disable_web_page_preview: true,
    }),
  });
}

async function sendWebhook(lead: StoredLead): Promise<void> {
  const url = process.env.ASHYQ_LEAD_WEBHOOK_URL;
  if (!url) return;
  // операторская настройка, но https обязателен: телефон не должен идти открытым текстом
  if (!url.startsWith('https://')) return;

  await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...lead, text: leadToText(lead) }),
  });
}

/**
 * Доставка «тихих» лидов (kind: 'result') в мессенджер выключена по умолчанию:
 * иначе телефон Ashyq будет звенеть на каждого зашедшего. Включается
 * ASHYQ_NOTIFY_ALL=1, когда нужно следить за воронкой в реальном времени.
 */
export async function deliverLead(lead: StoredLead): Promise<void> {
  const notifyAll = process.env.ASHYQ_NOTIFY_ALL === '1';
  if (lead.kind === 'result' && !notifyAll) return;

  await Promise.allSettled([sendTelegram(lead), sendWebhook(lead)]);
}
