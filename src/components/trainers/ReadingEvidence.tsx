'use client';
import { LearningRoute } from '@/components/ui/LearningFeedback';

import TrainerCheckpoint from '@/components/trainers/TrainerCheckpoint';
import Link from 'next/link';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { flushSync } from 'react-dom';
import { answerLabels, evidenceMatches, readingCases, type Confidence, type ReadingTask, type TfngAnswer } from '@/lib/reading-evidence/cases';
import styles from './ReadingEvidence.module.css';

type Attempt = { answer: TfngAnswer; evidenceId: string; confidence: Confidence };
type Phase = 'choose' | 'first' | 'review' | 'repair' | 'transfer' | 'result';
type Review = { attempt: Attempt; open: boolean; onToggle: () => void };

// Literal excerpts from the existing public passages. No generated offsets,
// new answer keys or hidden hints before the first attempt is frozen.
const reviewExcerpts: Record<string, { passage: string[]; statement: string[] }> = {
  'City Museum': { passage: ['local residents', 'on Fridays', 'Visitors from outside the city still paid the usual price', 'weekend tickets remained unchanged'], statement: ['every visitor', 'every day of the week'] },
  'Solar Lights Pilot': { passage: ['installation costs', 'assess maintenance costs next year'], statement: ['reduced', 'annual maintenance costs'] },
  'Community Pool': { passage: ['Adults pay the standard entry fee', 'including when they accompany a child'], statement: ['Adults', 'without paying'] },
  'Library Evening Hours': { passage: ['A survey about why visitors came will be carried out at the end of the year'], statement: ['Most evening visitors', 'borrow books for school'] },
};

function MarkedText({ text, excerpts, active }: { text: string; excerpts: string[]; active: boolean }) {
  const ranges = excerpts.map(quote => ({ start: text.indexOf(quote), quote })).filter(part => part.start >= 0).sort((a, b) => a.start - b.start);
  let end = 0;
  const parts: ReactNode[] = [];
  for (const { start, quote } of ranges) {
    if (start < end) continue;
    parts.push(text.slice(end, start), <mark key={start} className={active ? styles.markActive : styles.mark}>{quote}</mark>);
    end = start + quote.length;
  }
  return <>{parts}{text.slice(end)}</>;
}

function ReviewVerdict({ task, attempt, label }: { task: ReadingTask; attempt: Attempt; label: string }) {
  const answerOk = attempt.answer === task.answer;
  const evidenceOk = evidenceMatches(task, attempt.evidenceId);
  const ng = task.answer === 'NOT GIVEN';
  return <div className={styles.verdict} data-answer-correct={answerOk}>
    <div role="status" aria-atomic="true">
      <p className={styles.miniLabel}>{label}</p>
      <h3><span>{answerOk ? 'Ответ верный.' : 'Пока неверно.'}</span><span className={answerOk ? styles.goodSymbol : styles.badSymbol} aria-hidden="true">{answerOk ? '✓' : '×'}</span></h3>
      <p>{answerOk && evidenceOk ? (ng ? 'Область подходит. Теперь проверь логику по всему отрывку.' : 'И ответ, и выбранная опора подходят.') : answerOk ? 'Но выбранное предложение нужно заменить.' : evidenceOk ? 'Нужная область найдена. Сравни её смысл с утверждением.' : 'Нужно пересмотреть и ответ, и выбранное предложение.'}</p>
    </div>
    <dl className={styles.verdictRows}>
      <div><dt>Твой ответ</dt><dd className={answerOk ? styles.goodText : styles.badText}>{attempt.answer} <span aria-hidden="true">{answerOk ? '✓' : '×'}</span></dd></div>
      <div><dt>Верный ответ</dt><dd>{task.answer}</dd></div>
      <div><dt>{ng ? 'Область проверки' : 'Опора в тексте'}</dt><dd className={evidenceOk ? styles.goodText : styles.badText}>{evidenceOk ? 'Подходит ✓' : 'Нужно заменить ×'}</dd></div>
    </dl>
  </div>;
}

