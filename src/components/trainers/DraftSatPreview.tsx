'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { draftSatChoiceText, parseDraftSatPair, type DraftSatPair } from '@/lib/trainers/draft-sat-rw';
import styles from './TrainerCheckpoint.module.css';
import BankCheckpoint from './BankCheckpoint';
import type { BankSource } from '@/lib/trainers/bank-sources';
import type { BankSatAttempt, BankSatState } from '@/lib/trainers/bank-sat-state';

type Attempt = BankSatAttempt;
const unchanged=()=>{};
function Preview({ pair,source,onDirty,onBusy }: { pair: DraftSatPair;source:BankSource|null;onDirty:(dirty:boolean)=>void;onBusy:(busy:boolean)=>void }) {
  const [started, setStarted] = useState(false);
  const [roundIndex, setRoundIndex] = useState<0|1>(0);
  const [prediction, setPrediction] = useState('');
  const [locked, setLocked] = useState(false);
  const [choice, setChoice] = useState<number | null>(null);
  const [reasons, setReasons] = useState(['', '', '', '']);
  const [checked, setChecked] = useState(false);
  const [repair, setRepair] = useState('');
  const [error, setError] = useState('');
  const [attempts, setAttempts] = useState<Attempt[]>([]);
  const [report, setReport] = useState(false);
  const stepHeading = useRef<HTMLHeadingElement>(null);
  const [bankBusy,setBankBusy]=useState(false),[generation,setGeneration]=useState(0),[resetRequested,setResetRequested]=useState(false),[focusTick,setFocusTick]=useState(0);
  const heading=useRef<HTMLHeadingElement>(null);
  const handleBusy=useCallback((value:boolean)=>{setBankBusy(value);onBusy(value);},[onBusy]);
  const snapshot:BankSatState={type:'sat-rw',started,roundIndex,prediction,locked,choice,reasons,checked,repair,attempts,report};
  function restore(value:BankSatState){setStarted(value.started);setRoundIndex(value.roundIndex);setPrediction(value.prediction);setLocked(value.locked);setChoice(value.choice);setReasons(value.reasons);setChecked(value.checked);setRepair(value.repair);setAttempts(value.attempts);setReport(value.report);setError('');setResetRequested(false);setFocusTick(value=>value+1);}
  useEffect(() => { if (started||focusTick) { const target=started?stepHeading.current:heading.current;target?.focus({ preventScroll: true }); target?.scrollIntoView({ block: 'start',behavior:'instant' }); } }, [started, roundIndex, report,focusTick]);
  const item = pair.rounds[roundIndex];
  function clearRound() { setPrediction(''); setLocked(false); setChoice(null); setReasons(['', '', '', '']); setChecked(false); setRepair(''); setError(''); }
  function reset() { setStarted(false);setRoundIndex(0); setAttempts([]); setReport(false); clearRound();setResetRequested(false);setGeneration(value=>value+1);setFocusTick(value=>value+1); }
  function check() {
    if (choice === null) { setError('Выбери вариант.'); return; }
    if (pair.trainer === 'sat-distractor' && reasons.some((value, index) => index !== choice && value.trim().length < 12)) { setError('Объясни каждый из трёх оставшихся вариантов: минимум 12 символов в каждом поле.'); return; }
    setChecked(true); setError('');
  }
  function advance() {
    if (choice === null || !checked) return;
    if (repair.trim().length < 12) { setError('Запиши, что подтверждает ответ или что ты пересмотрел: минимум 12 символов.'); return; }
    setAttempts(old => [...old, { id: item.id, prediction, choice, reasons: [...reasons], repair }]);
    if (roundIndex === 0) { setRoundIndex(1); clearRound(); } else { setReport(true); setError(''); }
  }
  return <section className={styles.preview} aria-labelledby="sat-draft-preview-title">
    <h3 ref={heading} tabIndex={-1} id="sat-draft-preview-title">Пробное прохождение SAT · DRAFT</h3>
    <p>Первая задача, разбор и новый текст. {source?'Работу можно сохранить отдельной кнопкой ниже в этом браузере.':'Проба временная, без сохранения.'} Прогноз и объяснения не оцениваются автоматически; совпадение выбранного варианта с ключом не даёт балл SAT. Просмотр ключей заранее влияет на независимость попытки.</p>
    <fieldset className={styles.practiceBody} disabled={bankBusy}><legend>Работа с SAT-текстами</legend>
    {!started ? <button type="button" onClick={() => setStarted(true)}>Пройти SAT-черновик как ученик</button> : report ? <>
      <h4 ref={stepHeading} tabIndex={-1}>Сравнение двух первых выборов</h4>
      {attempts.map((attempt, index) => <div key={attempt.id} className={styles.outcome}><h4>{index === 0 ? 'Первая задача' : 'Новый текст'} · {attempt.id}</h4><p>{attempt.choice === pair.rounds[index].key ? 'Выбор совпал с подготовленным ключом.' : 'Первый выбор не совпал с подготовленным ключом.'}</p><p className={styles.frozenText}>Прогноз: {attempt.prediction}</p><p>Выбран вариант {attempt.choice + 1}: <span lang="en">{draftSatChoiceText(pair.rounds[index].choices[attempt.choice].text)}</span></p>{pair.trainer === 'sat-distractor' && attempt.reasons.map((reason, reasonIndex) => reasonIndex !== attempt.choice && <p key={reasonIndex} className={styles.frozenText}>Объяснение варианта {reasonIndex + 1}: {reason}</p>)}<p className={styles.frozenText}>После разбора: {attempt.repair}</p></div>)}
      <p>Это два отдельных текста, а не доказательство роста навыка. Свободные объяснения требуют ручной проверки.</p>
    </> : <>
      <h4 ref={stepHeading} tabIndex={-1}>{roundIndex === 0 ? 'Первая задача' : 'Новый текст после разбора'} · {item.id}</h4><p lang="en" className={`${styles.frozenText} ${styles.essaySource}`}>{item.passage}</p><p lang="en"><strong>{item.question}</strong></p>
      <label htmlFor="sat-draft-prediction">Твой прогноз до вариантов</label><textarea id="sat-draft-prediction" maxLength={600} rows={3} value={prediction} disabled={locked} onChange={event => { setPrediction(event.target.value); setError(''); }}/>
      {!locked ? <button type="button" onClick={() => { if (prediction.trim().length < 12) { setError('Сначала сформулируй свой прогноз: минимум 12 символов.'); return; } setLocked(true); setError(''); }}>Зафиксировать прогноз и показать варианты</button> : <>
        <fieldset className={styles.filters} disabled={checked}><legend>Выбери ответ по тексту</legend>{item.choices.map((option, index) => <label key={index}><input type="radio" name="sat-draft-choice" checked={choice === index} onChange={() => { setChoice(index); setError(''); }}/><span lang="en">{index + 1}. {draftSatChoiceText(option.text)}</span></label>)}</fieldset>
        {pair.trainer === 'sat-distractor' && choice !== null && <div className={styles.previewReasons}><p>Оцени три оставшихся варианта. Один из них может оказаться верным: не называй его ошибкой только потому, что ты выбрал другой.</p>{item.choices.map((option, index) => index !== choice && <div key={index}><label htmlFor={`sat-draft-reason-${index}`}>Почему вариант {index + 1} подходит или не подходит?</label><p lang="en" id={`sat-draft-option-${index}`}>{draftSatChoiceText(option.text)}</p><textarea id={`sat-draft-reason-${index}`} aria-describedby={`sat-draft-option-${index}`} maxLength={600} rows={3} disabled={checked} value={reasons[index]} onChange={event => { const value = event.target.value; setReasons(old => old.map((reason, n) => n === index ? value : reason)); setError(''); }}/></div>)}</div>}
        {!checked ? <button type="button" onClick={check}>Проверить первый выбор</button> : <div className={styles.outcome}>
          <h4>{choice === item.key ? 'Выбор совпал с ключом' : 'Первый выбор нужно пересмотреть'}</h4><p className={styles.warning}>{item.choices[choice!].feedback}</p>
          <p><strong>Основание в тексте:</strong> <span lang="en">{item.evidence}</span></p><p>{item.explanation}</p>
          <details><summary>Разбор всех четырёх вариантов</summary>{item.choices.map((option, index) => <p key={index}><strong>{index + 1}. {option.best ? 'Подходит' : 'Нужно пересмотреть'}.</strong> <span lang="en">{draftSatChoiceText(option.text)}</span> — {option.feedback}</p>)}</details>
          <div className={styles.previewReasons}><label htmlFor="sat-draft-repair">Что подтверждает ответ или что ты пересмотрел?</label><textarea id="sat-draft-repair" rows={3} maxLength={600} value={repair} onChange={event => { setRepair(event.target.value); setError(''); }}/></div>
          <p>Текст объяснения проверяется вручную; достаточная длина не означает правильное рассуждение.</p>
          <button type="button" onClick={advance}>{roundIndex === 0 ? 'Перейти к новому тексту' : 'Сравнить две попытки'}</button>
        </div>}
      </>}
      {error && <p role="status" className={styles.warning}>{error}</p>}
    </>}
    </fieldset>
    {source&&<BankCheckpoint key={generation} source={source} data={snapshot} onRestore={value=>{if(value.type==='sat-rw')restore(value);}} onDirty={onDirty} onBusy={handleBusy}/>}
    {started&&<div className={styles.actions}><button type="button" disabled={bankBusy} onClick={()=>source?setResetRequested(true):reset()}>Начать новую SAT-пробу</button></div>}
    {resetRequested&&<div role="alert" className={styles.warning}><p>Новая проба очистит текст на экране. Сохранённая работа и история останутся; несохранённые изменения сначала сохрани или скачай.</p><div className={styles.actions}><button type="button" disabled={bankBusy} onClick={reset}>Подтвердить новую SAT-пробу</button><button type="button" disabled={bankBusy} onClick={()=>setResetRequested(false)}>Продолжить текущую SAT-пробу</button></div></div>}
  </section>;
}
export default function DraftSatPreview({ value,source=null,onDirty=unchanged,onBusy=unchanged }: { value: unknown;source?:BankSource|null;onDirty?:(dirty:boolean)=>void;onBusy?:(busy:boolean)=>void }) {
  if (!value || typeof value !== 'object' || !('kind' in value) || value.kind !== 'sat-rw-pair-v1') return null;
  const pair = parseDraftSatPair(value);
  if (!pair) return <p role="alert">Структура SAT-черновика не прошла проверку. Пробное прохождение недоступно; другой текст не подставлен.</p>;
  return <Preview key={pair.rounds[0].id} pair={pair} source={source} onDirty={onDirty} onBusy={onBusy}/>;
}
