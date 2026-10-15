import 'server-only';
import { createHash, randomUUID } from 'node:crypto';
import { writingStepSignal } from '../writing-trainer/request-budget';
import { providerSpeakingTranscript, type SpeakingTranscript } from './transcript';
import { inspectSpeakingWav } from './transcription-wav';
import { readSpeakingBytes, speakingMultipartPayload } from './transcription-body';

const busy = new Set<string>();
export const SPEAKING_REQUEST_MS = 55_000;
export function speakingAiEnabled(env: NodeJS.ProcessEnv = process.env): boolean {
  return env.SPEAKING_AI_ENABLED === '1' && env.NEXT_PUBLIC_SPEAKING_AI_ENABLED === '1' && env.NEXT_PUBLIC_AUTH_PROVIDER === 'supabase' && Boolean(env.OPENAI_API_KEY && env.SPEAKING_AI_PILOT_EMAIL?.trim() && env.NEXT_PUBLIC_SUPABASE_URL && env.NEXT_PUBLIC_SUPABASE_ANON_KEY && (env.SUPABASE_SERVICE_ROLE_KEY || env.ASHYQ_SUPABASE_SERVICE_ROLE_KEY));
}
/** Separate namespace: at most3/user and9 total canonical <=120s files per UTC day. */
async function reserve(userId: string, signal: AbortSignal): Promise<200 | 429 | 503> {
  if (signal.aborted) return 503;
  const hash = createHash('sha256').update(userId).digest('hex'); if (busy.has(hash)) return 429;
  busy.add(hash);
  const url = (process.env.NEXT_PUBLIC_SUPABASE_URL ?? '').replace(/(\/(rest|auth)\/v1)?\/?$/, ''), key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.ASHYQ_SUPABASE_SERVICE_ROLE_KEY;
  if (!key || !/^https:\/\/[^/]+$/.test(url) && !/^http:\/\/127\.0\.0\.1:\d+$/.test(url)) { busy.delete(hash); return 503; }
  const day = new Date().toISOString().slice(0, 10);
  const check = async (suffix: string, max: number) => {
    const response = await fetch(`${url}/rest/v1/rpc/check_rate_limit`, { method: 'POST', headers: { apikey: key, Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ p_key: `speaking-transcription:${day}:${suffix}`, p_window_seconds: 86_400, p_max: max }), cache: 'no-store', signal: writingStepSignal(signal, 5_000) });
    if (!response.ok) return null;
    const value: unknown = await response.json(); return typeof value === 'boolean' ? value : null;
  };
  try {
    const user = await check(`user:${hash}`, 3), all = user ? await check('all', 9) : true;
    const status = user === null || all === null ? 503 : user && all ? 200 : 429;
    if (status !== 200) busy.delete(hash); return status;
  } catch { busy.delete(hash); return 503; }
}
export async function transcribeSpeaking(userId: string, bytes: Uint8Array, signal: AbortSignal): Promise<{status: number; transcript?: SpeakingTranscript}> {
  const { seconds } = inspectSpeakingWav(bytes);
  const status = await reserve(userId, signal); if (status !== 200) return { status };
  try {
    const payload = speakingMultipartPayload(bytes, `ashyq-${randomUUID()}`);
    const response = await fetch('https://api.openai.com/v1/audio/transcriptions', { method: 'POST', headers: { Authorization: `Bearer ${process.env.OPENAI_API_KEY}`, 'Content-Type': payload.contentType }, body: payload.body.slice().buffer, cache: 'no-store', signal: writingStepSignal(signal, 40_000) });
    if (!response.ok) return { status: response.status === 429 ? 429 : 502 };
    const result = JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(await readSpeakingBytes(response.body, signal, 256_000))) as unknown;
    const transcript = providerSpeakingTranscript(result, createHash('sha256').update(bytes).digest('hex'), seconds);
    return transcript ? { status: 200, transcript } : { status: 502 };
  } catch { return { status: signal.aborted ? 503 : 502 }; }
  finally { busy.delete(createHash('sha256').update(userId).digest('hex')); }
}
