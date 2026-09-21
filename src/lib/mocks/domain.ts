import type { MockAttemptStatus, MockSkillStatus } from './types';

export function normalizeMockAnswer(value: string): string {
  return value
    .trim()
    .replace(/[‘’]/g, "'")
    .replace(/\s+/g, ' ')
    .toLocaleLowerCase('en');
}

export function evaluateMockAnswer(value: string, accepted: string[], wordLimit: number | null) {
  const normalized = normalizeMockAnswer(value);
  const wordCount = normalized ? normalized.split(' ').length : 0;
  const wordLimitExceeded = wordLimit !== null && wordCount > wordLimit;
  return {
    normalized,
    wordCount,
    wordLimitExceeded,
    correct: !wordLimitExceeded && accepted.some((item) => normalizeMockAnswer(item) === normalized),
  };
}

const TRANSITIONS: Record<MockAttemptStatus, readonly MockAttemptStatus[]> = {
  in_progress: ['submitted'],
  submitted: ['in_review', 'reopened'],
  in_review: ['published', 'reopened'],
  reopened: ['submitted'],
  published: [],
};

export function transitionAllowed(from: MockAttemptStatus, to: MockAttemptStatus): boolean {
  return TRANSITIONS[from].includes(to);
}

export interface SkillStatusInput {
  questions: number;
  errors: number;
  attempts: number;
  currentAccuracy: number;
  previousAccuracy: number | null;
  repeatedCause: boolean;
}

export interface SkillStatusResult {
  status: MockSkillStatus;
  sampleSize: number;
}

/**
 * The progress card is deliberately conservative: a skill cannot become
 * "consolidating" from one short answer sheet or while a cause repeats.
 * The checks are ordered so the strongest evidence always wins.
 */
export function calculateSkillStatus(input: SkillStatusInput): SkillStatusResult {
  const sampleSize = Math.max(0, input.questions);
  const accuracy = Number.isFinite(input.currentAccuracy) ? input.currentAccuracy : 0;

  if (sampleSize >= 8 && input.attempts >= 2 && accuracy >= 80 && !input.repeatedCause) {
    return { status: 'consolidating', sampleSize };
  }
  if (input.attempts >= 2 && input.previousAccuracy !== null && accuracy >= input.previousAccuracy + 10 && accuracy < 80) {
    return { status: 'improving', sampleSize };
  }
  if (input.errors >= 2 || (sampleSize >= 5 && accuracy < 70)) {
    return { status: 'attention', sampleSize };
  }
  return { status: 'insufficient', sampleSize };
}
