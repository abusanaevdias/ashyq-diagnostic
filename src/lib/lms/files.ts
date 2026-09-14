import type { MaterialRef } from './types';
import { LmsStorageError, newId, readJson, readRaw, writeJson, writeRaw } from './store';

/**
 * Файлы сдач и уроков. Демо: base64 в localStorage с лимитами из ТЗ.
 * Браузер обычно даёт ~5 МБ localStorage на сайт — раньше 8 МБ может
 * сработать переполнение, оно тоже даёт честную ошибку.
 * Позже SupabaseFileStorage (Supabase Storage) с тем же интерфейсом.
 */

export const FILE_LIMIT_BYTES = 2 * 1024 * 1024;
export const DEVICE_LIMIT_BYTES = 8 * 1024 * 1024;

export interface FileStorage {
  upload(file: File): Promise<MaterialRef>;
  /** Ссылка для скачивания; для демо-файла — data: URL. */
  resolveUrl(ref: MaterialRef): Promise<string | null>;
  usage(): Promise<{ usedBytes: number; limitBytes: number }>;
}

const INDEX = 'files-index';
const DEMO_SCHEME = 'demo-file:';

function toBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let bin = '';
  for (let i = 0; i < bytes.length; i += 0x8000) bin += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return btoa(bin);
}

export const demoFileStorage: FileStorage = {
  async upload(file) {
    if (file.size > FILE_LIMIT_BYTES) {
      throw new LmsStorageError(`Файл «${file.name}» больше 2 МБ — в демо-режиме это предел. Сожмите файл или прикрепите ссылку.`);
    }
    const index = readJson<Record<string, number>>(INDEX, {});
    const used = Object.values(index).reduce((sum, size) => sum + size, 0);
    if (used + file.size > DEVICE_LIMIT_BYTES) {
      throw new LmsStorageError('Демо-хранилище файлов на этом устройстве заполнено (8 МБ). Удалите старые сдачи или прикрепите ссылку.');
    }
    const id = newId();
    writeRaw(`file:${id}`, `data:${file.type || 'application/octet-stream'};base64,${toBase64(await file.arrayBuffer())}`);
    writeJson(INDEX, { ...index, [id]: file.size });
    return { id, kind: 'file', title: file.name, url: `${DEMO_SCHEME}${id}`, sizeBytes: file.size };
  },
  async resolveUrl(ref) {
    if (!ref.url) return null;
    return ref.url.startsWith(DEMO_SCHEME) ? readRaw(`file:${ref.url.slice(DEMO_SCHEME.length)}`) : ref.url;
  },
  async usage() {
    const used = Object.values(readJson<Record<string, number>>(INDEX, {})).reduce((sum, size) => sum + size, 0);
    return { usedBytes: used, limitBytes: DEVICE_LIMIT_BYTES };
  },
};

/** В режиме supabase — Storage (SUPABASE-FILES-001), модуль грузится отдельным чанком. */
const supabaseFiles = () => import('./supabase-files').then((m) => m.supabaseFileStorage);

export function getFileStorage(): FileStorage {
  if (process.env.NEXT_PUBLIC_AUTH_PROVIDER !== 'supabase') return demoFileStorage;
  return {
    upload: async (file) => (await supabaseFiles()).upload(file),
    resolveUrl: async (ref) => (await supabaseFiles()).resolveUrl(ref),
    usage: async () => (await supabaseFiles()).usage(),
  };
}
