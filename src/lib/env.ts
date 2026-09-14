import { constants } from 'node:fs';
import { access, mkdir } from 'node:fs/promises';
import path from 'node:path';

/**
 * Проверка окружения прод-сервера (DEPLOY-PREP-001).
 *
 * Сайт стартует и без настроек, но часть ошибок конфигурации была тихой:
 * webhook на http и половина настроек Telegram просто игнорировались, а
 * read-only диск терял заявки. errors — конфигурация сломана (/api/health
 * отвечает 503), warnings — работает, но не так, как нужно в проде.
 * Подробности пишутся только в лог сервера, наружу не отдаются.
 */
export interface EnvReport {
  errors: string[];
  warnings: string[];
}

type Env = Record<string, string | undefined>;

export const ADMIN_KEY_MIN_LENGTH = 32;

/** Где хранятся заявки (LEADS-VERCEL-001). */
export interface LeadsStorage {
  provider: 'supabase' | 'file';
  url?: string;
  key?: string;
}

/**
 * Явный ASHYQ_LEADS_PROVIDER важнее всего. Без него на Vercel (диск read-only,
 * файлы в /tmp пропадают) — Supabase, если есть ключи официальной интеграции
 * Supabase ↔ Vercel: она задаёт SUPABASE_URL и SUPABASE_SERVICE_ROLE_KEY, а не ASHYQ_*.
 */
export function resolveLeadsStorage(env: Env): LeadsStorage {
  const url = (env.ASHYQ_SUPABASE_URL || env.SUPABASE_URL || env.NEXT_PUBLIC_SUPABASE_URL)?.replace(/\/$/, '') || undefined;
  const key = env.ASHYQ_SUPABASE_SERVICE_ROLE_KEY || env.SUPABASE_SERVICE_ROLE_KEY || undefined;
  if (env.ASHYQ_LEADS_PROVIDER === 'supabase') return { provider: 'supabase', url, key };
  if (!env.ASHYQ_LEADS_PROVIDER && env.VERCEL && url && key) return { provider: 'supabase', url, key };
  return { provider: 'file', url, key };
}

export function checkEnv(env: Env): EnvReport {
  const errors: string[] = [];
  const warnings: string[] = [];

  const site = env.NEXT_PUBLIC_SITE_URL;
  if (!site) {
    warnings.push('NEXT_PUBLIC_SITE_URL не задан при сборке: canonical, sitemap и Open Graph ведут на http://localhost:3000');
  } else if (!site.startsWith('https://')) {
    warnings.push(`NEXT_PUBLIC_SITE_URL=${site} без https: поисковики и соцсети получат небезопасный адрес`);
  }

  const whatsapp = env.NEXT_PUBLIC_ASHYQ_WHATSAPP;
  if (whatsapp && !/^\d{10,15}$/.test(whatsapp)) {
    warnings.push('NEXT_PUBLIC_ASHYQ_WHATSAPP: только цифры в международном формате, например 77067080181');
  }

  const adminKey = env.ASHYQ_ADMIN_KEY;
  if (!adminKey) {
    warnings.push('ASHYQ_ADMIN_KEY не задан: /crm и /api/leads отвечают 404, заявки видны только в файле');
  } else if (adminKey.length < ADMIN_KEY_MIN_LENGTH) {
    errors.push(`ASHYQ_ADMIN_KEY короче ${ADMIN_KEY_MIN_LENGTH} символов: этот ключ открывает базу телефонов (openssl rand -hex 32)`);
  }

  const webhook = env.ASHYQ_LEAD_WEBHOOK_URL;
  const webhookReady = Boolean(webhook?.startsWith('https://'));
  if (webhook && !webhookReady) {
    errors.push('ASHYQ_LEAD_WEBHOOK_URL должен начинаться с https://, иначе заявки на него не отправляются');
  }

  const telegramToken = env.ASHYQ_TELEGRAM_BOT_TOKEN;
  const telegramChat = env.ASHYQ_TELEGRAM_CHAT_ID;
  if (Boolean(telegramToken) !== Boolean(telegramChat)) {
    errors.push('Telegram: нужны оба ASHYQ_TELEGRAM_BOT_TOKEN и ASHYQ_TELEGRAM_CHAT_ID, иначе уведомления не уходят');
  }
  if (!(telegramToken && telegramChat) && !webhookReady) {
    warnings.push('Нет канала уведомлений о заявках (Telegram или webhook): новые заявки видны только в /crm');
  }

  if (env.ASHYQ_NOTIFY_ALL && env.ASHYQ_NOTIFY_ALL !== '1') {
    warnings.push('ASHYQ_NOTIFY_ALL понимает только значение 1');
  }

  // те же условия, что в src/lib/supabase-leads.ts: там они всплывают только на первой заявке
  const provider = env.ASHYQ_LEADS_PROVIDER;
  const storage = resolveLeadsStorage(env);
  if (storage.provider === 'supabase') {
    if (!storage.url || !storage.key) {
      errors.push('Заявки в Supabase: нужны URL и service role key (ASHYQ_SUPABASE_URL + ASHYQ_SUPABASE_SERVICE_ROLE_KEY или SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY интеграции), иначе заявки не сохраняются');
    } else if (!storage.url.startsWith('https://') && !/^http:\/\/(127\.0\.0\.1|localhost)(:\d+)?$/.test(storage.url)) {
      errors.push('Адрес Supabase должен быть https (http — только для localhost), иначе заявки не сохраняются');
    }
  } else if (provider && provider !== 'supabase') {
    warnings.push(`ASHYQ_LEADS_PROVIDER=${provider} не поддерживается (только supabase): заявки пишутся в файлы`);
  } else if (env.VERCEL) {
    errors.push('Vercel: диск только для чтения, файлы заявок в /tmp пропадают между запусками — подключи Supabase (интеграция Supabase ↔ Vercel или ASHYQ_LEADS_PROVIDER=supabase)');
  } else if (storage.key) {
    warnings.push('Supabase задан, но не включён: чтобы хранить заявки в Supabase, укажи ASHYQ_LEADS_PROVIDER=supabase');
  }

  if (env.NEXT_PUBLIC_AUTH_PROVIDER === 'supabase') {
    const authUrl = env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, '');
    if (!authUrl || !env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      errors.push('NEXT_PUBLIC_AUTH_PROVIDER=supabase: при сборке нужны NEXT_PUBLIC_SUPABASE_URL и NEXT_PUBLIC_SUPABASE_ANON_KEY, иначе вход не работает');
    } else if (!authUrl.startsWith('https://') && !/^http:\/\/(127\.0\.0\.1|localhost)(:\d+)?$/.test(authUrl)) {
      errors.push('NEXT_PUBLIC_SUPABASE_URL должен быть https (http — только для localhost)');
    }
  }
  for (const name of Object.keys(env)) {
    if (name.startsWith('NEXT_PUBLIC_') && /SERVICE_ROLE|SECRET/.test(name) && env[name]) {
      errors.push(`${name}: секретный ключ с префиксом NEXT_PUBLIC_ попадает в браузер — убери префикс`);
    }
  }

  return { errors, warnings };
}

