'use client';

import { useEffect, useRef, useState } from 'react';
import { draftTask1ClaimLabel, draftTask1Words, parseDraftTask1, type DraftTask1Chart } from '@/lib/trainers/draft-task1';
import { parseDraftTask1Categories, type Task1CategoryChart as CategoryChart } from '@/lib/trainers/draft-task1-categories';
import Task1LineChart from './Task1LineChart';
import Task1CategoryChart from './Task1CategoryChart';
import styles from './TrainerCheckpoint.module.css';

type Attempt = { selected: number[]; overview: string; evidence: Record<number, string>; draft: string; revision: string; reflection: string };
const order = [3,0,5,2,4,1];
function Preview({ pair }: { pair: { charts: (DraftTask1Chart|CategoryChart)[] } }) {
  const [started, setStarted] = useState(false), [round, setRound] = useState(0), [phase, setPhase] = useState<'overview'|'draft'|'feedback'|'report'>('overview');
  const [selected, setSelected] = useState<number[]>([]), [overview, setOverview] = useState(''), [evidence, setEvidence] = useState<Record<number,string>>({});
  const [draft, setDraft] = useState(''), [revision, setRevision] = useState(''), [reflection, setReflection] = useState(''), [reviewed, setReviewed] = useState(false), [error, setError] = useState('');
  const [attempts, setAttempts] = useState<Attempt[]>([]), step = useRef<HTMLHeadingElement>(null);
  const item = pair.charts[round];
  useEffect(() => { if (started) { step.current?.focus({ preventScroll: true }); step.current?.scrollIntoView({ block: 'start' }); } }, [started, round, phase]);
  function clear() { setSelected([]); setOverview(''); setEvidence({}); setDraft(''); setRevision(''); setReflection(''); setReviewed(false); setError(''); }
  function commitOverview() {
    if (selected.length !== 3) { setError('Выбери ровно три главные особенности. Это отбор для overview, а не всех верных деталей.'); return; }
    if (overview.trim().length < 12) { setError('Напиши собственный overview: минимум 12 символов. Длина не оценивает качество.'); return; }
    if (selected.some(index => (evidence[index] ?? '').trim().length < 3)) { setError('Для каждой выбранной особенности запиши опору в значениях графика: минимум 3 символа. Уместность этой опоры проверяется вручную.'); return; }
    setPhase('draft'); setError('');
  }
  function reveal() {
    if (draftTask1Words(draft) < 150) { setError('Для полного учебного ответа напиши не менее 150 слов. Количество слов не подтверждает качество текста.'); return; }
    setRevision(draft); setPhase('feedback'); setError('');
  }
  function advance() {
    if (draftTask1Words(revision) < 150) { setError('В пересмотренном полном ответе нужно не менее 150 слов.'); return; }
    if (!reviewed || reflection.trim().length < 3) { setError('Подтверди сравнение с данными и запиши, что проверишь на новом графике: минимум 3 символа.'); return; }
    setAttempts(old => [...old, { selected: [...selected], overview, evidence: { ...evidence }, draft, revision, reflection }]);
    if (round === 0) { setRound(1); setPhase('overview'); clear(); } else { setPhase('report'); setError(''); }
  }
  return <section className={styles.preview} aria-labelledby="task1-draft-preview-title">
    <h3 id="task1-draft-preview-title">Пробный Task 1 · DRAFT</h3>
    <p>Выбери общую картину, напиши свой overview и полный ответ до образца. Затем проверь данные, пересмотри текст и попробуй новый график. Свободный текст и обоснования оцениваются вручную. Это временная проба рецензента без сохранения, публикации или band IELTS. Ключ, открытый заранее, влияет на независимость попытки.</p>
    {!started ? <button type="button" onClick={() => setStarted(true)}>Пройти Task 1-черновик</button> : phase === 'report' ? <>
      <h4 ref={step} tabIndex={-1}>Сравнение двух Task 1-попыток</h4>
      {attempts.map((attempt, index) => <div key={pair.charts[index].title} className={styles.outcome}>
        <h4>{index ? 'Новый график' : 'Первый график'} · {pair.charts[index].title}</h4><p>Из выбранных особенностей входят в авторский набор: {attempt.selected.filter(value => pair.charts[index].key.includes(value)).length} из 3. Другой отбор может быть обоснован вручную.</p>
        {attempt.selected.map(value => <div key={value}><p lang="en">{pair.charts[index].claims[value][0]}</p><p className={styles.frozenText}>Своя опора в данных: {attempt.evidence[value]}</p><p>{draftTask1ClaimLabel(pair.charts[index], value)}</p></div>)}
        <p className={styles.frozenText}>Первый overview: {attempt.overview}</p><details><summary>Полный ответ до образца · {draftTask1Words(attempt.draft)} слов</summary><p lang="en" className={styles.frozenText}>{attempt.draft}</p></details><details><summary>Полный ответ после образца · {draftTask1Words(attempt.revision)} слов</summary><p lang="en" className={styles.frozenText}>{attempt.revision}</p></details><p className={styles.frozenText}>План после разбора: {attempt.reflection}</p>
      </div>)}<p>Сравнение с авторским отбором не оценивает свободный ответ. Пересмотр выполнялся после образца; два графика не доказывают устойчивый навык.</p><button type="button" onClick={() => { setRound(0); setPhase('overview'); setAttempts([]); clear(); }}>Начать новую временную Task 1-пробу</button>
    </> : <>
      <h4 ref={step} tabIndex={-1}>{round ? 'Новый график' : 'Первый график'} · {phase === 'overview' ? 'Свой обзор' : phase === 'draft' ? 'Полный ответ до образца' : 'Разбор и пересмотр'}</h4>
      <div className={styles.chartFrame}>{'categories' in item?<Task1CategoryChart item={item}/>:<Task1LineChart item={item}/>}</div>
      {phase === 'overview' ? <>
        <fieldset className={styles.filters}><legend>Выбери три главные особенности для overview</legend>{order.map(index => <label key={index}><input type="checkbox" checked={selected.includes(index)} onChange={() => { setSelected(old => old.includes(index) ? old.filter(value => value !== index) : [...old,index]); setError(''); }}/><span lang="en">{item.claims[index][0]}</span></label>)}</fieldset>
        <p>Выбрано {selected.length} из 3. Верная отдельная цифра может уступать общей тенденции.</p><label htmlFor="draft-task1-overview">Свой overview до образца</label><textarea id="draft-task1-overview" rows={3} maxLength={1800} value={overview} onChange={event => { setOverview(event.target.value); setError(''); }}/>
        <div className={styles.previewReasons}>{selected.map(index => <label key={index}>Опора в данных · {item.claims[index][0]}<textarea rows={2} maxLength={600} value={evidence[index] ?? ''} onChange={event => { const value = event.target.value; setEvidence(old => ({ ...old, [index]: value })); setError(''); }}/></label>)}</div><button type="button" onClick={commitOverview}>Зафиксировать overview и написать ответ</button>
      </> : phase === 'draft' ? <>
        <p className={styles.frozenText}>Зафиксированный overview: {overview}</p><label htmlFor="draft-task1-first">Полный ответ до образца</label><textarea id="draft-task1-first" rows={12} maxLength={10000} value={draft} onChange={event => { setDraft(event.target.value); setError(''); }}/><p>{draftTask1Words(draft)} слов. Порог в 150 слов проверяет только объём.</p><button type="button" onClick={reveal}>Зафиксировать полный ответ и открыть разбор</button>
      </> : <>
        <p>Первый overview и полный ответ зафиксированы. Авторский набор — один обоснованный отбор, а не единственный допустимый текст.</p><div className={styles.outcome}>{item.claims.map((claim,index) => <div key={index}><p lang="en"><strong>{selected.includes(index) ? 'Твой выбор: ' : ''}{claim[0]}</strong></p><p className={selected.includes(index) && !claim[1] ? styles.warning : undefined}>{draftTask1ClaimLabel(item,index)}</p></div>)}</div>
        <p className={styles.frozenText}>Твой первый overview: {overview}</p><p lang="en"><strong>Пример overview:</strong> {item.overview}</p><details><summary>Пример полного ответа · {draftTask1Words(item.model)} слов</summary><p lang="en" className={styles.frozenText}>{item.model}</p></details><details><summary>Твой зафиксированный полный ответ · {draftTask1Words(draft)} слов</summary><p lang="en" className={styles.frozenText}>{draft}</p></details>
        <label htmlFor="draft-task1-revision">Пересмотренный полный ответ</label><textarea id="draft-task1-revision" rows={12} maxLength={10000} value={revision} onChange={event => { setRevision(event.target.value); setError(''); }}/><p>{draftTask1Words(revision)} слов. Можно сохранить текст без изменений, если проверка данных и логики не выявила проблемы; объясни это ниже.</p><label htmlFor="draft-task1-reflection">Что проверишь на новом графике?</label><textarea id="draft-task1-reflection" rows={3} maxLength={600} value={reflection} onChange={event => { setReflection(event.target.value); setError(''); }}/><label className={styles.consent}><input type="checkbox" checked={reviewed} onChange={event => { setReviewed(event.target.checked); setError(''); }}/>Сопоставил свой текст с данными; понимаю, что он не получил автоматическую оценку.</label><button type="button" onClick={advance}>{round ? 'Сравнить две Task 1-попытки' : 'Перейти к новому Task 1-графику'}</button>
      </>}
      {error && <p role="status" className={styles.warning}>{error}</p>}
    </>}
  </section>;
}
export default function DraftTask1Preview({ value }: { value: unknown }) {
  if (!value || typeof value !== 'object' || !('kind' in value) || !['task1-pair-v1','task1-categories-pair-v1'].includes(String(value.kind))) return null;
  const pair = value.kind==='task1-pair-v1'?parseDraftTask1(value):parseDraftTask1Categories(value);
  if (!pair) return <p role="alert">Структура Task 1-черновика не прошла проверку. Проба недоступна; другой график не подставлен.</p>;
  return <Preview key={pair.charts[0].title} pair={pair}/>;
}
