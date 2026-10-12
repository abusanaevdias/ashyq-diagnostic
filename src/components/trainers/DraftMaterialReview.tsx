'use client';

import Link from 'next/link';
import { useEffect, useState, useSyncExternalStore, type ReactNode } from 'react';
import RequireRole from '@/components/lms/RequireRole';
import DraftWritingPreview from './DraftWritingPreview';
import DraftSatPreview from './DraftSatPreview';
import DraftListeningPreview from './DraftListeningPreview';
import DraftMathPreview from './DraftMathPreview';
import DraftReadingPreview from './DraftReadingPreview';
import DraftTask1Preview from './DraftTask1Preview';
import DraftSpeakingLaunch from './DraftSpeakingLaunch';
import { decisionSignature, DRAFT_REVIEW_CHANGED, draftBatches, emptyDraftReview, parseDraftReview, reviewCounts, reviewKey, validDecision, type DraftBatch, type DraftDecision, type DraftReview, type DraftUnit, type ReviewDecision } from '@/lib/trainers/draft-review';
import { saveDraftDecision } from '@/lib/trainers/draft-review-storage';
import styles from './TrainerCheckpoint.module.css';

const changed = DRAFT_REVIEW_CHANGED;
function subscribe(callback: () => void) {
  window.addEventListener('storage', callback); window.addEventListener(changed, callback);
  return () => { window.removeEventListener('storage', callback); window.removeEventListener(changed, callback); };
}

/** Deliberately renders text through React; supplied HTML is not executed. */
function MaterialText({ text, sectionLabel = 'задания' }: { text: string; sectionLabel?: string }) {
  const lines = text.split('\n'), blocks: ReactNode[] = [];
  let tableCount = 0;
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (!line.trim()) continue;
    if (line.startsWith('|')) {
      const rows: string[][] = [];
      while (i < lines.length && lines[i].startsWith('|')) {
        const row = lines[i].replace(/^\||\|$/g, '').split('|').map(cell => cell.trim());
        if (!row.every(cell => /^:?-+:?$/.test(cell))) rows.push(row);
        i++;
      }
      i--;
      tableCount++;
      blocks.push(<div key={i} className={styles.tableWrap} tabIndex={0} role="region" aria-label={`Таблица ${sectionLabel} ${tableCount}`}><table><thead><tr>{rows[0]?.map((cell, index) => <th key={index} scope="col">{cell}</th>)}</tr></thead><tbody>{rows.slice(1).map((row, index) => <tr key={index}>{row.map((cell, col) => <td key={col}>{cell}</td>)}</tr>)}</tbody></table></div>);
    } else if (/^#{1,4} /.test(line)) blocks.push(<h3 key={i}>{line.replace(/^#+ /, '')}</h3>);
    else if (/^(?:- |\d+\. )/.test(line)) blocks.push(<p key={i} className={styles.listLine}>{line}</p>);
    else blocks.push(<p key={i}>{line}</p>);
  }
  return <div className={styles.materialText}>{blocks}</div>;
}

