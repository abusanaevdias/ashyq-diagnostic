import { QUESTION_BANK } from './questions';
import type { ExamId, Question } from '@/lib/types';

export { QUESTION_BANK, BANK_STATS } from './questions';
export { MATERIALS, getMaterial } from './materials';

const BY_ID = new Map(QUESTION_BANK.map((q) => [q.id, q]));

export function getQuestion(id: string): Question | undefined {
  return BY_ID.get(id);
}

export function getQuestions(ids: string[]): Question[] {
  return ids.map((id) => BY_ID.get(id)).filter((q): q is Question => Boolean(q));
}

export function questionsForExam(exam: ExamId): Question[] {
  return QUESTION_BANK.filter((q) => q.exam === exam);
}
