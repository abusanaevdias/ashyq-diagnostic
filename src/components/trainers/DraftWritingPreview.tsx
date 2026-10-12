'use client';

import { useState } from 'react';
import { parseDraftWriting, type DraftWritingDrill } from '@/lib/trainers/draft-writing';
import { appendDrillChoice } from '@/lib/trainers/drill-records';
import styles from './TrainerCheckpoint.module.css';

function Preview({ item }: { item: DraftWritingDrill }) {
  const [started, setStarted] = useState(false);
  const [draft, setDraft] = useState('');
  const [locked, setLocked] = useState(false);
  const [choice, setChoice] = useState<number | null>(null);
  const [feedback, setFeedback] = useState('');
  const [revealed, setRevealed] = useState(false);
  const [trail, setTrail] = useState<number[]>([]);
  const [help, setHelp] = useState(false);
  const [attempts, setAttempts] = useState(0);
  function reset() { setDraft(''); setLocked(false); setChoice(null); setFeedback(''); setRevealed(false); setTrail([]); setHelp(false); setAttempts(0); }
  return <section className={styles.preview} aria-labelledby="draft-preview-title">
    <h3 id="draft-preview-title">Пробное прохождение · DRAFT</h3>
    <p>Проверь путь ученика до решения о материале. Эта попытка временная: она не сохраняется с решением проверяющего, не оценивает свободный текст и не публикует задание. Если ты уже видел ключ, прохождение не считается независимым.</p>
    {!started ? <button type="button" onClick={() => setStarted(true)}>Пройти черновик как ученик</button> : <>
      <p><strong>{item.task}</strong></p>
      <div className={styles.materialText}>{item.source.map((line, index) => <p key={index}>{line}</p>)}</div>
      <label htmlFor="draft-preview-answer">Твоя первая попытка</label>
      <textarea id="draft-preview-answer" maxLength={600} rows={4} value={draft} disabled={locked} onChange={event => { setDraft(event.target.value); setFeedback(''); }}/>
      {!locked ? <button type="button" onClick={() => { if (draft.trim().length < 12) { setFeedback('Сначала напиши свой вариант: хотя бы 12 символов.'); return; } setLocked(true); setFeedback(''); }}>Зафиксировать попытку и показать варианты</button> : <>
        <p>Первая попытка зафиксирована. Сравни её смысл и грамматику с подготовленными решениями.</p>
        <fieldset disabled={revealed} className={styles.filters}><legend>Какой вариант выполняет задание?</legend>{item.choices.map((option, index) => <label key={index}><input type="radio" name="draft-preview-choice" checked={choice === index} onChange={() => { setChoice(index); setFeedback(''); }}/><span>{option.text}</span></label>)}</fieldset>
        {!revealed && <div className={styles.actions}>
          <button type="button" onClick={() => { if (choice === null) { setFeedback('Выбери вариант для сравнения.'); return; } setAttempts(old => old + 1); setTrail(old => appendDrillChoice(old, choice)); setFeedback(item.choices[choice].feedback); if (item.choices[choice].best) setRevealed(true); else setChoice(null); }}>Проверить выбранный вариант</button>
          <button type="button" onClick={() => { setHelp(true); setRevealed(true); setFeedback('Разбор открыт по запросу. Это не самостоятельный выбор верного варианта.'); }}>Показать разбор без выбора</button>
        </div>}
      </>}
      {feedback && <p role="status" className={styles.warning}>{feedback}</p>}
      {revealed && <div className={styles.outcome}>
        <h4>Сравни с первой попыткой</h4><p className={styles.frozenText}>{draft}</p>
        <p><strong>Подготовленный пример:</strong> {item.example}</p><p>{item.explanation}</p>
        <p>Проверок вариантов: {attempts}. Выборы в этой пробе: {trail.length ? trail.map(index => index + 1).join(' → ') : 'не было'}. {attempts > 20 && 'Показаны первый выбор и последние 19.'} {help ? 'Разбор открыт по запросу.' : 'Выбран подготовленный верный вариант.'} Это не оценка написанного тобой текста.</p>
        <details><summary>Другие допустимые формулировки и замечания автору</summary><p>Список не исчерпывающий. Иной верный вариант не становится ошибкой из-за несовпадения с образцом.</p>{item.accepted_alternatives.map((line, index) => <p key={index}>{line}</p>)}{item.review_notes.map((line, index) => <p key={index}>{line}</p>)}</details>
      </div>}
      <div className={styles.actions}><button type="button" onClick={reset}>Начать новую временную пробу</button></div>
    </>}
  </section>;
}

export default function DraftWritingPreview({ value }: { value: unknown }) {
  if (!value || typeof value !== 'object' || !('kind' in value) || value.kind !== 'writing-drill-v1') return null;
  const item = parseDraftWriting(value);
  if (!item) return <p role="alert">Данные черновика не подходят для пробного прохождения. Проверь структуру материала; другое задание не подставлено.</p>;
  return <Preview key={item.id} item={item}/>;
}
