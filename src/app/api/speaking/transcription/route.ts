import { NextResponse } from 'next/server';
import { authorizedPilotUser } from '@/lib/writing-trainer/ai-server';
import { speakingAiEnabled, SPEAKING_REQUEST_MS, transcribeSpeaking } from '@/lib/speaking-second-take/transcription-server';
import { MAX_TRANSCRIPTION_BODY_BYTES, readSpeakingBytes, SpeakingBodyTooLargeError } from '@/lib/speaking-second-take/transcription-body';
import { inspectSpeakingWav, SpeakingAudioError } from '@/lib/speaking-second-take/transcription-wav';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;
const json = (value: object, status: number) => NextResponse.json(value, { status, headers: { 'Cache-Control': 'no-store' } });
export async function POST(request: Request) {
  if (!speakingAiEnabled()) return json({ error: 'Распознавание речи пока не настроено.' }, 503);
  if (request.headers.get('origin') !== new URL(request.url).origin) return json({ error: 'Недопустимый источник запроса.' }, 403);
  if (Number(request.headers.get('content-length') ?? 0) > MAX_TRANSCRIPTION_BODY_BYTES) return json({ error: 'Запись превышает лимит загрузки.' }, 413);
  const signal = AbortSignal.any([request.signal, AbortSignal.timeout(SPEAKING_REQUEST_MS)]);
  const userId = await authorizedPilotUser(request, signal, process.env.SPEAKING_AI_PILOT_EMAIL);
  if (signal.aborted) return json({ error: 'Время ожидания истекло. Локальная запись остаётся в этой вкладке.' }, 503);
  if (!userId) return json({ error: 'Нет доступа к пилоту распознавания.' }, 403);
  let bytes: Uint8Array;
  try {
    const contentType = request.headers.get('content-type') ?? '';
    if (!contentType.startsWith('multipart/form-data;')) return json({ error: 'Неверный формат запроса.' }, 400);
    const body = await readSpeakingBytes(request.body, signal);
    const form = await new Response(body.slice().buffer, { headers: { 'Content-Type': contentType } }).formData();
    const entries = Array.from(form.entries());
    if (entries.length !== 2 || form.getAll('audio').length !== 1 || form.getAll('consent').length !== 1 || form.get('consent') !== 'true') return json({ error: 'Подтверди согласие на один запрос.' }, 400);
    const file = form.get('audio');
    if (!(file instanceof File) || file.type !== 'audio/wav') return json({ error: 'Нужен подготовленный WAV-файл.' }, 415);
    bytes = new Uint8Array(await file.arrayBuffer()); inspectSpeakingWav(bytes);
  } catch (error) {
    if (signal.aborted) return json({ error: 'Время ожидания истекло. Локальная запись остаётся в этой вкладке.' }, 503);
    if (error instanceof SpeakingBodyTooLargeError) return json({ error: 'Запись превышает лимит загрузки.' }, 413);
    if (error instanceof SpeakingAudioError) return json({ error: error.message }, 400);
    return json({ error: 'Не удалось прочитать аудио. Оригинальная запись не заменена.' }, 400);
  }
  const result = await transcribeSpeaking(userId, bytes, signal);
  if (!result.transcript) return json({ error: result.status === 429 ? 'Лимит распознавания достигнут или запрос уже выполняется. Повтори позже.' : 'Распознавание временно недоступно. Локальная запись остаётся в этой вкладке.' }, result.status);
  return json({ transcript: result.transcript }, 200);
}
