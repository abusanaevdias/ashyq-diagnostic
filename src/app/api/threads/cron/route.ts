import { NextResponse, after } from 'next/server';
import { safeEqual } from '@/lib/admin-auth';
import { runThreads } from '@/lib/threads-bot';
import { threadsIo } from '@/lib/threads-server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
// несколько ответов ИИ подряд не укладываются в 30 с, которые ждёт pg_net
export const maxDuration = 60;

/**
 * Обход Threads (THREADS-BOT-001): Supabase pg_cron с Authorization: Bearer <CRON_SECRET>.
 * Отвечаем сразу, работа идёт после ответа; итог — в логах Vercel.
 */
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || !safeEqual(request.headers.get('authorization') ?? '', `Bearer ${secret}`)) {
    return new NextResponse('Not found', { status: 404 });
  }

  after(async () => {
    try {
      const result = await runThreads(threadsIo(), {
        autopublish: process.env.THREADS_AUTOPUBLISH === '1',
        chatId: process.env.THREADS_TELEGRAM_CHAT_ID || process.env.ASHYQ_TELEGRAM_CHAT_ID,
        threadId: process.env.THREADS_TELEGRAM_THREAD_ID ? Number(process.env.THREADS_TELEGRAM_THREAD_ID) : undefined,
        maxPerRun: Number(process.env.THREADS_MAX_PER_RUN) || undefined,
        searchPerDay: process.env.THREADS_SEARCH_PER_DAY ? Number(process.env.THREADS_SEARCH_PER_DAY) : undefined,
      });
      console.info('[ashyq threads] run', JSON.stringify(result));
    } catch (error) {
      console.error('[ashyq threads] run failed:', error instanceof Error ? error.message : 'unknown');
    }
  });
  return NextResponse.json({ ok: true }, { status: 202 });
}
