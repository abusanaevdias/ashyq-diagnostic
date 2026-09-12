'use client';

import { useEffect, useRef } from 'react';
import Landing from './Landing';
import Onboarding from './Onboarding';
import QuizRunner from './quiz/QuizRunner';
import ResultScreen from './result/ResultScreen';
import ReviewScreen from './review/ReviewScreen';
import { useDiagnostic } from '@/lib/useDiagnostic';

/**
 * Роутер экранов диагностики.
 *
 * landing -> onboarding -> quiz -> result -> review
 *
 * Состояние каждого экзамена хранится отдельно (localStorage), поэтому
 * результаты IELTS и SAT независимы, а refresh не убивает прогресс.
 */
export default function DiagnosticApp() {
  const d = useDiagnostic();

  const { run, activeExam, result } = d;

  /* deep-link /?start=sat|ielts — для CTA с /program и /progress.
     Срабатывает только без активной сессии, чтобы не угонять прогресс. */
  const startedRef = useRef(false);
  useEffect(() => {
    if (startedRef.current || !d.hydrated || activeExam) return;
    const param = new URLSearchParams(window.location.search).get('start');
    if (param === 'sat' || param === 'ielts') {
      startedRef.current = true;
      d.selectExam(param);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [d.hydrated, activeExam]);

  if (!activeExam || !run) {
    return <Landing runs={d.runs} onSelect={d.selectExam} />;
  }

  if (run.stage === 'onboarding') {
    return (
      <Onboarding
        exam={run.exam}
        run={run}
        onTarget={d.setTarget}
        onPlannedWhen={d.setPlannedWhen}
        onStart={d.startTest}
        onBack={d.backToLanding}
      />
    );
  }

  if (run.stage === 'quiz') {
    if (run.questionIds.length === 0 || d.questions.length === 0) {
      // Банк не собрался (например, после правки данных) — честно возвращаем на onboarding
      return (
        <Onboarding
          exam={run.exam}
          run={run}
          onTarget={d.setTarget}
          onPlannedWhen={d.setPlannedWhen}
          onStart={d.startTest}
          onBack={d.backToLanding}
        />
      );
    }
    return (
      <QuizRunner
        run={run}
        questions={d.questions}
        elapsedMs={d.elapsedMs}
        timeUp={d.timeUp}
        onAnswer={d.answer}
        onNext={d.next}
        onPrev={d.prev}
        onGoTo={d.goTo}
        onFinish={d.finish}
        onDismissTimeWarning={d.dismissTimeWarning}
        onExit={d.backToLanding}
      />
    );
  }

  if (!result) {
    // finished-флаг есть, а данных нет — безопасный выход на лендинг
    return <Landing runs={d.runs} onSelect={d.selectExam} />;
  }

  if (run.stage === 'review') {
    return (
      <ReviewScreen
        run={run}
        questions={d.questions}
        result={result}
        utm={d.utm}
        onBack={d.closeReview}
      />
    );
  }

  return (
    <ResultScreen
      run={run}
      result={result}
      utm={d.utm}
      onReview={d.openReview}
      onRestart={() => d.restart(run.exam)}
      onHome={d.backToLanding}
      onSaveLead={d.saveLead}
      onWhatsAppClick={d.notifyWhatsAppClick}
    />
  );
}
