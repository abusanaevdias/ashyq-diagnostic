import { EXAMS } from './config';
import { computeResult, isCorrect } from './engine';
import { buildTest, makeRng } from './selector';
import { DIFFICULTY_WEIGHT } from './scoring';
import type { Difficulty, ExamId, Question, SectionId } from './types';

/**
 * Валидация банка вопросов.
 *
 * Проверяет структуру, уникальность ответов, связи с материалами,
 * покрытие blueprint'а и работу селектора/скоринга.
 * Используется из CLI (`npm run validate:bank`) и из /api/validate.
 */

export interface ValidationIssue {
  level: 'error' | 'warning';
  questionId?: string;
  message: string;
}

export interface ValidationReport {
  ok: boolean;
  counts: Record<string, number>;
  issues: ValidationIssue[];
  buildChecks: Array<{ name: string; ok: boolean; detail?: string }>;
}

const FORBIDDEN = /lorem ipsum|TODO|FIXME|placeholder/i;

/** Для сверки вводимых ответов: пунктуация не значима */
function normalize(value: string): string {
  return value
    .toLowerCase()
    .replace(/ё/g, 'е')
    .replace(/[.,!?;:"'’“”()\[\]]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Для сравнения вариантов ответа: пунктуация ЗНАЧИМА,
 * иначе все варианты в вопросах на boundaries/punctuation схлопнутся.
 */
function labelKey(value: string): string {
  return value.toLowerCase().replace(/\s+/g, ' ').trim();
}

export function validateBank(
  bank: Question[],
  materials: Map<string, { exam: ExamId; section: SectionId; kind: string; text?: string; transcript?: string }>,
): ValidationReport {
  const issues: ValidationIssue[] = [];
  const push = (level: ValidationIssue['level'], message: string, questionId?: string) =>
    issues.push({ level, message, questionId });

  /* ---------- 1. уникальность ---------- */
  const ids = new Set<string>();
  bank.forEach((q) => {
    if (ids.has(q.id)) push('error', `Дублирующийся id вопроса: ${q.id}`, q.id);
    ids.add(q.id);
  });

  /* ---------- 2. поля ---------- */
  bank.forEach((q) => {
    const required: Array<[string, unknown]> = [
      ['exam', q.exam],
      ['section', q.section],
      ['domain', q.domain],
      ['skill', q.skill],
      ['difficulty', q.difficulty],
      ['kind', q.kind],
      ['prompt', q.prompt],
      ['correctAnswer', q.correctAnswer],
      ['explanation', q.explanation],
      ['skillLabel', q.skillLabel],
    ];
    required.forEach(([field, value]) => {
      if (!value) push('error', `Пустое обязательное поле "${field}"`, q.id);
    });

    if (!EXAMS[q.exam]) push('error', `Неизвестный exam: ${q.exam}`, q.id);
    else if (!EXAMS[q.exam].sections.includes(q.section)) {
      push('error', `Секция ${q.section} не относится к экзамену ${q.exam}`, q.id);
    }

    if (!['easy', 'medium', 'hard'].includes(q.difficulty)) {
      push('error', `Некорректная сложность: ${q.difficulty}`, q.id);
    }

    if (q.weight !== DIFFICULTY_WEIGHT[q.difficulty as Difficulty]) {
      push(
        'warning',
        `Вес ${q.weight} не совпадает с эталоном для ${q.difficulty} (${DIFFICULTY_WEIGHT[q.difficulty as Difficulty]})`,
        q.id,
      );
    }

    if (FORBIDDEN.test(q.prompt) || FORBIDDEN.test(q.explanation)) {
      push('error', 'В тексте вопроса/объяснения есть заглушка (lorem/TODO/placeholder)', q.id);
    }

    /* ---------- 3. ответы ---------- */
    if (q.kind === 'single-choice') {
      if (!q.options || q.options.length < 3 || q.options.length > 4) {
        push('error', `Должно быть 3–4 варианта, найдено ${q.options?.length ?? 0}`, q.id);
      } else {
        const optIds = new Set<string>();
        const labels = new Set<string>();
        q.options.forEach((o) => {
          if (optIds.has(o.id)) push('error', `Повторяющийся id варианта: ${o.id}`, q.id);
          optIds.add(o.id);
          if (!o.label.trim()) push('error', `Пустой текст варианта ${o.id}`, q.id);
          const key = labelKey(o.label);
          if (labels.has(key)) push('error', `Дословно одинаковые варианты (${o.id})`, q.id);
          labels.add(key);
        });
        if (!optIds.has(q.correctAnswer)) {
          push('error', `Правильный ответ "${q.correctAnswer}" отсутствует среди вариантов`, q.id);
        }
      }
    }

    if (q.kind === 'text-input') {
      if (!q.acceptedAnswers || q.acceptedAnswers.length === 0) {
        push('error', 'Для text-input нужны acceptedAnswers', q.id);
      } else {
        const accepted = q.acceptedAnswers.map(normalize);
        if (!accepted.includes(normalize(q.correctAnswer))) {
          push('error', 'correctAnswer не входит в acceptedAnswers', q.id);
        }
        if (new Set(accepted).size !== accepted.length) {
          push('warning', 'В acceptedAnswers есть дубликаты после нормализации', q.id);
        }
      }
      if (q.options) push('warning', 'У text-вопроса заданы options — они не используются', q.id);
    }

    /* ---------- 4. материалы ---------- */
    if (q.materialId) {
      const material = materials.get(q.materialId);
      if (!material) {
        push('error', `Материал "${q.materialId}" не найден`, q.id);
      } else {
        if (material.exam !== q.exam) push('error', 'Материал относится к другому экзамену', q.id);
        if (material.section !== q.section) push('error', 'Материал относится к другой секции', q.id);
      }
    } else if (q.section === 'listening') {
      push('error', 'Listening-вопрос без аудиоматериала', q.id);
    }

    /* ---------- 4b. длина passage ---------- */
    const linked = q.materialId ? materials.get(q.materialId) : undefined;
    // Длину проверяем только у настоящих текстов: для заданий на conventions
    // «материал» — это одно предложение с пропуском, и это нормально.
    // Sentence-level items (transitions, words in context, conventions)
    // в Digital SAT и правда короткие — длину проверяем только у полноценных текстов.
    const isLongForm =
      linked?.kind === 'passage' &&
      (q.domain === 'Information and Ideas' || q.section === 'reading');
    if (isLongForm && linked?.text) {
      const words = linked.text.split(/\s+/).filter(Boolean).length;
      const min = q.section === 'reading' ? 100 : 55;
      const max = q.section === 'reading' ? 240 : 260;
      if (words < min || words > max) {
        push(
          'warning',
          `Passage "${q.materialId}" содержит ${words} слов (ожидается ${min}–${max})`,
          q.id,
        );
      }
    }

    /* ---------- 4c. качество объяснения ---------- */
    if (q.explanation.trim().length < 40) {
      push('warning', 'Объяснение короче 40 символов — студент не поймёт логику', q.id);
    }
    if (linked?.kind === 'audio' && !linked.transcript) {
      push('error', 'Аудиоматериал без транскрипта — fallback-озвучка не сработает', q.id);
    }
  });

  /* ---------- 4d. общие материалы должны идти одним блоком ---------- */
  const byMaterial = new Map<string, Question[]>();
  bank.forEach((q) => {
    if (!q.materialId) return;
    const arr = byMaterial.get(q.materialId) ?? [];
    arr.push(q);
    byMaterial.set(q.materialId, arr);
  });
  byMaterial.forEach((list, materialId) => {
    if (list.length < 2) return;
    const keys = new Set(list.map((q) => q.groupKey ?? null));
    if (keys.size > 1 || keys.has(null)) {
      push(
        'warning',
        `Материал "${materialId}" используется в ${list.length} вопросах, но groupKey не задан единообразно — материал будет показываться несколько раз`,
        list[0].id,
      );
    }
  });

  /* ---------- 5. покрытие blueprint ---------- */
  const counts: Record<string, number> = { total: bank.length };
  (Object.keys(EXAMS) as ExamId[]).forEach((exam) => {
    const cfg = EXAMS[exam];
    counts[exam] = bank.filter((q) => q.exam === exam).length;
    cfg.sections.forEach((section) => {
      const need = cfg.blueprint.perSection[section] ?? 0;
      const pool = bank.filter((q) => q.exam === exam && q.section === section);
      counts[`${exam}:${section}`] = pool.length;
      if (pool.length < need) {
        push('error', `${exam}/${section}: в банке ${pool.length} вопросов, нужно минимум ${need}`);
      }
      (['easy', 'medium', 'hard'] as Difficulty[]).forEach((difficulty) => {
        const have = pool.filter((q) => q.difficulty === difficulty).length;
        counts[`${exam}:${section}:${difficulty}`] = have;
      });
    });
  });

  /* ---------- 6. сборка теста ---------- */
  const buildChecks: ValidationReport['buildChecks'] = [];
  (Object.keys(EXAMS) as ExamId[]).forEach((exam) => {
    const cfg = EXAMS[exam];
    const expectedTotal = cfg.sections.reduce(
      (acc, s) => acc + (cfg.blueprint.perSection[s] ?? 0),
      0,
    );
    const seeds = [1, 7, 42, 1337, 99991];
    let allOk = true;
    const details: string[] = [];

    seeds.forEach((seed) => {
      const built = buildTest({ exam, seed, bank });
      if (built.questions.length !== expectedTotal) {
        allOk = false;
        details.push(`seed ${seed}: ${built.questions.length} вопросов вместо ${expectedTotal}`);
      }
      const unique = new Set(built.questions.map((q) => q.id));
      if (unique.size !== built.questions.length) {
        allOk = false;
        details.push(`seed ${seed}: дубликаты вопросов в сборке`);
      }
      cfg.sections.forEach((section) => {
        const need = cfg.blueprint.perSection[section] ?? 0;
        const got = built.questions.filter((q) => q.section === section).length;
        if (got !== need) {
          allOk = false;
          details.push(`seed ${seed}: ${section} — ${got} вместо ${need}`);
        }
      });

      // порядок: секции идут блоками, вопросы одного материала подряд
      const seenGroups: string[] = [];
      built.questions.forEach((q) => {
        const g = q.groupKey ?? q.id;
        if (seenGroups[seenGroups.length - 1] !== g) seenGroups.push(g);
      });
      if (new Set(seenGroups).size !== seenGroups.length) {
        allOk = false;
        details.push(`seed ${seed}: вопросы одного материала разбросаны по тесту`);
      }
    });

    buildChecks.push({
      name: `buildTest(${exam})`,
      ok: allOk,
      detail: details.join('; ') || `${seeds.length} сборок корректны`,
    });

    /* ---------- 7. скоринг ---------- */
    const built = buildTest({ exam, seed: 42, bank });
    const answersAll: Record<string, string | null> = {};
    built.questions.forEach((q) => {
      answersAll[q.id] = q.correctAnswer;
    });
    const perfect = computeResult(exam, built.questions, {
      answers: answersAll,
      target: null,
      elapsedMs: 0,
      runId: 'validate-perfect',
    });
    buildChecks.push({
      name: `scoring(${exam}) — все ответы верны`,
      ok: Math.abs(perfect.overallReadiness - 1) < 1e-9 && perfect.totalCorrect === built.questions.length,
      detail: `readiness=${perfect.overallReadiness.toFixed(3)} band=${perfect.band.rangeLabel}`,
    });

    const answersNone: Record<string, string | null> = {};
    built.questions.forEach((q) => {
      answersNone[q.id] = null;
    });
    const zero = computeResult(exam, built.questions, {
      answers: answersNone,
      target: null,
      elapsedMs: 0,
      runId: 'validate-zero',
    });
    buildChecks.push({
      name: `scoring(${exam}) — нет ответов`,
      ok: zero.overallReadiness === 0 && zero.totalCorrect === 0 && zero.insights.length > 0,
      detail: `readiness=${zero.overallReadiness} band=${zero.band.rangeLabel} insights=${zero.insights.length}`,
    });

    // случайное угадывание не должно давать «сильный» уровень
    const rng = makeRng(99);
    const guessScores: number[] = [];
    for (let i = 0; i < 200; i++) {
      const guess: Record<string, string | null> = {};
      built.questions.forEach((q) => {
        if (q.kind === 'text-input') {
          guess[q.id] = rng() < 0.05 ? q.correctAnswer : 'zzz';
        } else {
          const opts = q.options ?? [];
          guess[q.id] = opts[Math.floor(rng() * opts.length)]?.id ?? null;
        }
      });
      const res = computeResult(exam, built.questions, {
        answers: guess,
        target: null,
        elapsedMs: 0,
        runId: `guess-${i}`,
      });
      guessScores.push(res.overallReadiness);
    }
    const avgGuess = guessScores.reduce((a, b) => a + b, 0) / guessScores.length;
    const maxGuess = Math.max(...guessScores);
    buildChecks.push({
      name: `scoring(${exam}) — случайное угадывание`,
      ok: maxGuess < 0.7,
      detail: `средний readiness=${avgGuess.toFixed(3)}, максимум из 200 попыток=${maxGuess.toFixed(3)}`,
    });

    // isCorrect для text-input должен принимать разные формы записи
    const textQuestions = built.questions.filter((q) => q.kind === 'text-input');
    if (textQuestions.length > 0) {
      const okText = textQuestions.every((q) => {
        const variants = (q.acceptedAnswers ?? [q.correctAnswer]).map((a) => a.toUpperCase());
        return variants.every((v) => isCorrect(q, v));
      });
      buildChecks.push({
        name: `text-input(${exam}) — нормализация ответа`,
        ok: okText,
        detail: `${textQuestions.length} вопросов с вводом текста`,
      });
    }
  });

  buildChecks.forEach((c) => {
    if (!c.ok) push('error', `${c.name}: ${c.detail ?? 'проверка не прошла'}`);
  });

  const errors = issues.filter((i) => i.level === 'error');
  return {
    ok: errors.length === 0,
    counts,
    issues,
    buildChecks,
  };
}
