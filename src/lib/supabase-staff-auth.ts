// без 'server-only': tsx-самопроверка не резолвит его (как telegram-auth.ts); импортирует только серверный admin-auth
import { createHash } from 'node:crypto';
import { resolveLeadsStorage, validSupabaseUrl } from './env';

/**
 * Персональный вход в CRM аккаунтом Supabase (CRM-PROD-001): браузер присылает
 * access token сессии в `Authorization: Bearer`, сервер проверяет его в Supabase
 * Auth и пускает роли admin и manager из public.profiles (роль выдаёт только админ).
 * Адрес и service role key — те же, что у заявок в Supabase.
 */

const STAFF_ROLES = new Set(['admin', 'manager']);
const STAFF_CACHE_MS = 5 * 60_000;
const JWT = /^[\w-]+\.[\w-]+\.[\w-]+$/;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// кэшируем только «да» и по хешу токена (сам токен не храним): снятая роль действует не дольше 5 минут
const staffUntil = new Map<string, number>();

export async function isSupabaseStaffRequest(
  request: Request,
  env: Record<string, string | undefined> = process.env,
  fetchImpl: typeof fetch = fetch,
): Promise<boolean> {
  const token = request.headers.get('authorization')?.replace(/^Bearer\s+/i, '') ?? '';
  // ключ админа и прочие не-JWT в Supabase не отправляем
  if (!JWT.test(token) || token.length > 4_096 || token === env.ASHYQ_ADMIN_KEY) return false;

  const cacheKey = createHash('sha256').update(token).digest('hex');
  if ((staffUntil.get(cacheKey) ?? 0) > Date.now()) return true;

  const { url, key } = resolveLeadsStorage(env);
  if (!url || !key || !validSupabaseUrl(url)) return false;

  try {
    const user = await fetchImpl(`${url}/auth/v1/user`, {
      headers: { apikey: key, Authorization: `Bearer ${token}` },
      signal: AbortSignal.timeout(5_000),
    });
    if (!user.ok) return false;
    const { id } = (await user.json()) as { id?: unknown };
    if (typeof id !== 'string' || !UUID.test(id)) return false;

    const profile = await fetchImpl(`${url}/rest/v1/profiles?select=role&id=eq.${id}`, {
      headers: { apikey: key, Authorization: `Bearer ${key}` },
      signal: AbortSignal.timeout(5_000),
    });
    if (!profile.ok) return false;
    const [row] = (await profile.json()) as { role?: unknown }[];
    const staff = STAFF_ROLES.has(String(row?.role));
    if (staff) {
      // ponytail: сброс вместо LRU — токен меняется раз в час, сотрудников единицы
      if (staffUntil.size > 1_000) staffUntil.clear();
      staffUntil.set(cacheKey, Date.now() + STAFF_CACHE_MS);
    }
    return staff;
  } catch {
    // ошибку не логируем: в её тексте адрес, а в запросе — токен
    return false;
  }
}
