/**
 * Типы теста «Компас».
 *
 * Отдельный модуль, чтобы `src/data/career/*` и `src/lib/career.ts` могли
 * ссылаться на одни и те же типы без циклического импорта (данные →
 * движок → данные).
 */

/** Четыре шкалы. Первая буква пары считается положительным направлением оси. */
export type CareerAxis = 'EI' | 'SN' | 'TF' | 'JP';

export type CareerPole = 'E' | 'I' | 'S' | 'N' | 'T' | 'F' | 'J' | 'P';

/** Четырёхбуквенный код профиля, например `INTJ`. */
export type CareerCode = string;

export type CareerSphereId = 'tech' | 'science' | 'business' | 'creative' | 'people' | 'public';

export interface CareerAxisScore {
  axis: CareerAxis;
  /** Победившая буква шкалы. */
  pole: CareerPole;
  /** Проигравшая буква — нужна, чтобы показать обе стороны шкалы. */
  otherPole: CareerPole;
  /**
   * Насколько выражен перевес, 50–100 %. 50 — шкала ровно посередине,
   * 100 — все ответы в одну сторону.
   */
  strength: number;
  /** Перевес меньше порога: честно говорим, что шкала почти в равновесии. */
  balanced: boolean;
}

export interface CareerResult {
  code: CareerCode;
  axes: CareerAxisScore[];
  /**
   * Соседний профиль по самой шаткой шкале. Показываем только когда эта
   * шкала действительно близка к середине — иначе «а вдруг вы вот этот»
   * превращается в гадание.
   */
  neighbourCode: CareerCode | null;
  /** Сколько утверждений получили осознанный ответ (не «как когда»). */
  decisiveAnswers: number;
}
