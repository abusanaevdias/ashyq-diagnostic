'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { getQuestions } from '@/data';
import { EXAMS } from './config';
import { computeResult } from './engine';
import { buildTest, randomSeed } from './selector';
import { QUESTION_BANK } from '@/data/questions';
import {
  appendHistory,
  clearRun,
  loadActiveExam,
  loadRun,
  loadUtm,
  newRunId,
  persistUtm,
  readUtmFromLocation,
  saveActiveExam,
  saveRun,
} from './storage';
import { track, recordLeadSnapshot } from './analytics';
import { sendLead, type LeadPayload } from './lead';
import type {
  DiagnosticResult,
  ExamId,
  Question,
  RunState,
  UtmParams,
} from './types';

/**
 * Контроллер диагностики: этапы, ответы, таймер, persistence, аналитика.
 * UI-компоненты только читают состояние и вызывают actions.
 */

function createRun(exam: ExamId, utm: UtmParams): RunState {
  return {
    schemaVersion: 1,
    runId: newRunId(),
    exam,
    stage: 'onboarding',
    target: null,
    plannedWhen: null,
    questionIds: [],
    seed: randomSeed(),
    optionOrder: {},
    answers: {},
    currentIndex: 0,
    startedAt: null,
    elapsedMs: 0,
    finished: false,
    finishedAt: null,
    timeWarningShown: false,
    utm,
  };
}

export interface DiagnosticController {
  hydrated: boolean;
  utm: UtmParams;
  runs: Record<ExamId, RunState | null>;
  activeExam: ExamId | null;
  run: RunState | null;
  questions: Question[];
  result: DiagnosticResult | null;
  elapsedMs: number;
  timeUp: boolean;
  selectExam: (exam: ExamId) => void;
  backToLanding: () => void;
  setTarget: (value: string) => void;
  setPlannedWhen: (value: string) => void;
  startTest: () => void;
  answer: (questionId: string, value: string) => void;
  goTo: (index: number) => void;
  next: () => void;
  prev: () => void;
  finish: () => void;
  restart: (exam?: ExamId) => void;
  openReview: () => void;
  closeReview: () => void;
  saveLead: (lead: { name?: string; grade?: string; phone: string }) => Promise<boolean>;
  notifyWhatsAppClick: () => void;
  dismissTimeWarning: () => void;
}

