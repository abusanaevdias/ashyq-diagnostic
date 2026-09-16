import { QUESTION_BANK } from '@/data/questions';
import { isCorrect } from './engine';
import type { Difficulty, ExamId, Question, SectionId } from './types';

/**
 * Разбор ошибок диагностики для менеджера в CRM (CRM-MISTAKES-001).
 *
 * На входе — только ответы клиента (questionId → ответ). Правильность
 * пересчитывается по банку, а не берётся из браузера. На выходе — ответы
 * по каждому вопросу и «слабые места»: сценарии вида «ошибся в этих
 * вопросах → хромает этот навык → вот что с ним делать».
 */

export type ClientAnswers = Record<string, string | null>;

export interface AnswerReview {
  id: string;
  section: SectionId;
  skillLabel: string;
  difficulty: Difficulty;
  prompt: string;
  /** Ответ клиента с подписью варианта: «C · 28»; null — пропустил */
  answer: string | null;
  correctAnswer: string;
  correct: boolean;
  explanation: string;
}

export interface WeakSpot {
  id: string;
  title: string;
  /** На каких вопросах это видно */
  evidence: string;
  /** Что делать на занятиях / что сказать клиенту */
  advice: string;
  severity: 'high' | 'medium';
}

export interface MistakesReport {
  reviews: AnswerReview[];
  weakSpots: WeakSpot[];
  correct: number;
  total: number;
}

const BANK = new Map(QUESTION_BANK.map((q) => [q.id, q]));

/** Сервер пропускает только id из банка нужного экзамена — остальное мусор. */
export function isKnownQuestion(exam: ExamId, id: string): boolean {
  return BANK.get(id)?.exam === exam;
}

const DIFFICULTY_RU: Record<Difficulty, string> = { easy: 'лёгкий', medium: 'средний', hard: 'сложный' };

function withLabel(q: Question, value: string | null): string | null {
  if (!value) return null;
  const option = q.options?.find((o) => o.id === value);
  return option && option.label !== option.id ? `${option.id} · ${option.label}` : value;
}

/** Сценарий по метке вопроса: ошибка хотя бы в одном вопросе с меткой → слабое место. */
interface TagScenario {
  exam: ExamId;
  tag: string;
  title: string;
  advice: string;
  /** Не показывать, если сработал более точный сценарий */
  unless?: string;
}

