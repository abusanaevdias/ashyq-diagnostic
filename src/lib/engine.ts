import { EXAMS } from './config';
import { DIFFICULTY_WEIGHT, gapToTarget, levelFromReadiness, scoreBand, LEVEL_TITLE_RU } from './scoring';
import type {
  DiagnosticResult,
  DomainScore,
  ExamId,
  Question,
  RunState,
  SectionScore,
} from './types';

/**
 * Scoring engine: ответы -> DiagnosticResult.
 * Чистая функция, легко покрыть тестами и переиспользовать на бэкенде.
 */

export function normalizeAnswer(raw: string): string {
  return raw
    .toLowerCase()
    .replace(/ё/g, 'е')
    .replace(/[.,!?;:"'’“”()\[\]]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function isCorrect(question: Question, answer: string | null | undefined): boolean {
  if (!answer) return false;
  if (question.kind === 'text-input') {
    const accepted = (question.acceptedAnswers ?? [question.correctAnswer]).map(normalizeAnswer);
    return accepted.includes(normalizeAnswer(answer));
  }
  return answer === question.correctAnswer;
}

interface Scored {
  earned: number;
  possible: number;
}

function scoreList(questions: Question[], answers: Record<string, string | null>): Scored {
  return questions.reduce<Scored>(
    (acc, q) => {
      const w = q.weight || DIFFICULTY_WEIGHT[q.difficulty];
      acc.possible += w;
      if (isCorrect(q, answers[q.id])) acc.earned += w;
      return acc;
    },
    { earned: 0, possible: 0 },
  );
}

export function computeResult(
  exam: ExamId,
  questions: Question[],
  run: Pick<RunState, 'answers' | 'target' | 'elapsedMs' | 'runId'>,
): DiagnosticResult {
  const cfg = EXAMS[exam];
  const answers = run.answers;

  const sections: SectionScore[] = cfg.sections.map((sectionId) => {
    const list = questions.filter((q) => q.section === sectionId);
    const { earned, possible } = scoreList(list, answers);
    const correct = list.filter((q) => isCorrect(q, answers[q.id])).length;
    const answered = list.filter((q) => Boolean(answers[q.id])).length;
    const readiness = possible > 0 ? earned / possible : 0;
    return {
      section: sectionId,
      label: cfg.sectionLabels[sectionId],
      correct,
      total: list.length,
      answered,
      readiness,
      percent: Math.round(readiness * 100),
      level: levelFromReadiness(readiness),
    };
  });

  const domains: DomainScore[] = [];
  const byDomain = new Map<string, Question[]>();
  questions.forEach((q) => {
    const key = `${q.section}::${q.domain}`;
    const arr = byDomain.get(key) ?? [];
    arr.push(q);
    byDomain.set(key, arr);
  });
  byDomain.forEach((list, key) => {
    const { earned, possible } = scoreList(list, answers);
    const readiness = possible > 0 ? earned / possible : 0;
    domains.push({
      domain: list[0].domain,
      section: list[0].section,
      correct: list.filter((q) => isCorrect(q, answers[q.id])).length,
      total: list.length,
      readiness,
      percent: Math.round(readiness * 100),
      level: levelFromReadiness(readiness),
    });
    void key;
  });

  const overall = scoreList(questions, answers);
  const overallReadiness = overall.possible > 0 ? overall.earned / overall.possible : 0;
  const band = scoreBand(exam, overallReadiness);
  const gap = gapToTarget(exam, band, run.target ?? null);

  const ranked = [...domains].sort((a, b) => b.readiness - a.readiness || a.domain.localeCompare(b.domain));
  // «Сильная сторона» — только там, где есть хотя бы один верный ответ
  const strongest = ranked.filter((d) => d.correct > 0).slice(0, 2);
  // «Резерв роста» — домены, где теряем больше всего взвешенных баллов
  const weakest = [...domains]
    .map((d) => ({ d, lost: d.total - d.correct }))
    .filter((x) => x.lost > 0)
    .sort((a, b) => b.d.readiness === a.d.readiness ? b.lost - a.lost : a.d.readiness - b.d.readiness)
    .slice(0, 2)
    .map((x) => x.d);

  const result: DiagnosticResult = {
    exam,
    runId: run.runId,
    generatedAt: Date.now(),
    totalCorrect: questions.filter((q) => isCorrect(q, answers[q.id])).length,
    totalQuestions: questions.length,
    answeredQuestions: questions.filter((q) => Boolean(answers[q.id])).length,
    overallReadiness,
    overallPercent: Math.round(overallReadiness * 100),
    overallLevel: band.level,
    sections,
    domains,
    band,
    strongest,
    weakest,
    insights: [],
    target: run.target ?? null,
    gapLabel: gap?.label ?? null,
    targetReached: gap?.reached ?? false,
    elapsedMs: run.elapsedMs,
    perQuestion: questions.map((q) => ({
      questionId: q.id,
      section: q.section,
      domain: q.domain,
      skill: q.skill,
      skillLabel: q.skillLabel,
      difficulty: q.difficulty,
      correct: isCorrect(q, answers[q.id]),
      answered: Boolean(answers[q.id]),
      myAnswer: answers[q.id] ?? null,
      correctAnswer: q.correctAnswer,
      weight: q.weight || DIFFICULTY_WEIGHT[q.difficulty],
    })),
  };

  result.insights = buildInsights(exam, questions, result, run.target ?? null, gap?.reached ?? false);
  return result;
}

/** Домен + короткое русское имя для экрана результата */
export function domainShortLabel(exam: ExamId, d: DomainScore): string {
  if (exam === 'ielts') {
    const part = d.section === 'listening' ? 'Listening' : 'Reading';
    return `${part} — ${d.domain}`;
  }
  return d.domain;
}

export function levelLabel(level: keyof typeof LEVEL_TITLE_RU): string {
  return LEVEL_TITLE_RU[level];
}

/* ------------------------------------------------------------------ */
/* Персональные insight'ы                                              */
/* ------------------------------------------------------------------ */

function tagStats(questions: Question[], result: DiagnosticResult) {
  const map = new Map<string, { correct: number; total: number }>();
  const byId = new Map(result.perQuestion.map((p) => [p.questionId, p]));
  questions.forEach((q) => {
    const p = byId.get(q.id);
    if (!p) return;
    (q.tags ?? [q.domain]).forEach((tag) => {
      const cur = map.get(tag) ?? { correct: 0, total: 0 };
      cur.total += 1;
      if (p.correct) cur.correct += 1;
      map.set(tag, cur);
    });
  });
  return map;
}

function buildInsights(
  exam: ExamId,
  questions: Question[],
  result: DiagnosticResult,
  target: string | null,
  targetReached: boolean,
): string[] {
  const out: string[] = [];
  const tags = tagStats(questions, result);
  const section = (id: string) => result.sections.find((s) => s.section === id);

  if (exam === 'sat') {
    const rw = section('rw');
    const math = section('math');

    if (math && math.readiness >= 0.7) {
      out.push('Math держится уверенно: базовые и средние задачи решаются стабильно.');
    } else if (math && math.readiness < 0.45) {
      out.push('Сейчас больше всего баллов теряется в Math — это самый быстрый резерв роста.');
    }

    if (rw && rw.readiness >= 0.7) {
      out.push('Reading & Writing: ты хорошо считываешь текст и держишь логику предложения.');
    } else if (rw && rw.readiness < 0.45) {
      out.push('В Reading & Writing стоит отдельно пройти пунктуацию, переходы и вопросы на вывод.');
    }

    const conv = tags.get('conventions');
    if (conv && conv.total > 0 && conv.correct < conv.total) {
      out.push('Standard English Conventions — точечная тема: границы предложения и согласование добираются практикой.');
    }

    const advMath = tags.get('advanced-math');
    if (advMath && advMath.total > 0 && advMath.correct === 0) {
      out.push('Advanced Math пока не дал баллов: квадратные и экспоненциальные задачи стоит разобрать первыми.');
    } else if (advMath && advMath.total > 0 && advMath.correct === advMath.total) {
      out.push('Advanced Math получился полностью — можно идти в более сложные нелинейные задачи.');
    }

    const data = tags.get('data-analysis');
    if (data && data.total > 0 && data.correct < data.total) {
      out.push('В задачах на данные и проценты полезно потренировать перевод условия в пропорцию.');
    }
  } else {
    const reading = section('reading');
    const listening = section('listening');

    const detail = tags.get('detail');
    if (detail && detail.correct === detail.total && detail.total > 0) {
      out.push('Ты хорошо находишь прямую информацию в тексте.');
    }

    const inference = tags.get('inference');
    if (inference && inference.total > 0 && inference.correct < inference.total) {
      out.push('Сложнее даются inference-вопросы: ответ там выводится из текста, а не цитируется.');
    } else if (inference && inference.total > 0 && inference.correct === inference.total) {
      out.push('Inference-вопросы прошли чисто — это хороший знак для Reading.');
    }

    const vocab = tags.get('vocabulary');
    if (vocab && vocab.total > 0 && vocab.correct < vocab.total) {
      out.push('Академическая лексика в контексте — зона роста: стоит собирать слова из текстов, а не из списков.');
    }

    if (reading && reading.readiness >= 0.7) {
      out.push('Reading выглядит сильной стороной: темп и понимание текста на уровне.');
    } else if (reading && reading.readiness < 0.45) {
      out.push('Reading сейчас главный резерв: начни со сканирования текста под конкретный вопрос.');
    }

    if (listening && listening.readiness >= 0.75) {
      out.push('Listening держится хорошо — детали на слух ловишь.');
    } else if (listening && listening.readiness < 0.5) {
      out.push('В Listening внимание теряется на заданиях с деталями: цифры, имена, сроки.');
    }

    out.push('Writing и Speaking в этой диагностике не оценивались — их стоит проверить отдельно с тренером.');
  }

  if (target && target !== 'unknown') {
    if (targetReached) {
      out.push(
        `Цель ${target}${exam === 'sat' ? '+' : ''} уже в твоём текущем диапазоне. Дальше важна стабильность: полный mock и работа над ошибками.`,
      );
    } else if (result.gapLabel) {
      out.push(
        exam === 'sat'
          ? `До цели ${target}+ сейчас ${result.gapLabel}. Такой разрыв обычно закрывается работой над 2–3 доменами, а не «всем сразу».`
          : `До цели ${target} сейчас ${result.gapLabel}. Разрыв по Reading и Listening закрывается быстрее, чем по Writing.`,
      );
    }
  }

  // Держим 2–4 insight'а
  const unique: string[] = [];
  out.forEach((line) => {
    if (!unique.includes(line)) unique.push(line);
  });
  return unique.slice(0, 4);
}
