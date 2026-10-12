'use client';

import TrainerCheckpoint from '@/components/trainers/TrainerCheckpoint';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { drillModes, writingDrills, type DrillMode } from '@/lib/writing-trainer/drills';
import { appendDrillChoice, appendDrillRecord, MAX_DRILL_RECORDS, type DrillRecords } from '@/lib/trainers/drill-records';
import styles from './WritingDrills.module.css';

export default function WritingDrills() {
  const [mode, setMode] = useState<DrillMode | null>(null);
  const [index, setIndex] = useState(0);
  const [draft, setDraft] = useState('');
  const [optionsVisible, setOptionsVisible] = useState(false);
  const [choice, setChoice] = useState<number | null>(null);
  const [attempts, setAttempts] = useState(0);
  const [feedback, setFeedback] = useState('');
  const [revealed, setRevealed] = useState(false);
  const [completed, setCompleted] = useState<string[]>([]);
  const [currentChoices, setCurrentChoices] = useState<number[]>([]);
  const [revealedByHelp, setRevealedByHelp] = useState<boolean | null>(false);
  const [drillRecords, setDrillRecords] = useState<DrillRecords>({});

  const items = writingDrills.filter((item) => item.mode === mode);
  const item = items[index];

  useEffect(() => {
    if (mode) document.getElementById('exercise-title')?.scrollIntoView({ block: 'start' });
  }, [mode, index]);

  function clearAttempt() {
    setDraft('');
    setOptionsVisible(false);
    setChoice(null);
    setAttempts(0);
    setFeedback('');
    setRevealed(false);
    setCurrentChoices([]);
    setRevealedByHelp(false);
  }

  function chooseMode(next: DrillMode) {
    setMode(next);
    setIndex(0);
    clearAttempt();
  }

  function finishItem() {
    if (!item) return;
    const record = { savedAt: new Date().toISOString(), draft, choices: [...currentChoices], attemptCount: attempts, revealedByHelp };
    setDrillRecords(old => appendDrillRecord(old, item.id, record));
    setCompleted((old) => old.includes(item.id) ? old : [...old, item.id]);
    if (index < items.length - 1) {
      setIndex(index + 1);
      clearAttempt();
    } else {
      setMode(null);
      setIndex(0);
      clearAttempt();
      window.scrollTo({ top: 0 });
    }
  }

  function showOptions() {
    if (draft.trim().length < 12) {
      setFeedback('Сначала напиши собственный вариант — хотя бы одно короткое предложение.');
      return;
    }
    setOptionsVisible(true);
    setFeedback('');
  }

  function checkChoice() {
    if (!item) return;
    if (choice === null) {
      setFeedback('Теперь выбери один из вариантов ниже и сравни его со своей мыслью.');
      return;
    }
    const selected = item.choices[choice];
    const nextAttempts = attempts + 1;
    setAttempts(nextAttempts);
    setCurrentChoices(old => appendDrillChoice(old, choice));
    setFeedback(selected.feedback);
    if (selected.best) { setRevealed(true); setRevealedByHelp(false); }
    else setChoice(null);
  }

  return <main className={styles.page}>
    <div className={styles.topline}><Link href="/writing/trainer">← К тренажёру эссе</Link><span>ASHYQ / WRITING LAB</span></div>
    <header className={styles.hero}>
      <p className={styles.eyebrow}>КОРОТКИЕ УПРАЖНЕНИЯ · IELTS TASK 2</p>
      <h1>Отработай один навык за раз</h1>
      <p>Сначала напиши свой вариант. Затем сравни три решения, получи объяснение и при необходимости попробуй ещё раз. Все задания вымышлены и доступны без входа. Здесь нет автоматической оценки твоего текста или балла IELTS.</p>
    </header>
    <TrainerCheckpoint trainer="writing-drills" data={{ mode, index, draft, optionsVisible, choice, attempts, feedback, revealed, completed, currentChoices, revealedByHelp, drillRecords }} completed={mode === null && completed.length > 0} onRestore={saved => { setMode(saved.mode); setIndex(saved.index); setDraft(saved.draft); setOptionsVisible(saved.optionsVisible); setChoice(saved.choice); setAttempts(saved.attempts); setFeedback(saved.feedback); setRevealed(saved.revealed); setCompleted(saved.completed); setCurrentChoices(saved.currentChoices ?? []); setRevealedByHelp(saved.revealedByHelp === undefined ? null : saved.revealedByHelp); setDrillRecords(saved.drillRecords ?? {}); }} />

    {!mode ? <section aria-labelledby="drill-modes-title">
      <div className={styles.sectionHeading}><h2 id="drill-modes-title">Выбери упражнение</h2><p>Каждый блок содержит два коротких задания. Для продолжения после обновления включи сохранение выше.</p></div>
      <div className={styles.modeGrid}>{drillModes.map((drillMode) => {
        const done = writingDrills.filter((drill) => drill.mode === drillMode.id && completed.includes(drill.id)).length;
        return <article className={styles.modeCard} key={drillMode.id}>
          <span className={styles.modeSkill}>{drillMode.skill}</span>
          <h3>{drillMode.title}</h3>
          <p>{drillMode.summary}</p>
          <div className={styles.modeFooter}><span>{done} / 2 выполнено</span><button type="button" onClick={() => chooseMode(drillMode.id)}>{done === 2 ? 'Пройти ещё раз' : 'Начать'} <span aria-hidden="true">→</span></button></div>
        </article>;
      })}</div>
      <div className={styles.essayCallout}><div><h2>Хочешь поработать с целым эссе?</h2><p>В основном тренажёре ты сам находишь ошибки в готовом тексте и постепенно улучшаешь его по критериям IELTS.</p></div><Link href="/writing/trainer/practice">Перейти к эссе →</Link></div>
    </section> : item && <section className={styles.exercise} aria-labelledby="exercise-title" key={item.id}>
      <div className={styles.exerciseTop}><button type="button" className={styles.back} onClick={() => { setMode(null); clearAttempt(); }}>← Все упражнения</button><span>Задание {index + 1} из {items.length}</span></div>
      <div className={styles.progress} aria-hidden="true"><span style={{ width: `${((index + 1) / items.length) * 100}%` }} /></div>
      <div className={styles.exerciseHead}><p className={styles.eyebrow}>{item.context}</p><h2 id="exercise-title">{item.title}</h2><p>{item.task}</p></div>
      <div className={styles.source} aria-label="Исходные идеи"><span>ИСХОДНЫЕ ИДЕИ</span>{item.source.map((line) => <p key={line}>{line}</p>)}</div>
      <label className={styles.draftLabel} htmlFor="writing-drill-draft">Твой вариант <span>сначала попробуй сам</span></label>
      <textarea id="writing-drill-draft" value={draft} onChange={(event) => { setDraft(event.target.value); setFeedback(''); }} maxLength={600} rows={3} placeholder="Напиши предложение своими словами…" disabled={optionsVisible} />
      <p className={styles.note}>Свободный текст не оценивается автоматически. Сравни смысл своей правки с разбором ниже.</p>
      {!optionsVisible && <button type="button" className={styles.primary} onClick={showOptions}>Я написал свой вариант · показать решения →</button>}
      {optionsVisible && <><fieldset className={styles.choices} disabled={revealed}>
        <legend>Какой вариант лучше сохраняет смысл и выполняет задание?</legend>
        {item.choices.map((option, optionIndex) => <label className={choice === optionIndex ? styles.choiceSelected : styles.choice} key={option.text}>
          <input type="radio" name={`drill-choice-${item.id}`} checked={choice === optionIndex} onChange={() => { setChoice(optionIndex); setFeedback(''); }} />
          <span>{option.text}</span>
        </label>)}
      </fieldset>
      {!revealed && <div className={styles.actions}><button type="button" className={styles.primary} onClick={checkChoice}>Проверить выбор →</button>{attempts >= 2 && <button type="button" className={styles.secondary} onClick={() => { setRevealed(true); setRevealedByHelp(true); setFeedback('Разбор открыт. Сравни свой вариант с примером и объяснением.'); }}>Показать разбор</button>}</div>}</>}
      {feedback && <p className={revealed ? styles.feedbackGood : styles.feedback} role="status">{feedback}{!revealed && attempts > 0 ? ' Попробуй ещё раз.' : ''}</p>}
      {revealed && <div className={styles.reveal}>
        <span className={styles.modeSkill}>РАЗБОР · {item.criterion}</span>
        <h3>Сравни с собственной попыткой</h3>
        <div className={styles.compare}><div><span>ТВОЙ ВАРИАНТ</span><p>{draft}</p></div><div><span>УЧЕБНЫЙ ПРИМЕР</span><p>{item.example}</p></div></div>
        <p>{item.explanation}</p>
        <p className={styles.revealNote}>Это пример, а не единственно допустимая формулировка. Выбор из трёх вариантов проверен; твой свободный текст не оценивался.</p>
        <button type="button" className={styles.primary} onClick={finishItem}>{index < items.length - 1 ? 'Следующее задание' : 'К упражнениям'} →</button>
      </div>}
    </section>}
    {Object.keys(drillRecords).length > 0 && <section className={styles.reveal} aria-labelledby="drill-history-title"><h2 id="drill-history-title">Твои завершённые попытки</h2><p>Последние {MAX_DRILL_RECORDS} попыток каждого упражнения. Текст не оценивается автоматически; выполнение не означает освоение навыка. Для хранения после закрытия включи сохранение выше.</p><details><summary>Посмотреть первые варианты, выборы и помощь</summary>{writingDrills.filter(drill => drillRecords[drill.id]?.length).map(drill => <section key={drill.id}><h3>{drill.title}</h3>{drillRecords[drill.id].map((record, index) => <article className={styles.record} key={`${record.savedAt}-${index}`}><p>{new Date(record.savedAt).toLocaleString('ru-RU')} · {record.revealedByHelp === null ? 'Способ открытия разбора не сохранён в ранней версии' : record.revealedByHelp ? 'Разбор открыт через помощь' : 'Разбор открыт после подходящего выбора'}</p><p lang="en">{record.draft}</p><p>Выборы: {record.choices.length ? record.choices.map(choice => `${choice + 1}${drill.choices[choice].best ? ' (подходит)' : ' (нужно пересмотреть)'}`).join(' → ') : 'не сохранились в ранней версии'}. Всего проверок выбора: {record.attemptCount}.</p>{record.attemptCount > record.choices.length && <p>Список неполный: при долгой серии сохраняются первый и последние 19 выборов; ранние версии могли не хранить выборы.</p>}</article>)}</section>)}</details></section>}
    {completed.some(id => !drillRecords[id]?.length) && <p className={styles.note}>Часть выполнений отмечена в ранней версии без текста попытки. Их содержание не восстановлено.</p>}
  </main>;
}