const TAG_SCENARIOS: TagScenario[] = [
  // SAT Math
  { exam: 'sat', tag: 'algebra', title: 'Алгебра: линейные уравнения, неравенства, системы', advice: 'База SAT Math и треть всех задач. Отработать решение линейных уравнений и систем до автоматизма, затем — наклон и смысл коэффициентов в контексте.' },
  { exam: 'sat', tag: 'advanced-math', title: 'Advanced Math: квадратичные, экспоненциальные, рациональные функции', advice: 'Разобрать вершину параболы, корни и разложение, рост в процентах (a·b^x). Много баллов на сложных задачах — давать после закрепления алгебры.' },
  { exam: 'sat', tag: 'data-analysis', title: 'Данные: проценты, пропорции, скорости, статистика', advice: 'Тренировать перевод условия в пропорцию, единицы измерения и чтение графиков/scatterplot. Типичная ошибка — посчитал верно, но не ту величину.' },
  { exam: 'sat', tag: 'geometry', title: 'Геометрия и тригонометрия', advice: 'Повторить подобие, sin/cos/tan в прямоугольном треугольнике, объёмы и уравнение окружности. Небольшой объём формул — быстрый прирост.' },
  { exam: 'sat', tag: 'contextual', title: 'Текстовые задачи: не переводит условие в уравнение', advice: 'Считать умеет, но теряется в формулировке. Приём: выписать величины и что ищем → составить уравнение → только потом считать. Разбирать word problems на английском.', unless: 'contextual-only' },
  // SAT Reading & Writing
  { exam: 'sat', tag: 'information-and-ideas', title: 'Понимание текста: главная мысль, детали, выводы', advice: 'Учить формулировать главную мысль своими словами до чтения вариантов и подтверждать ответ строкой из текста.' },
  { exam: 'sat', tag: 'data', title: 'Текст + график: подтверждение данными', advice: 'Сверять утверждение с конкретными цифрами таблицы/графика, а не с общим смыслом текста.' },
  { exam: 'sat', tag: 'vocabulary', title: 'Словарный запас: слова в контексте', advice: 'Собирать академическую лексику из текстов (не из списков), подставлять свой синоним в пропуск перед выбором варианта.' },
  { exam: 'sat', tag: 'craft-and-structure', title: 'Структура и цель текста, сравнение двух текстов', advice: 'Разбирать «зачем автор это написал» и роль предложения в абзаце; в Cross-Text — сначала позиция каждого автора отдельно.', unless: 'vocabulary-only' },
  { exam: 'sat', tag: 'conventions', title: 'Грамматика и пунктуация (Standard English Conventions)', advice: 'Самая «натаскиваемая» тема: границы предложений, запятые/точка с запятой, согласование подлежащего и сказуемого, модификаторы. Правило + 20 примеров.' },
  { exam: 'sat', tag: 'expression-of-ideas', title: 'Связность текста: переходы и синтез', advice: 'Определять логическую связь двух предложений (контраст / следствие / пример) до выбора слова-перехода; в Synthesis — отвечать строго на цель из вопроса.' },
  // IELTS Reading
  { exam: 'ielts', tag: 'tfng', title: 'True / False / Not Given', advice: 'Сверять утверждение по частям с конкретным местом текста. False — текст прямо противоречит, Not Given — информации нет.', unless: 'tfng-confusion' },
  { exam: 'ielts', tag: 'main-idea', title: 'Главная мысль текста', advice: 'Читать первое/последнее предложение абзацев, формулировать идею одной фразой. Не выбирать вариант, который верен только для части текста.' },
  { exam: 'ielts', tag: 'inference', title: 'Выводы и позиция автора', advice: 'Ответ не цитируется, а выводится: искать парафраз и отношение автора (оценочные слова, however/but).' },
  { exam: 'ielts', tag: 'vocabulary', title: 'Лексика и парафраз', advice: 'IELTS проверяет синонимы: вопрос и текст говорят одно разными словами. Вести словарь парафразов из прочитанных текстов.' },
  { exam: 'ielts', tag: 'completion', title: 'Запись ответа: орфография и формат', advice: 'Ответ пишется словом из текста без ошибок и в лимите слов. Опечатка = 0 баллов — тренировать дословный перенос.' },
  // IELTS Listening
  { exam: 'ielts', tag: 'numbers', title: 'Listening: числа, цены, даты на слух', advice: 'Диктанты на числа (fifteen/fifty, суммы, даты), запись в правильном формате.' },
  { exam: 'ielts', tag: 'distractors', title: 'Listening: ловушки — говорящий поправляет себя', advice: 'Слушать до конца фразы: «on Tuesday… actually, no, Thursday». Тренировать задания с заменой информации.' },
  { exam: 'ielts', tag: 'speakers', title: 'Listening: несколько спикеров, кто что делает', advice: 'Matching-задания: заранее прочитать варианты, отмечать смену говорящего и имена.' },
];

function questionList(items: AnswerReview[]): string {
  return items.map((r) => r.skillLabel).filter((v, i, a) => a.indexOf(v) === i).join(', ');
}

