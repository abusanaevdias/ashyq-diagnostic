import type { Difficulty, ExamId, ReadinessLevel, ScoreBand } from './types';

/**
 * SCORING MODEL
 * -------------
 * Мы сознательно НЕ имитируем официальный adaptive-скоринг College Board
 * и не выдаём «IELTS Band» как факт. 16 вопросов для этого мало.
 *
 * Вместо этого — Weighted Diagnostic Score:
 *   readiness(section) = Σ weight(correct) / Σ weight(all questions in section)
 *
 * Дальше readiness маппится в ОЧЕНЬ ШИРОКИЙ предварительный диапазон
 * и в уровень готовности (FOUNDATION / DEVELOPING / STRONG / ADVANCED).
 *
 * Все пороги — здесь. Меняем цифры, не трогая UI.
 */

export const DIFFICULTY_WEIGHT: Record<Difficulty, number> = {
  easy: 1.0,
  medium: 1.5,
  hard: 2.0,
};

export interface BandRule {
  /** нижняя граница readiness (включительно), 0..1 */
  min: number;
  level: ReadinessLevel;
  levelTitleRu: string;
  /** SAT: числовой диапазон */
  sat?: { low: number; high: number; label: string };
  /** IELTS: диапазон band */
  ielts?: { low: number; high: number; label: string };
}

/**
 * Пороги SAT. Настроены так, чтобы случайное угадывание (25%)
 * попадало в нижнюю часть FOUNDATION, а не в «средний».
 */
export const SAT_BANDS: BandRule[] = [
  { min: 0.85, level: 'ADVANCED', levelTitleRu: 'Очень сильный', sat: { low: 1500, high: 1600, label: '1500+' } },
  { min: 0.7, level: 'STRONG', levelTitleRu: 'Сильный', sat: { low: 1400, high: 1490, label: '1400–1490' } },
  { min: 0.55, level: 'STRONG', levelTitleRu: 'Выше среднего', sat: { low: 1290, high: 1390, label: '1290–1390' } },
  { min: 0.4, level: 'DEVELOPING', levelTitleRu: 'Средний', sat: { low: 1160, high: 1280, label: '1160–1280' } },
  { min: 0.25, level: 'DEVELOPING', levelTitleRu: 'Ниже среднего', sat: { low: 1000, high: 1150, label: '1000–1150' } },
  { min: 0, level: 'FOUNDATION', levelTitleRu: 'База', sat: { low: 800, high: 990, label: 'до 1000' } },
];

/** Пороги IELTS (только Reading + Listening). */
export const IELTS_BANDS: BandRule[] = [
  { min: 0.85, level: 'ADVANCED', levelTitleRu: 'Очень сильный', ielts: { low: 7.5, high: 9, label: '7.5–9.0' } },
  { min: 0.7, level: 'STRONG', levelTitleRu: 'Сильный', ielts: { low: 7.0, high: 7.5, label: '7.0–7.5' } },
  { min: 0.55, level: 'STRONG', levelTitleRu: 'Уверенный', ielts: { low: 6.5, high: 7.0, label: '6.5–7.0' } },
  { min: 0.4, level: 'DEVELOPING', levelTitleRu: 'Развивающийся', ielts: { low: 6.0, high: 6.5, label: '6.0–6.5' } },
  { min: 0.25, level: 'DEVELOPING', levelTitleRu: 'Ниже среднего', ielts: { low: 5.5, high: 6.0, label: '5.5–6.0' } },
  { min: 0, level: 'FOUNDATION', levelTitleRu: 'База', ielts: { low: 4.0, high: 5.5, label: '4.0–5.5' } },
];

export function bandsFor(exam: ExamId): BandRule[] {
  return exam === 'sat' ? SAT_BANDS : IELTS_BANDS;
}

export function bandForReadiness(exam: ExamId, readiness: number): BandRule {
  const bands = bandsFor(exam);
  const clamped = Math.max(0, Math.min(1, readiness));
  return bands.find((b) => clamped >= b.min) ?? bands[bands.length - 1];
}

export function scoreBand(exam: ExamId, readiness: number): ScoreBand {
  const rule = bandForReadiness(exam, readiness);
  const spec = exam === 'sat' ? rule.sat : rule.ielts;
  if (!spec) {
    // Теоретически недостижимо, но на случай правки конфигов — честный fallback
    return {
      rangeLabel: rule.level,
      level: rule.level,
      levelTitleRu: rule.levelTitleRu,
      low: 0,
      high: 0,
    };
  }
  return {
    rangeLabel: spec.label,
    level: rule.level,
    levelTitleRu: rule.levelTitleRu,
    low: spec.low,
    high: spec.high,
  };
}

export function levelFromReadiness(readiness: number): ReadinessLevel {
  if (readiness >= 0.7) return 'ADVANCED';
  if (readiness >= 0.55) return 'STRONG';
  if (readiness >= 0.35) return 'DEVELOPING';
  return 'FOUNDATION';
}

/** Человекочитаемые подписи уровней (рус.) */
export const LEVEL_TITLE_RU: Record<ReadinessLevel, string> = {
  FOUNDATION: 'База',
  DEVELOPING: 'В процессе',
  STRONG: 'Уверенно',
  ADVANCED: 'Сильно',
};

/**
 * GAP до цели.
 * SAT — в пунктах (берём середину своего диапазона и число цели).
 * IELTS — в band (шаг 0.5).
 */
export interface GapInfo {
  /** короткая строка для карточки и статистики: «≈ +50–110» или «0» */
  label: string;
  /** цель уже внутри текущего диапазона */
  reached: boolean;
}

export function gapToTarget(
  exam: ExamId,
  band: ScoreBand,
  target: string | null,
): GapInfo | null {
  if (!target || target === 'unknown') return null;

  if (exam === 'sat') {
    const targetScore = Number.parseInt(target, 10);
    if (Number.isNaN(targetScore)) return null;
    const lowGap = targetScore - band.high;
    const highGap = targetScore - band.low;
    if (highGap <= 0) return { label: '0', reached: true };
    const lo = Math.max(0, Math.round(lowGap / 10) * 10);
    const hi = Math.round(highGap / 10) * 10;
    if (lo === hi) return { label: `≈ +${hi}`, reached: false };
    return { label: `≈ +${lo}–${hi}`, reached: false };
  }

  const targetBand = Number.parseFloat(target);
  if (Number.isNaN(targetBand)) return null;
  const lowGap = targetBand - band.high;
  const highGap = targetBand - band.low;
  if (highGap <= 0) return { label: '0', reached: true };
  const lo = Math.max(0, roundHalf(lowGap));
  const hi = roundHalf(highGap);
  if (lo === hi) return { label: `≈ +${formatBand(lo)}`, reached: false };
  return { label: `≈ +${formatBand(lo)}–${formatBand(hi)}`, reached: false };
}

function roundHalf(v: number): number {
  return Math.round(v * 2) / 2;
}

function formatBand(v: number): string {
  return v % 1 === 0 ? v.toFixed(1) : v.toFixed(1);
}