export function useDiagnostic(): DiagnosticController {
  const [hydrated, setHydrated] = useState(false);
  const [utm, setUtm] = useState<UtmParams>({});
  const [runs, setRuns] = useState<Record<ExamId, RunState | null>>({
    sat: null,
    ielts: null,
  });
  const [activeExam, setActiveExam] = useState<ExamId | null>(null);
  const [elapsedMs, setElapsedMs] = useState(0);

  const elapsedRef = useRef(0);
  useEffect(() => {
    elapsedRef.current = elapsedMs;
  }, [elapsedMs]);

  const run = activeExam ? runs[activeExam] : null;
  const questions = useMemo(
    () => (run ? getQuestions(run.questionIds) : []),
    [run],
  );

  /* ---------------- hydration ---------------- */

  useEffect(() => {
    const merged = persistUtm(readUtmFromLocation());
    const loaded = { sat: loadRun('sat'), ielts: loadRun('ielts') };
    setUtm(merged);
    setRuns(loaded);

    // возвращаем пользователя туда, где он остановился
    const active = loadActiveExam();
    if (active && loaded[active]) {
      setActiveExam(active);
      setElapsedMs(loaded[active]?.elapsedMs ?? 0);
    }

    setHydrated(true);
    track('diagnostic_landing_view', { utm: merged, resumed: Boolean(active && loaded[active]) });
  }, []);

  /* ---------------- persistence (debounced) ---------------- */

  // Сохраняем сразу: при refresh/краше не должно теряться ни одного ответа.
  // Запись маленькая (несколько КБ), поэтому debounce здесь только вредит.
  useEffect(() => {
    if (!hydrated || !activeExam) return;
    const current = runs[activeExam];
    if (!current) return;
    saveRun(current);
  }, [runs, activeExam, hydrated]);

  const updateRun = useCallback(
    (exam: ExamId, updater: (prev: RunState | null) => RunState | null) => {
      setRuns((prev) => ({ ...prev, [exam]: updater(prev[exam]) }));
    },
    [],
  );

  /* ---------------- timer ---------------- */

  const isRunning = Boolean(run && run.stage === 'quiz' && !run.finished);

  useEffect(() => {
    if (!isRunning || !run) return;
    setElapsedMs(run.elapsedMs);
    const id = window.setInterval(() => {
      setElapsedMs((prev) => prev + 1000);
    }, 1000);
    return () => window.clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isRunning, run?.runId, run?.stage, run?.finished]);

  // Коммитим накопленное время, чтобы refresh не обнулял прогресс
  useEffect(() => {
    if (!isRunning) return;
    const id = window.setInterval(() => {
      const exam = activeExam;
      if (!exam) return;
      updateRun(exam, (prev) =>
        prev ? { ...prev, elapsedMs: elapsedRef.current } : prev,
      );
    }, 10_000);
    return () => window.clearInterval(id);
  }, [isRunning, activeExam, updateRun]);

  useEffect(() => {
    const commit = () => {
      const exam = activeExam;
      if (!exam) return;
      updateRun(exam, (prev) =>
        prev ? { ...prev, elapsedMs: elapsedRef.current } : prev,
      );
    };
    const onHide = () => {
      if (document.visibilityState === 'hidden') commit();
    };
    document.addEventListener('visibilitychange', onHide);
    window.addEventListener('pagehide', commit);
    return () => {
      document.removeEventListener('visibilitychange', onHide);
      window.removeEventListener('pagehide', commit);
    };
  }, [activeExam, updateRun]);

  /* ---------------- result ---------------- */

  const result = useMemo(() => {
    if (!run || !run.finished || questions.length === 0) return null;
    return computeResult(run.exam, questions, {
      answers: run.answers,
      target: run.target,
      elapsedMs: run.elapsedMs,
      runId: run.runId,
    });
  }, [run, questions]);

  const targetDurationSec = run ? EXAMS[run.exam].blueprint.targetDurationSec : 0;
  const timeUp = isRunning && elapsedMs >= targetDurationSec * 1000;

  /* ---------------- actions ---------------- */

  const selectExam = useCallback(
    (exam: ExamId) => {
      track('exam_selected', { exam, utm });
      saveActiveExam(exam);
      setActiveExam(exam);
      setRuns((prev) => {
        if (prev[exam]) return prev;
        return { ...prev, [exam]: createRun(exam, utm) };
      });
      setElapsedMs(0);
    },
    [utm],
  );

  const backToLanding = useCallback(() => {
    saveActiveExam(null);
    if (activeExam) {
      updateRun(activeExam, (prev) =>
        prev ? { ...prev, elapsedMs: elapsedRef.current } : prev,
      );
    }
    setActiveExam(null);
    setElapsedMs(0);
  }, [activeExam, updateRun]);

  const setTarget = useCallback(
    (value: string) => {
      if (!activeExam) return;
      updateRun(activeExam, (prev) => (prev ? { ...prev, target: value } : prev));
    },
    [activeExam, updateRun],
  );

  const setPlannedWhen = useCallback(
    (value: string) => {
      if (!activeExam) return;
      updateRun(activeExam, (prev) =>
        prev ? { ...prev, plannedWhen: value } : prev,
      );
    },
    [activeExam, updateRun],
  );

  const startTest = useCallback(() => {
    if (!activeExam) return;
    const exam = activeExam;
    const seed = randomSeed();
    const built = buildTest({ exam, seed, bank: QUESTION_BANK });
    const answers: Record<string, string | null> = {};
    built.questions.forEach((q) => {
      answers[q.id] = null;
    });

    updateRun(exam, (prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        stage: 'quiz',
        seed,
        questionIds: built.questions.map((q) => q.id),
        optionOrder: built.optionOrder,
        answers,
        currentIndex: 0,
        startedAt: Date.now(),
        elapsedMs: 0,
        finished: false,
        finishedAt: null,
        timeWarningShown: false,
      };
    });
    setElapsedMs(0);
    track('diagnostic_started', {
      exam,
      target: runs[exam]?.target ?? null,
      plannedWhen: runs[exam]?.plannedWhen ?? null,
      questionCount: built.questions.length,
      utm,
    });
  }, [activeExam, updateRun, runs, utm]);

  const answer = useCallback(
    (questionId: string, value: string) => {
      if (!activeExam) return;
      const exam = activeExam;
      const current = runs[exam];
      if (!current || current.finished) return;
      const q = questions.find((item) => item.id === questionId);
      updateRun(exam, (prev) =>
        prev
          ? {
              ...prev,
              elapsedMs: elapsedRef.current,
              answers: { ...prev.answers, [questionId]: value },
            }
          : prev,
      );
      if (q) {
        track('question_answered', {
          exam,
          questionId,
          section: q.section,
          domain: q.domain,
          difficulty: q.difficulty,
        });
      }
      void current;
    },
    [activeExam, runs, questions, updateRun],
  );

  const goTo = useCallback(
    (index: number) => {
      if (!activeExam) return;
      updateRun(activeExam, (prev) => {
        if (!prev) return prev;
        const max = prev.questionIds.length - 1;
        const clamped = Math.max(0, Math.min(max, index));
        return { ...prev, currentIndex: clamped, elapsedMs: elapsedRef.current };
      });
    },
    [activeExam, updateRun],
  );

  const next = useCallback(() => {
    if (!run) return;
    goTo(Math.min(run.currentIndex + 1, run.questionIds.length - 1));
  }, [run, goTo]);

  const prev = useCallback(() => {
    if (!run) return;
    goTo(Math.max(run.currentIndex - 1, 0));
  }, [run, goTo]);

  const finish = useCallback(() => {
    if (!activeExam) return;
    const exam = activeExam;
    updateRun(exam, (prev) =>
      prev
        ? {
            ...prev,
            stage: 'result',
            finished: true,
            finishedAt: Date.now(),
            elapsedMs: elapsedRef.current,
          }
        : prev,
    );
    track('diagnostic_completed', { exam, utm });
  }, [activeExam, updateRun, utm]);

  const restart = useCallback(
    (exam?: ExamId) => {
      const target = exam ?? activeExam;
      if (!target) return;
      clearRun(target);
      const fresh = createRun(target, utm);
      setRuns((prev) => ({ ...prev, [target]: fresh }));
      setElapsedMs(0);
      track('restart_clicked', { exam: target, utm });
    },
    [activeExam, utm],
  );

  const openReview = useCallback(() => {
    if (!activeExam) return;
    updateRun(activeExam, (prev) => (prev ? { ...prev, stage: 'review' } : prev));
    track('review_opened', { exam: activeExam });
  }, [activeExam, updateRun]);

  const closeReview = useCallback(() => {
    if (!activeExam) return;
    updateRun(activeExam, (prev) => (prev ? { ...prev, stage: 'result' } : prev));
  }, [activeExam, updateRun]);

  /** Результат без PII; контакт добавляется только при явной отправке формы. */
  const leadBase = useCallback((): Omit<LeadPayload, 'kind'> | null => {
    if (!run) return null;
    return {
      runId: run.runId,
      exam: run.exam,
      target: run.target,
      plannedWhen: run.plannedWhen,
      band: result?.band.rangeLabel ?? null,
      level: result?.band.level ?? null,
      correct: result?.totalCorrect,
      total: result?.totalQuestions,
      strongest: result?.strongest[0]?.domain ?? null,
      weakest: result?.weakest[0]?.domain ?? null,
      elapsedMin: result ? Math.max(1, Math.round(result.elapsedMs / 60000)) : undefined,
      utm,
    };
  }, [run, result, utm]);

  const saveLead = useCallback(
    async (lead: { name?: string; grade?: string; phone: string }) => {
      if (!activeExam) return false;
      const base = leadBase();
      if (!base) return false;

      const ok = await sendLead({ ...base, kind: 'contact', ...lead });
      updateRun(activeExam, (prev) =>
        prev ? { ...prev, lead: { ...prev.lead, ...lead, submitted: ok } } : prev,
      );
      track('lead_captured', {
        exam: activeExam,
        delivered: ok,
        hasName: Boolean(lead.name),
        hasGrade: Boolean(lead.grade),
        utm,
      });
      recordLeadSnapshot({
        exam: activeExam,
        target: run?.target ?? null,
        level: result?.band.level ?? null,
        band: result?.band.rangeLabel ?? null,
        strongest: result?.strongest[0]?.domain ?? null,
        weakest: result?.weakest[0]?.domain ?? null,
        delivered: ok,
        utm,
      });
      return ok;
    },
    [activeExam, updateRun, leadBase, run, result, utm],
  );

  /** Клик по WhatsApp фиксируется отдельно от фактически отправленной заявки. */
  const notifyWhatsAppClick = useCallback(() => {
    const base = leadBase();
    if (!base) return;
    void sendLead({
      ...base,
      kind: 'whatsapp',
      name: run?.lead?.name,
      phone: run?.lead?.phone,
      grade: run?.lead?.grade,
    });
  }, [leadBase, run]);

  const dismissTimeWarning = useCallback(() => {
    if (!activeExam) return;
    updateRun(activeExam, (prev) =>
      prev ? { ...prev, timeWarningShown: true } : prev,
    );
  }, [activeExam, updateRun]);

  useEffect(() => {
    if (!result || !run) return;
    track('result_viewed', {
      exam: run.exam,
      target: run.target,
      readiness: Number(result.overallReadiness.toFixed(3)),
      band: result.band.rangeLabel,
      level: result.band.level,
      strongestDomain: result.strongest[0]?.domain ?? null,
      weakestDomain: result.weakest[0]?.domain ?? null,
      utm,
    });
    recordLeadSnapshot({
      exam: run.exam,
      target: run.target,
      plannedWhen: run.plannedWhen,
      readiness: Number(result.overallReadiness.toFixed(3)),
      band: result.band.rangeLabel,
      level: result.band.level,
      strongestDomain: result.strongest[0]?.domain ?? null,
      weakestDomain: result.weakest[0]?.domain ?? null,
      correct: result.totalCorrect,
      total: result.totalQuestions,
      utm,
    });
    // личный прогресс: один срез на runId (дедуп внутри appendHistory)
    appendHistory(run.exam, {
      runId: result.runId,
      ts: result.generatedAt,
      bandLabel: result.band.rangeLabel,
      bandLow: result.band.low,
      bandHigh: result.band.high,
      overallPercent: result.overallPercent,
      totalCorrect: result.totalCorrect,
      totalQuestions: result.totalQuestions,
      elapsedMs: result.elapsedMs,
      target: run.target,
      sections: result.sections.map((s) => ({
        section: s.section,
        label: s.label,
        percent: s.percent,
        correct: s.correct,
        total: s.total,
      })),
    });
    void sendLead({
      kind: 'result',
      runId: run.runId,
      exam: run.exam,
      target: run.target,
      plannedWhen: run.plannedWhen,
      band: result.band.rangeLabel,
      level: result.band.level,
      correct: result.totalCorrect,
      total: result.totalQuestions,
      strongest: result.strongest[0]?.domain ?? null,
      weakest: result.weakest[0]?.domain ?? null,
      elapsedMin: Math.max(1, Math.round(result.elapsedMs / 60000)),
      utm,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [result?.runId]);

  return {
    hydrated,
    utm,
    runs,
    activeExam,
    run,
    questions,
    result,
    elapsedMs,
    timeUp,
    selectExam,
    backToLanding,
    setTarget,
    setPlannedWhen,
    startTest,
    answer,
    goTo,
    next,
    prev,
    finish,
    restart,
    openReview,
    closeReview,
    saveLead,
    notifyWhatsAppClick,
    dismissTimeWarning,
  };
}

export { loadUtm };