function TaskView({ task, answer, evidenceId, confidence, onAnswer, onEvidence, onConfidence, onSubmit, submitLabel, error, review }: {
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
  review?: Review;
}) {
  const excerpts = reviewExcerpts[task.passageTitle];
  const ng = task.answer === 'NOT GIVEN';
  const selectedId = review?.attempt.evidenceId ?? evidenceId;
  return <>
    <div className={styles.taskGrid} data-review={Boolean(review)}>
      <section className={styles.passage} aria-labelledby="passage-title">
        <p className={styles.miniLabel}>УЧЕБНЫЙ ТЕКСТ · НАПИСАН ASHYQ</p>
        <h3 id="passage-title">{task.passageTitle}</h3>
        <p className={styles.instruction}>{review ? (review.open ? ng ? 'Подсветка — область проверки, не доказательство отсутствия. Прочитай весь отрывок.' : 'Сравни выделенные слова с утверждением. Твоя исходная опора отмечена отдельно.' : 'Текст тот же. Открой объяснение, чтобы увидеть связь с утверждением.') : 'Нажми на предложение, которое ближе всего к ответу. Для NOT GIVEN это область проверки, а не доказательство отсутствия.'}</p>
        <div className={styles.sentences}>
          {task.sentences.map((sentence) => review ? <div key={sentence.id} className={`${styles.reviewSentence} ${review.open && sentence.id === task.evidenceId ? styles.keySentence : ''}`}>
            <span className={styles.sentenceId}>{sentence.id.toUpperCase()}</span>
            <div><p lang="en"><MarkedText text={sentence.text} excerpts={excerpts?.passage ?? [task.sentences.find(s => s.id === task.evidenceId)?.text ?? '']} active={review.open} /></p>
              {selectedId === sentence.id && <small className={styles.chosenLabel}>Твоя исходная {ng ? 'область' : 'опора'} · {evidenceMatches(task, selectedId) ? 'подходит' : 'нужно заменить'}</small>}
              {review.open && sentence.id === task.evidenceId && <small className={styles.keyLabel}>{ng ? 'Релевантная область · проверь весь текст' : 'Опора для сравнения'}</small>}
            </div>
          </div> : <button
            key={sentence.id}
            type="button"
            className={evidenceId === sentence.id ? styles.sentenceSelected : styles.sentence}
            aria-pressed={evidenceId === sentence.id}
            onClick={() => onEvidence(sentence.id)}
          ><span aria-hidden="true">{sentence.id.toUpperCase()}</span><span lang="en" className={styles.sentenceText}>{sentence.text}</span></button>)}
        </div>
      </section>
      <section className={styles.response} aria-labelledby="statement-title">
        <p className={styles.miniLabel}>УТВЕРЖДЕНИЕ</p>
        <h3 id="statement-title" lang="en"><MarkedText text={task.statement} excerpts={review ? excerpts?.statement ?? [] : []} active={Boolean(review?.open)} /></h3>
        {review ? <div className={styles.reviewControls}>
          <button className={styles.primary} type="button" aria-expanded={review.open} aria-controls="reading-explanation" onClick={review.onToggle}>{review.open ? 'Скрыть объяснение' : 'Понять почему'} <span aria-hidden="true">{review.open ? '−' : '→'}</span></button>
          {review.open && <div id="reading-explanation" className={styles.explanation}>
            <p className={styles.explanationLabel}>{ng ? 'ПОЧЕМУ НЕ ХВАТАЕТ ДАННЫХ' : task.answer === 'FALSE' ? 'ВОТ ПРОТИВОРЕЧИЕ' : 'ВОТ ПОДТВЕРЖДЕНИЕ'}</p>
            <h4>{ng ? 'Факт не сообщается.' : task.answer === 'FALSE' ? 'Текст говорит иначе.' : 'Смысл совпадает.'}</h4>
            <p>{task.explanation}</p>
            <p lang="en" className={styles.relationLine}>{task.relation}</p>
          </div>}
          <p className={styles.confidenceNote}>Твоя уверенность: <strong>{{ low: 'низкая', medium: 'средняя', high: 'высокая' }[review.attempt.confidence]}</strong>. Это самооценка до разбора, она не влияет на проверку.</p>
        </div> : <>
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
        </>}
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
  const [explanationOpen, setExplanationOpen] = useState(false);
  const transition = useRef<{ skipTransition: () => void; finished: Promise<void> } | null>(null);
  const transitionVersion = useRef(0);
  const current = caseIndex === null ? null : readingCases[caseIndex];

  function moveTo(next: Phase, update?: () => void) {
    const version = ++transitionVersion.current;
    let committed = false;
    const commit = () => { if (version !== transitionVersion.current || committed) return; committed = true; update?.(); setPhase(next); };
    transition.current?.skipTransition();
    const browser = document as Document & { startViewTransition?: (callback: () => void) => { skipTransition: () => void; finished: Promise<void> } };
    if (!browser.startViewTransition || window.matchMedia('(prefers-reduced-motion: reduce)').matches) { commit(); return; }
    try {
      const nextTransition = browser.startViewTransition(() => flushSync(commit));
      transition.current = nextTransition;
      void nextTransition.finished.catch(() => {}).finally(() => { if (transition.current === nextTransition) transition.current = null; });
    } catch { commit(); }
  }

  function cancelTransition() { transitionVersion.current += 1; transition.current?.skipTransition(); transition.current = null; }
  useEffect(() => () => { transitionVersion.current += 1; transition.current?.skipTransition(); }, []);

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
    moveTo('first', () => { setCaseIndex(index); setFirst(null); setRepair(null); setTransfer(null); setReason(''); setExplanationOpen(false); clearInputs(); });
  }
  function record(target: 'first' | 'repair' | 'transfer') {
    if (!answer || !evidenceId || !confidence) {
      setError('Выбери ответ, предложение из текста и уровень уверенности.');
      return;
    }
    const attempt = { answer, evidenceId, confidence };
    if (target === 'first') moveTo('review', () => { setFirst(attempt); setExplanationOpen(false); });
    if (target === 'repair') moveTo('transfer', () => { setRepair(attempt); setExplanationOpen(false); clearInputs(); });
    if (target === 'transfer') moveTo('result', () => { setTransfer(attempt); setExplanationOpen(false); });
    setError('');
  }

  return <main className={styles.page}>
    <div className={styles.topline}><Link href="/trainers">← Все тренажёры</Link><span>ASHYQ · READING LAB</span></div>
    <header className={styles.hero}>
      <p className={styles.eyebrow}>IELTS ACADEMIC READING · УЧЕБНЫЕ ПРИМЕРЫ</p>
      <h1>Докажи ответ текстом</h1>
      <p>Выбери TRUE, FALSE или NOT GIVEN, найди ближайший фрагмент и укажи уверенность. Потом разбери свою логику, исправь ответ и проверь навык на новом тексте.</p>
    </header>
    <TrainerCheckpoint trainer="reading-evidence" data={{ caseIndex, phase, answer, evidenceId, confidence, first, repair, transfer, reason }} completed={phase === 'result'} onRestore={saved => { cancelTransition(); setExplanationOpen(false); setCaseIndex(saved.caseIndex); setPhase(saved.phase); setAnswer(saved.answer); setEvidenceId(saved.evidenceId); setConfidence(saved.confidence); setFirst(saved.first); setRepair(saved.repair); setTransfer(saved.transfer); setReason(saved.reason); setError(''); }} />
    {phase === 'choose' && <section aria-labelledby="reading-stage-title">
      <div className={styles.sectionHead}><h2 id="reading-stage-title">Выбери ловушку</h2><p>Два коротких сценария. Ответы не отправляются на сервер. Для продолжения позже включи сохранение выше.</p></div>
      <div className={styles.caseGrid}>{readingCases.map((item, index) => <article className={styles.caseCard} key={item.id}>
        <span className={styles.caseNumber}>0{index + 1}</span><p>{item.focus}</p><h3>{item.title}</h3>
        <button type="button" className={styles.primary} onClick={() => start(index)}>Начать →</button>
      </article>)}</div>
    </section>}
    {current && phase !== 'choose' && <section className={styles.lesson} aria-labelledby="reading-stage-title">
      <div id="reading-stage-start" className={styles.lessonTop}><button type="button" data-trainer-replace="reading-evidence" onClick={() => { cancelTransition(); setPhase('choose'); setCaseIndex(null); setExplanationOpen(false); window.scrollTo({ top: 0 }); }}>← К выбору</button><span>{current.focus}</span></div>
      <LearningRoute phase={phase} steps={[["first","Своя попытка"],["review","Разбор"],["repair","Повтор на том же тексте"],["transfer","Новый текст"],["result","Итог"]]}/>
      <h2 id="reading-stage-title" tabIndex={-1}>{phase === 'first' ? '1. Ответ и опора в тексте' : phase === 'review' ? '2. Разбери первое решение' : phase === 'repair' ? '3. Проверь решение ещё раз' : phase === 'transfer' ? '4. Новый текст без подсказки' : '5. Что изменилось'}</h2>
      {phase === 'review' && first && <ReviewVerdict task={current.task} attempt={first} label="ТВОЯ ПЕРВАЯ ПОПЫТКА" />}
      {phase === 'result' && transfer && <ReviewVerdict task={current.transfer} attempt={transfer} label="НОВЫЙ ТЕКСТ · САМОСТОЯТЕЛЬНАЯ ПОПЫТКА" />}
      {phase === 'repair' && <p className={styles.stageIntro}>Ответь на то же утверждение заново. Это повтор после разбора; затем будет новый текст без подсказки.</p>}
      {phase === 'transfer' && <p className={styles.stageIntro}>Новый текст. Та же логическая ловушка. Повтор записан — сравнение трёх попыток будет в конце. Подсказки и ответ предыдущего примера здесь не показаны.</p>}
      <TaskView task={phase === 'transfer' || phase === 'result' ? current.transfer : current.task} answer={answer} evidenceId={evidenceId} confidence={confidence} onAnswer={setAnswer} onEvidence={setEvidenceId} onConfidence={setConfidence} onSubmit={() => record(phase === 'transfer' ? 'transfer' : phase === 'repair' ? 'repair' : 'first')} submitLabel={phase === 'transfer' ? 'Проверить новый пример' : phase === 'repair' ? 'Проверить повтор и открыть новый текст' : 'Проверить ответ и опору'} error={error} review={phase === 'review' && first ? { attempt: first, open: explanationOpen, onToggle: () => setExplanationOpen(value => !value) } : phase === 'result' && transfer ? { attempt: transfer, open: explanationOpen, onToggle: () => setExplanationOpen(value => !value) } : undefined} />
      {phase === 'review' && first && <div className={styles.review}>
        <div className={styles.nextStep}><p className={styles.miniLabel}>СНАЧАЛА ЗАКРЕПИ</p><h3>Что проверишь ещё раз?</h3><p>Выбери свой фокус и ответь на тот же вопрос заново. После повтора откроется новый пример.</p></div>
        <fieldset className={styles.reasons}><legend>Что хочешь проверить на повторной попытке?</legend>{current.reasons.map((item) => <label key={item}><input type="radio" name="reading-reason" checked={reason === item} onChange={() => setReason(item)} />{item}</label>)}</fieldset>
        {error && <p className={styles.error} role="alert">{error}</p>}
        <button type="button" className={styles.primary} onClick={() => { if (!reason) { setError('Выбери причину, которую стоит проверить.'); return; } moveTo('repair', clearInputs); }}>Повторить на том же тексте →</button>
      </div>}
      {phase === 'result' && first && repair && transfer && <div className={styles.result}>
        <h3>Три попытки — отдельно</h3><div className={styles.resultGrid}><div><span>ПЕРВАЯ ПОПЫТКА</span><strong>{first.answer === current.task.answer ? 'Ответ верен' : 'Ответ нужно исправить'}</strong><p>{evidenceMatches(current.task, first.evidenceId) ? 'Релевантная строка найдена' : 'Опорную строку стоит пересмотреть'}</p></div><div><span>ПОСЛЕ РАЗБОРА</span><strong>{repair.answer === current.task.answer ? 'Ответ верен после разбора' : 'Ответ ещё расходится с текстом'}</strong><p>{evidenceMatches(current.task, repair.evidenceId) ? 'Опора найдена' : 'Опора требует проверки'}</p></div><div><span>НОВЫЙ ТЕКСТ</span><strong>{transfer.answer === current.transfer.answer ? 'Ответ верен' : 'Ответ ещё расходится с текстом'}</strong><p>{evidenceMatches(current.transfer, transfer.evidenceId) ? 'Релевантная строка найдена' : 'Опорную строку стоит пересмотреть'}</p></div></div>
        <p className={styles.disclaimer}>Это учебная обратная связь по подготовленным заданиям, не оценка IELTS и не вывод о твоём общем уровне. Выбранная причина ошибки — твоё самоописание, не автоматический диагноз.</p>
        <div className={styles.actions}><button type="button" className={styles.primary} data-trainer-replace="reading-evidence" onClick={() => start(caseIndex === 0 ? 1 : 0)}>Попробовать другую ловушку →</button><Link href="/trainers">К тренажёрам</Link></div>
      </div>}
    </section>}
  </main>;
}
