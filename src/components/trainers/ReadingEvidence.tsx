'use client';
import {ReadingFeedback,LearningRoute} from '@/components/ui/LearningFeedback';

import TrainerCheckpoint from '@/components/trainers/TrainerCheckpoint';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { answerLabels, evidenceMatches, readingCases, type Confidence, type ReadingTask, type TfngAnswer } from '@/lib/reading-evidence/cases';
import styles from './ReadingEvidence.module.css';

type Attempt = { answer: TfngAnswer; evidenceId: string; confidence: Confidence };
type Phase = 'choose' | 'first' | 'review' | 'repair' | 'transfer' | 'result';

function TaskView({ task, answer, evidenceId, confidence, onAnswer, onEvidence, onConfidence, onSubmit, submitLabel, error }: {
  task: ReadingTask;
  answer: TfngAnswer | '';
  evidenceId: string;
  confidence: Confidence | '';
  onAnswer: (value: TfngAnswer) => void;
  onEvidence: (value: string) => void;
  onConfidence: (value: Confidence) => void;
  onSubmit: () => void;
  submitLabel: string;
  error: string;
}) {
  return <>
    <div className={styles.taskGrid}>
      <section className={styles.passage} aria-labelledby="passage-title">
        <p className={styles.miniLabel}>УЧЕБНЫЙ ТЕКСТ · НАПИСАН ASHYQ</p>
        <h3 id="passage-title">{task.passageTitle}</h3>
        <p className={styles.instruction}>Нажми на предложение, которое ближе всего к ответу. Для NOT GIVEN это область проверки, а не доказательство отсутствия.</p>
        <div className={styles.sentences}>
          {task.sentences.map((sentence) => <button
            key={sentence.id}
            type="button"
            className={evidenceId === sentence.id ? styles.sentenceSelected : styles.sentence}
            aria-pressed={evidenceId === sentence.id}
            onClick={() => onEvidence(sentence.id)}
          ><span aria-hidden="true">{sentence.id.toUpperCase()}</span>{sentence.text}</button>)}
        </div>
      </section>
      <section className={styles.response} aria-labelledby="statement-title">
        <p className={styles.miniLabel}>УТВЕРЖДЕНИЕ</p>
        <h3 id="statement-title">{task.statement}</h3>
        <fieldset className={styles.answerGroup}>
          <legend>Твой ответ</legend>
          {(['TRUE', 'FALSE', 'NOT GIVEN'] as const).map((value) => <label key={value} className={answer === value ? styles.optionSelected : styles.option}>
            <input type="radio" name="tfng-answer" checked={answer === value} onChange={() => onAnswer(value)} />
            {answerLabels[value]}
          </label>)}
        </fieldset>
        <fieldset className={styles.confidenceGroup}>
          <legend>Насколько уверен?</legend>
          {([['low', 'Низкая'], ['medium', 'Средняя'], ['high', 'Высокая']] as const).map(([value, label]) => <label key={value}>
            <input type="radio" name="tfng-confidence" checked={confidence === value} onChange={() => onConfidence(value)} /> {label}
          </label>)}
        </fieldset>
        {error && <p className={styles.error} role="alert">{error}</p>}
        <button className={styles.primary} type="button" onClick={onSubmit}>{submitLabel} →</button>
      </section>
    </div>
  </>;
}

