'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { draftMathChoiceLabel, parseDraftMath, parseDraftMathNumber, type DraftMathPair } from '@/lib/trainers/draft-math';
import styles from './TrainerCheckpoint.module.css';
import BankCheckpoint from './BankCheckpoint';
import type { BankSource } from '@/lib/trainers/bank-sources';
import type { BankMathAttempt, BankMathState } from '@/lib/trainers/bank-math-state';

type Attempt = BankMathAttempt;
const unchanged=()=>{};
function Preview({ pair,source,onDirty,onBusy }: { pair: DraftMathPair;source:BankSource|null;onDirty:(dirty:boolean)=>void;onBusy:(busy:boolean)=>void }) {
  const [started, setStarted] = useState(false), [round, setRound] = useState<0|1>(0), [report, setReport] = useState(false);
  const [working, setWorking] = useState(''), [answer, setAnswer] = useState(''), [choice, setChoice] = useState<number | null>(null);
  const [locked, setLocked] = useState(false), [checked, setChecked] = useState(false), [reflection, setReflection] = useState(''), [error, setError] = useState('');
  const [repairedWorking, setRepairedWorking] = useState(''), [repairedAnswer, setRepairedAnswer] = useState('');
  const [attempts, setAttempts] = useState<Attempt[]>([]), step = useRef<HTMLHeadingElement>(null);
  const [bankBusy,setBankBusy]=useState(false),[generation,setGeneration]=useState(0),[resetRequested,setResetRequested]=useState(false),[focusTick,setFocusTick]=useState(0);
  const heading=useRef<HTMLHeadingElement>(null);
  const handleBusy=useCallback((value:boolean)=>{setBankBusy(value);onBusy(value);},[onBusy]);
  const snapshot:BankMathState={type:'math',started,round,report,working,answer,choice,locked,checked,reflection,repairedWorking,repairedAnswer,attempts};
  function restore(value:BankMathState){setStarted(value.started);setRound(value.round);setReport(value.report);setWorking(value.working);setAnswer(value.answer);setChoice(value.choice);setLocked(value.locked);setChecked(value.checked);setReflection(value.reflection);setRepairedWorking(value.repairedWorking);setRepairedAnswer(value.repairedAnswer);setAttempts(value.attempts);setError('');setResetRequested(false);setFocusTick(value=>value+1);}
  const item = pair.rounds[round];
  useEffect(() => { if (started||focusTick) { const target=started?step.current:heading.current;target?.focus({ preventScroll: true }); target?.scrollIntoView({ block: 'start',behavior:'instant' }); } }, [started, round, report,focusTick]);
  function clearRound() { setWorking(''); setAnswer(''); setChoice(null); setLocked(false); setChecked(false); setReflection(''); setRepairedWorking(''); setRepairedAnswer(''); setError(''); }
  function reset() { setStarted(false);setRound(0); setReport(false); setAttempts([]); clearRound();setResetRequested(false);setGeneration(value=>value+1);setFocusTick(value=>value+1); }
  function lock() {
    if (working.trim().length < 3) { setError('Запиши модель или действия своими словами: минимум 3 символа. Короткое уравнение тоже подходит.'); return; }
    if (parseDraftMathNumber(answer) === null) { setError('Введи десятичное число длиной до 15 символов без слов; можно использовать точку или запятую.'); return; }
    if (pair.family === 'method-switch' && choice === null) { setError('Сначала отметь, каким способом начнёшь. Сам выбор способа не оценивается.'); return; }
    setLocked(true); setError('');
  }
  function check() { if (choice === null) { setError(pair.family === 'translation' ? 'Выбери модель для сравнения.' : 'Укажи первый неверный переход.'); return; } setChecked(true); setError(''); }
  function advance() {
    const numericAnswer = parseDraftMathNumber(answer);
    if (!checked || choice === null || numericAnswer === null) return;
    if (reflection.trim().length < 3) { setError('Запиши, что проверишь в новой задаче: минимум 3 символа.'); return; }
    const repairedNumericAnswer = parseDraftMathNumber(repairedAnswer);
    if (repairedWorking.trim().length < 3 || repairedNumericAnswer === null) { setError('После разбора запиши отдельную версию решения и числовой ответ. Можно оставить прежнее решение, если ты проверил его; первая попытка сохранится отдельно.'); return; }
    setAttempts(old => [...old, { working, answer, numericAnswer, choice, reflection, repairedWorking, repairedAnswer, repairedNumericAnswer }]);
    if (round === 0) { setRound(1); clearRound(); } else { setReport(true); setError(''); }
  }
  return <section className={styles.preview} aria-labelledby="math-draft-preview-title">
    <h3 ref={heading} tabIndex={-1} id="math-draft-preview-title">Пробная математика · DRAFT</h3>
    <p>Сначала реши сам, затем сравни модель или переход и проверь число. Записи действий проверяются вручную: выбор подготовленного варианта не доказывает правильность твоего решения. {source?'Работу можно сохранить отдельной кнопкой ниже в этом браузере.':'Это временная проба без сохранения.'} Нет публикации или балла SAT. Просмотр ключа заранее влияет на независимость попытки.</p>
    <fieldset className={styles.practiceBody} disabled={bankBusy}><legend>Работа с Math-задачами</legend>
    {!started ? <button type="button" onClick={() => setStarted(true)}>Пройти Math-черновик</button> : report ? <>
      <h4 ref={step} tabIndex={-1}>Сравнение двух Math-попыток</h4>{attempts.map((attempt, index) => <div key={pair.rounds[index].id} className={styles.outcome}>
        <h4>{index === 0 ? 'Первая задача' : 'Новая задача'} · {pair.rounds[index].id}</h4><p className={styles.frozenText}>Свои действия: {attempt.working}</p><p>Первый ответ: {attempt.answer} {pair.rounds[index].unit}.</p><p>{attempt.numericAnswer === pair.rounds[index].answer ? 'Число совпало с подготовленным ответом.' : 'Число отличается от подготовленного ответа.'}</p><p>{draftMathChoiceLabel(pair.rounds[index], pair.family, attempt.choice)}</p>{pair.family === 'method-switch' && <p>Отмеченный способ: {pair.rounds[index].methods![attempt.choice].title}.</p>}<p className={styles.frozenText}>Версия решения после помощи: {attempt.repairedWorking}</p><p>Ответ после помощи: {attempt.repairedAnswer} {pair.rounds[index].unit}.</p><p>{attempt.repairedNumericAnswer === pair.rounds[index].answer ? 'После помощи число совпало с ключом; качество действий не оценивалось.' : 'После помощи число всё ещё отличается от ключа; проверь решение с учителем.'}</p><p className={styles.frozenText}>После разбора: {attempt.reflection}</p>
      </div>)}<p>Две задачи не подтверждают устойчивый навык или рост балла. Первые ответы и размышления после помощи показаны отдельно.</p>
    </> : <>
      <h4 ref={step} tabIndex={-1}>{round === 0 ? 'Первая задача' : 'Новая задача'} · {item.id}</h4><p lang="en">{item.prompt}</p><p lang="en">{item.variable}</p>
      {pair.family === 'forensics' && <><p>Проверь предложенные строки решения:</p><ol className={styles.mathSteps}>{item.steps!.map((line, index) => <li key={index}>{line.statement}</li>)}</ol></>}
      {pair.family === 'method-switch' && <fieldset className={styles.filters} disabled={locked}><legend>Каким способом начнёшь?</legend>{item.methods!.map((method, index) => <label key={index}><input type="radio" name="draft-math-method" checked={choice === index} onChange={() => { setChoice(index); setError(''); }}/><span>{method.title}</span></label>)}</fieldset>}
      <label htmlFor="draft-math-working">Твоя модель или действия до разбора</label><textarea id="draft-math-working" rows={4} maxLength={600} disabled={locked} value={working} onChange={event => { setWorking(event.target.value); setError(''); }}/>
      <label htmlFor="draft-math-answer">Твой числовой ответ{item.unit ? ` · ${item.unit}` : ''}</label><input id="draft-math-answer" inputMode="decimal" maxLength={60} disabled={locked} value={answer} onChange={event => { setAnswer(event.target.value); setError(''); }}/>
      {!locked ? <button type="button" onClick={lock}>Зафиксировать своё решение</button> : <>
        {pair.family !== 'method-switch' && <fieldset className={styles.filters} disabled={checked}><legend>{pair.family === 'translation' ? 'Какая модель соответствует условию?' : 'Где первый неверный переход?'}</legend>{(pair.family === 'translation' ? item.models!.map(model => model.equation) : item.steps!.map((line, index) => `Строка ${index + 1}: ${line.statement}`)).map((label, index) => <label key={index}><input type="radio" name="draft-math-comparison" checked={choice === index} onChange={() => { setChoice(index); setError(''); }}/><span>{label}</span></label>)}</fieldset>}
        {!checked ? <button type="button" onClick={check}>Сравнить с разбором</button> : <div className={styles.outcome}>
          <h4>{parseDraftMathNumber(answer) === item.answer ? 'Число совпало с подготовленным ответом' : 'Число отличается от подготовленного ответа'}</h4><p className={styles.warning}>{draftMathChoiceLabel(item, pair.family, choice!)}</p>
          {pair.family === 'translation' && <p>{item.models![choice!].feedback}</p>}{pair.family === 'forensics' && <p>Первая неверная строка: {item.first_invalid! + 1}. {item.steps![item.first_invalid!].explanation}</p>}
          <p><strong>Подготовленный ответ:</strong> {item.answer} {item.unit}.</p><p>{item.explanation}</p><ol className={styles.mathSteps}>{item.corrected_working.map((line, index) => <li key={index}>{line}</li>)}</ol>
          {pair.family === 'method-switch' && <details><summary>Сравнить два допустимых способа</summary>{item.methods!.map((method, index) => <div key={index}><h4>{method.title}</h4>{method.working.map((line, n) => <p key={n}>{line}</p>)}<p>{method.tradeoff}</p></div>)}</details>}
          <label htmlFor="draft-math-repaired-working">Твоё решение после разбора</label><textarea id="draft-math-repaired-working" rows={4} maxLength={600} value={repairedWorking} onChange={event => { setRepairedWorking(event.target.value); setError(''); }}/>
          <label htmlFor="draft-math-repaired-answer">Твой числовой ответ после разбора</label><input id="draft-math-repaired-answer" inputMode="decimal" maxLength={60} value={repairedAnswer} onChange={event => { setRepairedAnswer(event.target.value); setError(''); }}/>
          <p>Это версия после помощи, а не независимая попытка. Можно сохранить прежние действия после проверки; совпадение числа не оценивает рассуждение.</p>
          <div className={styles.previewReasons}><label htmlFor="draft-math-reflection">Что проверишь в новой задаче?<textarea id="draft-math-reflection" rows={3} maxLength={600} value={reflection} onChange={event => { setReflection(event.target.value); setError(''); }}/></label></div>
          <p>Свободные записи не оценивались автоматически. Достаточная длина пояснения не означает верное рассуждение.</p><button type="button" onClick={advance}>{round === 0 ? 'Перейти к новой Math-задаче' : 'Сравнить две Math-попытки'}</button>
        </div>}
      </>}
      {error && <p role="status" className={styles.warning}>{error}</p>}
    </>}
    </fieldset>
    {source&&<BankCheckpoint key={generation} source={source} data={snapshot} onRestore={value=>{if(value.type==='math')restore(value);}} onDirty={onDirty} onBusy={handleBusy}/>}
    {started&&<div className={styles.actions}><button type="button" disabled={bankBusy} onClick={()=>source?setResetRequested(true):reset()}>Начать новую Math-пробу</button></div>}
    {resetRequested&&<div role="alert" className={styles.warning}><p>Новая проба очистит текст на экране. Сохранённая работа и история останутся; несохранённые изменения сначала сохрани или скачай.</p><div className={styles.actions}><button type="button" disabled={bankBusy} onClick={reset}>Подтвердить новую Math-пробу</button><button type="button" disabled={bankBusy} onClick={()=>setResetRequested(false)}>Продолжить текущую Math-пробу</button></div></div>}
  </section>;
}
export default function DraftMathPreview({ value,source=null,onDirty=unchanged,onBusy=unchanged }: { value: unknown;source?:BankSource|null;onDirty?:(dirty:boolean)=>void;onBusy?:(busy:boolean)=>void }) {
  if (!value || typeof value !== 'object' || !('kind' in value) || value.kind !== 'sat-math-pair-v1') return null;
  const pair = parseDraftMath(value);
  if (!pair) return <p role="alert">Структура Math-черновика не прошла проверку. Пробное решение недоступно; другая задача не подставлена.</p>;
  return <Preview key={pair.rounds[0].id} pair={pair} source={source} onDirty={onDirty} onBusy={onBusy}/>;
}
