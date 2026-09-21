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
  const previous = input.previousAccuracy ?? 0;
  const errorRate = sampleSize > 0 ? input.errors / sampleSize : 1;

  if (sampleSize >= 8 && input.attempts >= 2 && accuracy >= 85 && !input.repeatedCause) {
    return { status: 'consolidating', sampleSize };
  }
  if (sampleSize >= 5 && accuracy > previous && accuracy >= 60 && !input.repeatedCause) {
    return { status: 'improving', sampleSize };
  }
  if (sampleSize >= 5 && (accuracy < 70 || errorRate >= 0.3 || input.repeatedCause)) {
    return { status: 'attention', sampleSize };
  }
  return { status: 'insufficient', sampleSize };
}