export default function ReadingEvidence() {
  const [caseIndex, setCaseIndex] = useState<number | null>(null);
  const [phase, setPhase] = useState<Phase>('choose');
  const [answer, setAnswer] = useState<TfngAnswer | ''>('');
  const [evidenceId, setEvidenceId] = useState('');
  const [confidence, setConfidence] = useState<Confidence | ''>('');
  const [first, setFirst] = useState<Attempt | null>(null);
  const [repair, setRepair] = useState<Attempt | null>(null);
  const [transfer, setTransfer] = useState<Attempt | null>(null);
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');
  const current = caseIndex === null ? null : readingCases[caseIndex];

  useEffect(() => {
    if (phase !== 'choose') {
      const heading = document.getElementById('reading-stage-title');
      const stageStart = document.getElementById('reading-stage-start');
      (stageStart ?? heading)?.scrollIntoView({ block: 'start' });
      heading?.focus({ preventScroll: true });
    }
  }, [phase, caseIndex]);

  function clearInputs() { setAnswer(''); setEvidenceId(''); setConfidence(''); setError(''); }
  function start(index: number) {
    setCaseIndex(index); setFirst(null); setRepair(null); setTransfer(null); setReason(''); clearInputs(); setPhase('first');
  }
  function record(target: 'first' | 'repair' | 'transfer') {
    if (!answer || !evidenceId || !confidence) {
      setError('Выбери ответ, предложение из текста и уровень уверенности.');
      return;
    }
    const attempt = { answer, evidenceId, confidence };
    if (target === 'first') { setFirst(attempt); setPhase('review'); }
    if (target === 'repair') { setRepair(attempt); clearInputs(); setPhase('transfer'); }
    if (target === 'transfer') { setTransfer(attempt); setPhase('result'); }
    setError('');
  }

  return <main className={styles.page}>
    <div className={styles.topline}><Link href="/trainers">← Все тренажёры</Link><span>ASHYQ · READING LAB</span></div>
    <header className={styles.hero}>
      <p className={styles.eyebrow}>IELTS ACADEMIC READING · УЧЕБНЫЕ ПРИМЕРЫ</p>
      <h1>Докажи ответ текстом</h1>
      <p>Выбери TRUE, FALSE или NOT GIVEN, найди ближайший фрагмент и укажи уверенность. Потом разбери свою логику, исправь ответ и проверь навык на новом тексте.</p>
    </header>
    <TrainerCheckpoint trainer="reading-evidence" data={{ caseIndex, phase, answer, evidenceId, confidence, first, repair, transfer, reason }} completed={phase === 'result'} onRestore={saved => { setCaseIndex(saved.caseIndex); setPhase(saved.phase); setAnswer(saved.answer); setEvidenceId(saved.evidenceId); setConfidence(saved.confidence); setFirst(saved.first); setRepair(saved.repair); setTransfer(saved.transfer); setReason(saved.reason); setError(''); }} />
    {phase === 'choose' && <section aria-labelledby="reading-stage-title">
      <div className={styles.sectionHead}><h2 id="reading-stage-title">Выбери ловушку</h2><p>Два коротких сценария. Ответы не отправляются на сервер. Для продолжения позже включи сохранение выше.</p></div>
      <div className={styles.caseGrid}>{readingCases.map((item, index) => <article className={styles.caseCard} key={item.id}>
        <span className={styles.caseNumber}>0{index + 1}</span><p>{item.focus}</p><h3>{item.title}</h3>
        <button type="button" className={styles.primary} onClick={() => start(index)}>Начать →</button>
      </article>)}</div>
    </section>}
    {current && phase !== 'choose' && <section className={styles.lesson} aria-labelledby="reading-stage-title">
      <div id="reading-stage-start" className={styles.lessonTop}><button type="button" data-trainer-replace="reading-evidence" onClick={() => { setPhase('choose'); setCaseIndex(null); window.scrollTo({ top: 0 }); }}>← К выбору</button><span>{current.focus}</span></div>
      <LearningRoute phase={phase} steps={[["first","Своя попытка"],["review","Разбор"],["repair","Повтор на том же тексте"],["transfer","Новый текст"],["result","Итог"]]}/>
      <h2 id="reading-stage-title" tabIndex={-1}>{phase === 'first' ? '1. Ответ и опора в тексте' : phase === 'review' ? '2. Разбери первое решение' : phase === 'repair' ? '3. Проверь решение ещё раз' : phase === 'transfer' ? '4. Новый текст без подсказки' : '5. Что изменилось'}</h2>
      {phase === 'first' && <TaskView task={current.task} answer={answer} evidenceId={evidenceId} confidence={confidence} onAnswer={setAnswer} onEvidence={setEvidenceId} onConfidence={setConfidence} onSubmit={() => record('first')} submitLabel="Проверить ответ и опору" error={error} />}
      {phase === 'review' && first && <div className={styles.review}>
        <ReadingFeedback task={current.task} attempt={first} evidenceOk={evidenceMatches(current.task,first.evidenceId)}/><details className="learning-explanation"><summary>Почему верный ответ — {current.task.answer}?</summary><p>{current.task.explanation}</p><p lang="en">{current.task.relation}</p><p className="learning-neutral">Уверенность — твоя самооценка. Она не меняет правильность ответа.</p></details>
        <fieldset className={styles.reasons}><legend>Что хочешь проверить на повторной попытке?</legend>{current.reasons.map((item) => <label key={item}><input type="radio" name="reading-reason" checked={reason === item} onChange={() => setReason(item)} />{item}</label>)}</fieldset>
        {error && <p className={styles.error} role="alert">{error}</p>}
        <button type="button" className={styles.primary} onClick={() => { if (!reason) { setError('Выбери причину, которую стоит проверить.'); return; } clearInputs(); setPhase('repair'); }}>Повторить на том же тексте →</button>
      </div>}
      {phase === 'repair' && <><p className={styles.stageIntro}>Попробуй ответить на то же утверждение заново. Подсказка уже открыта; следующий текст проверит перенос навыка.</p><TaskView task={current.task} answer={answer} evidenceId={evidenceId} confidence={confidence} onAnswer={setAnswer} onEvidence={setEvidenceId} onConfidence={setConfidence} onSubmit={() => record('repair')} submitLabel="Проверить повтор и открыть новый текст" error={error} /></>}
      {phase === 'transfer' && <>{repair&&<ReadingFeedback task={current.task} attempt={repair} evidenceOk={evidenceMatches(current.task,repair.evidenceId)} compact label="Повтор первого текста · после разбора"/>}<p className={styles.stageIntro}>Это новый, вымышленный текст с похожей логической ловушкой. Ответь без разбора первого текста.</p><TaskView task={current.transfer} answer={answer} evidenceId={evidenceId} confidence={confidence} onAnswer={setAnswer} onEvidence={setEvidenceId} onConfidence={setConfidence} onSubmit={() => record('transfer')} submitLabel="Проверить новый пример" error={error} /></>}
      {phase === 'result' && first && repair && transfer && <div className={styles.result}>
        <h3>Новый текст · самостоятельная попытка</h3><ReadingFeedback task={current.transfer} attempt={transfer} evidenceOk={evidenceMatches(current.transfer,transfer.evidenceId)} compact/><div className={styles.resultGrid}><div><span>ПЕРВАЯ ПОПЫТКА</span><strong>{first.answer === current.task.answer ? 'Ответ верен' : 'Ответ нужно исправить'}</strong><p>{evidenceMatches(current.task, first.evidenceId) ? 'Релевантная строка найдена' : 'Опорную строку стоит пересмотреть'}</p></div><div><span>ПОСЛЕ РАЗБОРА</span><strong>{repair.answer === current.task.answer ? 'Ответ верен после разбора' : 'Ответ ещё расходится с текстом'}</strong><p>{evidenceMatches(current.task, repair.evidenceId) ? 'Опора найдена' : 'Опора требует проверки'}</p></div><div><span>НОВЫЙ ТЕКСТ</span><strong>{transfer.answer === current.transfer.answer ? 'Ответ верен' : 'Ответ ещё расходится с текстом'}</strong><p>{evidenceMatches(current.transfer, transfer.evidenceId) ? 'Релевантная строка найдена' : 'Опорную строку стоит пересмотреть'}</p></div></div>
        <div className={styles.relation}><span>РАЗБОР НОВОГО ПРИМЕРА</span><p><strong>{current.transfer.answer}</strong> · {current.transfer.explanation}</p><p>Опора: {current.transfer.sentences.find((sentence) => sentence.id === current.transfer.evidenceId)?.text}</p></div>
        <p className={styles.disclaimer}>Это учебная обратная связь по подготовленным заданиям, не оценка IELTS и не вывод о твоём общем уровне. Выбранная причина ошибки — твоё самоописание, не автоматический диагноз.</p>
        <div className={styles.actions}><button type="button" className={styles.primary} data-trainer-replace="reading-evidence" onClick={() => start(caseIndex === 0 ? 1 : 0)}>Попробовать другую ловушку →</button><Link href="/trainers">К тренажёрам</Link></div>
      </div>}
    </section>}
  </main>;
}
