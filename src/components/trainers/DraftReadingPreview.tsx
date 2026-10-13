'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { isReadingLabel, parseDraftReading, READING_LABELS, type DraftReadingPair, type ReadingLabel } from '@/lib/trainers/draft-reading';
import styles from './TrainerCheckpoint.module.css';
import BankCheckpoint from './BankCheckpoint';
import type { BankSource } from '@/lib/trainers/bank-sources';
import { blankBankReadingResponses, type BankReadingState, type BankReadingResponse, type BankReadingAttempt } from '@/lib/trainers/bank-reading-state';

type Response = BankReadingResponse;
type Attempt = BankReadingAttempt;
const blank = blankBankReadingResponses;
const unchanged=()=>{};
function Preview({ pair,source,onDirty,onBusy }: { pair: DraftReadingPair;source:BankSource|null;onDirty:(dirty:boolean)=>void;onBusy:(busy:boolean)=>void }) {
  const [started, setStarted] = useState(false), [round, setRound] = useState<0|1>(0), [report, setReport] = useState(false);
  const [responses, setResponses] = useState(blank), [frozen, setFrozen] = useState<Response[] | null>(null);
  const [repairs, setRepairs] = useState<(ReadingLabel | '')[]>(['','','']), [reflection, setReflection] = useState(''), [error, setError] = useState('');
  const [attempts, setAttempts] = useState<Attempt[]>([]), step = useRef<HTMLHeadingElement>(null);
  const [bankBusy,setBankBusy]=useState(false),[generation,setGeneration]=useState(0),[resetRequested,setResetRequested]=useState(false),[focusTick,setFocusTick]=useState(0);
  const heading=useRef<HTMLHeadingElement>(null);
  const handleBusy=useCallback((value:boolean)=>{setBankBusy(value);onBusy(value);},[onBusy]);
  const snapshot:BankReadingState={type:'reading',started,round,report,responses,frozen,repairs,reflection,attempts};
  function restore(value:BankReadingState){setStarted(value.started);setRound(value.round);setReport(value.report);setResponses(value.responses);setFrozen(value.frozen);setRepairs(value.repairs);setReflection(value.reflection);setAttempts(value.attempts);setError('');setResetRequested(false);setFocusTick(value=>value+1);}
  const item = pair.rounds[round];
  useEffect(() => { if (started||focusTick) { const target=started?step.current:heading.current;target?.focus({ preventScroll: true }); target?.scrollIntoView({ block: 'start',behavior:'instant' }); } }, [started, round, report,focusTick]);
  function update(index: number, key: keyof Response, value: string) {
    if (key === 'choice' && value !== '' && !isReadingLabel(value)) return;
    setResponses(old => old.map((response, i) => i === index ? { ...response, [key]: value } : response)); setError('');
  }
  function reveal() {
    for (const [index, response] of responses.entries()) {
      if (!response.choice || response.reason.trim().length < 3) { setError(`Утверждение ${index + 1}: выбери категорию и объясни связь с текстом минимум в 3 символах. Длина не оценивает качество объяснения.`); return; }
      if (response.choice !== 'NOT GIVEN' && response.excerpt.trim().length < 3) { setError(`Утверждение ${index + 1}: скопируй относящийся к нему фрагмент текста. Для NOT GIVEN можно оставить фрагмент пустым и объяснить, каких данных не хватает.`); return; }
      if (response.excerpt.trim() && !item.text.includes(response.excerpt.trim())) { setError(`Утверждение ${index + 1}: фрагмент должен дословно присутствовать в тексте. Это проверка цитирования, а не правильности доказательства.`); return; }
    }
    setFrozen(responses.map(response => ({ ...response }))); setError('');
  }
  function clear() { setResponses(blank()); setFrozen(null); setRepairs(['','','']); setReflection(''); setError(''); }
  function reset(){setStarted(false);setRound(0);setReport(false);setAttempts([]);clear();setResetRequested(false);setGeneration(value=>value+1);setFocusTick(value=>value+1);}
  function advance() {
    if (!frozen) return;
    if (!repairs.every(isReadingLabel)) { setError('После разбора отметь категорию для всех трёх утверждений. Первая попытка останется отдельно.'); return; }
    if (repairs.some((choice, i) => choice !== item.claims[i].answer)) { setError('Один из ответов после разбора ещё отличается от ключа. Сопоставь утверждение с объяснением; первая попытка не меняется.'); return; }
    if (reflection.trim().length < 3) { setError('Запиши, что проверишь в новом тексте: минимум 3 символа.'); return; }
    setAttempts(old => [...old, { first: frozen, repair: repairs, reflection }]);
    if (round === 0) { setRound(1); clear(); } else { setReport(true); setError(''); }
  }
  return <section className={styles.preview} aria-labelledby="reading-draft-preview-title">
    <h3 ref={heading} tabIndex={-1} id="reading-draft-preview-title">Пробное Reading · DRAFT</h3>
    <p>Сначала выбери категорию и объясни её, потом открой разбор. TRUE — текст подтверждает всё утверждение; FALSE — противоречит ему; NOT GIVEN — данных не хватает. Свободные объяснения и уместность цитат проверяются вручную. {source?'Работу можно сохранить отдельной кнопкой ниже в этом браузере.':'Это временная проба без сохранения.'} Нет публикации или балла IELTS. Предварительный просмотр ключа влияет на независимость попытки.</p>
    <fieldset className={styles.practiceBody} disabled={bankBusy}><legend>Работа с Reading-текстами</legend>
    {!started ? <button type="button" onClick={() => setStarted(true)}>Пройти Reading-черновик</button> : report ? <>
      <h4 ref={step} tabIndex={-1}>Сравнение двух Reading-попыток</h4>
      {attempts.map((attempt, index) => <div key={pair.rounds[index].id} className={styles.outcome}>
        <h4>{index === 0 ? 'Первый текст' : 'Новый текст'} · {pair.rounds[index].id}</h4>
        <p>Категории до разбора совпали с ключом: {attempt.first.filter((response, i) => response.choice === pair.rounds[index].claims[i].answer).length} из 3. Это не оценка объяснений.</p>
        {attempt.first.map((response, i) => <div key={i}><p lang="en"><strong>{i + 1}. {pair.rounds[index].claims[i].statement}</strong></p><p>До разбора: {response.choice}. После разбора: {attempt.repair[i]}.</p><p className={styles.frozenText}>Своя цитата: {response.excerpt || 'Не указана (NOT GIVEN).'}</p><p className={styles.frozenText}>Первое объяснение: {response.reason}</p></div>)}
        <p className={styles.frozenText}>План после разбора: {attempt.reflection}</p>
      </div>)}
      <p>После разбора ответы повторялись с открытыми объяснениями. Два текста не подтверждают устойчивый навык или рост IELTS.</p>
    </> : <>
      <h4 ref={step} tabIndex={-1}>{round === 0 ? 'Первый текст' : 'Новый текст'} · {item.id}</h4><p lang="en" className={styles.frozenText}>{item.text}</p>
      {item.claims.map((claim, index) => <div key={index} className={`${styles.outcome} ${styles.readingClaim}`}>
        <h4 lang="en">{index + 1}. {claim.statement}</h4>
        <label htmlFor={`draft-reading-choice-${index}`}>Категория до разбора · {index + 1}</label><select id={`draft-reading-choice-${index}`} disabled={!!frozen} value={responses[index].choice} onChange={event => update(index, 'choice', event.target.value)}><option value="">Выбери категорию</option>{READING_LABELS.map(value => <option key={value}>{value}</option>)}</select>
        <label htmlFor={`draft-reading-excerpt-${index}`}>Своя цитата из текста · {index + 1}</label><textarea id={`draft-reading-excerpt-${index}`} rows={2} maxLength={600} disabled={!!frozen} value={responses[index].excerpt} onChange={event => update(index, 'excerpt', event.target.value)}/>
        <label htmlFor={`draft-reading-reason-${index}`}>Почему эта категория · {index + 1}</label><textarea id={`draft-reading-reason-${index}`} rows={2} maxLength={600} disabled={!!frozen} value={responses[index].reason} onChange={event => update(index, 'reason', event.target.value)}/>
        {frozen && <><p className={frozen[index].choice === claim.answer ? undefined : styles.warning}>{frozen[index].choice === claim.answer ? 'Первая категория совпала с ключом.' : 'Первая категория отличается от ключа.'} Качество объяснения не оценивалось.</p><p><strong>Ключ: {claim.answer}.</strong></p><blockquote lang="en">{claim.evidence}</blockquote><p>{claim.explanation}</p><label htmlFor={`draft-reading-repair-${index}`}>Категория после разбора · {index + 1}</label><select id={`draft-reading-repair-${index}`} value={repairs[index]} onChange={event => { const value = event.target.value; if (value === '' || isReadingLabel(value)) setRepairs(old => old.map((choice, i) => i === index ? value : choice)); setError(''); }}><option value="">Сравни с объяснением</option>{READING_LABELS.map(value => <option key={value}>{value}</option>)}</select></>}
      </div>)}
      {!frozen ? <button type="button" onClick={reveal}>Зафиксировать ответы и открыть разбор</button> : <><label htmlFor="draft-reading-reflection">Что проверишь в новом тексте?</label><textarea id="draft-reading-reflection" rows={3} maxLength={600} value={reflection} onChange={event => { setReflection(event.target.value); setError(''); }}/><button type="button" onClick={advance}>{round === 0 ? 'Перейти к новому Reading-тексту' : 'Сравнить две Reading-попытки'}</button></>}
      {error && <p role="status" className={styles.warning}>{error}</p>}
    </>}
    </fieldset>
    {source&&<BankCheckpoint key={generation} source={source} data={snapshot} onRestore={value=>{if(value.type==='reading')restore(value);}} onDirty={onDirty} onBusy={handleBusy}/>}
    {started&&<div className={styles.actions}><button type="button" disabled={bankBusy} onClick={()=>source?setResetRequested(true):reset()}>Начать новую Reading-пробу</button></div>}
    {resetRequested&&<div role="alert" className={styles.warning}><p>Новая проба очистит текст на экране. Сохранённая работа и история останутся; несохранённые изменения сначала сохрани или скачай.</p><div className={styles.actions}><button type="button" disabled={bankBusy} onClick={reset}>Подтвердить новую Reading-пробу</button><button type="button" disabled={bankBusy} onClick={()=>setResetRequested(false)}>Продолжить текущую Reading-пробу</button></div></div>}
  </section>;
}
export default function DraftReadingPreview({ value,source=null,onDirty=unchanged,onBusy=unchanged }: { value: unknown;source?:BankSource|null;onDirty?:(dirty:boolean)=>void;onBusy?:(busy:boolean)=>void }) {
  if (!value || typeof value !== 'object' || !('kind' in value) || value.kind !== 'reading-evidence-pair-v1') return null;
  const pair = parseDraftReading(value);
  if (!pair) return <p role="alert">Структура Reading-черновика не прошла проверку. Проба недоступна; другой текст не подставлен.</p>;
  return <Preview key={pair.rounds[0].id} pair={pair} source={source} onDirty={onDirty} onBusy={onBusy}/>;
}
