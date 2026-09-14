import type { SupabaseClient } from '@supabase/supabase-js';
import { FILE_LIMIT_BYTES, type FileStorage } from './files';
import { LmsStorageError, newId } from './store';
import { supabaseBrowser } from './supabase-auth';

/**
 * Файлы уроков и сдач в Supabase Storage (SUPABASE-FILES-001): приватный
 * bucket `lms-files`, путь `<uid>/<id>-<имя>`. Кто может читать — решают
 * политики миграции `20260914000500_lms_files.sql`; наружу только подписанные
 * ссылки на 10 минут, поэтому ссылка из письма или чата быстро протухает.
 */

const BUCKET = 'lms-files';
const SCHEME = 'sb-file:';
const SIGNED_URL_TTL_S = 600;

export function createSupabaseFileStorage(client: () => SupabaseClient): FileStorage {
  return {
    async upload(file) {
      if (file.size > FILE_LIMIT_BYTES) {
        throw new LmsStorageError(`Файл «${file.name}» больше 2 МБ. Сожмите файл или прикрепите ссылку.`);
      }
      const { data: auth } = await client().auth.getUser();
      if (!auth.user) throw new LmsStorageError('Войдите, чтобы прикрепить файл');
      const id = newId();
      // Storage принимает только ASCII-ключи («Эссе.txt» → Invalid key): имя для людей — в title и при скачивании
      const safeName = file.name.replace(/[^A-Za-z0-9._-]+/g, '_').replace(/^_+/, '').slice(-80) || 'file';
      const path = `${auth.user.id}/${id}-${safeName}`;
      const { error } = await client().storage.from(BUCKET).upload(path, file, { contentType: file.type || 'application/octet-stream', upsert: false });
      if (error) throw new LmsStorageError(`Не удалось загрузить «${file.name}»: ${error.message}`);
      return { id, kind: 'file', title: file.name, url: `${SCHEME}${path}`, sizeBytes: file.size };
    },
    async resolveUrl(ref) {
      if (!ref.url) return null;
      if (!ref.url.startsWith(SCHEME)) return ref.url;
      const { data, error } = await client()
        .storage.from(BUCKET)
        .createSignedUrl(ref.url.slice(SCHEME.length), SIGNED_URL_TTL_S, { download: ref.title });
      return error ? null : data.signedUrl;
    },
    async usage() {
      // ponytail: квоты на пользователя нет — лимит только на файл; считать объём, когда появится квота
      return { usedBytes: 0, limitBytes: FILE_LIMIT_BYTES };
    },
  };
}

export const supabaseFileStorage: FileStorage = createSupabaseFileStorage(supabaseBrowser);
