import { createHmac } from 'node:crypto';
import { NextResponse } from 'next/server';
import { safeEqual } from '@/lib/admin-auth';
import { THREADS_SCOPES, connectThreads } from '@/lib/threads-server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const STATE_TTL_MS = 10 * 60_000;
const sign = (value: string) => createHmac('sha256', process.env.THREADS_APP_SECRET ?? '').update(value).digest('hex');
const page = (text: string, status = 200) => new NextResponse(text, { status, headers: { 'Content-Type': 'text/plain; charset=utf-8' } });

/**
 * Подключение Threads (THREADS-BOT-001): открыть /api/threads/auth, войти в @ashyqedu,
 * Threads вернёт сюда с code. Токен сохранится только для аккаунта THREADS_USERNAME.
 * Этот же адрес указать в приложении Meta как Redirect Callback URL.
 */
export async function GET(request: Request) {
  if (!process.env.THREADS_APP_ID || !process.env.THREADS_APP_SECRET || !process.env.THREADS_USERNAME) {
    return page('Нужны THREADS_APP_ID, THREADS_APP_SECRET и THREADS_USERNAME', 400);
  }
  const url = new URL(request.url);
  const redirectUri = `${url.origin}${url.pathname}`;
  const code = url.searchParams.get('code');

  if (!code) {
    if (url.searchParams.get('error')) return page(`Threads отказал: ${url.searchParams.get('error_description') ?? url.searchParams.get('error')}`, 400);
    const issued = String(Date.now());
    const authorize = new URL('https://threads.net/oauth/authorize');
    authorize.search = new URLSearchParams({
      client_id: process.env.THREADS_APP_ID,
      redirect_uri: redirectUri,
      scope: THREADS_SCOPES.join(','),
      response_type: 'code',
      state: `${issued}.${sign(issued)}`,
    }).toString();
    return NextResponse.redirect(authorize);
  }

  const [issued = '', signature = ''] = (url.searchParams.get('state') ?? '').split('.');
  if (!safeEqual(signature, sign(issued)) || Date.now() - Number(issued) > STATE_TTL_MS) {
    return page('Ссылка устарела — открой /api/threads/auth ещё раз', 400);
  }
  try {
    // Threads дописывает к коду #_
    const username = await connectThreads(code.replace(/#_$/, ''), redirectUri);
    return page(`Threads подключён: @${username}. Окно можно закрыть.`);
  } catch (error) {
    console.error('[ashyq threads] connect failed:', error instanceof Error ? error.message : 'unknown');
    return page(`Не получилось подключить: ${error instanceof Error ? error.message : 'ошибка'}`, 400);
  }
}
