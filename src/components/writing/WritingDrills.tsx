'use client';
import {FeedbackSummary} from '@/components/ui/LearningFeedback';

import TrainerCheckpoint from '@/components/trainers/TrainerCheckpoint';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { drillModes, writingDrills, type DrillMode } from '@/lib/writing-trainer/drills';
import { appendDrillChoice, appendDrillRecord, MAX_DRILL_RECORDS,validDrillRepair, type DrillRecords } from '@/lib/trainers/drill-records';
import styles from './WritingDrills.module.css';
import { motionPaused, MOTION_PREFERENCE_EVENT } from '@/lib/motion-preference';

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
  const [repairRevision,setRepairRevision]=useState(''),[repairReflection,setRepairReflection]=useState(''),[repairUnchanged,setRepairUnchanged]=useState(false);
  const [repairError,setRepairError]=useState('');

  const items = writingDrills.filter((item) => item.mode === mode);
  const item = items[index];
  const lastCheckedIndex = currentChoices.at(-1);
  const lastCheckedOption = lastCheckedIndex === undefined ? undefined : item?.choices[lastCheckedIndex];
  const showCheckedFeedback = Boolean(optionsVisible && lastCheckedOption && feedback === lastCheckedOption.feedback && !revealedByHelp);

  useEffect(() => {
    if (mode) document.getElementById('exercise-title')?.scrollIntoView({ block: 'start' });
  }, [mode, index]);

  useEffect(() => {
    if (!optionsVisible) return;
    const legend = document.getElementById('drill-choice-title');
    legend?.focus({ preventScroll: true });
    legend?.scrollIntoView({ block: 'nearest', behavior: 'auto' });
  }, [optionsVisible]);

  useEffect(() => {
    if (!feedback) return;
    const node = document.getElementById(showCheckedFeedback ? `drill-choice-feedback-${lastCheckedIndex}` : 'drill-feedback-note');
    if (!node) return;
    node.focus({ preventScroll: true });
    node.scrollIntoView({ block: 'nearest', behavior: 'auto' });
    if (motionPaused() || document.hidden) return;
    const animation = node.animate([{ opacity: .6, transform: 'translateY(5px)' }, { opacity: 1, transform: 'translateY(0)' }], { duration: 300, easing: 'cubic-bezier(.2,.7,.2,1)' });
    const reduced = matchMedia('(prefers-reduced-motion: reduce)');
    const stop = () => { if (motionPaused() || document.hidden) animation.cancel(); };
    window.addEventListener(MOTION_PREFERENCE_EVENT, stop); document.addEventListener('visibilitychange', stop); reduced.addEventListener('change', stop);
    return () => { animation.cancel(); window.removeEventListener(MOTION_PREFERENCE_EVENT, stop); document.removeEventListener('visibilitychange', stop); reduced.removeEventListener('change', stop); };
  }, [feedback, showCheckedFeedback, lastCheckedIndex, attempts]);
  function clearAttempt() {
    setDraft('');
    setOptionsVisible(false);
    setChoice(null);
    setAttempts(0);
    setFeedback('');
    setRevealed(false);
    setCurrentChoices([]);
    setRevealedByHelp(false);
    setRepairRevision('');setRepairReflection('');setRepairUnchanged(false);
    setRepairError('');
  }

  function chooseMode(next: DrillMode) {
    setMode(next);
    setIndex(0);
    clearAttempt();
  }

  function finishItem() {
    if (!item) return;
    const repair={revision:repairRevision,reflection:repairReflection,unchanged:repairUnchanged};
    if(!validDrillRepair(repair,draft)){setRepairError('Запиши свою правку и объясни изменение. Если решил оставить первый вариант, отметь это явно и объясни почему.');return;}
    if(draft.length>600){setRepairError('Первый вариант из ранней записи длиннее лимита истории. Скачай его в JSON или Word перед новой пробой; текст не обрезан.');return;}
    if((drillRecords[item.id]?.length??0)>=MAX_DRILL_RECORDS&&!window.confirm('В истории этого упражнения уже 5 попыток. Сначала скачай работу выше. Сохранить новую попытку и удалить самую старую из этой короткой истории?'))return;
    const record = { savedAt: new Date().toISOString(), draft, choices: [...currentChoices], attemptCount: attempts, revealedByHelp,repair };
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


  function renderOwnDraft() {
    return <>
      <label className={styles.draftLabel} htmlFor="writing-drill-draft">Твой вариант на английском <span>сначала попробуй сам</span></label>
      <textarea id="writing-drill-draft" lang="en" value={draft} onChange={(event) => { setDraft(event.target.value); setFeedback(''); }} maxLength={600} rows={3} placeholder="Напиши предложение своими словами…" disabled={optionsVisible} />
      <p className={styles.note}>Свободный текст не оценивается автоматически. Сравни смысл своей правки с разбором ниже.</p>
    </>;
  }

  return <main className={styles.page}>
    <div className={styles.topline}><Link href="/writing/trainer">← К тренажёру эссе</Link><span>ASHYQ / WRITING LAB</span></div>
    <header className={styles.hero} data-exercising={Boolean(mode)}>
      <p className={styles.eyebrow}>КОРОТКИЕ УПРАЖНЕНИЯ · IELTS TASK 2</p>
      <h1>{!mode ? 'Отработай один навык за раз' : revealed ? 'Разбери и перепиши.' : optionsVisible ? 'Какой вариант точнее?' : 'Напиши свой вариант.'}</h1>
      <p>{mode ? 'Сначала своя фраза, затем выбор и разбор. Проверяется выбор варианта — твой свободный текст не оценивается автоматически.' : 'Напиши свой вариант, сравни три решения и прочитай объяснение. Затем перепиши свою попытку и попробуй другое задание. Все задания вымышлены и доступны без входа. Здесь нет автоматической оценки твоего текста или балла IELTS.'}</p>
    </header>
    <TrainerCheckpoint trainer="writing-drills" data={{ mode, index, draft, optionsVisible, choice, attempts, feedback, revealed, completed, currentChoices, revealedByHelp, drillRecords,repairRevision,repairReflection,repairUnchanged }} completed={mode === null && completed.length > 0} onRestore={saved => { setMode(saved.mode); setIndex(saved.index); setDraft(saved.draft); setOptionsVisible(saved.optionsVisible); setChoice(saved.choice); setAttempts(saved.attempts); setFeedback(saved.feedback); setRevealed(saved.revealed); setCompleted(saved.completed); setCurrentChoices(saved.currentChoices ?? []); setRevealedByHelp(saved.revealedByHelp === undefined ? null : saved.revealedByHelp); setDrillRecords(saved.drillRecords ?? {});setRepairRevision(saved.repairRevision??'');setRepairReflection(saved.repairReflection??'');setRepairUnchanged(saved.repairUnchanged??false);setRepairError(''); }} />

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
      <div className={styles.exerciseTop}><button type="button" className={styles.back} data-trainer-replace="writing-drills" onClick={() => { setMode(null); clearAttempt(); }}>← Все упражнения</button><span>Задание {index + 1} из {items.length}</span></div>
      <div className={styles.progress} aria-hidden="true"><span style={{ width: `${((index + 1) / items.length) * 100}%` }} /></div>
      <div className={styles.exerciseHead}><p className={styles.eyebrow}>{item.context}</p><h2 id="exercise-title" tabIndex={-1}>{item.title}</h2><p>{item.task}</p></div>
      <details className={styles.source} open={!optionsVisible}><summary>ИСХОДНЫЕ ИДЕИ</summary>{item.source.map(line => <p key={line} lang="en">{line}</p>)}</details>
      {optionsVisible ? <details className={styles.ownDraft}><summary>Твоя фраза <span>Не оценена автоматически</span></summary><p className={styles.ownDraftText} lang="en">{draft}</p></details> : renderOwnDraft()}      {!optionsVisible && <button type="button" className={styles.primary} onClick={showOptions}>Я написал свой вариант · показать решения →</button>}
      {optionsVisible && <><fieldset className={styles.choices} disabled={revealed}>
        <legend id="drill-choice-title" tabIndex={-1}>Какой вариант лучше сохраняет смысл и выполняет задание?</legend>
        {item.choices.map((option, optionIndex) => {
          const checkedHere = showCheckedFeedback && lastCheckedIndex === optionIndex;
          return <div className={styles.choiceGroup} data-choice-result={checkedHere ? option.best ? 'good' : 'bad' : undefined} key={option.text}>
            <label className={choice === optionIndex ? styles.choiceSelected : styles.choice}>
              <input type="radio" name={`drill-choice-${item.id}`} aria-label={option.text} aria-describedby={checkedHere ? `drill-choice-feedback-${optionIndex}` : undefined} checked={choice === optionIndex} onChange={() => { setChoice(optionIndex); setFeedback(''); }} />
              <span className={styles.choiceLetter} aria-hidden="true">{String.fromCharCode(65 + optionIndex)}</span><span className={styles.choiceText} lang="en">{option.text}</span>
            </label>
            {checkedHere && <div id={`drill-choice-feedback-${optionIndex}`} tabIndex={-1} className={styles.choiceFeedback}>
              <p className={styles.lastChoice}>Последний проверенный выбор</p>
              <h3 className={styles.resultTitle} role="status"><span aria-hidden="true">{option.best ? '✓' : '×'}</span>{option.best ? 'Выбранный вариант верный' : 'Выбранный вариант пока неверный'}</h3>
              <p className={styles.optionExplanation}>{feedback}</p><p className={styles.nextStep}>{revealed ? 'Дальше: сравни со своей фразой и перепиши её ниже.' : 'Выбери другой вариант и снова нажми «Проверить выбор».'}</p><p className={styles.note}>Проверен выбор варианта. Твоё предложение не оценено автоматически.</p>
            </div>}
          </div>;
        })}
      </fieldset>
      {!revealed && <div className={styles.actions}><button type="button" className={styles.primary} onClick={checkChoice}>Проверить выбор →</button>{attempts >= 2 && <button type="button" className={styles.secondary} onClick={() => { setRevealed(true); setRevealedByHelp(true); setFeedback('Разбор открыт. Сравни свой вариант с примером и объяснением.'); }}>Показать разбор</button>}</div>}</>}
      {feedback && !showCheckedFeedback && <div id="drill-feedback-note" tabIndex={-1} className={styles.feedbackNote}>
        {revealedByHelp && currentChoices.length>0 && <FeedbackSummary title="Разбор открыт после помощи" checks={[{label:'Последний проверенный выбор',state:lastCheckedOption?.best?'good':'bad',value:lastCheckedOption?.best?'Верно':'Пока неверно'},{label:'Твоё предложение',state:'neutral',value:'Не оценено автоматически'}]} next="Сравни смысл своей первой попытки с примером. Перепиши её или объясни, почему оставляешь без изменений."/>}
        <p className={styles.feedbackNeutral} role="status">{feedback}{!revealed && attempts > 0 ? ' Попробуй ещё раз.' : ''}</p>
      </div>}      {revealed && <div className={styles.reveal}>
        <span className={styles.modeSkill}>РАЗБОР · {item.criterion}</span>
        <h3>Сравни с собственной попыткой</h3>
        <div className={styles.compare}><div><span>ТВОЙ ВАРИАНТ</span><p>{draft}</p></div><div><span>УЧЕБНЫЙ ПРИМЕР</span><p>{item.example}</p></div></div>
        <p>{item.explanation}</p>
        <p className={styles.revealNote}>Это пример, а не единственно допустимая формулировка. Выбор из трёх вариантов проверен; твой свободный текст не оценивался.</p>
        <h3>Теперь перепиши свой вариант</h3><p>Исправь свою первую попытку с опорой на объяснение. Сохрани свою мысль: можно написать иначе, чем в учебном примере.</p>
        <label className={styles.draftLabel} htmlFor="drill-repair">Твой вариант после разбора</label><textarea id="drill-repair" lang="en" maxLength={600} rows={4} disabled={repairUnchanged} value={repairRevision} onChange={event=>{setRepairRevision(event.target.value);setRepairError('');}}/>
        <label className={styles.unchanged}><input type="checkbox" disabled={draft.length>600} checked={repairUnchanged} onChange={event=>{setRepairUnchanged(event.target.checked);if(event.target.checked)setRepairRevision(draft);setRepairError('');}}/>Я сверил свой первый вариант и решил оставить его без правок</label>
        <label className={styles.draftLabel} htmlFor="drill-reflection">Что изменил и почему? Или почему оставил без правок?</label><textarea id="drill-reflection" maxLength={1000} rows={3} value={repairReflection} onChange={event=>{setRepairReflection(event.target.value);setRepairError('');}}/>
        <p className={styles.revealNote}>Обе версии и объяснение сохранятся отдельно. Правка после подсказки не считается самостоятельным решением; её качество автоматически не оценивается.</p>
        {repairError&&<p className={styles.feedback} role="alert">{repairError}</p>}
        <button type="button" className={styles.primary} onClick={finishItem}>{index < items.length - 1 ? 'Следующее задание' : 'К упражнениям'} →</button>
      </div>}
    </section>}
    {Object.keys(drillRecords).length > 0 && <section className={styles.reveal} aria-labelledby="drill-history-title"><h2 id="drill-history-title">Твои завершённые попытки</h2><p>Последние {MAX_DRILL_RECORDS} попыток каждого упражнения. Текст не оценивается автоматически; выполнение не означает освоение навыка. Для хранения после закрытия включи сохранение выше.</p><details><summary>Посмотреть первые варианты, свои правки и помощь</summary>{writingDrills.filter(drill => drillRecords[drill.id]?.length).map(drill => <section key={drill.id}><h3>{drill.title}</h3>{drillRecords[drill.id].map((record, index) => <article className={styles.record} key={`${record.savedAt}-${index}`}><p>{new Date(record.savedAt).toLocaleString('ru-RU')} · {record.revealedByHelp === null ? 'Способ открытия разбора не сохранён в ранней версии' : record.revealedByHelp ? 'Разбор открыт через помощь' : 'Разбор открыт после подходящего выбора'}</p><p>Первая попытка:</p><p lang="en">{record.draft}</p>{record.repair?<><p>После разбора{record.repair.unchanged?" · оставил без правок":""}:</p><p lang="en">{record.repair.revision}</p><p>Объяснение: {record.repair.reflection}</p></>:<p>В ранней версии собственная правка и объяснение не записывались.</p>}<p>Выборы: {record.choices.length ? record.choices.map(choice => `${choice + 1}${drill.choices[choice].best ? ' (подходит)' : ' (нужно пересмотреть)'}`).join(' → ') : 'не сохранились в ранней версии'}. Всего проверок выбора: {record.attemptCount}.</p>{record.attemptCount > record.choices.length && <p>Список неполный: при долгой серии сохраняются первый и последние 19 выборов; ранние версии могли не хранить выборы.</p>}</article>)}</section>)}</details></section>}
    {completed.some(id => !drillRecords[id]?.length) && <p className={styles.note}>Часть выполнений отмечена в ранней версии без текста попытки. Их содержание не восстановлено.</p>}
  </main>;
}
