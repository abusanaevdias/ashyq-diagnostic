'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { draftTask1ClaimLabel, draftTask1Words, parseDraftTask1 } from '@/lib/trainers/draft-task1';
import { parseDraftTask1Categories } from '@/lib/trainers/draft-task1-categories';
import { parseDraftTask1Diagrams } from '@/lib/trainers/draft-task1-diagrams';
import Task1LineChart from './Task1LineChart';
import Task1CategoryChart from './Task1CategoryChart';
import Task1DiagramChart from './Task1DiagramChart';
import styles from './TrainerCheckpoint.module.css';
import BankCheckpoint from './BankCheckpoint';
import {isPublishedBankSource} from '@/lib/trainers/bank-publication';
import type { BankSource } from '@/lib/trainers/bank-sources';
import type { BankTask1Attempt, BankTask1State, BankTask1Pair } from '@/lib/trainers/bank-task1-state';

type Attempt = BankTask1Attempt;
const unchanged=()=>{};
const order = [3,0,5,2,4,1];
function Preview({ pair,source,onDirty,onBusy }: { pair: BankTask1Pair;source:BankSource|null;onDirty:(dirty:boolean)=>void;onBusy:(busy:boolean)=>void }) {
  const [started, setStarted] = useState(false), [round, setRound] = useState<0|1>(0), [phase, setPhase] = useState<'overview'|'draft'|'feedback'|'report'>('overview');
  const [selected, setSelected] = useState<number[]>([]), [overview, setOverview] = useState(''), [evidence, setEvidence] = useState<Record<number,string>>({});
  const [draft, setDraft] = useState(''), [revision, setRevision] = useState(''), [reflection, setReflection] = useState(''), [reviewed, setReviewed] = useState(false), [error, setError] = useState('');
  const [attempts, setAttempts] = useState<Attempt[]>([]), step = useRef<HTMLHeadingElement>(null);
  const [bankBusy,setBankBusy]=useState(false),[generation,setGeneration]=useState(0),[resetRequested,setResetRequested]=useState(false),[focusTick,setFocusTick]=useState(0);
  const heading=useRef<HTMLHeadingElement>(null);
  const handleBusy=useCallback((value:boolean)=>{setBankBusy(value);onBusy(value);},[onBusy]);
  const snapshot:BankTask1State={type:'task1',started,round,phase,selected,overview,evidence,draft,revision,reflection,reviewed,attempts};
  function restore(value:BankTask1State){setStarted(value.started);setRound(value.round);setPhase(value.phase);setSelected(value.selected);setOverview(value.overview);setEvidence(value.evidence);setDraft(value.draft);setRevision(value.revision);setReflection(value.reflection);setReviewed(value.reviewed);setAttempts(value.attempts);setError('');setResetRequested(false);setFocusTick(value=>value+1);}
  const item = pair.charts[round];
  const isDiagram = 'diagram' in item;
  useEffect(() => { if (started||focusTick) { const target=started?step.current:heading.current;target?.focus({ preventScroll: true }); target?.scrollIntoView({ block: 'start',behavior:'instant' }); } }, [started, round, phase,focusTick]);
  function clear() { setSelected([]); setOverview(''); setEvidence({}); setDraft(''); setRevision(''); setReflection(''); setReviewed(false); setError(''); }
  function reset(){setStarted(false);setRound(0);setPhase('overview');setAttempts([]);clear();setResetRequested(false);setGeneration(value=>value+1);setFocusTick(value=>value+1);}
  function commitOverview() {
    if (selected.length !== 3) { setError('Выбери ровно три главные особенности. Это отбор для overview, а не всех верных деталей.'); return; }
    if (overview.trim().length < 12) { setError('Напиши собственный overview: минимум 12 символов. Длина не оценивает качество.'); return; }
    if (selected.some(index => (evidence[index] ?? '').trim().length < 3)) { setError(isDiagram ? 'Для каждой выбранной особенности запиши опору в схеме: минимум 3 символа. Уместность этой опоры проверяется вручную.' : 'Для каждой выбранной особенности запиши опору в значениях графика: минимум 3 символа. Уместность этой опоры проверяется вручную.'); return; }
    setPhase('draft'); setError('');
  }
  function reveal() {
    if (draftTask1Words(draft) < 150) { setError('Для полного учебного ответа напиши не менее 150 слов. Количество слов не подтверждает качество текста.'); return; }
    setRevision(draft); setPhase('feedback'); setError('');
  }
  function advance() {
    if (draftTask1Words(revision) < 150) { setError('В пересмотренном полном ответе нужно не менее 150 слов.'); return; }
    if (!reviewed || reflection.trim().length < 3) { setError(isDiagram ? 'Подтверди сравнение с данными и запиши, что проверишь на новой схеме: минимум 3 символа.' : 'Подтверди сравнение с данными и запиши, что проверишь на новом графике: минимум 3 символа.'); return; }
    setAttempts(old => [...old, { selected: [...selected], overview, evidence: { ...evidence }, draft, revision, reflection }]);
    if (round === 0) { setRound(1); setPhase('overview'); clear(); } else { setPhase('report'); setError(''); }
  }
  return <section className={styles.preview} aria-labelledby="task1-draft-preview-title">
    <h3 ref={heading} tabIndex={-1} id="task1-draft-preview-title">{source&&isPublishedBankSource(source.ref)?'Практика Task 1':'Пробный Task 1 · DRAFT'}</h3>
    <p>Выбери общую картину, напиши свой overview и полный ответ до образца. Затем проверь данные, пересмотри текст и попробуй {isDiagram ? 'новую схему' : 'новый график'}. Свободный текст и обоснования оцениваются вручную. {source?'Работу можно сохранить отдельной кнопкой ниже в этом браузере.':'Это временная проба без сохранения.'} Нет публикации или band IELTS. Ключ, открытый заранее, влияет на независимость попытки.</p>
    <fieldset className={styles.practiceBody} disabled={bankBusy}><legend>Работа с Task 1</legend>
    {!started ? <button type="button" onClick={() => setStarted(true)}>{source&&isPublishedBankSource(source.ref)?'Начать задание':'Пройти Task 1-черновик'}</button> : phase === 'report' ? <>
      <h4 ref={step} tabIndex={-1}>Сравнение двух Task 1-попыток</h4>
      {attempts.map((attempt, index) => <div key={pair.charts[index].title} className={styles.outcome}>
        <h4>{index ? (isDiagram ? 'Новая схема' : 'Новый график') : (isDiagram ? 'Первая схема' : 'Первый график')} · {pair.charts[index].title}</h4><p>Из выбранных особенностей входят в авторский набор: {attempt.selected.filter(value => pair.charts[index].key.includes(value)).length} из 3. Другой отбор может быть обоснован вручную.</p>
        {attempt.selected.map(value => <div key={value}><p lang="en">{pair.charts[index].claims[value][0]}</p><p className={styles.frozenText}>Своя опора в данных: {attempt.evidence[value]}</p><p>{draftTask1ClaimLabel(pair.charts[index], value)}</p></div>)}
        <p className={styles.frozenText}>Первый overview: {attempt.overview}</p><details><summary>Полный ответ до образца · {draftTask1Words(attempt.draft)} слов</summary><p lang="en" className={styles.frozenText}>{attempt.draft}</p></details><details><summary>Полный ответ после образца · {draftTask1Words(attempt.revision)} слов</summary><p lang="en" className={styles.frozenText}>{attempt.revision}</p></details><p className={styles.frozenText}>План после разбора: {attempt.reflection}</p>
      </div>)}<p>Сравнение с авторским отбором не оценивает свободный ответ. Пересмотр выполнялся после образца; два источника не доказывают устойчивый навык.</p>
    </> : <>
      <h4 ref={step} tabIndex={-1}>{round ? (isDiagram ? 'Новая схема' : 'Новый график') : (isDiagram ? 'Первая схема' : 'Первый график')} · {phase === 'overview' ? 'Свой обзор' : phase === 'draft' ? 'Полный ответ до образца' : 'Разбор и пересмотр'}</h4>
      <div className={'diagram' in item&&item.chartType==='map'?styles.mapFrame:styles.chartFrame}>{'diagram' in item?<Task1DiagramChart item={item}/>:'categories' in item?<Task1CategoryChart item={item}/>:<Task1LineChart item={item}/>}</div>
      {phase === 'overview' ? <>
        <fieldset className={styles.filters}><legend>Выбери три главные особенности для overview</legend>{order.map(index => <label key={index}><input type="checkbox" checked={selected.includes(index)} onChange={() => { setSelected(old => old.includes(index) ? old.filter(value => value !== index) : [...old,index]); setError(''); }}/><span lang="en">{item.claims[index][0]}</span></label>)}</fieldset>
        <p>Выбрано {selected.length} из 3. {isDiagram ? 'Верная отдельная деталь может уступать общей картине процесса или изменений.' : 'Верная отдельная цифра может уступать общей тенденции.'}</p><label htmlFor="draft-task1-overview">Свой overview до образца</label><textarea id="draft-task1-overview" rows={3} maxLength={1800} value={overview} onChange={event => { setOverview(event.target.value); setError(''); }}/>
        <div className={styles.previewReasons}>{selected.map(index => <div key={index}><label htmlFor={`draft-task1-evidence-${index}`}>Опора в данных · {item.claims[index][0]}</label><textarea id={`draft-task1-evidence-${index}`} rows={2} maxLength={600} value={evidence[index] ?? ''} onChange={event => { const value = event.target.value; setEvidence(old => ({ ...old, [index]: value })); setError(''); }}/></div>)}</div><button type="button" onClick={commitOverview}>Зафиксировать overview и написать ответ</button>
      </> : phase === 'draft' ? <>
        <p className={styles.frozenText}>Зафиксированный overview: {overview}</p><label htmlFor="draft-task1-first">Полный ответ до образца</label><textarea id="draft-task1-first" rows={12} maxLength={10000} value={draft} onChange={event => { setDraft(event.target.value); setError(''); }}/><p>{draftTask1Words(draft)} слов. Порог в 150 слов проверяет только объём.</p><button type="button" onClick={reveal}>Зафиксировать полный ответ и открыть разбор</button>
      </> : <>
        <p>Первый overview и полный ответ зафиксированы. Авторский набор — один обоснованный отбор, а не единственный допустимый текст.</p><div className={styles.outcome}>{item.claims.map((claim,index) => <div key={index}><p lang="en"><strong>{selected.includes(index) ? 'Твой выбор: ' : ''}{claim[0]}</strong></p><p className={selected.includes(index) && !claim[1] ? styles.warning : undefined}>{draftTask1ClaimLabel(item,index)}</p></div>)}</div>
        <p className={styles.frozenText}>Твой первый overview: {overview}</p><p lang="en"><strong>Пример overview:</strong> {item.overview}</p><details><summary>Пример полного ответа · {draftTask1Words(item.model)} слов</summary><p lang="en" className={styles.frozenText}>{item.model}</p></details><details><summary>Твой зафиксированный полный ответ · {draftTask1Words(draft)} слов</summary><p lang="en" className={styles.frozenText}>{draft}</p></details>
        <label htmlFor="draft-task1-revision">Пересмотренный полный ответ</label><textarea id="draft-task1-revision" rows={12} maxLength={10000} value={revision} onChange={event => { setRevision(event.target.value); setError(''); }}/><p>{draftTask1Words(revision)} слов. Можно сохранить текст без изменений, если проверка данных и логики не выявила проблемы; объясни это ниже.</p><label htmlFor="draft-task1-reflection">{isDiagram ? 'Что проверишь на новой схеме?' : 'Что проверишь на новом графике?'}</label><textarea id="draft-task1-reflection" rows={3} maxLength={600} value={reflection} onChange={event => { setReflection(event.target.value); setError(''); }}/><label className={styles.consent}><input type="checkbox" checked={reviewed} onChange={event => { setReviewed(event.target.checked); setError(''); }}/>Сопоставил свой текст с данными; понимаю, что он не получил автоматическую оценку.</label><button type="button" onClick={advance}>{round ? 'Сравнить две Task 1-попытки' : (isDiagram ? 'Перейти к новой Task 1-схеме' : 'Перейти к новому Task 1-графику')}</button>
      </>}
      {error && <p role="status" className={styles.warning}>{error}</p>}
    </>}
    </fieldset>
    {source&&<BankCheckpoint key={generation} source={source} data={snapshot} onRestore={value=>{if(value.type==='task1')restore(value);}} onDirty={onDirty} onBusy={handleBusy}/>}
    {started&&<div className={styles.actions}><button type="button" disabled={bankBusy} onClick={()=>source?setResetRequested(true):reset()}>Начать новую Task 1-пробу</button></div>}
    {resetRequested&&<div role="alert" className={styles.warning}><p>Новая проба очистит текст на экране. Сохранённая работа и история останутся; несохранённые изменения сначала сохрани или скачай.</p><div className={styles.actions}><button type="button" disabled={bankBusy} onClick={reset}>Подтвердить новую Task 1-пробу</button><button type="button" disabled={bankBusy} onClick={()=>setResetRequested(false)}>Продолжить текущую Task 1-пробу</button></div></div>}
  </section>;
}
export default function DraftTask1Preview({ value,source=null,onDirty=unchanged,onBusy=unchanged }: { value: unknown;source?:BankSource|null;onDirty?:(dirty:boolean)=>void;onBusy?:(busy:boolean)=>void }) {
  if (!value || typeof value !== 'object' || !('kind' in value) || !['task1-pair-v1','task1-categories-pair-v1','task1-diagrams-pair-v1'].includes(String(value.kind))) return null;
  const pair = value.kind==='task1-pair-v1'?parseDraftTask1(value):value.kind==='task1-categories-pair-v1'?parseDraftTask1Categories(value):parseDraftTask1Diagrams(value);
  if (!pair) return <p role="alert">Структура Task 1-черновика не прошла проверку. Проба недоступна; другой источник не подставлен.</p>;
  return <Preview key={pair.charts[0].title} pair={pair} source={source} onDirty={onDirty} onBusy={onBusy}/>;
}
