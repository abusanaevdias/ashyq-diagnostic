'use client';

import { useEffect, useRef, useState } from 'react';
import { draftSatChoiceText, parseDraftSatPair, type DraftSatPair } from '@/lib/trainers/draft-sat-rw';
import styles from './TrainerCheckpoint.module.css';

type Attempt = { id: string; prediction: string; choice: number; reasons: string[]; repair: string };
function Preview({ pair }: { pair: DraftSatPair }) {
  const [started, setStarted] = useState(false);
  const [roundIndex, setRoundIndex] = useState(0);
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
  useEffect(() => { if (started) { stepHeading.current?.focus({ preventScroll: true }); stepHeading.current?.scrollIntoView({ block: 'start' }); } }, [started, roundIndex, report]);
  const item = pair.rounds[roundIndex];
  function clearRound() { setPrediction(''); setLocked(false); setChoice(null); setReasons(['', '', '', '']); setChecked(false); setRepair(''); setError(''); }
  function reset() { setRoundIndex(0); setAttempts([]); setReport(false); clearRound(); }
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
    <h3 id="sat-draft-preview-title">Пробное прохождение SAT · DRAFT</h3>
    <p>Временная проба для проверки материала: первая задача, разбор и новый текст. Она сбрасывается при выходе и не сохраняется с решением проверяющего. Прогноз и объяснения не оцениваются автоматически; совпадение выбранного варианта с ключом не даёт балл SAT. Просмотр ключей заранее влияет на независимость попытки.</p>
    {!started ? <button type="button" onClick={() => setStarted(true)}>Пройти SAT-черновик как ученик</button> : report ? <>
      <h4 ref={stepHeading} tabIndex={-1}>Сравнение двух первых выборов</h4>
      {attempts.map((attempt, index) => <div key={attempt.id} className={styles.outcome}><h4>{index === 0 ? 'Первая задача' : 'Новый текст'} · {attempt.id}</h4><p>{attempt.choice === pair.rounds[index].key ? 'Выбор совпал с подготовленным ключом.' : 'Первый выбор не совпал с подготовленным ключом.'}</p><p className={styles.frozenText}>Прогноз: {attempt.prediction}</p><p>Выбран вариант {attempt.choice + 1}: <span lang="en">{draftSatChoiceText(pair.rounds[index].choices[attempt.choice].text)}</span></p>{pair.trainer === 'sat-distractor' && attempt.reasons.map((reason, reasonIndex) => reasonIndex !== attempt.choice && <p key={reasonIndex} className={styles.frozenText}>Объяснение варианта {reasonIndex + 1}: {reason}</p>)}<p className={styles.frozenText}>После разбора: {attempt.repair}</p></div>)}
      <p>Это два отдельных текста, а не доказательство роста навыка. Свободные объяснения сохранены только на текущем экране для ручной проверки.</p>
      <button type="button" onClick={reset}>Начать новую временную SAT-пробу</button>
    </> : <>
      <h4 ref={stepHeading} tabIndex={-1}>{roundIndex === 0 ? 'Первая задача' : 'Новый текст после разбора'} · {item.id}</h4><p lang="en" className={`${styles.frozenText} ${styles.essaySource}`}>{item.passage}</p><p lang="en"><strong>{item.question}</strong></p>
      <label htmlFor="sat-draft-prediction">Твой прогноз до вариантов</label><textarea id="sat-draft-prediction" maxLength={600} rows={3} value={prediction} disabled={locked} onChange={event => { setPrediction(event.target.value); setError(''); }}/>
      {!locked ? <button type="button" onClick={() => { if (prediction.trim().length < 12) { setError('Сначала сформулируй свой прогноз: минимум 12 символов.'); return; } setLocked(true); setError(''); }}>Зафиксировать прогноз и показать варианты</button> : <>
        <fieldset className={styles.filters} disabled={checked}><legend>Выбери ответ по тексту</legend>{item.choices.map((option, index) => <label key={index}><input type="radio" name="sat-draft-choice" checked={choice === index} onChange={() => { setChoice(index); setError(''); }}/><span lang="en">{index + 1}. {draftSatChoiceText(option.text)}</span></label>)}</fieldset>
        {pair.trainer === 'sat-distractor' && choice !== null && <div className={styles.previewReasons}><p>Оцени три оставшихся варианта. Один из них может оказаться верным: не называй его ошибкой только потому, что ты выбрал другой.</p>{item.choices.map((option, index) => index !== choice && <label key={index} htmlFor={`sat-draft-reason-${index}`}>Почему вариант {index + 1} подходит или не подходит?<span lang="en">{draftSatChoiceText(option.text)}</span><textarea id={`sat-draft-reason-${index}`} maxLength={600} rows={3} disabled={checked} value={reasons[index]} onChange={event => { const value = event.target.value; setReasons(old => old.map((reason, n) => n === index ? value : reason)); setError(''); }}/></label>)}</div>}
        {!checked ? <button type="button" onClick={check}>Проверить первый выбор</button> : <div className={styles.outcome}>
          <h4>{choice === item.key ? 'Выбор совпал с ключом' : 'Первый выбор нужно пересмотреть'}</h4><p className={styles.warning}>{item.choices[choice!].feedback}</p>
          <p><strong>Основание в тексте:</strong> <span lang="en">{item.evidence}</span></p><p>{item.explanation}</p>
          <details><summary>Разбор всех четырёх вариантов</summary>{item.choices.map((option, index) => <p key={index}><strong>{index + 1}. {option.best ? 'Подходит' : 'Нужно пересмотреть'}.</strong> <span lang="en">{draftSatChoiceText(option.text)}</span> — {option.feedback}</p>)}</details>
          <div className={styles.previewReasons}><label htmlFor="sat-draft-repair">Что подтверждает ответ или что ты пересмотрел?<textarea id="sat-draft-repair" rows={3} maxLength={600} value={repair} onChange={event => { setRepair(event.target.value); setError(''); }}/></label></div>
          <p>Текст объяснения проверяется вручную; достаточная длина не означает правильное рассуждение.</p>
          <button type="button" onClick={advance}>{roundIndex === 0 ? 'Перейти к новому тексту' : 'Сравнить две попытки'}</button>
        </div>}
      </>}
      {error && <p role="status" className={styles.warning}>{error}</p>}
    </>}
  </section>;
}
export default function DraftSatPreview({ value }: { value: unknown }) {
  if (!value || typeof value !== 'object' || !('kind' in value) || value.kind !== 'sat-rw-pair-v1') return null;
  const pair = parseDraftSatPair(value);
  if (!pair) return <p role="alert">Структура SAT-черновика не прошла проверку. Пробное прохождение недоступно; другой текст не подставлен.</p>;
  return <Preview key={pair.rounds[0].id} pair={pair}/>;
}