export function analyzeAnswers(exam: ExamId, answers: ClientAnswers): MistakesReport {
  const pairs = Object.entries(answers)
    .map(([id, answer]) => ({ q: BANK.get(id), answer }))
    .filter((p): p is { q: Question; answer: string | null } => p.q?.exam === exam);

  const reviews: AnswerReview[] = pairs.map(({ q, answer }) => ({
    id: q.id,
    section: q.section,
    skillLabel: q.skillLabel,
    difficulty: q.difficulty,
    prompt: q.prompt,
    answer: withLabel(q, answer),
    correctAnswer: withLabel(q, q.correctAnswer) ?? q.correctAnswer,
    correct: isCorrect(q, answer),
    explanation: q.explanation,
  }));
  const rawAnswer = new Map(pairs.map(({ q, answer }) => [q.id, answer]));
  const tagsOf = (id: string) => BANK.get(id)?.tags ?? [];
  const wrong = reviews.filter((r) => !r.correct);
  const spots: WeakSpot[] = [];
  const fired = new Set<string>();

  // 1. Поведение: пропуски
  const skipped = reviews.filter((r) => !r.answer);
  if (skipped.length >= 2) {
    spots.push({
      id: 'skipped',
      title: 'Пропускает вопросы — не хватает времени или бросает сложное',
      evidence: `Без ответа ${skipped.length} из ${reviews.length}: ${questionList(skipped)}`,
      advice: 'На экзамене пустой ответ = 0, угаданный — 25%. Учить отвечать на всё, отмечать сомнительные и возвращаться; тренировать темп на таймере.',
      severity: skipped.length / reviews.length >= 0.25 ? 'high' : 'medium',
    });
  }

  // 2. Поведение: ошибается в лёгком, но решает сложное → невнимательность
  const easyWrong = wrong.filter((r) => r.difficulty === 'easy' && r.answer);
  const hardRight = reviews.filter((r) => r.difficulty === 'hard' && r.correct);
  if (easyWrong.length > 0 && hardRight.length > 0) {
    spots.push({
      id: 'careless',
      title: 'Невнимательность: ошибки в лёгких вопросах при решённых сложных',
      evidence: `Ошибся в лёгких (${questionList(easyWrong)}), но решил сложные (${questionList(hardRight)})`,
      advice: 'Знаний хватает — теряет баллы на спешке. Перечитывать вопрос, подставлять ответ обратно в условие, не решать «в уме».',
      severity: 'medium',
    });
  }

  // 3. Потолок сложности: база держится, сложные не даются
  const hard = reviews.filter((r) => r.difficulty === 'hard');
  const base = reviews.filter((r) => r.difficulty !== 'hard');
  const baseRate = base.length ? base.filter((r) => r.correct).length / base.length : 0;
  if (hard.length >= 2 && hardRight.length === 0 && baseRate >= 0.75) {
    spots.push({
      id: 'ceiling',
      title: 'Потолок сложности: база есть, сложные задачи не решает',
      evidence: `Лёгкие и средние: ${Math.round(baseRate * 100)}% верно; сложные: 0 из ${hard.length}`,
      advice: 'Не тратить время на базу — сразу сложные форматы и разбор ловушек. Хороший кандидат на интенсив под высокий балл.',
      severity: 'medium',
    });
  }

  // 4. IELTS: классическая путаница False ↔ Not Given
  const tfngConfusion = wrong.filter((r) => {
    const q = BANK.get(r.id);
    const a = rawAnswer.get(r.id);
    return q && tagsOf(r.id).includes('tfng') &&
      ((q.correctAnswer === 'NG' && a === 'FALSE') || (q.correctAnswer === 'FALSE' && a === 'NG'));
  });
  if (tfngConfusion.length > 0) {
    fired.add('tfng-confusion');
    spots.push({
      id: 'tfng-confusion',
      title: 'Путает False и Not Given',
      evidence: `${tfngConfusion.map((r) => `ответил ${rawAnswer.get(r.id)} вместо ${BANK.get(r.id)?.correctAnswer}`).join('; ')}`,
      advice: 'False — текст прямо говорит обратное. Not Given — в тексте об этом нет информации. Додумывание «логично же» — главная причина ошибки. 10–15 утверждений с объяснением.',
      severity: 'high',
    });
  }

  // 5. SAT: текстовые задачи хуже «чистых» — не сработает, если математика провалена целиком
  const math = reviews.filter((r) => r.section === 'math');
  const ctx = math.filter((r) => tagsOf(r.id).includes('contextual'));
  const plain = math.filter((r) => !tagsOf(r.id).includes('contextual'));
  const rate = (list: AnswerReview[]) => list.length ? list.filter((r) => r.correct).length / list.length : 1;
  if (ctx.filter((r) => !r.correct).length < 2 || rate(ctx) >= rate(plain)) fired.add('contextual-only');

  // 6. SAT: в Craft and Structure ошибся только в словах — это уже покрыто сценарием лексики
  const craftWrong = wrong.filter((r) => tagsOf(r.id).includes('craft-and-structure'));
  if (craftWrong.length > 0 && craftWrong.every((r) => tagsOf(r.id).includes('vocabulary'))) fired.add('vocabulary-only');

  // 7. Сценарии по темам
  for (const scenario of TAG_SCENARIOS) {
    if (scenario.exam !== exam || (scenario.unless && fired.has(scenario.unless))) continue;
    const all = reviews.filter((r) => tagsOf(r.id).includes(scenario.tag));
    const bad = all.filter((r) => !r.correct);
    if (bad.length === 0) continue;
    // completion: ошибка записи — только если что-то написал
    if (scenario.tag === 'completion' && !bad.some((r) => r.answer)) continue;
    spots.push({
      id: scenario.tag,
      title: scenario.title,
      evidence: `Ошибки: ${bad.length} из ${all.length} — ${bad.map((r) => `${r.skillLabel} (${r.answer ? DIFFICULTY_RU[r.difficulty] : 'пропуск'})`).join(', ')}`,
      advice: scenario.advice,
      severity: bad.length === all.length && all.length >= 2 ? 'high' : 'medium',
    });
  }

  const order = { high: 0, medium: 1 };
  spots.sort((a, b) => order[a.severity] - order[b.severity]);

  return {
    reviews,
    weakSpots: spots,
    correct: reviews.filter((r) => r.correct).length,
    total: reviews.length,
  };
}
