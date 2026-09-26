'use client';

import { useEffect, useRef, useState } from 'react';
import { criterionLabels, writingCases, type Criterion } from '@/lib/writing-trainer/cases';
import {
  canApplyGrammar,
  canApplyRevision,
  createSession,
  grammarAttemptStatus,
  hasWork,
  normalize,
  originalParagraph,
  originalSentence,
  practiceScores,
  stages,
  workingParagraph,
  type TrainerSession,
} from '@/lib/writing-trainer/engine';
import styles from './WritingTrainer.module.css';

const criterionOrder: Criterion[] = ['grammar', 'task', 'coherence', 'lexical'];
const stageLabels = ['Найди ошибки', 'Ответ на вопрос', 'Связность', 'Лексика', 'Итог'];
const statusText = {
  found: 'Найдено: твоя правка совпала с проверенным вариантом.',
  missed: 'Пропущено: сравни исходную фразу с примером.',
  review: 'Другой вариант: его может проверить учитель. Автоматически не оцениваем.',
  unnecessary: 'Предложена правка в предложении без размеченной ошибки. Это не штраф.',
  clean: 'В этом предложении нет размеченной ошибки.',
};

function moveToNext(session: TrainerSession): TrainerSession {
  const current = stages.indexOf(session.stage);
  const nextIndex = Math.min(current + 1, stages.length - 1);
  return { ...session, stage: stages[nextIndex], furthestStage: stages[Math.max(nextIndex, stages.indexOf(session.furthestStage))] };
}

function moveToPrevious(session: TrainerSession): TrainerSession {
  const current = stages.indexOf(session.stage);
  return { ...session, stage: stages[Math.max(current - 1, 0)] };
}

