'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { compareDraftAnswer, parseDraftListening, type DraftListeningPair } from '@/lib/trainers/draft-listening';
import styles from './TrainerCheckpoint.module.css';
import BankCheckpoint from './BankCheckpoint';
import {isPublishedBankSource} from '@/lib/trainers/bank-publication';
import type { BankSource } from '@/lib/trainers/bank-sources';
import {emptyBankListeningEvidence,type BankListeningEvidence,type BankListeningAttempt,type BankListeningState} from '@/lib/trainers/bank-listening-state';

type Evidence = BankListeningEvidence;
type Attempt = BankListeningAttempt;
const emptyEvidence = emptyBankListeningEvidence;
const unchanged=()=>{};
const answerLabel = { match: 'Ответ совпал с подготовленным вариантом', 'known-distractor': 'Ответ совпал с разобранной ловушкой', unreviewed: 'Ответ требует ручной проверки' };
function modeLabel(evidence: Evidence) { return evidence.transcript ? 'Текст открыт до ответа — это практика по тексту.' : evidence.ended ? 'Браузер сообщил о завершении полной записи.' : evidence.played ? 'Запись запускалась; завершение до ответа не зафиксировано.' : 'Запись не запускалась.'; }

function Preview({ pair,source,onDirty,onBusy }: { pair: DraftListeningPair;source:BankSource|null;onDirty:(dirty:boolean)=>void;onBusy:(busy:boolean)=>void }) {
  const [started, setStarted] = useState(false), [round, setRound] = useState<0|1>(0), [report, setReport] = useState(false);
  const [answer, setAnswer] = useState(''), [repair, setRepair] = useState(''), [locked, setLocked] = useState(false);
  const [reflection,setReflection]=useState('');
  const [prediction,setPrediction]=useState(''),[predictionLocked,setPredictionLocked]=useState(false);
  const [evidence, setEvidence] = useState<Evidence>(emptyEvidence), [before, setBefore] = useState<Evidence>(emptyEvidence);
  const [scriptVisible, setScriptVisible] = useState(false), [audioError, setAudioError] = useState(false), [error, setError] = useState('');
  const [segmentError, setSegmentError] = useState(false);
  const [attempts, setAttempts] = useState<Attempt[]>([]);
  const fullAudio = useRef<HTMLAudioElement>(null), segmentAudio = useRef<HTMLAudioElement>(null), step = useRef<HTMLHeadingElement>(null);
  const [bankBusy,setBankBusy]=useState(false),[generation,setGeneration]=useState(0),[audioGeneration,setAudioGeneration]=useState(0),[resetRequested,setResetRequested]=useState(false),[focusTick,setFocusTick]=useState(0);
  const heading=useRef<HTMLHeadingElement>(null);
  const handleBusy=useCallback((value:boolean)=>{if(value){fullAudio.current?.pause();segmentAudio.current?.pause();}setBankBusy(value);onBusy(value);},[onBusy]);
  const snapshot:BankListeningState={type:'listening',mediaIdentity:pair.mediaIdentity,started,round,report,prediction,predictionLocked,answer,repair,reflection,locked,evidence,before,scriptVisible,attempts};
  function restore(value:BankListeningState){fullAudio.current?.pause();segmentAudio.current?.pause();setStarted(value.started);setRound(value.round);setReport(value.report);setPrediction(value.prediction);setPredictionLocked(value.predictionLocked);setAnswer(value.answer);setRepair(value.repair);setReflection(value.reflection);setLocked(value.locked);setEvidence(value.evidence);setBefore(value.before);setScriptVisible(value.scriptVisible);setAttempts(value.attempts);setAudioError(false);setSegmentError(false);setError('');setResetRequested(false);setAudioGeneration(value=>value+1);setFocusTick(value=>value+1);}
  const item = pair.rounds[round];
  useEffect(() => {
    if (started||focusTick) { const target=started?step.current:heading.current;target?.focus({ preventScroll: true }); target?.scrollIntoView({ block: 'start',behavior:'instant' }); }
  }, [started, round, report,focusTick]);
  useEffect(() => {
    const full = fullAudio.current, segment = segmentAudio.current;
    return () => { full?.pause(); segment?.pause(); };
  }, [started, round, report, locked, predictionLocked,audioGeneration]);
  function clearRound() { setAnswer(''); setRepair('');setReflection(''); setLocked(false); setPrediction(''); setPredictionLocked(false); setEvidence(emptyEvidence()); setBefore(emptyEvidence()); setScriptVisible(false); setAudioError(false); setSegmentError(false); setError(''); }
  function reset() { fullAudio.current?.pause();segmentAudio.current?.pause();setStarted(false);setRound(0); setReport(false); setAttempts([]); clearRound();setResetRequested(false);setGeneration(value=>value+1);setAudioGeneration(value=>value+1);setFocusTick(value=>value+1); }
  function checkFirst() {
    if(!predictionLocked)return;
    if (!answer.trim()) { setError('Сначала запиши ответ.'); return; }
    if (!evidence.played && !evidence.transcript) { setError('Запусти запись или явно перейди к текстовой практике.'); return; }
    setBefore({ ...evidence }); setLocked(true); setError('');
  }
  function advance() {
    if (!locked) return;
    if (!repair.trim()) { setError('Запиши ответ после разбора отдельно от первой попытки.'); return; }
    if(reflection.trim().length<12){setError('Запиши, что проверишь при следующем прослушивании: минимум 12 символов. Длина не оценивает качество плана.');return;}
    setAttempts(old => [...old, { prediction, answer, repair,reflection, before: { ...before }, after: { ...evidence } }]);
    if (round === 0) { setRound(1); clearRound(); } else { setReport(true); setError(''); }
  }
  return <section className={styles.preview} aria-labelledby="listening-draft-preview-title">
    <h3 ref={heading} tabIndex={-1} id="listening-draft-preview-title">{source&&isPublishedBankSource(source.ref)?'Практика Listening':'Пробное аудирование · DRAFT'}</h3>
    <p>Синтетическая речь: {pair.voice}, создана офлайн из авторского вымышленного сценария. Это проба материала, не экзамен и не подтверждение навыка. {source?'Работу можно сохранить отдельной кнопкой ниже в этом браузере. При сохранении и восстановлении плеер останавливается; после восстановления он начинается с нуля без автозапуска. Прежние события и помощь остаются в записи.':'Проба временная, без сохранения.'}</p>
    <fieldset className={styles.practiceBody} disabled={bankBusy}><legend>Работа с аудированием</legend>
    {!started ? <button type="button" onClick={() => setStarted(true)}>{source&&isPublishedBankSource(source.ref)?'Начать задание':'Пройти Listening-черновик'}</button> : report ? <>
      <h4 ref={step} tabIndex={-1}>Две попытки аудирования и помощи</h4>{attempts.map((attempt, index) => <div key={index} className={styles.outcome}>
        <h4>{index === 0 ? 'Первая задача' : 'Новая задача'}</h4><p className={styles.frozenText}>Ожидание до записи: {attempt.prediction}</p><p>Первый ответ: <strong>{attempt.answer}</strong> — {answerLabel[compareDraftAnswer(attempt.answer, pair.rounds[index])]}.</p><p>{modeLabel(attempt.before)}</p><p>После разбора: <strong>{attempt.repair}</strong> — {answerLabel[compareDraftAnswer(attempt.repair, pair.rounds[index])]}.</p><p>Помощь за всю попытку: фрагмент {attempt.after.segment ? 'запускался' : 'не запускался'}; текст {attempt.after.transcript ? 'открывался' : 'не открывался'}.</p>
      <p className={styles.frozenText}>План следующей проверки: {attempt.reflection}</p></div>)}<p>События плеера не доказывают внимательное прослушивание. Неизвестный вариант остаётся для ручной проверки; причина ошибки не выводится автоматически из числа или слова.</p>
    </> : <>
      <h4 ref={step} tabIndex={-1}>{round === 0 ? 'Первая запись' : 'Новая запись'} · {round + 1}</h4><p lang="en"><strong>{item.prompt}</strong></p>
      {item.instruction&&<p>{item.instruction}</p>}
      {!predictionLocked?<>
        <label htmlFor="draft-listening-prediction">Какой тип ответа ожидаешь и какую деталь будешь различать?</label><textarea id="draft-listening-prediction" rows={3} maxLength={1000} value={prediction} onChange={event=>{setPrediction(event.target.value);setError('');}}/>
        <p>Например: число участников, а не сотрудников; время начала, а не входа. Это твоя стратегия, она не оценивается автоматически.</p><button type="button" onClick={()=>{if(prediction.trim().length<3){setError('Сначала запиши ожидание: минимум 3 символа, без оценки качества по длине.');return;}setPrediction(prediction.trim());setPredictionLocked(true);setError('');}}>Зафиксировать ожидание и открыть запись</button>
      </>:<>
      <p className={styles.frozenText}>Ожидание до записи: {prediction}</p>
      <audio key={`${audioGeneration}:${item.fullUrl}`} ref={fullAudio} controls={!bankBusy} tabIndex={bankBusy?-1:0} preload="metadata" aria-label="Полная синтетическая запись" src={item.fullUrl} onPlay={() => { if(bankBusy){fullAudio.current?.pause();return;}segmentAudio.current?.pause(); setEvidence(old => ({ ...old, played: true })); setAudioError(false); }} onEnded={() => {if(!bankBusy)setEvidence(old => ({ ...old, ended: true }));}} onError={() => setAudioError(true)}/>
      {audioError && <><p role="alert" className={styles.warning}>Запись не загрузилась. Повтори загрузку или выбери текстовую практику; она будет отмечена отдельно.</p><button type="button" onClick={() => { setAudioError(false); fullAudio.current?.load(); }}>Повторить загрузку записи</button></>}
      <div className={styles.actions}><button type="button" onClick={() => { setScriptVisible(true); setEvidence(old => ({ ...old, transcript: true })); }}>Открыть текст · отметить текстовую помощь</button></div>
      {scriptVisible && <p lang="en" className={styles.warning}>{item.script}</p>}
      <label htmlFor="draft-listening-answer">Первый ответ до разбора</label><input id="draft-listening-answer" maxLength={60} value={answer} disabled={locked} onChange={event => { setAnswer(event.target.value); setError(''); }}/>
      {!locked ? <button type="button" onClick={checkFirst}>Зафиксировать первый ответ</button> : <div className={styles.outcome}>
        <h4>{answerLabel[compareDraftAnswer(answer, item)]}</h4><p>{modeLabel(before)}</p><p><strong>Подготовленный ответ:</strong> {item.answer}. Допустимые варианты: {item.accepted.join(', ')}.</p><p>{item.explanation}</p>
        {compareDraftAnswer(answer, item) === 'unreviewed' && <p className={styles.warning}>Ответ не входит в подготовленные варианты. Это не основание автоматически объявлять его неправильным; проверь смысл и инструкцию вручную.</p>}
        <p>Послушай ключевой фрагмент отдельно:</p><audio key={`${audioGeneration}:${item.segmentUrl}`} ref={segmentAudio} controls={!bankBusy} tabIndex={bankBusy?-1:0} preload="metadata" aria-label="Ключевой синтетический фрагмент" src={item.segmentUrl} onPlay={() => { if(bankBusy){segmentAudio.current?.pause();return;}fullAudio.current?.pause(); setSegmentError(false); setEvidence(old => ({ ...old, segment: true })); }} onError={() => setSegmentError(true)}/>
        {segmentError && <><p role="alert" className={styles.warning}>Фрагмент не загрузился. Можно повторить его загрузку, использовать полную запись или открыть текст с отметкой помощи.</p><button type="button" onClick={() => { setSegmentError(false); segmentAudio.current?.load(); }}>Повторить загрузку фрагмента</button></>}
        <div className={styles.previewReasons}><label htmlFor="draft-listening-repair">Ответ после разбора</label><input id="draft-listening-repair" maxLength={60} value={repair} onChange={event => { setRepair(event.target.value); setError(''); }}/></div>
        <label htmlFor="draft-listening-reflection">Что проверишь при следующем прослушивании?</label><textarea id="draft-listening-reflection" rows={3} maxLength={1000} value={reflection} onChange={event=>{setReflection(event.target.value);setError('');}}/><p>Опиши, какую деталь и возможную ловушку будешь различать. План проверяется вручную.</p>
        <button type="button" onClick={advance}>{round === 0 ? 'Перейти к новой записи' : 'Сравнить попытки аудирования'}</button>
      </div>}
      </>}
      {error && <p role="status" className={styles.warning}>{error}</p>}
    </>}
    </fieldset>
    {source&&<BankCheckpoint key={generation} source={source} data={snapshot} onRestore={value=>{if(value.type==='listening')restore(value);}} onDirty={onDirty} onBusy={handleBusy}/>}
    {started&&<div className={styles.actions}><button type="button" disabled={bankBusy} onClick={()=>source?setResetRequested(true):reset()}>Начать новую Listening-пробу</button></div>}
    {resetRequested&&<div role="alert" className={styles.warning}><p>Новая проба очистит текст на экране. Сохранённая работа и история останутся; несохранённые изменения сначала сохрани или скачай.</p><div className={styles.actions}><button type="button" disabled={bankBusy} onClick={reset}>Подтвердить новую Listening-пробу</button><button type="button" disabled={bankBusy} onClick={()=>setResetRequested(false)}>Продолжить текущую Listening-пробу</button></div></div>}
  </section>;
}
export default function DraftListeningPreview({ value, unitId,source=null,onDirty=unchanged,onBusy=unchanged }: { value: unknown; unitId: string;source?:BankSource|null;onDirty?:(dirty:boolean)=>void;onBusy?:(busy:boolean)=>void }) {
  if (!value || typeof value !== 'object' || !('kind' in value) || value.kind !== 'listening-pair-v1') return null;
  const pair = parseDraftListening(value, unitId);
  if (!pair) return <p role="alert">Сценарий и аудиофайлы черновика не совпали или не готовы. Пробное аудирование недоступно; чужая запись не подставлена.</p>;
  return <Preview key={unitId} pair={pair} source={source} onDirty={onDirty} onBusy={onBusy}/>;
}