/** Папка заявок должна быть на постоянном и доступном для записи диске. */
export async function checkLeadsDir(
  // ignore: иначе сборка трассирует локальную .data (заявки с телефонами) в standalone-вывод
  directory = process.env.ASHYQ_LEADS_DIR ?? path.join(/*turbopackIgnore: true*/ process.cwd(), '.data'),
): Promise<string | null> {
  try {
    await mkdir(directory, { recursive: true });
    await access(directory, constants.W_OK);
    return null;
  } catch (error) {
    const code = (error as NodeJS.ErrnoException).code ?? 'unknown';
    return `Папка заявок ${directory} недоступна для записи (${code}): заявки будут теряться, задай ASHYQ_LEADS_DIR на постоянный том`;
  }
}

/**
 * С Supabase-хранилищем заявок: таблица crm_leads отвечает service role — значит, миграции
 * применены и ключ верный. Так прод подтверждается без тестовой заявки (Vercel: диск read-only).
 */
export async function checkSupabaseLeads(url: string, key: string, fetchImpl: typeof fetch = fetch): Promise<string | null> {
  try {
    const response = await fetchImpl(`${url.replace(/\/$/, '')}/rest/v1/crm_leads?select=id&limit=1`, {
      headers: { apikey: key, Authorization: `Bearer ${key}` },
      signal: AbortSignal.timeout(5000),
    });
    if (response.ok) return null;
    if (response.status === 401 || response.status === 403) {
      return `Supabase отклонил ключ (${response.status}): в ASHYQ_SUPABASE_SERVICE_ROLE_KEY нужен service_role, не anon — заявки не сохраняются`;
    }
    if (response.status === 404) return 'В Supabase нет таблицы crm_leads: примени миграции (supabase/migrations) — заявки не сохраняются';
    return `Supabase ответил ${response.status} на crm_leads: заявки не сохраняются`;
  } catch (error) {
    return `Supabase недоступен (${error instanceof Error ? error.message : 'сеть'}): заявки не сохраняются`;
  }
}

export async function inspectDeployment(): Promise<EnvReport & { storage: LeadsStorage['provider'] }> {
  const env: Env = {
    ...process.env,
    // NEXT_PUBLIC_* вшиваются при сборке: прямое обращение даёт значение из
    // сборки, а не из окружения запуска (в Docker их при запуске может не быть)
    NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
    NEXT_PUBLIC_ASHYQ_WHATSAPP: process.env.NEXT_PUBLIC_ASHYQ_WHATSAPP,
    NEXT_PUBLIC_AUTH_PROVIDER: process.env.NEXT_PUBLIC_AUTH_PROVIDER,
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  };
  const report = checkEnv(env);
  const storage = resolveLeadsStorage(env);
  // с Supabase заявки не живут на диске: read-only хостинг не должен давать 503
  if (storage.provider === 'file') {
    const leadsDirError = await checkLeadsDir();
    if (leadsDirError) report.errors.push(leadsDirError);
  } else if (storage.url && storage.key) {
    // без URL/ключа checkEnv уже сообщил ошибку — ходить в сеть незачем
    const supabaseError = await checkSupabaseLeads(storage.url, storage.key);
    if (supabaseError) report.errors.push(supabaseError);
  }
  return { ...report, storage: storage.provider };
}
