'use client';

import { useState } from 'react';
import { getFileStorage } from '@/lib/lms/files';
import { formatBytes, isHttpUrl } from '@/lib/lms/format';
import type { MaterialRef } from '@/lib/lms/types';
import styles from './Lms.module.css';

const KIND_LABEL: Record<MaterialRef['kind'], string> = { link: 'ссылка', text: 'текст', file: 'файл' };

export default function MaterialList({ items: all }: { items: MaterialRef[] }) {
  const [error, setError] = useState('');
  // данные из хранилища не доверенные: ссылку не-http(s) не рендерим
  const items = all.filter((m) => m.kind !== 'link' || isHttpUrl(m.url ?? ''));
  if (items.length === 0) return null;

  const download = async (ref: MaterialRef) => {
    setError('');
    const url = await getFileStorage().resolveUrl(ref);
    if (!url) {
      setError(`Файл «${ref.title}» не найден на этом устройстве — в демо-режиме файлы хранятся локально.`);
      return;
    }
    const a = document.createElement('a');
    a.href = url;
    a.download = ref.title;
    a.click();
  };

  return (
    <>
      <ul className={styles.materials} aria-label="Материалы">
        {items.map((m) => (
          <li key={m.id}>
            {m.kind === 'link' ? (
              <a className={styles.materialLink} href={m.url} target="_blank" rel="noopener noreferrer">
                <span className={styles.chip}>{KIND_LABEL.link}</span>
                {m.title}
              </a>
            ) : m.kind === 'text' ? (
              <details className={styles.materialText}>
                <summary>
                  <span className={styles.chip}>{KIND_LABEL.text}</span>
                  {m.title}
                </summary>
                <p>{m.body}</p>
              </details>
            ) : (
              <button type="button" className={styles.materialLink} onClick={() => download(m)}>
                <span className={styles.chip}>{KIND_LABEL.file}</span>
                {m.title} · {formatBytes(m.sizeBytes)}
              </button>
            )}
          </li>
        ))}
      </ul>
      {error ? <p className={styles.error} role="alert">{error}</p> : null}
    </>
  );
}
