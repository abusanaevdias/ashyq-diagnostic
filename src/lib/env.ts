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
  const supabaseUrl = env.ASHYQ_SUPABASE_URL?.replace(/\/$/, '');
  const supabaseKey = env.ASHYQ_SUPABASE_SERVICE_ROLE_KEY;
  if (provider === 'supabase') {
    if (!supabaseUrl || !supabaseKey) {
      errors.push('ASHYQ_LEADS_PROVIDER=supabase: нужны оба ASHYQ_SUPABASE_URL и ASHYQ_SUPABASE_SERVICE_ROLE_KEY, иначе заявки не сохраняются');
    } else if (!supabaseUrl.startsWith('https://') && !/^http:\/\/(127\.0\.0\.1|localhost)(:\d+)?$/.test(supabaseUrl)) {
      errors.push('ASHYQ_SUPABASE_URL должен быть https (http — только для localhost), иначе заявки не сохраняются');
    }
  } else if (provider) {
    warnings.push(`ASHYQ_LEADS_PROVIDER=${provider} не поддерживается (только supabase): заявки пишутся в файлы`);
  } else if (supabaseUrl || supabaseKey) {
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

export async function inspectDeployment(): Promise<EnvReport> {
  const report = checkEnv({
    ...process.env,
    // NEXT_PUBLIC_* вшиваются при сборке: прямое обращение даёт значение из
    // сборки, а не из окружения запуска (в Docker их при запуске может не быть)
    NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
    NEXT_PUBLIC_ASHYQ_WHATSAPP: process.env.NEXT_PUBLIC_ASHYQ_WHATSAPP,
    NEXT_PUBLIC_AUTH_PROVIDER: process.env.NEXT_PUBLIC_AUTH_PROVIDER,
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  });
  // с Supabase заявки не живут на диске: read-only хостинг не должен давать 503
  if (process.env.ASHYQ_LEADS_PROVIDER !== 'supabase') {
    const leadsDirError = await checkLeadsDir();
    if (leadsDirError) report.errors.push(leadsDirError);
  }
  return report;
}
