'use client';

import { getAuth } from '@/lib/lms/auth';
import { diagnosticInput, freezeDiagnostic, isDiagnosticSnapshot, type DiagnosticInput, type DiagnosticSnapshot } from './model';

const pendingKey = 'ashyq:v1:diagnostic-profile:pending';
const demoKey = (owner: string) => `ashyq:v1:diagnostic-profile:demo:${owner}`;
export const profileUsesCloud = process.env.NEXT_PUBLIC_AUTH_PROVIDER === 'supabase';

export function prepareDiagnostic(value: unknown) {
  const input = diagnosticInput(value);
  localStorage.setItem(pendingKey, JSON.stringify(input));
  if (localStorage.getItem(pendingKey) !== JSON.stringify(input)) throw new Error('Браузер не сохранил результат. Разреши хранение данных сайта и попробуй снова.');
}
export function pendingDiagnostic(): DiagnosticInput | null {
  const raw = localStorage.getItem(pendingKey);
  return raw ? diagnosticInput(JSON.parse(raw)) : null;
}
export function forgetPending(runId: string) {
  if (pendingDiagnostic()?.runId === runId) localStorage.removeItem(pendingKey);
}

async function cloud(method: 'GET' | 'POST' | 'DELETE', owner: string, signal?: AbortSignal, input?: DiagnosticInput, runId?: string) {
  const auth = getAuth();
  const token = await auth.accessToken?.();
  if (!token || auth.getSession()?.user.id !== owner) throw new Error('Сессия изменилась. Войди в нужный аккаунт и повтори действие.');
  let response: Response;
  try { response = await fetch('/api/learning-diagnostics', { method, signal, cache: 'no-store', headers: { Authorization: `Bearer ${token}`, 'X-Expected-Actor': owner, ...(method !== 'GET' ? { 'Content-Type': 'application/json' } : {}) }, body: method === 'POST' ? JSON.stringify(input) : method === 'DELETE' ? JSON.stringify({ runId }) : undefined }); }
  catch (error) { if (signal?.aborted) throw error; throw new Error('Нет подтверждения от сервера. Проверь соединение и повтори действие: выбранная попытка остаётся в браузере.'); }
  let value;
  try { value = await response.json(); } catch { throw new Error('Сервер не подтвердил результат. Повтори действие позже.'); }
  if (!response.ok) throw new Error(value.error || 'Не удалось сохранить результат. Повтори позже.');
  if (auth.getSession()?.user.id !== owner) throw new Error('Сессия изменилась. Открой профиль заново.');
  return value;
}

export async function listDiagnostics(owner: string, signal?: AbortSignal): Promise<DiagnosticSnapshot[]> {
  const values: unknown = profileUsesCloud ? await cloud('GET', owner, signal) : JSON.parse(localStorage.getItem(demoKey(owner)) ?? '[]');
  if (!Array.isArray(values) || !values.every(isDiagnosticSnapshot)) throw new Error('Не удалось прочитать сохранённые результаты. Попробуй обновить список.');
  return values;
}
export async function saveDiagnostic(owner: string, input: DiagnosticInput, signal?: AbortSignal) {
  if (getAuth().getSession()?.user.id !== owner) throw new Error('Сначала войди в нужный аккаунт.');
  if (profileUsesCloud) return cloud('POST', owner, signal, input);
  const snapshot = freezeDiagnostic(input);
  // LocalDemo is deliberately local and is never represented as a cloud profile.
  const claimKey = `ashyq:v1:diagnostic-profile:demo-claim:${input.runId}`;
  const claimed = localStorage.getItem(claimKey);
  if (claimed && claimed !== owner) throw new Error('Эта попытка недоступна для прикрепления к этому аккаунту.');
  const values = await listDiagnostics(owner);
  if (signal?.aborted || getAuth().getSession()?.user.id !== owner) throw new Error('Сессия изменилась.');
  const currentClaim = localStorage.getItem(claimKey);
  if (currentClaim && currentClaim !== owner) throw new Error('Эта попытка недоступна для прикрепления к этому аккаунту.');
  const old = values.find(v => v.runId === input.runId);
  if (old && JSON.stringify(old) !== JSON.stringify(snapshot)) throw new Error('Сохранённый исходный результат нельзя заменить.');
  localStorage.setItem(claimKey, owner);
  if (!old) localStorage.setItem(demoKey(owner), JSON.stringify([snapshot, ...values]));
}
export async function deleteDiagnostic(owner: string, runId: string, signal?: AbortSignal) {
  if (getAuth().getSession()?.user.id !== owner) throw new Error('Сессия изменилась.');
  if (profileUsesCloud) return cloud('DELETE', owner, signal, undefined, runId);
  const values = await listDiagnostics(owner);
  if (signal?.aborted || getAuth().getSession()?.user.id !== owner) throw new Error('Сессия изменилась.');
  localStorage.setItem(demoKey(owner), JSON.stringify(values.filter(v => v.runId !== runId)));
  localStorage.removeItem(`ashyq:v1:diagnostic-profile:demo-claim:${runId}`);
}
