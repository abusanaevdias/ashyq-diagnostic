'use client';

import { useState } from 'react';
import { FILE_LIMIT_BYTES, getFileStorage } from '@/lib/lms/files';
import { formatBytes } from '@/lib/lms/format';
import type { MaterialRef } from '@/lib/lms/types';
import styles from './Lms.module.css';

/** Выбор файлов: инпут визуально скрыт, но доступен с клавиатуры (фокус — на подписи). */
export default function FilePicker({ files, onChange, disabled = false }: { files: MaterialRef[]; onChange: (next: MaterialRef[]) => void; disabled?: boolean }) {
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const pick = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const picked = Array.from(event.target.files ?? []);
    event.target.value = '';
    setError('');
    setBusy(true);
    const added: MaterialRef[] = [];
    try {
      for (const file of picked) added.push(await getFileStorage().upload(file));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не удалось прикрепить файл');
    } finally {
      setBusy(false);
      if (added.length) onChange([...files, ...added]);
    }
  };

  return (
    <div className={styles.filePicker}>
      <div className={styles.fileBar}>
        <label className={styles.fileLabel}>
          <input type="file" multiple className={styles.srOnly} onChange={pick} disabled={disabled || busy} />
          {busy ? 'Загружаем файл…' : 'Прикрепить файл'}
        </label>
        <span className={styles.hint}>до {formatBytes(FILE_LIMIT_BYTES)} на файл</span>
      </div>
      {files.length ? (
        <ul className={styles.fileList} aria-label="Прикреплённые файлы">
          {files.map((file) => (
            <li key={file.id} className={styles.fileRow}>
              <span>{file.title} · {formatBytes(file.sizeBytes)}</span>
              <button type="button" className={styles.textButton} onClick={() => onChange(files.filter((f) => f.id !== file.id))} aria-label={`Убрать файл ${file.title}`} disabled={disabled}>
                Убрать
              </button>
            </li>
          ))}
        </ul>
      ) : null}
      {error ? <p className={styles.error} role="alert">{error}</p> : null}
    </div>
  );
}
