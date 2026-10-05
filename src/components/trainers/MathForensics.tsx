'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { mathForensicsCases, numericAnswerMatches, parseNumericAnswer } from '@/lib/math-forensics/cases';
import styles from './MathForensics.module.css';

type Phase = 'choose' | 'locate' | 'feedback' | 'continue' | 'transfer' | 'result';
type FirstAttempt = { stepIndex: number; mechanism: string; repairLine: string };
type TransferAttempt = { stepIndex: number; answer: string };

function WorkedSteps({ steps, selected, onSelect }: { steps: string[]; selected: number | null; onSelect: (index: number) => void }) {
  return <div className={styles.steps} role="group" aria-label="Выбери первую неверную строку решения">
    {steps.map((step, index) => <button key={`${index}-${step}`} type="button" className={selected === index ? styles.stepSelected : styles.step} aria-pressed={selected === index} onClick={() => onSelect(index)}>
      <span>Шаг {index + 1}</span><strong>{step}</strong>
    </button>)}
  </div>;
}

export default function MathForensics() {
  const [caseIndex, setCaseIndex] = useState<number | null>(null);
  const [phase, setPhase] = useState<Phase>('choose');
  const [stepIndex, setStepIndex] = useState<number | null>(null);
  const [mechanism, setMechanism] = useState('');
  const [repairLine, setRepairLine] = useState('');
  const [firstAttempt, setFirstAttempt] = useState<FirstAttempt | null>(null);
  const [ownAnswer, setOwnAnswer] = useState('');
  const [transferStep, setTransferStep] = useState<number | null>(null);
  const [transferAnswer, setTransferAnswer] = useState('');
  const [transferAttempt, setTransferAttempt] = useState<TransferAttempt | null>(null);
  const [error, setError] = useState('');
  const current = caseIndex === null ? null : mathForensicsCases[caseIndex];

  useEffect(() => {
    if (phase !== 'choose') {
      const heading = document.getElementById('math-stage-title');
      heading?.scrollIntoView({ block: 'start' });
      heading?.focus({ preventScroll: true });
    }
  }, [phase, caseIndex]);

  function start(index: number) {
    setCaseIndex(index); setStepIndex(null); setMechanism(''); setRepairLine(''); setFirstAttempt(null);
    setOwnAnswer(''); setTransferStep(null); setTransferAnswer(''); setTransferAttempt(null); setError(''); setPhase('locate');
  }
  function commitFirst() {
    if (stepIndex === null || !mechanism || !repairLine.trim()) {
      setError('Выбери первую неверную строку, причину и напиши исправленную строку.'); return;
    }
    setFirstAttempt({ stepIndex, mechanism, repairLine: repairLine.trim() }); setError(''); setPhase('feedback');
  }
  function commitContinuation() {
    if (parseNumericAnswer(ownAnswer) === null) { setError('Введи конечное числовое значение. Десятичную дробь можно написать через точку или запятую.'); return; }
    setError(''); setPhase('transfer');
  }
  function commitTransfer() {
    if (transferStep === null || parseNumericAnswer(transferAnswer) === null) {
      setError('Выбери первую неверную строку нового решения и введи конечное число.'); return;
    }
    setTransferAttempt({ stepIndex: transferStep, answer: transferAnswer }); setError(''); setPhase('result');
  }

  return <main className={styles.page}>
    <div className={styles.topline}><Link href="/trainers">← Все тренажёры</Link><span>ASHYQ · SAT MATH LAB</span></div>
    <header className={styles.hero}><p className={styles.eyebrow}>SAT MATH · УЧЕБНЫЕ ПРИМЕРЫ</p><h1>Найди первую ошибку</h1><p>Посмотри чужое решение. Укажи первый неверный шаг, объясни причину и исправь только эту строку. Затем доведи решение до конца и проверь себя на новой задаче.</p></header>
    {phase === 'choose' && <section aria-labelledby="math-stage-title"><div className={styles.sectionHead}><h2 id="math-stage-title">Выбери механизм ошибки</h2><p>Две авторские задачи: алгебра и проценты. Твои действия остаются в этой вкладке.</p></div><div className={styles.caseGrid}>{mathForensicsCases.map((item, index) => <article className={styles.caseCard} key={item.id}><span>{item.domain}</span><h3>{item.title}</h3><p>Найди неверный переход и попробуй исправить ход решения.</p><button className={styles.primary} type="button" onClick={() => start(index)}>Начать →</button></article>)}</div></section>}
    {current && phase !== 'choose' && <section className={styles.lesson} aria-labelledby="math-stage-title">
      <div className={styles.lessonTop}><button type="button" onClick={() => { setCaseIndex(null); setPhase('choose'); window.scrollTo({ top: 0 }); }}>← К выбору</button><span>{current.domain} · {current.title}</span></div>
      <div className={styles.progress} aria-label={`Шаг ${['locate', 'feedback', 'continue', 'transfer', 'result'].indexOf(phase) + 1} из 5`}><span style={{ width: `${(['locate', 'feedback', 'continue', 'transfer', 'result'].indexOf(phase) + 1) * 20}%` }} /></div>
      <h2 id="math-stage-title" tabIndex={-1}>{phase === 'locate' ? '1. Найди первый неверный переход' : phase === 'feedback' ? '2. Сравни свою правку' : phase === 'continue' ? '3. Реши до конца сам' : phase === 'transfer' ? '4. Найди ошибку в новой задаче' : '5. Что удалось проверить'}</h2>
      {phase === 'locate' && <div className={styles.taskGrid}><section className={styles.problemCard}><p className={styles.miniLabel}>ЗАДАЧА</p><h3>{current.problem}</h3><p>Нажми на первую строку, которая уже неверна. Более поздняя строка может повторять ошибку, но она не первая.</p><WorkedSteps steps={current.steps} selected={stepIndex} onSelect={setStepIndex} /></section><section className={styles.responseCard}><fieldset className={styles.mechanisms}><legend>Что произошло в этом переходе?</legend>{current.mechanismOptions.map((item) => <label key={item}><input type="radio" name="math-mechanism" checked={mechanism === item} onChange={() => setMechanism(item)} />{item}</label>)}</fieldset><label className={styles.fieldLabel} htmlFor="math-repair">Как должна выглядеть только эта строка?</label><input id="math-repair" className={styles.textInput} value={repairLine} onChange={(event) => setRepairLine(event.target.value)} placeholder="Напиши исправленную строку" autoComplete="off" /><p className={styles.note}>Свободная строка не оценивается автоматически: сравни её с авторским примером на следующем шаге.</p>{error && <p className={styles.error} role="alert">{error}</p>}<button type="button" className={styles.primary} onClick={commitFirst}>Зафиксировать попытку →</button></section></div>}
      {phase === 'feedback' && firstAttempt && <div className={styles.panel}><div className={styles.compare}><div><span>ТВОЯ ПЕРВАЯ ПОПЫТКА</span><strong>Шаг {firstAttempt.stepIndex + 1}</strong><p>{firstAttempt.stepIndex === current.wrongStepIndex ? 'Первая неверная строка найдена.' : `Первая неверная строка — шаг ${current.wrongStepIndex + 1}.`}</p><p>Причина: {firstAttempt.mechanism}</p><p>Твоя правка: {firstAttempt.repairLine}</p></div><div><span>АВТОРСКАЯ ОПОРА</span><strong>Шаг {current.wrongStepIndex + 1}</strong><p>{current.correctionWhy}</p><p>Исправленная строка: <b>{current.correctedStep}</b></p></div></div><p className={styles.note}>Причина {firstAttempt.mechanism === current.mechanism ? 'совпала с разбором' : 'отличается от разбора'}. Твоя свободная строка показана для самостоятельного сравнения, без автоматического вердикта.</p><button type="button" className={styles.primary} onClick={() => { setError(''); setPhase('continue'); }}>Продолжить решение →</button></div>}
      {phase === 'continue' && <div className={styles.narrowPanel}><p className={styles.miniLabel}>ИСПРАВЛЕННЫЙ ПЕРЕХОД</p><p className={styles.correctedLine}>{current.correctedStep}</p><p>Теперь продолжи решение самостоятельно. Полный ход появится только после твоего числового ответа и новой задачи.</p><label className={styles.fieldLabel} htmlFor="math-own-answer">Твой конечный ответ</label><input id="math-own-answer" className={styles.textInput} inputMode="decimal" value={ownAnswer} onChange={(event) => setOwnAnswer(event.target.value)} placeholder="Например, 10" autoComplete="off" />{error && <p className={styles.error} role="alert">{error}</p>}<button type="button" className={styles.primary} onClick={commitContinuation}>Зафиксировать решение →</button></div>}
      {phase === 'transfer' && <div className={styles.taskGrid}><section className={styles.problemCard}><p className={styles.miniLabel}>НОВАЯ ЗАДАЧА</p><h3>{current.transfer.problem}</h3><WorkedSteps steps={current.transfer.steps} selected={transferStep} onSelect={setTransferStep} /></section><section className={styles.responseCard}><p>Укажи первую ошибку и вычисли правильный итог без подсказки.</p><label className={styles.fieldLabel} htmlFor="math-transfer-answer">Правильный числовой ответ</label><input id="math-transfer-answer" className={styles.textInput} inputMode="decimal" value={transferAnswer} onChange={(event) => setTransferAnswer(event.target.value)} placeholder="Введи число" autoComplete="off" />{error && <p className={styles.error} role="alert">{error}</p>}<button type="button" className={styles.primary} onClick={commitTransfer}>Проверить новый пример →</button></section></div>}
      {phase === 'result' && firstAttempt && transferAttempt && <div className={styles.panel}><div className={styles.resultGrid}><div><span>ПЕРВАЯ ОШИБКА</span><strong>{firstAttempt.stepIndex === current.wrongStepIndex ? 'Найдена' : 'Нужно пересмотреть'}</strong><p>Причина {firstAttempt.mechanism === current.mechanism ? 'совпала с разбором' : 'не совпала с разбором'}.</p></div><div><span>СВОЁ РЕШЕНИЕ</span><strong>{numericAnswerMatches(ownAnswer, current.finalAnswer) ? 'Ответ верен' : 'Ответ требует проверки'}</strong><p>Твой ответ: {ownAnswer}. Авторский ответ: {current.finalAnswer}.</p></div><div><span>НОВЫЙ ПРИМЕР</span><strong>{transferAttempt.stepIndex === current.transfer.wrongStepIndex && numericAnswerMatches(transferAttempt.answer, current.transfer.answer) ? 'Оба шага верны' : 'Проверь ход решения'}</strong><p>Первый неверный шаг: {current.transfer.wrongStepIndex + 1}. Верный итог: {current.transfer.answer}.</p></div></div><div className={styles.reveal}><p className={styles.miniLabel}>ПОЛНЫЙ РАЗБОР ПОСЛЕ ПОПЫТКИ</p><p>{current.finalWorking}</p><p>{current.transfer.explanation}</p></div><p className={styles.note}>Это две учебные задачи, не оценка SAT и не вывод об устойчивом владении навыком. Свободная правка строки не проверялась автоматически.</p><div className={styles.actions}><button type="button" className={styles.primary} onClick={() => start(caseIndex === 0 ? 1 : 0)}>Другая ошибка →</button><Link href="/trainers">К тренажёрам</Link></div></div>}
    </section>}
  </main>;
}
