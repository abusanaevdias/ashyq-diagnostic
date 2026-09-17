import { CAREER_STATEMENTS, type CareerStatement } from '@/data/career/questions';
import { CAREER_PROFILES, type CareerProfile } from '@/data/career/profiles';
import { CAREER_PROFESSIONS, CAREER_SPHERES, type CareerProfession, type CareerSphere } from '@/data/career/professions';
import type { CareerAxis, CareerAxisScore, CareerCode, CareerPole, CareerResult } from './career-types';

/**
 * Движок теста «Компас»: чистые функции без DOM и storage, чтобы их можно
 * было прогнать в `scripts/career-unit-check.ts`.
 */

export const CAREER_AXES: CareerAxis[] = ['EI', 'SN', 'TF', 'JP'];

/** Человеческие подписи шкал — используются и в UI, и в юнит-проверке. */
export const CAREER_AXIS_LABELS: Record<CareerAxis, { title: string; positive: string; negative: string }> = {
  EI: { title: 'Энергия', positive: 'Среди людей', negative: 'В тишине' },
  SN: { title: 'Информация', positive: 'Факты', negative: 'Идеи' },
  TF: { title: 'Решения', positive: 'Логика', negative: 'Люди' },
  JP: { title: 'Темп', positive: 'План', negative: 'Гибкость' },
};

/** Ответы: −2…+2, где 0 — честное «как когда». */
export type CareerAnswers = Record<number, number>;

/**
 * Ниже этого порога перевес по шкале считается несущественным: две буквы
 * набрали почти поровну, и обещать человеку твёрдую «I» было бы враньём.
 */
export const BALANCED_STRENGTH = 60;

/** Минимум осознанных ответов, ниже которого результат честно называется размытым. */
export const MIN_DECISIVE_ANSWERS = 12;

const MAX_ANSWER = 2;

function axisStatements(axis: CareerAxis): CareerStatement[] {
  return CAREER_STATEMENTS.filter((statement) => statement.axis === axis);
}

function clampAnswer(value: number | undefined): number {
  if (typeof value !== 'number' || Number.isNaN(value)) return 0;
  return Math.max(-MAX_ANSWER, Math.min(MAX_ANSWER, Math.round(value)));
}

function scoreAxis(axis: CareerAxis, answers: CareerAnswers): CareerAxisScore {
  const statements = axisStatements(axis);
  const positive = axis[0] as CareerPole;
  const negative = axis[1] as CareerPole;

  // Согласие тянет к букве утверждения, несогласие — к противоположной.
  const sum = statements.reduce((total, statement) => {
    const answer = clampAnswer(answers[statement.id]);
    return total + (statement.pole === positive ? answer : -answer);
  }, 0);

  const max = statements.length * MAX_ANSWER;
  const strength = Math.round(50 + (50 * Math.abs(sum)) / max);
  // Ровный ноль — не повод для монетки: берём первую букву шкалы и честно
  // помечаем результат как сбалансированный.
  const leading = sum >= 0 ? positive : negative;

  return {
    axis,
    pole: leading,
    otherPole: leading === positive ? negative : positive,
    strength,
    balanced: strength <= BALANCED_STRENGTH,
  };
}

export function scoreCareer(answers: CareerAnswers): CareerResult {
  const axes = CAREER_AXES.map((axis) => scoreAxis(axis, answers));
  const code = axes.map((axis) => axis.pole).join('');

  // Соседний профиль показываем только по самой шаткой шкале и только
  // если она действительно близка к середине.
  const weakest = axes.reduce((min, axis) => (axis.strength < min.strength ? axis : min), axes[0]);
  const neighbourCode = weakest.balanced
    ? axes.map((axis) => (axis.axis === weakest.axis ? axis.otherPole : axis.pole)).join('')
    : null;

  const decisiveAnswers = CAREER_STATEMENTS.reduce(
    (count, statement) => count + (clampAnswer(answers[statement.id]) === 0 ? 0 : 1),
    0,
  );

  return { code, axes, neighbourCode: neighbourCode === code ? null : neighbourCode, decisiveAnswers };
}

export function isCareerCode(value: unknown): value is CareerCode {
  return typeof value === 'string' && Object.prototype.hasOwnProperty.call(CAREER_PROFILES, value);
}

export function getCareerProfile(code: CareerCode): CareerProfile | null {
  return isCareerCode(code) ? CAREER_PROFILES[code] : null;
}

/**
 * Профессии профиля, отсортированные по точности попадания: чем ближе код
 * к началу списка `codes`, тем выше профессия. При равенстве — по `id`,
 * чтобы выдача была одинаковой при каждом прогоне.
 */
export function rankProfessions(code: CareerCode): CareerProfession[] {
  return CAREER_PROFESSIONS.filter((profession) => profession.codes.includes(code)).sort((a, b) => {
    const diff = a.codes.indexOf(code) - b.codes.indexOf(code);
    return diff !== 0 ? diff : a.id - b.id;
  });
}

export interface CareerMatches {
  /** Топ-3: самые точные попадания. */
  top: CareerProfession[];
  /** Остальное, сгруппированное по сферам в порядке `CAREER_SPHERES`. */
  bySphere: Array<{ sphere: CareerSphere; items: CareerProfession[] }>;
  total: number;
}

export function matchProfessions(code: CareerCode): CareerMatches {
  const ranked = rankProfessions(code);
  const top = ranked.slice(0, 3);
  const rest = ranked.slice(3);

  const bySphere = CAREER_SPHERES.map((sphere) => ({
    sphere,
    items: rest.filter((profession) => profession.sphere === sphere.id),
  })).filter((group) => group.items.length > 0);

  return { top, bySphere, total: ranked.length };
}

/** Сколько утверждений в тесте — чтобы цифра в UI не разъезжалась с банком. */
export const CAREER_STATEMENT_COUNT = CAREER_STATEMENTS.length;