export default function WritingTrainer() {
  const [session, setSession] = useState<TrainerSession>(() => createSession(writingCases[0].id));
  const previousStage = useRef(session.stage);
  useEffect(() => {
    if (previousStage.current === session.stage) return;
    previousStage.current = session.stage;
    const exercise = document.getElementById('exercise');
    exercise?.scrollIntoView({ block: 'start', behavior: 'auto' });
    exercise?.querySelector<HTMLElement>('h2')?.focus({ preventScroll: true });
  }, [session.stage]);
  const essay = writingCases.find((item) => item.id === session.caseId) ?? writingCases[0];
  const scores = practiceScores(essay, session);
  const currentStageIndex = stages.indexOf(session.stage);
  const furthestStageIndex = Math.max(currentStageIndex, stages.indexOf(session.furthestStage));
  const issueIds = new Set(essay.grammarIssues.map((issue) => issue.sentenceId));
  const foundCount = essay.grammarIssues.filter((issue) => grammarAttemptStatus(essay, session, issue.sentenceId) === 'found').length;
  const appliedGrammarCount = essay.grammarIssues.filter((issue) => Boolean(session.appliedGrammar[issue.sentenceId])).length;
  const latestAppliedGrammarId = Object.keys(session.appliedGrammar).at(-1);
  const hasGrammarAttempt = Object.entries(session.grammarDrafts).some(([sentenceId, draft]) => draft.trim() && normalize(draft) !== normalize(originalSentence(essay, sentenceId)));
  const originalWordCount = essay.paragraphs.flatMap((paragraph) => paragraph.sentences).map((sentence) => sentence.text).join(' ').trim().split(/\s+/).length;
  const unverifiedGrammar = Object.entries(session.grammarDrafts).filter(([sentenceId, draft]) => draft.trim() && normalize(draft) !== normalize(originalSentence(essay, sentenceId)) && normalize(draft) !== normalize(session.appliedGrammar[sentenceId] ?? ''));
  const unverifiedRevisions = (criterionOrder.filter((criterion) => criterion !== 'grammar') as Exclude<Criterion, 'grammar'>[]).filter((criterion) => session.revisionDrafts[criterion] && normalize(session.revisionDrafts[criterion] ?? '') !== normalize(session.appliedRevisions[criterion] ?? ''));
  const postFeedbackRevisions = (criterionOrder.filter((criterion) => criterion !== 'grammar') as Exclude<Criterion, 'grammar'>[]).filter((criterion) => session.postFeedbackDrafts[criterion]?.trim());
  const revisionReportCriteria = (criterionOrder.filter((criterion) => criterion !== 'grammar') as Exclude<Criterion, 'grammar'>[]).filter((criterion) => unverifiedRevisions.includes(criterion) || postFeedbackRevisions.includes(criterion));
  const hasUnappliedDrafts = unverifiedGrammar.length > 0 || unverifiedRevisions.length > 0 || postFeedbackRevisions.length > 0;

  function chooseCase(caseId: string) {
    if (caseId === session.caseId) return;
    if (hasWork(session) && !window.confirm('Текущие правки сохраняются только в этой вкладке. Начать другое эссе и удалить их?')) return;
    setSession(createSession(caseId));
  }

  function restart() {
    if (hasWork(session) && !window.confirm('Начать заново и удалить правки этого эссе?')) return;
    setSession(createSession(session.caseId));
  }

  function selectSentence(sentenceId: string) {
    setSession((current) => ({ ...current, selectedSentenceId: sentenceId }));
  }

  const selectedText = session.selectedSentenceId ? originalSentence(essay, session.selectedSentenceId) : '';
  const grammarDraft = session.selectedSentenceId ? session.grammarDrafts[session.selectedSentenceId] ?? '' : '';

  return (
    <div className={styles.page}>
      <div className={styles.topline}><span>ASHYQ / WRITING LAB</span><span>IELTS ACADEMIC · TASK 2</span></div>
      <header className={styles.hero}>
        <div>
          <p className={styles.eyebrow}>УЧЕБНЫЙ ТРЕНАЖЁР · ПИЛОТ</p>
          <h1>Перепиши сильнее.</h1>
          <p className={styles.lead}>Сначала найди слабые места сам. Потом сравни правку с разбором и посмотри, как меняется рабочая версия эссе.</p>
          <a className={styles.jumpLink} href="#exercise">К текущему этапу ↓</a>
        </div>
        <div className={styles.heroNumber} aria-hidden="true">02<span>кейса</span></div>
      </header>

      <div className={styles.notice}><strong>Как читать оценки</strong><span>Это учебные ориентиры для заранее размеченных вымышленных эссе. Они не являются официальным IELTS band score и не оценивают твой свободный текст автоматически. Черновик живёт только в открытой вкладке.</span></div>

      <section className={styles.caseBar} aria-label="Выбор эссе">
        <div><span className={styles.overline}>ВЫБЕРИ ЭССЕ</span><p>Оба текста написаны для этого тренажёра.</p></div>
        <div className={styles.caseChoices}>
          {writingCases.map((item) => <button key={item.id} type="button" className={`${styles.caseButton} ${item.id === essay.id ? styles.caseActive : ''}`} aria-pressed={item.id === essay.id} onClick={() => chooseCase(item.id)}><small>{item.label}</small><strong>{item.topic}</strong></button>)}
        </div>
      </section>

      <div className={styles.layout}>
        <main className={styles.main}>
          <section className={styles.promptCard}>
            <div className={styles.sectionTop}><span className={styles.overline}>ЗАДАНИЕ IELTS TASK 2</span><span>Черновик · {originalWordCount} слов</span></div>
            <p lang="en" className={styles.question}>{essay.question}</p>
          </section>

          <nav className={styles.steps} aria-label="Этапы тренажёра">
            {stageLabels.map((label, index) => <span key={label} className={`${styles.step} ${index === currentStageIndex ? styles.stepCurrent : index <= furthestStageIndex ? styles.stepDone : ''}`} aria-current={index === currentStageIndex ? 'step' : undefined}><b>{String(index + 1).padStart(2, '0')}</b>{label}</span>)}
          </nav>

          {session.stage === 'grammar' && <section id="exercise" className={styles.workCard} aria-labelledby="grammar-title">
            <div className={styles.roundHeading}><span className={styles.overline}>РАУНД 01 / 04</span><h2 id="grammar-title" tabIndex={-1}>Охота за ошибками</h2><p>Прочитай эссе. Нажми на предложение, в котором подозреваешь грамматическую ошибку, и перепиши его. Подсказки появятся после проверки.</p></div>
            <div className={styles.essayPaper} lang="en">
              {essay.paragraphs.map((paragraph) => <p key={paragraph.id}>{paragraph.sentences.map((sentence) => {
                const touched = Boolean(session.grammarDrafts[sentence.id]?.trim());
                const status = session.grammarChecked ? grammarAttemptStatus(essay, session, sentence.id) : null;
                return <button key={sentence.id} type="button" className={`${styles.sentence} ${session.selectedSentenceId === sentence.id ? styles.sentenceSelected : ''} ${touched && !session.grammarChecked ? styles.sentenceTouched : ''} ${status === 'found' ? styles.sentenceFound : ''} ${status === 'missed' ? styles.sentenceMissed : ''}`} aria-pressed={session.selectedSentenceId === sentence.id} onClick={() => selectSentence(sentence.id)}>{sentence.text}</button>;
              })}</p>)}
            </div>
            <div className={styles.editPanel}>
              <span className={styles.overline}>ТВОЯ ПРАВКА</span>
              {session.selectedSentenceId ? <>
                <p lang="en" className={styles.originalLine}>{selectedText}</p>
                <label htmlFor="grammar-edit">Перепиши выбранное предложение</label>
                <textarea id="grammar-edit" lang="en" rows={3} value={grammarDraft} disabled={session.grammarChecked} placeholder="Твой вариант предложения" onChange={(event) => {
                  const id = session.selectedSentenceId;
                  if (!id) return;
                  setSession((current) => ({ ...current, grammarDrafts: { ...current.grammarDrafts, [id]: event.target.value } }));
                }} />
                {!session.grammarChecked && <p className={styles.hint}>Можно выбрать и исправить несколько предложений. Пустые поля не считаются попыткой.</p>}
              </> : <p className={styles.hint}>Выбери любое предложение в тексте выше.</p>}
            </div>
            {!session.grammarChecked ? <div className={styles.actionRow}><button type="button" className={styles.primaryButton} disabled={!hasGrammarAttempt} onClick={() => setSession((current) => ({ ...current, grammarChecked: true }))}>Проверить мои правки</button>{!hasGrammarAttempt && <button type="button" className={styles.textButton} onClick={() => setSession((current) => ({ ...current, grammarChecked: true }))}>Не нашёл ошибок — показать разбор</button>}<span>{hasGrammarAttempt ? 'Ошибки пока скрыты' : 'Можно закончить поиск и без правки'}</span></div> : <>
              <div className={styles.feedbackHeader} role="status"><strong>Ты самостоятельно нашёл {foundCount} из {essay.grammarIssues.length} размеченных ошибок.</strong><span>Другие корректные варианты может оценить учитель.</span></div>
              <div className={styles.feedbackList}>
                {essay.paragraphs.flatMap((paragraph) => paragraph.sentences).filter((sentence) => issueIds.has(sentence.id) || session.grammarDrafts[sentence.id]?.trim()).map((sentence) => {
                  const issue = essay.grammarIssues.find((item) => item.sentenceId === sentence.id);
                  const status = grammarAttemptStatus(essay, session, sentence.id);
                  return <article key={sentence.id} className={styles.feedbackItem}>
                    <div className={styles.feedbackTitle}><span className={`${styles.statusTag} ${status === 'found' ? styles.positive : ''}`}>{status === 'found' ? 'НАЙДЕНО' : status === 'missed' ? 'ПРОПУЩЕНО' : status === 'review' ? 'НУЖЕН УЧИТЕЛЬ' : 'БЕЗ РАЗМЕТКИ'}</span><span>{statusText[status]}</span></div>
                    <p lang="en"><b>Было:</b> {sentence.text}</p>
                    {session.grammarDrafts[sentence.id]?.trim() && <p lang="en"><b>Твой вариант:</b> {session.grammarDrafts[sentence.id]}</p>}
                    {issue && <><p lang="en"><b>Пример:</b> {issue.accepted[0]}</p><p>{issue.explanation}</p>
                      {!session.appliedGrammar[sentence.id] && <button type="button" className={styles.textButton} onClick={() => setSession((current) => ({ ...current, appliedGrammar: { ...current.appliedGrammar, [sentence.id]: canApplyGrammar(essay, current, sentence.id) ? current.grammarDrafts[sentence.id].trim() : issue.accepted[0] } }))}>{status === 'found' ? 'Применить мою проверенную правку' : 'Применить пример к эссе'}</button>}
                      {session.appliedGrammar[sentence.id] && (latestAppliedGrammarId === sentence.id ? <div className={styles.applicationFeedback} role="status"><span className={styles.applied}>✓ Применено к рабочей версии</span><span>{appliedGrammarCount === essay.grammarIssues.length ? `Учебный ориентир по грамматике: ${essay.baseline.grammar.toFixed(1)} → ${scores.grammar.toFixed(1)}. Это не официальный балл IELTS.` : `Применено ${appliedGrammarCount} из ${essay.grammarIssues.length} размеченных правок. Ориентир изменится после обеих.`}</span></div> : <span className={styles.applied}>✓ Применено к рабочей версии</span>)}
                    </>}
                  </article>;
                })}
              </div>
              <div className={styles.actionRow}><button type="button" className={styles.primaryButton} onClick={() => setSession(moveToNext)}>Дальше: ответ на вопрос →</button><span>Примеры можно применить и позже, пока ты здесь</span></div>
            </>}
          </section>}

          {(session.stage === 'task' || session.stage === 'coherence' || session.stage === 'lexical') && (() => {
            const criterion = session.stage;
            const target = essay.revisions[criterion];
            const draft = session.revisionDrafts[criterion] ?? '';
            const postFeedbackDraft = session.postFeedbackDrafts[criterion] ?? '';
            const revealed = Boolean(session.revealed[criterion]);
            const applied = Boolean(session.appliedRevisions[criterion]);
            const original = originalParagraph(essay, target.paragraphId);
            const changed = Boolean(draft.trim()) && normalize(draft) !== normalize(original);
            return <section id="exercise" className={styles.workCard} aria-labelledby="round-title">
              <button type="button" className={styles.backButton} onClick={() => setSession(moveToPrevious)}>← Предыдущий этап</button>
              <div className={styles.roundHeading}><span className={styles.overline}>РАУНД {String(currentStageIndex + 1).padStart(2, '0')} / 04</span><h2 id="round-title" tabIndex={-1}>{criterionLabels[criterion]}</h2><p>{target.instruction}</p></div>
              <div className={styles.sourceBlock}><span className={styles.overline}>ИСХОДНЫЙ АБЗАЦ</span><p lang="en">{original}</p></div>
              <label className={styles.fieldLabel} htmlFor="paragraph-edit">Твой переписанный абзац</label>
              <textarea id="paragraph-edit" className={styles.paragraphEditor} lang="en" rows={7} value={draft} disabled={revealed} placeholder="Напиши свой вариант до просмотра примера" onChange={(event) => setSession((current) => ({ ...current, revisionDrafts: { ...current.revisionDrafts, [criterion]: event.target.value } }))} />
              {!revealed && <div className={styles.actionRow}><button type="button" className={styles.primaryButton} disabled={!changed} onClick={() => setSession((current) => ({ ...current, revealed: { ...current.revealed, [criterion]: true } }))}>Сравнить с примером</button><span>{changed ? 'Готово к сравнению' : 'Сначала перепиши абзац своими словами'}</span></div>}
              {revealed && <>
                <div className={styles.comparison}>
                  <div><span className={styles.overline}>ТВОЙ ВАРИАНТ</span><p lang="en">{draft}</p></div>
                  <div><span className={styles.overline}>ОДИН ИЗ УДАЧНЫХ ВАРИАНТОВ</span><p lang="en">{target.example}</p></div>
                </div>
                <p className={styles.explanation}>{target.explanation}</p>
                <p className={styles.hint}>Твой вариант может быть хорошим, но этот пилот узнаёт только подготовленный пример. Другую формулировку должен оценить учитель.</p>
                {!applied ? <button type="button" className={styles.secondaryButton} onClick={() => setSession((current) => ({ ...current, appliedRevisions: { ...current.appliedRevisions, [criterion]: canApplyRevision(essay, current, criterion) ? current.revisionDrafts[criterion]?.trim() : target.example } }))}>{canApplyRevision(essay, session, criterion) ? 'Применить мою проверенную правку' : 'Применить пример к рабочему эссе'}</button> : <div className={styles.applicationFeedback} role="status"><span className={styles.applied}>✓ Применено к рабочей версии</span><span>Учебный ориентир по критерию «{criterionLabels[criterion]}»: {essay.baseline[criterion].toFixed(1)} → {scores[criterion].toFixed(1)}. Это не официальный балл IELTS.</span></div>}
                <div className={styles.secondAttempt}>
                  <h3>Попробуй ещё раз после разбора</h3>
                  <p>Перепиши свой абзац с учётом объяснения. Эта попытка останется для обсуждения с учителем и не изменит учебный ориентир автоматически.</p>
                  <label className={styles.fieldLabel} htmlFor="post-feedback-edit">Твоя версия после разбора</label>
                  <textarea id="post-feedback-edit" className={styles.paragraphEditor} lang="en" rows={6} value={postFeedbackDraft} placeholder="Новая версия абзаца" aria-describedby="post-feedback-note" onChange={(event) => setSession((current) => ({ ...current, postFeedbackDrafts: { ...current.postFeedbackDrafts, [criterion]: event.target.value } }))} />
                  <p id="post-feedback-note" className={styles.hint}>{postFeedbackDraft.trim() ? 'Вторая попытка сохранена в этой вкладке и появится в итоговом отчёте.' : 'Необязательный шаг. Исходная попытка останется без изменений.'}</p>
                </div>
                <div className={styles.actionRow}><button type="button" className={styles.primaryButton} onClick={() => setSession(moveToNext)}>{criterion === 'lexical' ? 'Посмотреть итог →' : 'Следующий критерий →'}</button><span>Можно продолжить без применения примера</span></div>
              </>}
            </section>;
          })()}

          {session.stage === 'report' && <section id="exercise" className={styles.workCard} aria-labelledby="report-title">
            <button type="button" className={styles.backButton} onClick={() => setSession(moveToPrevious)}>← Вернуться к лексике</button>
            <div className={styles.roundHeading}><span className={styles.overline}>ИТОГ ПРАКТИКИ</span><h2 id="report-title" tabIndex={-1}>Что изменилось</h2><p>В рабочем эссе показаны только применённые проверенные правки. {hasUnappliedDrafts ? 'Твои другие варианты сохранены ниже для обсуждения с учителем.' : 'Других вариантов для обсуждения пока нет.'}</p></div>
            <div className={styles.reportStats}><div><strong>{foundCount}/{essay.grammarIssues.length}</strong><span>ошибок найдено самостоятельно</span></div><div><strong>{Object.keys(session.appliedGrammar).length + Object.keys(session.appliedRevisions).length}</strong><span>проверенных изменений применено</span></div></div>
            <div className={styles.scoreGrid}>{criterionOrder.map((criterion) => <div key={criterion} className={styles.reportScore}><span>{criterionLabels[criterion]}</span><strong>{essay.baseline[criterion].toFixed(1)} <span aria-hidden="true">→</span> {scores[criterion].toFixed(1)}</strong><small>{scores[criterion] > essay.baseline[criterion] ? criterion === 'grammar' ? 'Применены обе размеченные грамматические правки. Диапазон конструкций отдельно не оценивался.' : essay.revisions[criterion].explanation : 'Без проверенной правки по этому критерию'}</small></div>)}</div>
            <h3 className={styles.diffHeading}>Исходное и рабочее эссе</h3>
            <div className={styles.diffGrid}><div><span className={styles.overline}>БЫЛО</span>{essay.paragraphs.map((paragraph) => <p key={paragraph.id} lang="en">{originalParagraph(essay, paragraph.id)}</p>)}</div><div><span className={styles.overline}>СТАЛО</span>{essay.paragraphs.map((paragraph) => <p key={paragraph.id} lang="en" className={workingParagraph(essay, session, paragraph.id) !== originalParagraph(essay, paragraph.id) ? styles.changedParagraph : ''}>{workingParagraph(essay, session, paragraph.id)}</p>)}</div></div>
            {hasUnappliedDrafts && <section className={styles.unverified}><h3>Твои версии для разбора</h3><p className={styles.hint}>Неприменённые и повторные варианты не меняют ориентир автоматически. Покажи их учителю, чтобы обсудить качество текста.</p>{unverifiedGrammar.map(([sentenceId, draft]) => {
              const status = grammarAttemptStatus(essay, session, sentenceId);
              const label = status === 'found' ? 'найденная, но не применённая правка' : status === 'unnecessary' ? 'правка без размеченной ошибки' : 'вариант для проверки учителем';
              return <div key={sentenceId}><strong>Грамматика · {label}</strong><p lang="en">{draft}</p></div>;
            })}{revisionReportCriteria.map((criterion) => <div key={criterion}><strong>{criterionLabels[criterion]}</strong>{session.revisionDrafts[criterion]?.trim() && <><span className={styles.draftPhase}>До разбора · {unverifiedRevisions.includes(criterion) ? 'на проверку учителю' : 'применено к рабочему эссе'}</span><p lang="en">{session.revisionDrafts[criterion]}</p></>}{postFeedbackRevisions.includes(criterion) && <><span className={styles.draftPhase}>После разбора · на проверку учителю</span><p lang="en">{session.postFeedbackDrafts[criterion]}</p></>}</div>)}</section>}
            <div className={styles.nextPractice}><span className={styles.overline}>СЛЕДУЮЩИЙ ШАГ</span><p>{essay.nextPractice}</p></div>
            <button type="button" className={styles.secondaryButton} onClick={restart}>Начать это эссе заново</button>
          </section>}
        </main>

        <aside className={styles.aside} aria-label="Учебные ориентиры и прогресс">
          <div className={styles.asideCard}><span className={styles.overline}>ПРОГРЕСС</span><strong className={styles.asideHeadline}>{String(furthestStageIndex + 1).padStart(2, '0')} <span>/ 05</span></strong><div className={styles.progressTrack}><span style={{ width: `${((furthestStageIndex + 1) / stages.length) * 100}%` }} /></div><p>Сейчас: {stageLabels[currentStageIndex]}</p></div>
          <div className={styles.asideCard}><span className={styles.overline}>УЧЕБНЫЕ ОРИЕНТИРЫ</span><p className={styles.asideNote}>Для этого вымышленного эссе. Рост только после применения размеченной правки.</p>{criterionOrder.map((criterion) => <div className={styles.scoreRow} key={criterion}><span>{criterionLabels[criterion]}</span><strong>{scores[criterion].toFixed(1)}</strong></div>)}</div>
          <div className={styles.asideFoot}>IELTS Academic Task 2 · 4 критерия<br />Версия эссе не сохраняется после закрытия страницы.</div>
        </aside>
      </div>
    </div>
  );
}
