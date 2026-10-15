import { writingRequestSignal, readWritingBody, WritingBodyTooLargeError } from '@/lib/writing-trainer/request-budget';
import { NextResponse } from 'next/server';
import { feedbackCriteria } from '@/lib/writing-trainer/ai-feedback';
import { authorizedPilotUser, generateWritingFeedback, writingAiEnabled } from '@/lib/writing-trainer/ai-server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 40;

const json = (body: object, status: number) => NextResponse.json(body, { status, headers: { 'Cache-Control': 'no-store' } });

export async function POST(request: Request) {
  if (!writingAiEnabled()) return json({ error: 'AI-разбор пока не настроен.' }, 503);
  const origin = request.headers.get('origin');
  if (!origin || origin !== new URL(request.url).origin) return json({ error: 'Недопустимый источник запроса.' }, 403);
  if (Number(request.headers.get('content-length') ?? 0) > 50_000) return json({ error: 'Текст слишком длинный.' }, 413);
  const signal = writingRequestSignal(request);
  const userId = await authorizedPilotUser(request, signal);
  if (signal.aborted) return json({ error: 'Время ожидания истекло. Текст остаётся на экране; повтори запрос позже.' }, 503);
  if (!userId) return json({ error: 'Нет доступа к пилоту AI-разбора.' }, 403);
  let body: Record<string, unknown>;
  try {
    const raw = await readWritingBody(request, signal);
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return json({ error: 'Неверный запрос.' }, 400);
    body = parsed as Record<string, unknown>;
  } catch (error) {
    if (signal.aborted) return json({ error: 'Время ожидания истекло. Текст остаётся на экране; повтори запрос позже.' }, 503);
    if (error instanceof WritingBodyTooLargeError) return json({ error: 'Текст слишком длинный.' }, 413);
    return json({ error: 'Неверный запрос.' }, 400);
  }
  if (body.consent !== true || typeof body.criterion !== 'string' || !feedbackCriteria.includes(body.criterion as typeof feedbackCriteria[number])) return json({ error: 'Подтверди согласие и выбери критерий.' }, 400);
  const prompt = typeof body.prompt === 'string' ? body.prompt.trim() : '';
  const original = typeof body.original === 'string' ? body.original.trim() : '';
  const working = typeof body.working === 'string' ? body.working.trim() : '';
  if (!prompt || !original || !working || prompt.length > 1_000 || original.length > 10_000 || working.length > 10_000) return json({ error: 'Проверь задание и длину эссе.' }, 400);
  const result = await generateWritingFeedback(userId, { criterion: body.criterion as typeof feedbackCriteria[number], prompt, original, working }, signal);
  if (!result.feedback) return json({ error: result.status === 429 ? 'Слишком много запросов. Дождись текущего разбора или повтори позже.' : 'AI-разбор временно недоступен. Текст остаётся на экране.' }, result.status);
  return json({ feedback: result.feedback }, 200);
}
