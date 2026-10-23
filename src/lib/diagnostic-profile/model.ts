import { QUESTION_BANK } from '@/data/questions';
import { EXAMS } from '@/lib/config';
import { computeResult, isCorrect } from '@/lib/engine';
import type { ExamId, RunState, SectionId } from '@/lib/types';
import { trainerById, type TrainerId } from '@/lib/trainers/catalog';

export type DiagnosticInput = Pick<RunState, 'runId' | 'exam' | 'questionIds' | 'answers' | 'target' | 'elapsedMs' | 'finishedAt'>;
export type DiagnosticSnapshot = {
  version: 1; source: 'self-assessment'; runId: string; exam: ExamId; finishedAt: number;
  elapsedMs: number; target: string | null; band: string; correct: number; total: number;
  questions: { id: string; section: SectionId; skill: string; tags: string[]; prompt: string; answer: string | null; answerLabel: string; expectedLabel: string; correct: boolean; answered: boolean }[];
};
const object = (v: unknown): v is Record<string, unknown> => !!v && typeof v === 'object' && !Array.isArray(v);
const questionCount = (exam: ExamId) => Object.values(EXAMS[exam].blueprint.perSection).reduce((sum, count) => sum + count, 0);
const fail = (): never => { throw new Error('Эту попытку нельзя сохранить: данные неполные или устарели. Исходные ответы остаются в браузере.'); };

/** Whitelist, validate and grade against this release's canonical bank. Never serialize RunState/lead/UTM. */
export function diagnosticInput(value: unknown): DiagnosticInput {
  if (!object(value) || !['sat', 'ielts'].includes(String(value.exam))) return fail();
  const exam = value.exam as ExamId;
  if (typeof value.runId !== 'string' || !/^[a-z0-9-]{12,90}$/i.test(value.runId)) return fail();
  if (!Array.isArray(value.questionIds) || value.questionIds.length !== questionCount(exam) || new Set(value.questionIds).size !== value.questionIds.length || !object(value.answers)) return fail();
  const questions = value.questionIds.map(id => QUESTION_BANK.find(q => q.id === id && q.exam === exam));
  if (questions.some(q => !q)) return fail();
  for (const section of EXAMS[exam].sections) if (questions.filter(q => q!.section === section).length !== EXAMS[exam].blueprint.perSection[section]) return fail();
  if (value.target !== null && !EXAMS[exam].targets.some(t => t.value === value.target)) return fail();
  if (typeof value.finishedAt !== 'number' || !Number.isSafeInteger(value.finishedAt) || value.finishedAt < 1704067200000 || value.finishedAt > Date.now() + 60000) return fail();
  if (typeof value.elapsedMs !== 'number' || !Number.isFinite(value.elapsedMs) || value.elapsedMs < 0 || value.elapsedMs > 604800000) return fail();
  const answers: Record<string, string | null> = {};
  for (const question of questions) {
    const q = question!;
    const answer = Object.hasOwn(value.answers, q.id) ? value.answers[q.id] : null;
    if (answer !== null && (typeof answer !== 'string' || answer.length > 300)) return fail();
    if (answer && q.kind === 'single-choice' && !q.options?.some(option => option.id === answer)) return fail();
    answers[q.id] = typeof answer === 'string' && answer.trim() ? answer : null;
  }
  return { runId: value.runId, exam, questionIds: questions.map(q => q!.id), answers, target: value.target as string | null, finishedAt: value.finishedAt, elapsedMs: value.elapsedMs };
}

export function freezeDiagnostic(value: unknown): DiagnosticSnapshot {
  const input = diagnosticInput(value);
  const questions = input.questionIds.map(id => QUESTION_BANK.find(q => q.id === id)!);
  const result = computeResult(input.exam, questions, input);
  return { version: 1, source: 'self-assessment', runId: input.runId, exam: input.exam, finishedAt: input.finishedAt!, elapsedMs: input.elapsedMs, target: input.target,
    band: result.band.rangeLabel, correct: result.totalCorrect, total: questions.length,
    questions: questions.map(q => ({ id: q.id, section: q.section, skill: q.skill, tags: [...q.tags ?? []], prompt: q.prompt, answer: input.answers[q.id], answerLabel: q.options?.find(o => o.id === input.answers[q.id])?.label ?? input.answers[q.id] ?? 'Нет ответа', expectedLabel: q.options?.find(o => o.id === q.correctAnswer)?.label ?? q.correctAnswer, correct: isCorrect(q, input.answers[q.id]), answered: !!input.answers[q.id] })) };
}

