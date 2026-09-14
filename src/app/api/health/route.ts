import { NextResponse } from 'next/server';
import { inspectDeployment } from '@/lib/env';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Health check для балансировщика и Docker HEALTHCHECK.
 * 503 — конфигурация сломана (заявки теряются или не доставляются).
 * Что именно не так, наружу не отдаём: детали в логе сервера.
 */
export async function GET() {
  const { errors, storage } = await inspectDeployment();
  const ok = errors.length === 0;
  return NextResponse.json(
    // storage — где хранятся заявки (supabase | file): без секретов, но видно снаружи, что прод настроен
    { status: ok ? 'ok' : 'misconfigured', storage },
    { status: ok ? 200 : 503, headers: { 'Cache-Control': 'no-store' } },
  );
}
