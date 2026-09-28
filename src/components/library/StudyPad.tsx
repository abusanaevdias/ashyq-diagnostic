'use client';

import { useState } from 'react';
import styles from './Library.module.css';

/** Session memory only. No essay/network/persistence/AI grading calls. */
export default function StudyPad({ code }: { code: string }) {
  const [draft, setDraft] = useState('');
  const [status, setStatus] = useState('');
  const [exportText, setExportText] = useState('');
  const words = draft.trim() ? draft.trim().split(/\s+/u).length : 0;
  async function copy() {
    const text = `ASHYQ · ${code}\n\n${draft}`;
    try { await navigator.clipboard.writeText(text); setStatus('Скопировано. Сохраните текст в своём документе.'); }
    catch { setExportText(text); setStatus('Копирование недоступно. Выделите текст в поле ниже и скопируйте вручную.'); }
  }
  return <div className={styles.pad}>
    <label htmlFor={`draft-${code}`}><strong>Ваша попытка / заметки · {code}</strong><span>Для нескольких заданий укажите их коды перед ответами.</span></label>
    <textarea id={`draft-${code}`} value={draft} maxLength={24000} onChange={(event) => { setDraft(event.target.value); setStatus(''); setExportText(''); }} placeholder="Сначала сформулируйте свой ответ. Затем откройте разбор ниже." rows={7} />
    <div className={styles.padActions}><span>Слов: {words} · лимит поля: 24 000 символов</span><button type="button" disabled={!draft.trim()} onClick={copy}>Скопировать попытку</button><button type="button" disabled={!draft} onClick={() => { if (window.confirm('Очистить эту попытку? Скопируйте текст, если он нужен.')) { setDraft(''); setExportText(''); setStatus('Попытка очищена.'); } }}>Очистить</button></div>
    <p className={styles.small}>Текст хранится только в памяти открытой страницы и исчезнет при перезагрузке или переходе. Перед выходом скопируйте его. Он не отправляется ASHYQ или ИИ и не оценивается автоматически.</p>
    <p role="status" aria-live="polite">{status}</p>
    {exportText && <label>Текст для ручного копирования<textarea readOnly value={exportText} rows={6} onFocus={(event) => event.target.select()} /></label>}
  </div>;
}
