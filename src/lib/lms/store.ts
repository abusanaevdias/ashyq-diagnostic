/**
 * Хранилище учебного слоя: только ключи `ashyq:v2:*`, ключи диагностики
 * `ashyq:v1:*` не трогаем. UI сюда не ходит — только репозитории и auth.
 *
 * Если localStorage недоступен (приватный режим, запрет сайта), данные живут
 * в памяти вкладки: страницы работают, а UI честно пишет «данные не
 * сохраняются» (см. storageAvailable). Переполнение даёт LmsStorageError.
 */

const PREFIX = 'ashyq:v2:';
const memory = new Map<string, string>();
let available: boolean | null = null;

export class LmsStorageError extends Error {}

export function storageAvailable(): boolean {
  if (typeof window === 'undefined') return false;
  if (available !== null) return available;
  try {
    const probe = `${PREFIX}__probe`;
    window.localStorage.setItem(probe, '1');
    window.localStorage.removeItem(probe);
    available = true;
  } catch {
    available = false;
  }
  return available;
}

function isQuotaError(error: unknown): boolean {
  return error instanceof DOMException && (error.name === 'QuotaExceededError' || error.code === 22);
}

export function readRaw(name: string): string | null {
  const key = PREFIX + name;
  if (storageAvailable()) {
    try {
      return window.localStorage.getItem(key);
    } catch {
      /* упадём в память */
    }
  }
  return memory.get(key) ?? null;
}

export function writeRaw(name: string, value: string): void {
  const key = PREFIX + name;
  if (!storageAvailable()) {
    memory.set(key, value);
    return;
  }
  try {
    window.localStorage.setItem(key, value);
  } catch (error) {
    if (isQuotaError(error)) {
      throw new LmsStorageError('Хранилище браузера переполнено — данные не сохранились. Удалите старые файлы или используйте ссылки.');
    }
    memory.set(key, value);
  }
}

export function removeRaw(name: string): void {
  const key = PREFIX + name;
  memory.delete(key);
  if (!storageAvailable()) return;
  try {
    window.localStorage.removeItem(key);
  } catch {
    /* ignore */
  }
}

export function readJson<T>(name: string, fallback: T): T {
  const raw = readRaw(name);
  if (raw == null) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function writeJson(name: string, value: unknown): void {
  writeRaw(name, JSON.stringify(value));
}

/* ---------- шина изменений: хуки подписываются, мутации эмитят ---------- */

type Listener = () => void;
const listeners = new Set<Listener>();

export const lmsBus = {
  on(listener: Listener): () => void {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  },
  emit(): void {
    listeners.forEach((listener) => listener());
  },
};

/* ---------- id ---------- */

/** crypto.randomUUID недоступен по http вне localhost — тогда v4 из getRandomValues. */
export function newId(): string {
  if (typeof crypto.randomUUID === 'function') {
    try {
      return crypto.randomUUID();
    } catch {
      /* insecure context */
    }
  }
  const b = crypto.getRandomValues(new Uint8Array(16));
  b[6] = (b[6] & 0x0f) | 0x40;
  b[8] = (b[8] & 0x3f) | 0x80;
  const h = Array.from(b, (x) => x.toString(16).padStart(2, '0')).join('');
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20)}`;
}

/** Код приглашения без похожих символов (0/O, 1/I). */
export function newInviteCode(length = 6): string {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  return Array.from(crypto.getRandomValues(new Uint8Array(length)), (x) => alphabet[x % alphabet.length]).join('');
}
