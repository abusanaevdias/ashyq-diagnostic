/**
 * Доменная модель ASHYQ Quick Diagnostic.
 *
 * Всё (вопросы, материалы, скоринг, настройки) описано типами,
 * чтобы команда Ashyq могла менять контент без правок UI.
 */

export type ExamId = 'sat' | 'ielts';

export type Difficulty = 'easy' | 'medium' | 'hard';

export type SectionId =
  /** SAT */
  | 'rw'
  | 'math'
  /** IELTS */
  | 'reading'
  | 'listening';

export type QuestionKind = 'single-choice' | 'text-input';

/** Вариант ответа. `id` — стабильная буква/ключ, не меняется при перемешивании. */
export interface Option {
  id: string;
  label: string;
}

/**
 * Материал, к которому привязан вопрос: passage, таблица, аудио.
 * Несколько вопросов могут ссылаться на один материал (groupKey),
 * тогда материал показывается один раз сверху блока вопросов.
 */
export interface Material {
  id: string;
  exam: ExamId;
  /** reading | listening */
  section: SectionId;
  kind: 'passage' | 'table' | 'audio';
  title: string;
  /** Подпись над материалом: "Passage A", "Recording 1" */
  tag?: string;
  /** Основной текст (passage) или описание таблицы */
  text?: string;
  /** Для таблиц: заголовки + строки */
  table?: {
    caption?: string;
    headers: string[];
    rows: string[][];
    /** Единицы/примечание под таблицей */
    note?: string;
  };
  /** Для аудио */
  audio?: {
    /** Файл в /public. Если файла нет — компонент честно уходит в fallback. */
    src?: string;
    durationSec?: number;
    /** Транскрипт: нужен для TTS-fallback и для проверки качества банка. В проде не показывать. */
    transcript: string;
    /** Сколько раз можно прослушать (IELTS-подобное ограничение). */
    maxPlays?: number;
  };
}

export interface Question {
  id: string;
  exam: ExamId;
  section: SectionId;
  /** Официальный content domain: "Information and Ideas", "Algebra", ... */
  domain: string;
  /** Конкретный навык: "Inference", "Linear equations in one variable", ... */
  skill: string;
  difficulty: Difficulty;
  /** Короткое имя навыка для result screen ("Reading — Detail") */
  skillLabel: string;
  kind: QuestionKind;
  /** id материала из materials (passage / table / audio) */
  materialId?: string;
  /** Вопросы с одинаковым groupKey идут подряд и делят материал */
  groupKey?: string;
  prompt: string;
  options?: Option[];
  /** Для text-input: нормализованные допустимые ответы (lowercase, без знаков препинания) */
  acceptedAnswers?: string[];
  correctAnswer: string;
  explanation: string;
  /** Вес для внутреннего скоринга: easy 1 / medium 1.5 / hard 2 */
  weight: number;
  /** Метки для insight'ов, например ['detail'] | ['inference'] */
  tags?: string[];
}

/** Набор, который реально выдаётся пользователю за один заход */
export interface TestBlueprint {
  exam: ExamId;
  title: string;
  /** Целевая длительность в секундах (мягкий лимит, не обрывает тест) */
  targetDurationSec: number;
  /** Сколько вопросов берём из банка по секциям */
  perSection: Partial<Record<SectionId, number>>;
  /** Желаемое распределение по сложности */
  difficultyMix: Record<Difficulty, number>;
}

export type RunStage =
  | 'landing'
  | 'onboarding'
  | 'quiz'
  | 'result'
  | 'review';

export interface AnswerRecord {
  questionId: string;
  answer: string | null;
  /** ms от старта теста */
  answeredAtMs?: number;
}

export interface UtmParams {
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_content?: string;
  utm_term?: string;
}

export interface RunState {
  schemaVersion: number;
  runId: string;
  exam: ExamId;
  stage: RunStage;
  target: string | null;
  plannedWhen: string | null;
  questionIds: string[];
  /** seed сборки теста — чтобы набор вопросов можно было воспроизвести */
  seed: number;
  /** questionId -> порядок вариантов (для будущего A/B и перемешивания) */
  optionOrder: Record<string, string[]>;
  answers: Record<string, string | null>;
  currentIndex: number;
  startedAt: number | null;
  elapsedMs: number;
  finished: boolean;
  finishedAt: number | null;
  timeWarningShown: boolean;
  utm: UtmParams;
  /** Контакт, оставленный на экране результата */
  lead?: {
    name?: string;
    grade?: string;
    phone?: string;
    /** заявка успешно принята сервером */
    submitted?: boolean;
  };
}

export type ReadinessLevel =
  | 'FOUNDATION'
  | 'DEVELOPING'
  | 'STRONG'
  | 'ADVANCED';

export interface SectionScore {
  section: SectionId;
  label: string;
  correct: number;
  total: number;
  answered: number;
  /** 0..1 — доля набранных взвешенных баллов */
  readiness: number;
  percent: number;
  level: ReadinessLevel;
}

export interface DomainScore {
  domain: string;
  section: SectionId;
  correct: number;
  total: number;
  readiness: number;
  percent: number;
  level: ReadinessLevel;
}

export interface ScoreBand {
  /** "1290–1390" или "5.5–6.5" */
  rangeLabel: string;
  level: ReadinessLevel;
  levelTitleRu: string;
  low: number;
  high: number;
}

export interface DiagnosticResult {
  exam: ExamId;
  runId: string;
  generatedAt: number;
  totalCorrect: number;
  totalQuestions: number;
  answeredQuestions: number;
  /** 0..1 по всему тесту */
  overallReadiness: number;
  overallPercent: number;
  overallLevel: ReadinessLevel;
  sections: SectionScore[];
  domains: DomainScore[];
  band: ScoreBand;
  strongest: DomainScore[];
  weakest: DomainScore[];
  insights: string[];
  target: string | null;
  /** "≈ +10–110" (SAT) или "≈ +0.5–1.5 band" (IELTS); "0" если цель достигнута */
  gapLabel: string | null;
  /** цель уже внутри текущего диапазона */
  targetReached: boolean;
  /** Сколько секунд пользователь реально потратил */
  elapsedMs: number;
  /** Детализация по вопросам для review */
  perQuestion: Array<{
    questionId: string;
    section: SectionId;
    domain: string;
    skill: string;
    skillLabel: string;
    difficulty: Difficulty;
    correct: boolean;
    answered: boolean;
    myAnswer: string | null;
    correctAnswer: string;
    weight: number;
  }>;
}

/** Срез завершённой диагностики для личного прогресс-трекинга.
 *  Хранится локально (ashyq:v1:history:{exam}), без PII. */
export interface ProgressSnapshot {
  runId: string;
  ts: number;
  bandLabel: string;
  /** численные границы диапазона — ось графика */
  bandLow: number;
  bandHigh: number;
  overallPercent: number;
  totalCorrect: number;
  totalQuestions: number;
  elapsedMs: number;
  target: string | null;
  sections: Array<{
    section: SectionId;
    label: string;
    percent: number;
    correct: number;
    total: number;
  }>;
}
