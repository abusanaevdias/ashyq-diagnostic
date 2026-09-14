import 'server-only';
import { timingSafeEqual } from 'node:crypto';
import { isTelegramManagerRequest } from './telegram-auth';

export function safeEqual(provided: string, expected: string): boolean {
  const left = Buffer.from(provided);
  const right = Buffer.from(expected);
  return left.length === right.length && timingSafeEqual(left, right);
}

/** Доступ к CRM и выгрузке: ключ админа или менеджер из Telegram Mini App. */
export async function isAuthorized(request: Request): Promise<boolean> {
  return hasValidAdminKey(request) || isTelegramManagerRequest(request);
}

function hasValidAdminKey(request: Request): boolean {
  const expected = process.env.ASHYQ_ADMIN_KEY;
  if (!expected) return false;

  // Только заголовки: ключ в URL оседает в логах прокси, истории браузера и Referer.
  const provided =
    request.headers.get('x-ashyq-admin-key') ??
    request.headers.get('authorization')?.replace(/^Bearer\s+/i, '') ??
    '';

  return Boolean(provided) && safeEqual(provided, expected);
}