/** Stored snapshots are frozen; never regrade old answers against a changed bank. */
export function isDiagnosticSnapshot(v: unknown): v is DiagnosticSnapshot {
  return object(v) && v.version === 1 && v.source === 'self-assessment' && typeof v.runId === 'string' && ['sat', 'ielts'].includes(String(v.exam)) && typeof v.finishedAt === 'number'
    && Number.isSafeInteger(v.finishedAt) && v.finishedAt >= 1704067200000 && v.finishedAt <= 4102444800000 && typeof v.band === 'string' && typeof v.correct === 'number' && Number.isInteger(v.correct) && v.correct >= 0
    // Version 1 is frozen to its original blueprint, even if future selection changes.
    && typeof v.total === 'number' && v.total === (v.exam === 'ielts' ? 12 : 16) && v.correct <= v.total && Array.isArray(v.questions) && v.questions.length === v.total
    && v.questions.every(q => object(q) && typeof q.id === 'string' && typeof q.skill === 'string' && typeof q.prompt === 'string' && typeof q.answerLabel === 'string' && typeof q.expectedLabel === 'string' && ['reading', 'listening', 'rw', 'math'].includes(String(q.section)) && Array.isArray(q.tags) && q.tags.every(t => typeof t === 'string') && typeof q.correct === 'boolean' && typeof q.answered === 'boolean' && (q.answer === null || typeof q.answer === 'string'));
}

type Rule = { id: string; exam: ExamId; section: SectionId; tags: string[]; label: string; trainer: TrainerId; why: string };
const rules: Rule[] = [
  { id: 'tfng', exam: 'ielts', section: 'reading', tags: ['tfng'], label: 'TRUE / FALSE / NOT GIVEN', trainer: 'reading-evidence', why: 'Отдели противоречие от отсутствия информации и найди опору в тексте.' },
  { id: 'audio-correction', exam: 'ielts', section: 'listening', tags: ['distractors'], label: 'Исправления говорящего', trainer: 'listening-replay', why: 'Потренируй окончательный ответ после исправления. Это упражнение на отвлекающие ответы, а не на весь Listening.' },
  { id: 'sat-model', exam: 'sat', section: 'math', tags: ['contextual'], label: 'Модель текстового условия', trainer: 'sat-translation', why: 'Сначала определи переменную и связь величин. Упражнение тренирует чтение условия; оно не доказывает причину твоей ошибки.' },
  { id: 'sat-inference', exam: 'sat', section: 'rw', tags: ['inference', 'detail', 'central-idea'], label: 'Смысл и опора в тексте', trainer: 'sat-distractor', why: 'Проверь границы утверждения и объясни, почему другие варианты не подходят.' },
  { id: 'sat-transition', exam: 'sat', section: 'rw', tags: ['transitions'], label: 'Связь между предложениями', trainer: 'sat-optionless', why: 'Сформулируй связь до просмотра вариантов. Выбери пример на переходы в тренажёре.' },
];

export function diagnosticRecommendations(snapshot: DiagnosticSnapshot) {
  return rules.filter(rule => rule.exam === snapshot.exam).flatMap(rule => {
    const questions = snapshot.questions.filter(q => q.section === rule.section && q.tags.some(tag => rule.tags.includes(tag)));
    const wrong = questions.filter(q => q.answered && !q.correct);
    const skipped = questions.filter(q => !q.answered);
    if (!wrong.length && !skipped.length) return [];
    return [{ ...rule, item: trainerById(rule.trainer), total: questions.length, wrong: wrong.length, skipped: skipped.length, evidence: [...wrong, ...skipped].map(q => q.id), limited: questions.length < 3 }];
  }).sort((a, b) => b.wrong - a.wrong || b.skipped - a.skipped || a.id.localeCompare(b.id)).slice(0, 3);
}
