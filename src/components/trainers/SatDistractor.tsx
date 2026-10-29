'use client';
import {FeedbackSummary,LearningRoute} from '@/components/ui/LearningFeedback';

import TrainerCheckpoint from '@/components/trainers/TrainerCheckpoint';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { distractorCases, distractorReasons, expectedReason, type DistractorItem, type ReasonId } from '@/lib/sat-distractor/cases';
import styles from './SatDistractor.module.css';
import StudyContext from './StudyContext';

type Attempt = { answerIndex: number; reasons: Record<number, ReasonId> };
type Phase = 'choose' | 'answer' | 'reasons' | 'review' | 'result';
type Round = 'first' | 'transfer';

function reasonLabel(reason: ReasonId | 'best') {
  return reason === 'best' ? 'Лучший ответ' : distractorReasons.find((item) => item.id === reason)?.label ?? reason;
}

function reasonMatches(attempt: Attempt, item: DistractorItem) {
  return item.choices.reduce((count, _choice, index) => index !== attempt.answerIndex && attempt.reasons[index] === expectedReason(item, index) ? count + 1 : count, 0);
}

export default function SatDistractor() {
  const [caseIndex, setCaseIndex] = useState<number | null>(null);
  const [phase, setPhase] = useState<Phase>('choose');
  const [round, setRound] = useState<Round>('first');
  const [answerIndex, setAnswerIndex] = useState<number | null>(null);
  const [reasons, setReasons] = useState<Record<number, ReasonId>>({});
  const [first, setFirst] = useState<Attempt | null>(null);
  const [transfer, setTransfer] = useState<Attempt | null>(null);
  const [error, setError] = useState('');
  const current = caseIndex === null ? null : distractorCases[caseIndex];
  const item = current ? current[round] : null;

  useEffect(() => {
    if (phase !== 'choose') {
      const heading = document.getElementById('distractor-stage-title');
      heading?.scrollIntoView({ block: 'start' });
      heading?.focus({ preventScroll: true });
    }
  }, [phase, round, caseIndex]);

  function start(index: number) {
    setCaseIndex(index); setRound('first'); setAnswerIndex(null); setReasons({}); setFirst(null); setTransfer(null); setError(''); setPhase('answer');
  }
  function commitAnswer() {
    if (answerIndex === null) { setError('Сначала выбери лучший ответ.'); return; }
    setError(''); setPhase('reasons');
  }
  function commitReasons() {
    if (!item || answerIndex === null) return;
    const missing = item.choices.some((_choice, index) => index !== answerIndex && !reasons[index]);
    if (missing) { setError('Для каждого из трёх остальных вариантов укажи причину или отметь, что он тоже может быть лучшим.'); return; }
    const attempt = { answerIndex, reasons: { ...reasons } };
    if (round === 'first') { setFirst(attempt); setPhase('review'); }
    else { setTransfer(attempt); setPhase('result'); }
    setError('');
  }
  function startTransfer() { setRound('transfer'); setAnswerIndex(null); setReasons({}); setError(''); setPhase('answer'); }

  return <main className={styles.page} data-study-active={phase !== 'choose'} data-study-phase={phase} data-study-kind="SatDistractor" data-study-entry={phase === 'choose'}>
    <div className={styles.topline}><Link href="/trainers">← Все тренажёры</Link><span>ASHYQ · SAT R&W LAB</span></div>
    <header className={styles.hero} data-study-header><p className={styles.eyebrow}>SAT READING & WRITING · УЧЕБНЫЕ ПРИМЕРЫ</p><h1>Разбери ложные варианты</h1><details data-study-instructions><summary>Инструкции и ограничения</summary><p>Выбери лучший ответ. Затем для каждого другого варианта объясни, почему он не подходит — или отметь, что сомневаешься. Сравни ход мысли с разбором и попробуй новый текст.</p></details></header>
    {phase === 'choose' && <section data-study-entry-choice aria-labelledby="distractor-stage-title"><div className={styles.sectionHead}><h2 id="distractor-stage-title">Выбери ловушку</h2><p>Два авторских сценария с новым вопросом для каждого. Для продолжения после обновления включи сохранение в разделе сохранения.</p></div><div className={styles.caseGrid}>{distractorCases.map((entry, index) => <article className={styles.caseCard} key={entry.id}><span>{entry.domain}</span><h3>{entry.title}</h3><p>Верный выбор может скрывать слабое объяснение неверных вариантов.</p><button type="button" className={styles.primary} onClick={() => start(index)}>Начать →</button></article>)}</div></section>}
    <TrainerCheckpoint trainer="sat-distractor" data={{ caseIndex, phase, round, answerIndex, reasons, first, transfer }} completed={phase === 'result'} onRestore={saved => { setCaseIndex(saved.caseIndex); setPhase(saved.phase); setRound(saved.round); setAnswerIndex(saved.answerIndex); setReasons(saved.reasons); setFirst(saved.first); setTransfer(saved.transfer); setError(''); }} />
    {current && item && phase !== 'choose' && <section className={styles.lesson} data-study-lesson aria-labelledby="distractor-stage-title">
      <div className={styles.lessonTop}><button type="button" data-trainer-replace="sat-distractor" onClick={() => { setCaseIndex(null); setPhase('choose'); window.scrollTo({ top: 0 }); }}>← К выбору</button><span>{current.domain} · {current.title}</span></div>
      <LearningRoute phase={phase} steps={[["answer","Свой ответ"],["reasons","Разбор вариантов"],["review","Сверка с объяснением"],["result","Итог"]]} round={round === "transfer" ? "Новый пример" : "Первый пример"}/>
      <h2 id="distractor-stage-title" tabIndex={-1}>{phase === 'answer' ? round === 'first' ? 'Выбери лучший ответ' : 'Новый текст: выбери ответ' : phase === 'reasons' ? round === 'first' ? 'Разбери три альтернативы' : 'Разбери альтернативы заново' : phase === 'review' ? 'Сверь свои причины' : 'Что показал новый вопрос'}</h2>
      {(phase === 'answer' || phase === 'reasons') && <div className={styles.taskGrid} data-study-sheet><section className={styles.passage} data-study-source><p className={styles.miniLabel}>АВТОРСКИЙ SAT-STYLE ТЕКСТ</p><p lang="en">{item.passage}</p><h3 lang="en">{item.question}</h3></section><section className={styles.response} data-study-response>
        {phase === 'answer' && <><fieldset className={styles.choices}><legend>Какой вариант лучше всего следует из текста?</legend>{item.choices.map((choice, index) => <label key={index} className={answerIndex === index ? styles.choiceSelected : styles.choice}><input type="radio" name="distractor-answer" checked={answerIndex === index} onChange={() => setAnswerIndex(index)} /><b>{'ABCD'[index]}.</b>{choice.text}</label>)}</fieldset>{error && <p className={styles.error} role="alert">{error}</p>}<button type="button" className={styles.primary} onClick={commitAnswer}>Зафиксировать выбор →</button></>}
        {phase === 'reasons' && answerIndex !== null && <><div className={styles.locked}><span>ТВОЙ ВЫБОР</span><strong>{'ABCD'[answerIndex]} · {item.choices[answerIndex].text}</strong></div><p className={styles.instruction}>Теперь оцени остальные три варианта. Если среди них может быть лучший, отметь это — не придумывай ложную причину.</p><div className={styles.reasonList}>{item.choices.map((choice, index) => index === answerIndex ? null : <div className={styles.reasonRow} key={index}><p><b>{'ABCD'[index]}.</b> {choice.text}</p><label htmlFor={`reason-${index}`}>Как ты оцениваешь вариант {'ABCD'[index]}?</label><select id={`reason-${index}`} value={reasons[index] ?? ''} onChange={(event) => setReasons((previous) => ({ ...previous, [index]: event.target.value as ReasonId }))}><option value="">Выбери оценку</option>{distractorReasons.map((reason) => <option key={reason.id} value={reason.id}>{reason.label}</option>)}</select><p className={styles.note}>Твой разбор: {reasonLabel(reasons[index])}</p></div>)}</div>{error && <p className={styles.error} role="alert">{error}</p>}<button type="button" className={styles.primary} onClick={commitReasons}>Открыть разбор →</button></>}
      </section></div>}
      {phase === 'review' && first && <div className={styles.review} data-study-review><FeedbackSummary title={first.answerIndex===current.first.correctIndex?'Ответ верный. Теперь проверь объяснения':'Ответ нужно пересмотреть'} checks={[{label:'Выбор ответа',state:first.answerIndex===current.first.correctIndex?'good':'bad',value:first.answerIndex===current.first.correctIndex?'Верно':'Пока неверно',detail:'Твой: '+'ABCD'[first.answerIndex]+'. Верный: '+'ABCD'[current.first.correctIndex]+'.'},{label:'Типы ловушек',state:reasonMatches(first,current.first)===3?'good':'review',value:reasonMatches(first,current.first)+' из 3 совпали с разметкой',detail:'Другой ярлык сам по себе не делает твоё рассуждение неверным: сравни объяснение с текстом.'}]} next="Разбери отличия ниже. Затем проверь выбор на новом тексте."/><StudyContext passage={current.first.passage} question={current.first.question}/><div className={styles.summary}><div><span>ТВОЙ ОТВЕТ</span><strong>{'ABCD'[first.answerIndex]} · {first.answerIndex === current.first.correctIndex ? 'верен' : 'нужно пересмотреть'}</strong></div><div><span>ОЦЕНКИ ТРЁХ АЛЬТЕРНАТИВ</span><strong>{reasonMatches(first, current.first)} из 3 совпали</strong></div></div>{first.answerIndex !== current.first.correctIndex && first.reasons[current.first.correctIndex] === 'may-be-correct' && <p className={styles.warning}>Ты заметил, что верный вариант может подойти, но выбрал другой. Сравни, какая деталь текста должна была решить выбор.</p>}<div className={styles.autopsy}><h3>Авторский разбор каждого варианта</h3>{current.first.choices.map((choice, index) => <div key={index} data-study-verdict={index === first.answerIndex ? index === current.first.correctIndex ? 'good' : 'bad' : first.reasons[index] === expectedReason(current.first, index) ? 'good' : 'review'}><span>{'ABCD'[index]} · {reasonLabel(choice.reason)}</span><p className={styles.optionText} lang="en">{choice.text}</p><p>{choice.explanation}</p><p className={styles.rowVerdict}>{index === first.answerIndex ? index === current.first.correctIndex ? 'Твой выбор ответа: верно.' : 'Твой выбор ответа: пока неверно.' : first.reasons[index] === expectedReason(current.first, index) ? 'Твоя оценка альтернативы совпала с разметкой.' : 'Ярлык отличается — сравни объяснение с текстом.'}</p>{index !== first.answerIndex && <small>Твой разбор: {reasonLabel(first.reasons[index])}</small>}</div>)}</div><p className={styles.note}>В разборе указан основной тип ловушки. Если подходит другой ярлык, проверь своё объяснение по тексту: несовпадение ярлыка само по себе не опровергает рассуждение.</p><p className={styles.takeaway}>{current.first.takeaway}</p><button type="button" className={styles.primary} onClick={startTransfer}>Проверить на новом тексте →</button></div>}
      {phase === 'result' && first && transfer && <div className={styles.review} data-study-review><div className={styles.summary}><div><span>ПЕРВЫЙ ВОПРОС</span><strong>{first.answerIndex === current.first.correctIndex ? 'Ответ верен' : 'Ответ неверен'}</strong><p>Твой ответ: {'ABCD'[first.answerIndex]}. Верный: {'ABCD'[current.first.correctIndex]}.</p><p>Классификация альтернатив: {reasonMatches(first, current.first)} из 3.</p></div><div><span>НОВЫЙ ВОПРОС</span><strong>{transfer.answerIndex === current.transfer.correctIndex ? 'Ответ верен' : 'Ответ неверен'}</strong><p>Твой ответ: {'ABCD'[transfer.answerIndex]}. Верный: {'ABCD'[current.transfer.correctIndex]}.</p><p>Классификация альтернатив: {reasonMatches(transfer, current.transfer)} из 3.</p></div></div>{transfer.answerIndex === current.transfer.correctIndex && reasonMatches(transfer, current.transfer) < 3 && <p className={styles.warning}>Ответ верен, но часть объяснений неверных вариантов пока не совпала с разбором.</p>}{transfer.answerIndex !== current.transfer.correctIndex && transfer.reasons[current.transfer.correctIndex] === 'may-be-correct' && <p className={styles.warning}>Ты отметил верный вариант как возможный ответ, но выбрал другой. Сравни оба с конкретной деталью текста.</p>}<StudyContext passage={current.transfer.passage} question={current.transfer.question}/><div className={styles.autopsy}><h3>Разбор нового вопроса</h3>{current.transfer.choices.map((choice, index) => <div key={index} data-study-verdict={index === transfer.answerIndex ? index === current.transfer.correctIndex ? 'good' : 'bad' : transfer.reasons[index] === expectedReason(current.transfer, index) ? 'good' : 'review'}><span>{'ABCD'[index]} · {reasonLabel(choice.reason)}</span><p className={styles.optionText} lang="en">{choice.text}</p><p>{choice.explanation}</p><p className={styles.rowVerdict}>{index === transfer.answerIndex ? index === current.transfer.correctIndex ? 'Твой выбор ответа: верно.' : 'Твой выбор ответа: пока неверно.' : transfer.reasons[index] === expectedReason(current.transfer, index) ? 'Твоя оценка альтернативы совпала с разметкой.' : 'Ярлык отличается — сравни объяснение с текстом.'}</p>{index !== transfer.answerIndex && <small>Твой разбор: {reasonLabel(transfer.reasons[index])}</small>}</div>)}</div><p className={styles.takeaway}>{current.transfer.takeaway}</p><p className={styles.note}>Это два авторских учебных вопроса, не SAT score и не вывод об устойчивом навыке. Причины сравниваются только с подготовленной разметкой этих вариантов.</p><div className={styles.actions}><button type="button" className={styles.primary} data-trainer-replace="sat-distractor" onClick={() => start(caseIndex === 0 ? 1 : 0)}>Другая ловушка →</button><Link href="/trainers">К тренажёрам</Link></div></div>}
    </section>}
  </main>;
}