function ReviewUnit({ unit, batchId, contentHash, previous, onSave, onDirty }: { unit: DraftUnit; batchId: string; contentHash: string; previous?: DraftDecision; onSave: (value: DraftDecision, expected: string | null) => Promise<boolean>; onDirty: (dirty: boolean) => void }) {
  const [decision, setDecision] = useState<ReviewDecision>(previous?.decision ?? 'pending');
  const [comment, setComment] = useState(previous?.comment ?? '');
  const [attested, setAttested] = useState(previous?.attested ?? false);
  const [error, setError] = useState('');
  const [baseline, setBaseline] = useState(() => decisionSignature(previous));
  const [saving, setSaving] = useState(false);
  async function save() {
    const value: DraftDecision = { decision, comment, attested, savedAt: new Date().toISOString() };
    if (!validDecision(value)) { setError(decision === 'recommend' ? 'Подтверди проверку условия, ключа и альтернатив.' : 'Для решения «Нужна правка» напиши конкретное замечание.'); return; }
    setSaving(true); setError('');
    try { if (await onSave(value, baseline)) { setBaseline(decisionSignature(value)); onDirty(false); } }
    catch { setError('Не удалось сохранить решение. Скопируй замечание перед выходом.'); }
    finally { setSaving(false); }
  }
  return <section className={styles.panel} aria-labelledby="material-title">
    <p>{unit.id} · {unit.category} · DRAFT</p><h2 id="material-title">{unit.title}</h2>
    <MaterialText text={unit.student_markdown}/>
    <DraftWritingPreview value={unit.exercise_data}/>
    <DraftSatPreview value={unit.exercise_data}/>
    <DraftListeningPreview value={unit.exercise_data} unitId={unit.id}/>
    <DraftMathPreview value={unit.exercise_data}/>
    <DraftReadingPreview value={unit.exercise_data}/>
    <DraftTask1Preview value={unit.exercise_data}/>
    <DraftSpeakingLaunch value={unit.exercise_data} batchId={batchId} unitId={unit.id} contentHash={contentHash}/>
    <details className={styles.history}><summary>Показать ключ, альтернативы и границы проверки</summary><MaterialText text={unit.teacher_markdown} sectionLabel="разбора"/>{unit.language_only_markdown && <><h3>Только языковые исправления</h3><MaterialText text={unit.language_only_markdown} sectionLabel="языковой правки"/></>}</details>
    <fieldset className={styles.filters} disabled={saving}><legend>Решение проверяющего</legend>
      <label htmlFor="draft-review-decision">Результат проверки</label><select id="draft-review-decision" value={decision} onChange={event => { onDirty(true); setDecision(event.target.value as ReviewDecision); setError(''); }}><option value="pending">Пока не проверено</option><option value="recommend">Рекомендую принять</option><option value="revise">Нужна правка</option><option value="hold">Отложить</option></select>
      <label htmlFor="draft-review-comment">Замечание</label><textarea id="draft-review-comment" rows={4} value={comment} maxLength={3000} onChange={event => { onDirty(true); setComment(event.target.value); }}/>
      <label><input type="checkbox" checked={attested} onChange={event => { onDirty(true); setAttested(event.target.checked); }}/> Проверил условие, ключ, допустимые альтернативы и понятность разбора.</label>
      <div className={styles.actions}><button type="button" onClick={save}>Сохранить решение в этом браузере</button></div>
      {error && <p role="alert">{error}</p>}
    </fieldset>
  </section>;
}

