import { SAT_RW_QUESTIONS } from './sat-rw';
import { SAT_MATH_QUESTIONS } from './sat-math';
import { IELTS_READING_QUESTIONS } from './ielts-reading';
import { IELTS_LISTENING_QUESTIONS } from './ielts-listening';
import type { Question } from '@/lib/types';

/**
 * Единый банк вопросов.
 *
 * Чтобы добавить вопрос — допишите объект в нужный файл и (если нужен
 * passage/table/audio) материал в src/data/materials. UI и скоринг
 * подхватят его автоматически.
 */

export const QUESTION_BANK: Question[] = [
  ...SAT_RW_QUESTIONS,
  ...SAT_MATH_QUESTIONS,
  ...IELTS_READING_QUESTIONS,
  ...IELTS_LISTENING_QUESTIONS,
];

export const BANK_STATS = {
  total: QUESTION_BANK.length,
  sat: QUESTION_BANK.filter((q) => q.exam === 'sat').length,
  satRw: SAT_RW_QUESTIONS.length,
  satMath: SAT_MATH_QUESTIONS.length,
  ielts: QUESTION_BANK.filter((q) => q.exam === 'ielts').length,
  ieltsReading: IELTS_READING_QUESTIONS.length,
  ieltsListening: IELTS_LISTENING_QUESTIONS.length,
};
