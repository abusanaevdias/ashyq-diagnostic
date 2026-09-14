import { NextResponse } from 'next/server';
import { isAuthorized, safeEqual } from '@/lib/admin-auth';
import { appendCrmEvents, readCrmSnapshot } from '@/lib/crm-server';
import { isManager } from '@/lib/telegram-auth';
import { BOT_COMMANDS, handleUpdate, type TgUpdate } from '@/lib/telegram-bot';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// в ошибке — только метод и статус: URL содержит токен бота
async function callTelegram(method: string, body: Record<string, unknown>): Promise<{ ok: boolean; description?: string }> {
  const response = await fetch(`https://api.telegram.org/bot${process.env.ASHYQ_TELEGRAM_BOT_TOKEN}/${method}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(10_000),
  });
  return (await response.json().catch(() => ({ ok: false, description: `HTTP ${response.status}` }))) as { ok: boolean; description?: string };
}

async function api(method: string, body: Record<string, unknown>): Promise<void> {
  const result = await callTelegram(method, body);
  if (!result.ok) throw new Error(`telegram ${method}: ${result.description ?? 'failed'}`);
}

/** Входящие обновления бота; Telegram подписывает их секретом из setWebhook. */
export async function POST(request: Request) {
  const secret = process.env.ASHYQ_TELEGRAM_WEBHOOK_SECRET;
  const provided = request.headers.get('x-telegram-bot-api-secret-token') ?? '';
  if (!secret || !process.env.ASHYQ_TELEGRAM_BOT_TOKEN || !safeEqual(provided, secret)) {
    return new NextResponse('Not found', { status: 404 });
  }

  try {
    const update = (await request.json()) as TgUpdate;
    await handleUpdate(update, { snapshot: readCrmSnapshot, append: appendCrmEvents, isManager, api });
  } catch (error) {
    console.error('[ashyq bot] update failed:', error instanceof Error ? error.message : 'unknown');
  }
  // всегда 200: на ошибку Telegram повторял бы тот же update
  return NextResponse.json({ ok: true });
}

/** Разовая настройка после деплоя: webhook на этот адрес + меню команд. */
export async function PUT(request: Request) {
  if (!(await isAuthorized(request))) return new NextResponse('Not found', { status: 404 });
  const secret = process.env.ASHYQ_TELEGRAM_WEBHOOK_SECRET;
  if (!secret || !process.env.ASHYQ_TELEGRAM_BOT_TOKEN) {
    return NextResponse.json({ ok: false, error: 'нужны ASHYQ_TELEGRAM_BOT_TOKEN и ASHYQ_TELEGRAM_WEBHOOK_SECRET' }, { status: 400 });
  }

  const webhook = await callTelegram('setWebhook', {
    url: `${new URL(request.url).origin}/api/telegram`,
    secret_token: secret,
    allowed_updates: ['message', 'callback_query'],
  });
  const commands = await callTelegram('setMyCommands', { commands: BOT_COMMANDS });
  return NextResponse.json({
    ok: webhook.ok && commands.ok,
    setWebhook: webhook.description ?? webhook.ok,
    setMyCommands: commands.description ?? commands.ok,
  });
}
