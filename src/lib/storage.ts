import { STORAGE_KEYS } from './config';
import type { ExamId, ProgressSnapshot, RunState, UtmParams } from './types';

/**
 * Persistence + UTM.
 * Всё через try/catch: приватный режим Safari / заблокированный storage
 * не должны ронять диагностику.
 */

export function safeGet(key: string): string | null {
  try {
    if (typeof window === 'undefined') return null;
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

export function safeSet(key: string, value: string): void {
  try {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem(key, value);
  } catch {
    /* ignore */
  }
}

export function safeRemove(key: string): void {
  try {
    if (typeof window === 'undefined') return;
    window.localStorage.removeItem(key);
  } catch {
    /* ignore */
  }
}

export function newRunId(): string {
  // CSPRNG: по runId CRM склеивает лиды — угадываемый id позволил бы подменить чужой контакт.
  // getRandomValues, а не randomUUID: тот недоступен по http вне localhost.
  const bytes = crypto.getRandomValues(new Uint8Array(8));
  const rand = Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
  return `${Date.now().toString(36)}-${rand}`;
}

export function loadRun(exam: ExamId): RunState | null {
  const raw = safeGet(STORAGE_KEYS.run(exam));
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as RunState;
    if (parsed.schemaVersion !== 1) return null;
    if (parsed.exam !== exam) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function saveRun(run: RunState): void {
  safeSet(STORAGE_KEYS.run(run.exam), JSON.stringify(run));
}

export function clearRun(exam: ExamId): void {
  safeRemove(STORAGE_KEYS.run(exam));
}

/**
 * Активный экзамен тоже храним: после случайного refresh пользователь
 * возвращается к своему вопросу, а не на лендинг.
 */
export function saveActiveExam(exam: ExamId | null): void {
  if (exam) safeSet(STORAGE_KEYS.active, exam);
  else safeRemove(STORAGE_KEYS.active);
}

export function loadActiveExam(): ExamId | null {
  const value = safeGet(STORAGE_KEYS.active);
  return value === 'sat' || value === 'ielts' ? value : null;
}

const UTM_KEYS: Array<keyof UtmParams> = [
  'utm_source',
  'utm_medium',
  'utm_campaign',
  'utm_content',
  'utm_term',
];

export function readUtmFromLocation(): UtmParams {
  if (typeof window === 'undefined') return {};
  const params = new URLSearchParams(window.location.search);
  const utm: UtmParams = {};
  UTM_KEYS.forEach((key) => {
    const value = params.get(key);
    if (value) utm[key] = value;
  });
  return utm;
}

/** UTM живёт в localStorage, чтобы не теряться при переходах между экранами */
export function persistUtm(utm: UtmParams): UtmParams {
  const stored = loadUtm();
  const merged = { ...stored, ...utm };
  if (Object.keys(merged).length > 0) {
    safeSet(STORAGE_KEYS.utm, JSON.stringify(merged));
  }
  return merged;
}

export function loadUtm(): UtmParams {
  const raw = safeGet(STORAGE_KEYS.utm);
  if (!raw) return {};
  try {
    return JSON.parse(raw) as UtmParams;
  } catch {
    return {};
  }
}

export function utmToQuery(utm: UtmParams): string {
  const params = new URLSearchParams();
  UTM_KEYS.forEach((key) => {
    const value = utm[key];
    if (value) params.set(key, value);
  });
  const str = params.toString();
  return str ? `&${str}` : '';
}

/* ---------------- personal progress history ---------------- */

const HISTORY_CAP = 12;

/** История завершённых диагностик: только локально, без PII. */
export function readHistory(exam: ExamId): ProgressSnapshot[] {
  const raw = safeGet(STORAGE_KEYS.history(exam));
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as ProgressSnapshot[];
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((s) => s && typeof s.ts === 'number' && typeof s.bandLow === 'number');
  } catch {
    return [];
  }
}

/** Идемпотентно к refresh/remount: один runId = одна запись. */
export function appendHistory(exam: ExamId, snapshot: ProgressSnapshot): void {
  const list = readHistory(exam).filter((s) => s.runId !== snapshot.runId);
  list.push(snapshot);
  safeSet(STORAGE_KEYS.history(exam), JSON.stringify(list.slice(-HISTORY_CAP)));
}
