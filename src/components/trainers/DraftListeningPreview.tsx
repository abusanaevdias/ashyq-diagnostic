'use client';

import { useEffect, useRef, useState } from 'react';
import { compareDraftAnswer, parseDraftListening, type DraftListeningPair } from '@/lib/trainers/draft-listening';
import styles from './TrainerCheckpoint.module.css';

type Evidence = { played: boolean; ended: boolean; segment: boolean; transcript: boolean };
type Attempt = { answer: string; repair: string; before: Evidence; after: Evidence };
const emptyEvidence = (): Evidence => ({ played: false, ended: false, segment: false, transcript: false });
const answerLabel = { match: 'Ответ совпал с подготовленным вариантом', 'known-distractor': 'Ответ совпал с разобранной ловушкой', unreviewed: 'Ответ требует ручной проверки' };
function modeLabel(evidence: Evidence) { return evidence.transcript ? 'Текст открыт до ответа — это практика по тексту.' : evidence.ended ? 'Браузер сообщил о завершении полной записи.' : evidence.played ? 'Запись запускалась; завершение до ответа не зафиксировано.' : 'Запись не запускалась.'; }

function Preview({ pair }: { pair: DraftListeningPair }) {
  const [started, setStarted] = useState(false), [round, setRound] = useState(0), [report, setReport] = useState(false);
  const [answer, setAnswer] = useState(''), [repair, setRepair] = useState(''), [locked, setLocked] = useState(false);
  const [evidence, setEvidence] = useState<Evidence>(emptyEvidence), [before, setBefore] = useState<Evidence>(emptyEvidence);
  const [scriptVisible, setScriptVisible] = useState(false), [audioError, setAudioError] = useState(false), [error, setError] = useState('');
  const [segmentError, setSegmentError] = useState(false);
  const [attempts, setAttempts] = useState<Attempt[]>([]);
  const fullAudio = useRef<HTMLAudioElement>(null), segmentAudio = useRef<HTMLAudioElement>(null), step = useRef<HTMLHeadingElement>(null);
  const item = pair.rounds[round];
  useEffect(() => {
    if (started) { step.current?.focus({ preventScroll: true }); step.current?.scrollIntoView({ block: 'start' }); }
  }, [started, round, report]);
  useEffect(() => {
    const full = fullAudio.current, segment = segmentAudio.current;
    return () => { full?.pause(); segment?.pause(); };
  }, [started, round, report, locked]);
  function clearRound() { setAnswer(''); setRepair(''); setLocked(false); setEvidence(emptyEvidence()); setBefore(emptyEvidence()); setScriptVisible(false); setAudioError(false); setSegmentError(false); setError(''); }
  function reset() { setRound(0); setReport(false); setAttempts([]); clearRound(); }
  function checkFirst() {
    if (!answer.trim()) { setError('Сначала запиши ответ.'); return; }
    if (!evidence.played && !evidence.transcript) { setError('Запусти запись или явно перейди к текстовой практике.'); return; }
    setBefore({ ...evidence }); setLocked(true); setError('');
  }
  function advance() {
    if (!locked) return;
    if (!repair.trim()) { setError('Запиши ответ после разбора отдельно от первой попытки.'); return; }
    setAttempts(old => [...old, { answer, repair, before: { ...before }, after: { ...evidence } }]);
    if (round === 0) { setRound(1); clearRound(); } else { setReport(true); setError(''); }
  }
  return <section className={styles.preview} aria-labelledby="listening-draft-preview-title">
    <h3 id="listening-draft-preview-title">Пробное аудирование · DRAFT</h3>
    <p>Синтетическая речь: {pair.voice}, создана офлайн из авторского вымышленного сценария. Это временная проба материала, не экзамен и не подтверждение навыка. Попытки не сохраняются с решением проверяющего; новая проба и выход сбрасывают их.</p>
    {!started ? <button type="button" onClick={() => setStarted(true)}>Пройти Listening-черновик</button> : report ? <>
      <h4 ref={step} tabIndex={-1}>Две попытки аудирования и помощи</h4>{attempts.map((attempt, index) => <div key={index} className={styles.outcome}>
        <h4>{index === 0 ? 'Первая задача' : 'Новая задача'}</h4><p>Первый ответ: <strong>{attempt.answer}</strong> — {answerLabel[compareDraftAnswer(attempt.answer, pair.rounds[index])]}.</p><p>{modeLabel(attempt.before)}</p><p>После разбора: <strong>{attempt.repair}</strong> — {answerLabel[compareDraftAnswer(attempt.repair, pair.rounds[index])]}.</p><p>Помощь за всю попытку: фрагмент {attempt.after.segment ? 'запускался' : 'не запускался'}; текст {attempt.after.transcript ? 'открывался' : 'не открывался'}.</p>
      </div>)}<p>События плеера не доказывают внимательное прослушивание. Неизвестный вариант остаётся для ручной проверки; причина ошибки не выводится автоматически из числа или слова.</p><button type="button" onClick={reset}>Начать новую временную Listening-пробу</button>
    </> : <>
      <h4 ref={step} tabIndex={-1}>{round === 0 ? 'Первая запись' : 'Новая запись'} · {round + 1}</h4><p lang="en"><strong>{item.prompt}</strong></p>
      <audio key={item.fullUrl} ref={fullAudio} controls preload="metadata" aria-label="Полная синтетическая запись" src={item.fullUrl} onPlay={() => { segmentAudio.current?.pause(); setEvidence(old => ({ ...old, played: true })); setAudioError(false); }} onEnded={() => setEvidence(old => ({ ...old, ended: true }))} onError={() => setAudioError(true)}/>
      {audioError && <><p role="alert" className={styles.warning}>Запись не загрузилась. Повтори загрузку или выбери текстовую практику; она будет отмечена отдельно.</p><button type="button" onClick={() => { setAudioError(false); fullAudio.current?.load(); }}>Повторить загрузку записи</button></>}
      <div className={styles.actions}><button type="button" onClick={() => { setScriptVisible(true); setEvidence(old => ({ ...old, transcript: true })); }}>Открыть текст · отметить текстовую помощь</button></div>
      {scriptVisible && <p lang="en" className={styles.warning}>{item.script}</p>}
      <label htmlFor="draft-listening-answer">Первый ответ до разбора</label><input id="draft-listening-answer" maxLength={60} value={answer} disabled={locked} onChange={event => { setAnswer(event.target.value); setError(''); }}/>
      {!locked ? <button type="button" onClick={checkFirst}>Зафиксировать первый ответ</button> : <div className={styles.outcome}>
        <h4>{answerLabel[compareDraftAnswer(answer, item)]}</h4><p>{modeLabel(before)}</p><p><strong>Подготовленный ответ:</strong> {item.answer}. Допустимые варианты: {item.accepted.join(', ')}.</p><p>{item.explanation}</p>
        {compareDraftAnswer(answer, item) === 'unreviewed' && <p className={styles.warning}>Ответ не входит в подготовленные варианты. Это не основание автоматически объявлять его неправильным; проверь смысл и инструкцию вручную.</p>}
        <p>Послушай ключевой фрагмент отдельно:</p><audio key={item.segmentUrl} ref={segmentAudio} controls preload="metadata" aria-label="Ключевой синтетический фрагмент" src={item.segmentUrl} onPlay={() => { fullAudio.current?.pause(); setSegmentError(false); setEvidence(old => ({ ...old, segment: true })); }} onError={() => setSegmentError(true)}/>
        {segmentError && <><p role="alert" className={styles.warning}>Фрагмент не загрузился. Можно повторить его загрузку, использовать полную запись или открыть текст с отметкой помощи.</p><button type="button" onClick={() => { setSegmentError(false); segmentAudio.current?.load(); }}>Повторить загрузку фрагмента</button></>}
        <div className={styles.previewReasons}><label htmlFor="draft-listening-repair">Ответ после разбора<input id="draft-listening-repair" maxLength={60} value={repair} onChange={event => { setRepair(event.target.value); setError(''); }}/></label></div>
        <button type="button" onClick={advance}>{round === 0 ? 'Перейти к новой записи' : 'Сравнить попытки аудирования'}</button>
      </div>}
      {error && <p role="status" className={styles.warning}>{error}</p>}
    </>}
  </section>;
}
export default function DraftListeningPreview({ value, unitId }: { value: unknown; unitId: string }) {
  if (!value || typeof value !== 'object' || !('kind' in value) || value.kind !== 'listening-pair-v1') return null;
  const pair = parseDraftListening(value, unitId);
  if (!pair) return <p role="alert">Сценарий и аудиофайлы черновика не совпали или не готовы. Пробное аудирование недоступно; чужая запись не подставлена.</p>;
  return <Preview key={unitId} pair={pair}/>;
}
