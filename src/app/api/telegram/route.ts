import { NextResponse } from 'next/server';
import { isAuthorized, safeEqual } from '@/lib/admin-auth';
import { appendCrmEvents, readCrmSnapshot } from '@/lib/crm-server';
import { callTelegram, isManager, telegramApi } from '@/lib/telegram-auth';
import { BOT_COMMANDS, handleUpdate, type TgUpdate } from '@/lib/telegram-bot';
import { handleThreadsUpdate, isThreadsUpdate } from '@/lib/threads-bot';
import { threadsIo } from '@/lib/threads-server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** Входящие обновления бота; Telegram подписывает их секретом из setWebhook. */
export async function POST(request: Request) {
  const secret = process.env.ASHYQ_TELEGRAM_WEBHOOK_SECRET;
  const provided = request.headers.get('x-telegram-bot-api-secret-token') ?? '';
  if (!secret || !process.env.ASHYQ_TELEGRAM_BOT_TOKEN || !safeEqual(provided, secret)) {
    return new NextResponse('Not found', { status: 404 });
  }

  try {
    const update = (await request.json()) as TgUpdate;
    // черновики Threads (THREADS-BOT-001): кнопки и ответ на карточку своим текстом
    if (isThreadsUpdate(update) && (await handleThreadsUpdate(update, threadsIo()))) return NextResponse.json({ ok: true });
    await handleUpdate(update, { snapshot: readCrmSnapshot, append: appendCrmEvents, isManager, api: telegramApi });
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