function Workspace({ reviewerId, draftBatch, onBatchChange }: { reviewerId: string; draftBatch: DraftBatch; onBatchChange: (batch: string) => void }) {
  const key = reviewKey(reviewerId, draftBatch);
  const raw = useSyncExternalStore(subscribe, () => { try { return localStorage.getItem(key); } catch { return '!unavailable'; } }, () => null);
  const parsed = parseDraftReview(raw, reviewerId, draftBatch), review = parsed ?? emptyDraftReview(reviewerId, draftBatch);
  const counts = reviewCounts(review, draftBatch);
  const [selected, setSelected] = useState(draftBatch.units[0].id);
  const [message, setMessage] = useState('');
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [pendingUnit, setPendingUnit] = useState<string | null>(null);
  const [pendingBatch, setPendingBatch] = useState<string | null>(null);
  const [pendingExit, setPendingExit] = useState(false);
  const unit = draftBatch.units.find(item => item.id === selected)!;
  useEffect(() => {
    if (!dirty && !saving) return;
    const warn = (event: BeforeUnloadEvent) => { event.preventDefault(); event.returnValue = ''; };
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [dirty, saving]);
  async function save(value: DraftDecision, expected: string | null) {
    setSaving(true); setMessage('Сохранение решения: жду безопасную запись в этом браузере.');
    try {
      await saveDraftDecision(reviewerId, draftBatch, unit.id, value, expected);
      setPendingUnit(null); setPendingBatch(null); setPendingExit(false);
      setMessage(`Решение для ${unit.id} сохранено локально. Статус материала на сайте не изменён.`);
      return true;
    } catch (error) { setMessage(error instanceof DOMException ? 'Браузер не разрешил сохранение. Не закрывай страницу: скопируй замечание перед выходом.' : error instanceof Error ? error.message : 'Не удалось сохранить решение.'); return false; }
    finally { setSaving(false); }
  }
  function exportReview(value: DraftReview) {
    try {
      const url = URL.createObjectURL(new Blob([JSON.stringify(value, null, 2)], { type: 'application/json;charset=utf-8' }));
      const a = document.createElement('a'); a.href = url; a.download = `ASHYQ-batch-${draftBatch.batch}-review.json`; document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(url), 1000);
      setMessage('Сохранённые решения выгружены в JSON. Несохранённые замечания в файл не входят. Непроверенные материалы остаются непроверенными.');
    } catch { setMessage('Не удалось выгрузить файл. Скопируй замечания вручную.'); }
  }
  function exportRecovery() {
    if (raw === null || raw === '!unavailable') return;
    try {
      const url = URL.createObjectURL(new Blob([raw], { type: 'text/plain;charset=utf-8' }));
      const a = document.createElement('a'); a.href = url; a.download = `ASHYQ-batch-${draftBatch.batch}-review-recovery.txt`; document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(url), 1000);
      setMessage('Исходная локальная запись выгружена без изменений для восстановления. Она не считается проверенным набором решений.');
    } catch { setMessage('Не удалось скачать исходную запись. Скопируй замечание перед выходом.'); }
  }
  return <><h1>Проверка учебных материалов</h1><p>Партия {draftBatch.batch} · версия {draftBatch.version} · {counts.total} черновиков. Автор: {draftBatch.author}. Методическая проверка не завершена.</p><p>Сначала реши материал без ключа. Затем проверь объяснения и допустимые ответы. Решения сохраняются для текущего аккаунта в этом браузере; на общем устройстве их могут увидеть другие люди. Они не публикуют задания и не отправляются на сервер.</p>
    <div className={styles.panel}><h2>Рассмотрено {counts.considered} из {counts.total}</h2><p>Рекомендовано принять: {counts.recommended}; нужна правка: {counts.revise}; отложено: {counts.hold}.</p><div className={styles.actions}><button type="button" disabled={raw !== null && !parsed} onClick={() => exportReview(review)}>Скачать сохранённые решения</button><Link href="/trainers" onClick={event => { if (saving) { event.preventDefault(); setMessage('Дождись завершения записи перед выходом.'); } else if (dirty) { event.preventDefault(); setPendingUnit(null); setPendingBatch(null); setPendingExit(true); } }}>К тренажёрам →</Link></div></div>
    {raw !== null && !parsed && <div className={styles.panel}><p className={styles.warning} role="status">{raw === '!unavailable' ? 'Локальное сохранение недоступно.' : 'Локальная запись несовместима с этой версией. Она не восстановлена и не заменена. Скачай исходную запись для восстановления; выгрузка пустого набора решений отключена.'}</p>{raw !== '!unavailable' && <button type="button" onClick={exportRecovery}>Скачать исходную запись для восстановления</button>}</div>}
    <div className={styles.filters}><label htmlFor="draft-batch-picker">Партия материалов</label><select id="draft-batch-picker" value={draftBatch.batch} disabled={saving} onChange={event => { setPendingExit(false); setPendingUnit(null); if (dirty) setPendingBatch(event.target.value); else onBatchChange(event.target.value); }}>{draftBatches.map(batch => <option value={batch.batch} key={batch.batch}>Партия {batch.batch} · {batch.units.length} черновиков</option>)}</select><label htmlFor="draft-material-picker">Выбери материал</label><select id="draft-material-picker" value={selected} disabled={saving} onChange={event => { setPendingExit(false); setPendingBatch(null); if (dirty) setPendingUnit(event.target.value); else { setSelected(event.target.value); setMessage(''); } }}>{draftBatch.units.map(item => <option value={item.id} key={item.id}>{item.id} · {item.title}{review.decisions[item.id]?.decision && review.decisions[item.id].decision !== 'pending' ? ' · рассмотрено' : ''}</option>)}</select></div>
    {(pendingUnit || pendingBatch || pendingExit) && <div className={styles.warning} role="alert"><p>Есть несохранённое решение. Сохрани его внизу материала или явно перейди без сохранения.</p><div className={styles.actions}><button type="button" disabled={saving} onClick={() => { setPendingUnit(null); setPendingBatch(null); setPendingExit(false); }}>Остаться на материале</button>{pendingExit && !saving ? <Link href="/trainers" onClick={() => setDirty(false)}>Перейти без сохранения</Link> : <button type="button" disabled={saving} onClick={() => { if (pendingBatch) { onBatchChange(pendingBatch); return; } if (pendingUnit) setSelected(pendingUnit); setPendingUnit(null); setDirty(false); setMessage(''); }}>Перейти без сохранения</button>}</div></div>}
    <ReviewUnit key={unit.id} unit={unit} batchId={draftBatch.batch} contentHash={draftBatch.content_sha256} previous={review.decisions[unit.id]} onSave={save} onDirty={setDirty}/>
    {message && <p role="status">{message}</p>}
  </>;
}

function ReviewLibrary({ reviewerId }: { reviewerId: string }) {
  const [batchId, setBatchId] = useState(draftBatches[0].batch);
  const batch = draftBatches.find(item => item.batch === batchId)!;
  return <Workspace key={batch.content_sha256} reviewerId={reviewerId} draftBatch={batch} onBatchChange={setBatchId}/>;
}

export default function DraftMaterialReview() {
  return <RequireRole roles={['teacher','author']}>{user => <ReviewLibrary key={user.id} reviewerId={user.id}/>}</RequireRole>;
}
