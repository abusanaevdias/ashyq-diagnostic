// без 'server-only': tsx-самопроверка не резолвит его, а node:crypto и так не собирается в клиент
import { createHmac, timingSafeEqual } from 'node:crypto';

/**
 * Вход в CRM из Telegram Mini App (TG-MINIAPP-001): вместо ключа админа
 * браузер присылает подписанный Telegram `initData`, а доступ даёт участие
 * в группе заявок ASHYQ_TELEGRAM_CHAT_ID.
 */

const INIT_DATA_MAX_AGE_S = 24 * 60 * 60;
const INIT_DATA_MAX_LENGTH = 4_096;
const MEMBER_CACHE_MS = 5 * 60_000;
const MEMBER_STATUSES = new Set(['creator', 'administrator', 'member']);

/**
 * Проверка подписи initData по алгоритму Telegram
 * (core.telegram.org/bots/webapps#validating-data-received-via-the-mini-app).
 * Возвращает id пользователя или null — подделка, просрочка, нет user.
 */
export function verifyInitData(initData: string, botToken: string, now: number = Date.now()): number | null {
  if (!initData || initData.length > INIT_DATA_MAX_LENGTH) return null;
  const params = new URLSearchParams(initData);
  const hash = params.get('hash') ?? '';
  params.delete('hash');

  const checkString = [...params]
    .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
    .map(([key, value]) => `${key}=${value}`)
    .join('\n');
  const secret = createHmac('sha256', 'WebAppData').update(botToken).digest();
  const expected = createHmac('sha256', secret).update(checkString).digest('hex');
  if (hash.length !== expected.length || !timingSafeEqual(Buffer.from(hash), Buffer.from(expected))) return null;

  const authDate = Number(params.get('auth_date'));
  if (!authDate || now / 1000 - authDate > INIT_DATA_MAX_AGE_S) return null;

  try {
    const id: unknown = (JSON.parse(params.get('user') ?? '') as { id?: unknown }).id;
    return typeof id === 'number' ? id : null;
  } catch {
    return null;
  }
}

// на экземпляр функции; кэшируем только «да», чтобы удалённый из группы терял доступ не позже чем через 5 минут
const memberUntil = new Map<number, number>();

/** Кто считается менеджером. Сейчас — участник группы заявок; список ID добавить сюда. */
export async function isManager(userId: number): Promise<boolean> {
  if ((memberUntil.get(userId) ?? 0) > Date.now()) return true;

  const token = process.env.ASHYQ_TELEGRAM_BOT_TOKEN;
  const chatId = process.env.ASHYQ_TELEGRAM_CHAT_ID;
  if (!token || !chatId) return false;

  try {
    const response = await fetch(`https://api.telegram.org/bot${token}/getChatMember`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, user_id: userId }),
      signal: AbortSignal.timeout(5_000),
    });
    if (!response.ok) return false;
    const { result } = (await response.json()) as { result?: { status?: string; is_member?: boolean } };
    const member = MEMBER_STATUSES.has(result?.status ?? '') || (result?.status === 'restricted' && result.is_member === true);
    if (member) memberUntil.set(userId, Date.now() + MEMBER_CACHE_MS);
    return member;
  } catch {
    return false;
  }
}

/** Запрос из Mini App: заголовок x-telegram-init-data с верной подписью от менеджера. */
export async function isTelegramManagerRequest(request: Request): Promise<boolean> {
  const token = process.env.ASHYQ_TELEGRAM_BOT_TOKEN;
  const initData = request.headers.get('x-telegram-init-data');
  if (!token || !initData) return false;
  const userId = verifyInitData(initData, token);
  return userId !== null && isManager(userId);
}

/** Вызов Bot API. В ответе и ошибках нет URL: в нём токен бота. */
export async function callTelegram(method: string, body: Record<string, unknown>): Promise<{ ok: boolean; description?: string }> {
  const response = await fetch(`https://api.telegram.org/bot${process.env.ASHYQ_TELEGRAM_BOT_TOKEN}/${method}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(10_000),
  });
  return (await response.json().catch(() => ({ ok: false, description: `HTTP ${response.status}` }))) as { ok: boolean; description?: string };
}

export async function telegramApi(method: string, body: Record<string, unknown>): Promise<void> {
  const result = await callTelegram(method, body);
  if (!result.ok) throw new Error(`telegram ${method}: ${result.description ?? 'failed'}`);
}
