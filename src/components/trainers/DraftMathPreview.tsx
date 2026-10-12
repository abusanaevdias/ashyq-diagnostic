'use client';

import { useEffect, useRef, useState } from 'react';
import { draftMathChoiceLabel, parseDraftMath, parseDraftMathNumber, type DraftMathPair } from '@/lib/trainers/draft-math';
import styles from './TrainerCheckpoint.module.css';

type Attempt = { working: string; answer: string; numericAnswer: number; choice: number; reflection: string };
function Preview({ pair }: { pair: DraftMathPair }) {
  const [started, setStarted] = useState(false), [round, setRound] = useState(0), [report, setReport] = useState(false);
  const [working, setWorking] = useState(''), [answer, setAnswer] = useState(''), [choice, setChoice] = useState<number | null>(null);
  const [locked, setLocked] = useState(false), [checked, setChecked] = useState(false), [reflection, setReflection] = useState(''), [error, setError] = useState('');
  const [attempts, setAttempts] = useState<Attempt[]>([]), step = useRef<HTMLHeadingElement>(null);
  const item = pair.rounds[round];
  useEffect(() => { if (started) { step.current?.focus({ preventScroll: true }); step.current?.scrollIntoView({ block: 'start' }); } }, [started, round, report]);
  function clearRound() { setWorking(''); setAnswer(''); setChoice(null); setLocked(false); setChecked(false); setReflection(''); setError(''); }
  function reset() { setRound(0); setReport(false); setAttempts([]); clearRound(); }
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
    setAttempts(old => [...old, { working, answer, numericAnswer, choice, reflection }]);
    if (round === 0) { setRound(1); clearRound(); } else { setReport(true); setError(''); }
  }
  return <section className={styles.preview} aria-labelledby="math-draft-preview-title">
    <h3 id="math-draft-preview-title">Пробная математика · DRAFT</h3>
    <p>Сначала реши сам, затем сравни модель или переход и проверь число. Записи действий проверяются вручную: выбор подготовленного варианта не доказывает правильность твоего решения. Это временная проба для рецензента; она не сохраняется с его решением, не публикует материал и не выдаёт балл SAT. Просмотр ключа заранее влияет на независимость попытки.</p>
    {!started ? <button type="button" onClick={() => setStarted(true)}>Пройти Math-черновик</button> : report ? <>
      <h4 ref={step} tabIndex={-1}>Сравнение двух Math-попыток</h4>{attempts.map((attempt, index) => <div key={pair.rounds[index].id} className={styles.outcome}>
        <h4>{index === 0 ? 'Первая задача' : 'Новая задача'} · {pair.rounds[index].id}</h4><p className={styles.frozenText}>Свои действия: {attempt.working}</p><p>Первый ответ: {attempt.answer} {pair.rounds[index].unit}.</p><p>{attempt.numericAnswer === pair.rounds[index].answer ? 'Число совпало с подготовленным ответом.' : 'Число отличается от подготовленного ответа.'}</p><p>{draftMathChoiceLabel(pair.rounds[index], pair.family, attempt.choice)}</p>{pair.family === 'method-switch' && <p>Отмеченный способ: {pair.rounds[index].methods![attempt.choice].title}.</p>}<p className={styles.frozenText}>После разбора: {attempt.reflection}</p>
      </div>)}<p>Две задачи не подтверждают устойчивый навык или рост балла. Первые ответы и размышления после помощи показаны отдельно.</p><button type="button" onClick={reset}>Начать новую временную Math-пробу</button>
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
          <div className={styles.previewReasons}><label htmlFor="draft-math-reflection">Что проверишь в новой задаче?<textarea id="draft-math-reflection" rows={3} maxLength={600} value={reflection} onChange={event => { setReflection(event.target.value); setError(''); }}/></label></div>
          <p>Свободные записи не оценивались автоматически. Достаточная длина пояснения не означает верное рассуждение.</p><button type="button" onClick={advance}>{round === 0 ? 'Перейти к новой Math-задаче' : 'Сравнить две Math-попытки'}</button>
        </div>}
      </>}
      {error && <p role="status" className={styles.warning}>{error}</p>}
    </>}
  </section>;
}
export default function DraftMathPreview({ value }: { value: unknown }) {
  if (!value || typeof value !== 'object' || !('kind' in value) || value.kind !== 'sat-math-pair-v1') return null;
  const pair = parseDraftMath(value);
  if (!pair) return <p role="alert">Структура Math-черновика не прошла проверку. Пробное решение недоступно; другая задача не подставлена.</p>;
  return <Preview key={pair.rounds[0].id} pair={pair}/>;
}
