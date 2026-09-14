import { NextResponse } from 'next/server';
import { safeEqual } from '@/lib/admin-auth';
import { appendCrmEvents, readCrmSnapshot } from '@/lib/crm-server';
import { isManager, telegramApi } from '@/lib/telegram-auth';
import { runCron } from '@/lib/telegram-bot';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Расписание бота (TG-BOT-002): ?job=digest — сводка в 9:00, ?job=remind — напоминания.
 * Вызывает Supabase pg_cron с Authorization: Bearer <CRON_SECRET> (docs/DEPLOY.md).
 */
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || !safeEqual(request.headers.get('authorization') ?? '', `Bearer ${secret}`)) {
    return new NextResponse('Not found', { status: 404 });
  }
  const job = new URL(request.url).searchParams.get('job');
  if (job !== 'digest' && job !== 'remind') return NextResponse.json({ ok: false }, { status: 400 });

  try {
    const sent = await runCron(job, { snapshot: readCrmSnapshot, append: appendCrmEvents, isManager, api: telegramApi });
    return NextResponse.json({ ok: true, sent });
  } catch (error) {
    console.error(`[ashyq bot] cron ${job} failed:`, error instanceof Error ? error.message : 'unknown');
    return NextResponse.json({ ok: false }, { status: 502 });
  }
}
