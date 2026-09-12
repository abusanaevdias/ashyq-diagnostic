import type { ExamId, RunStage, SectionId, TestBlueprint } from './types';

/**
 * Единственное место, где живут «бизнес-настройки» диагностики.
 * Пороги, цели, номер WhatsApp — всё меняется здесь, без правок UI.
 */

export const SCHEMA_VERSION = 1;

export const STORAGE_KEYS = {
  run: (exam: ExamId) => `ashyq:v${SCHEMA_VERSION}:run:${exam}`,
  utm: `ashyq:v${SCHEMA_VERSION}:utm`,
  active: `ashyq:v${SCHEMA_VERSION}:active`,
  leads: `ashyq:v${SCHEMA_VERSION}:leads`,
  history: (exam: ExamId) => `ashyq:v${SCHEMA_VERSION}:history:${exam}`,
} as const;

/**
 * WhatsApp-номер Ashyq в международном формате, без «+», пробелов и скобок.
 * Пример: 77011234567 (Казахстан).
 *
 * Значение по умолчанию — плейсхолдер: приложение работает, но CTA ведёт
 * на номер-заглушку. Перед запуском рассылки заменить здесь или через
 * NEXT_PUBLIC_ASHYQ_WHATSAPP.
 */
export const WHATSAPP_NUMBER =
  process.env.NEXT_PUBLIC_ASHYQ_WHATSAPP ?? '77067080181';

export const IS_WHATSAPP_CONFIGURED = WHATSAPP_NUMBER !== '77000000000';

export interface ExamConfig {
  id: ExamId;
  /** Крупная подпись на кнопке выбора */
  name: string;
  fullName: string;
  sections: SectionId[];
  sectionLabels: Record<SectionId, string>;
  targetQuestion: string;
  targets: Array<{ value: string; label: string; numeric?: number }>;
  whenQuestion: string;
  whenOptions: Array<{ value: string; label: string }>;
  blueprint: TestBlueprint;
  /** Подсказка про длительность на landing */
  durationHint: string;
  /** Что честнее сказать про охват навыков */
  scopeNote: string;
}

export const WHEN_OPTIONS = [
  { value: 'lt1m', label: 'меньше чем через месяц' },
  { value: '1-3m', label: '1–3 месяца' },
  { value: '3-6m', label: '3–6 месяца' },
  { value: 'later', label: 'позже' },
  { value: 'unknown', label: 'пока не решил' },
];

export const EXAMS: Record<ExamId, ExamConfig> = {
  sat: {
    id: 'sat',
    name: 'SAT',
    fullName: 'SAT Quick Diagnostic',
    sections: ['rw', 'math'],
    sectionLabels: {
      rw: 'Reading & Writing',
      math: 'Math',
      reading: 'Reading',
      listening: 'Listening',
    },
    targetQuestion: 'Какой результат тебе нужен?',
    targets: [
      { value: '1100', label: '1100+', numeric: 1100 },
      { value: '1200', label: '1200+', numeric: 1200 },
      { value: '1300', label: '1300+', numeric: 1300 },
      { value: '1400', label: '1400+', numeric: 1400 },
      { value: '1500', label: '1500+', numeric: 1500 },
      { value: 'unknown', label: 'пока не знаю' },
    ],
    whenQuestion: 'Когда планируешь сдавать?',
    whenOptions: WHEN_OPTIONS,
    blueprint: {
      exam: 'sat',
      title: 'SAT Quick Diagnostic',
      targetDurationSec: 15 * 60,
      perSection: { rw: 8, math: 8 },
      difficultyMix: { easy: 4, medium: 8, hard: 4 },
    },
    durationHint: '15 минут · 16 вопросов',
    scopeNote:
      'Диагностика проверяет Reading & Writing и Math. Essay в Digital SAT нет, поэтому оцениваются только эти две секции.',
  },
  ielts: {
    id: 'ielts',
    name: 'IELTS',
    fullName: 'IELTS Quick Diagnostic',
    sections: ['reading', 'listening'],
    sectionLabels: {
      reading: 'Reading',
      listening: 'Listening',
      rw: 'Reading & Writing',
      math: 'Math',
    },
    targetQuestion: 'Какой Band тебе нужен?',
    targets: [
      { value: '6.0', label: '6.0', numeric: 6.0 },
      { value: '6.5', label: '6.5', numeric: 6.5 },
      { value: '7.0', label: '7.0', numeric: 7.0 },
      { value: '7.5', label: '7.5+', numeric: 7.5 },
      { value: 'unknown', label: 'пока не знаю' },
    ],
    whenQuestion: 'Когда планируешь сдавать?',
    whenOptions: WHEN_OPTIONS,
    blueprint: {
      exam: 'ielts',
      title: 'IELTS Quick Diagnostic',
      targetDurationSec: 14 * 60,
      perSection: { reading: 8, listening: 4 },
      difficultyMix: { easy: 3, medium: 6, hard: 3 },
    },
    durationHint: '12–15 минут · 12 вопросов',
    scopeNote:
      'Quick Diagnostic оценивает часть навыков: Reading и Listening. Writing и Speaking лучше проверить отдельно с тренером.',
  },
};

export const STAGE_ORDER: RunStage[] = [
  'landing',
  'onboarding',
  'quiz',
  'result',
  'review',
];

/** Диагностический номер для карточки результата */
export const DIAGNOSTIC_NUMBER = '001';

export const BRAND = {
  name: 'ASHYQ',
  line1: 'Знания открывают возможности.',
  line2: 'Мечты толкают вперёд.',
  line3: 'Ashyq соединяет мечты с возможностями.',
};
