import { EXAMS } from './config';
import { DIFFICULTY_WEIGHT } from './scoring';
import type { Difficulty, ExamId, Question } from './types';

/**
 * Сборка теста из банка.
 *
 * Алгоритм: для каждой секции берём нужное количество вопросов и
 * стараемся выдержать mix по сложности (2 easy / 4 medium / 2 hard на секцию).
 * Внутри одной секции вопросы идут блоками по groupKey (passage / recording),
 * чтобы материал не повторялся на каждом вопросе.
 */

export interface BuildOptions {
  exam: ExamId;
  seed?: number;
  bank: Question[];
  /** true — перемешивать порядок вариантов ответа (для single-choice) */
  shuffleOptions?: boolean;
}

export interface BuiltTest {
  exam: ExamId;
  questions: Question[];
  /** questionId -> перемешанный порядок option id */
  optionOrder: Record<string, string[]>;
}

/** Детерминированный PRNG (mulberry32), чтобы результат можно было воспроизвести по seed */
export function makeRng(seed: number): () => number {
  let a = seed >>> 0;
  return function rng() {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function randomSeed(): number {
  return Math.floor(Math.random() * 2 ** 31);
}

function shuffle<T>(arr: T[], rng: () => number): T[] {
  const copy = arr.slice();
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

const DIFFICULTY_ORDER: Difficulty[] = ['easy', 'medium', 'hard'];

/** Сколько вопросов каждой сложности нужно на секцию (по blueprint) */
function mixForSection(exam: ExamId, sectionCount: number): Record<Difficulty, number> {
  const mix = EXAMS[exam].blueprint.difficultyMix;
  const total = mix.easy + mix.medium + mix.hard;
  // Пропорционально масштабируем mix под размер секции
  const scale = sectionCount / total;
  const easy = Math.round(mix.easy * scale);
  const hard = Math.round(mix.hard * scale);
  const medium = Math.max(0, sectionCount - easy - hard);
  return { easy, medium, hard };
}

export function buildTest({ exam, seed, bank, shuffleOptions = false }: BuildOptions): BuiltTest {
  const rng = makeRng(seed ?? randomSeed());
  const cfg = EXAMS[exam];
  const examBank = bank.filter((q) => q.exam === exam);
  const picked: Question[] = [];
  const usedIds = new Set<string>();

  cfg.sections.forEach((section) => {
    const need = cfg.blueprint.perSection[section] ?? 0;
    const pool = examBank.filter((q) => q.section === section && !usedIds.has(q.id));
    const mix = mixForSection(exam, need);
    const sectionPicked: Question[] = [];

    DIFFICULTY_ORDER.forEach((difficulty) => {
      const candidates = pool.filter(
        (q) => q.difficulty === difficulty && !usedIds.has(q.id) && !sectionPicked.includes(q),
      );
      shuffle(candidates, rng)
        .slice(0, mix[difficulty])
        .forEach((q) => {
          if (sectionPicked.length < need) {
            sectionPicked.push(q);
            usedIds.add(q.id);
          }
        });
    });

    // Добиваем, если в банке не хватило нужной сложности
    if (sectionPicked.length < need) {
      shuffle(
        pool.filter((q) => !usedIds.has(q.id)),
        rng,
      )
        .slice(0, need - sectionPicked.length)
        .forEach((q) => {
          sectionPicked.push(q);
          usedIds.add(q.id);
        });
    }

    // Группируем по материалу: сначала вопросы одного passage/audio идут подряд
    sectionPicked.sort((a, b) => {
      const ga = a.groupKey ?? a.id;
      const gb = b.groupKey ?? b.id;
      if (ga !== gb) return ga < gb ? -1 : 1;
      // внутри группы — по возрастанию номера вопроса в банке (логичный порядок)
      return a.id < b.id ? -1 : a.id > b.id ? 1 : 0;
    });

    picked.push(...sectionPicked);
  });

  const optionOrder: Record<string, string[]> = {};
  picked.forEach((q) => {
    if (q.options) {
      optionOrder[q.id] = shuffleOptions
        ? shuffle(
            q.options.map((o) => o.id),
            rng,
          )
        : q.options.map((o) => o.id);
    }
  });

  return { exam, questions: picked, optionOrder };
}

export function weightOf(q: Question): number {
  return q.weight || DIFFICULTY_WEIGHT[q.difficulty];
}
