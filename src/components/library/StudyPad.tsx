'use client';

import { useState } from 'react';
import { emptyProgress, progressSource, readProgress } from '@/lib/library-progress';
import { useDeviceProgress } from './useDeviceProgress';
import styles from './Library.module.css';

/** Device-local notes; no network or AI grading. */
export default function StudyPad({ code, contentSource }: { code: string; contentSource?: string }) {
  const saved = useDeviceProgress(`pad:${code}`);
  const source = progressSource({code, contentSource, version: 1});
  const parsed = readProgress(saved.raw, source, [{id:code,max:24000}]);
  const draft = parsed?.values[code] ?? '';
  function setDraft(value: string) {saved.update(JSON.stringify({...emptyProgress(source),values:{[code]:value}}));}
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
    <textarea id={`draft-${code}`} disabled={!saved.ready || !parsed} value={draft} maxLength={24000} onChange={(event) => { setDraft(event.target.value); setStatus(''); setExportText(''); }} placeholder="Сначала сформулируйте свой ответ. Затем откройте разбор ниже." rows={7} />
    <div className={styles.padActions}><span>Слов: {words} · лимит поля: 24 000 символов</span><button type="button" disabled={!draft.trim()} onClick={copy}>Скопировать попытку</button><button type="button" disabled={!draft} onClick={() => { if (window.confirm('Очистить эту попытку? Скопируйте текст, если он нужен.')) { if(saved.update('',true)){setExportText('');setStatus('Попытка очищена.');}else setStatus('Не удалось удалить попытку.'); } }}>Очистить</button></div>
    <p className={styles.small}>Текст автоматически сохраняется в этом браузере на устройстве. На общем устройстве его могут увидеть другие; используйте «Очистить». Сохранение не заменяет личную резервную копию. Он не отправляется ASHYQ или ИИ и не оценивается автоматически.</p>
    <p role="status" aria-live="polite">{saved.problem || status || (!parsed ? 'Сохранённая попытка повреждена или устарела. Скопируйте её ниже, затем очистите.' : 'Сохранено на этом устройстве.')}</p>
    {!parsed && <><pre className={styles.quizExport}>{saved.raw}</pre><button type="button" onClick={() => {if(confirm('Удалить сохранённую попытку?')) saved.update(JSON.stringify(emptyProgress(source)),true);}}>Очистить сохранённую попытку</button></>}
    {exportText && <label>Текст для ручного копирования<textarea readOnly value={exportText} rows={6} onFocus={(event) => event.target.select()} /></label>}
  </div>;
}
