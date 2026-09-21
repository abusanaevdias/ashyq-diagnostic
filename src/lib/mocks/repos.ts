import { lmsProvider } from '../lms/repos';
import { localMockRepo } from './local-repo';
import type {
  MockActionItem,
  MockAnswerDraft,
  MockAssignment,
  MockAttempt,
  MockErrorReviewInput,
  MockPublishedResult,
  MockTemplateIdentity,
  MockTemplateVersion,
  SaveAnswersResult,
} from './types';

export interface CreateMockAssignmentInput {
  assignmentId: string;
  templateVersionId: string;
  availableAt: string;
  attemptLimit: number;
}

export interface SetAccommodationInput {
  assignmentId: string;
  studentId: string;
  extraMinutes: number;
}

export interface OverrideAnswerInput {
  attemptId: string;
  questionId: string;
  correct: boolean;
}

export interface PublishReviewInput {
  attemptId: string;
  reviewId: string;
  summaryText: string;
}

/** The mock workflow is intentionally separate from the generic LMS Repos contract. */
export interface MockRepo {
  listTemplates(): Promise<MockTemplateIdentity[]>;
  listTemplateVersions(templateId: string): Promise<MockTemplateVersion[]>;
  listAssignmentsByClass(classId: string): Promise<MockAssignment[]>;
  getAssignment(assignmentId: string): Promise<MockAssignment | null>;
  createAssignment(input: CreateMockAssignmentInput): Promise<MockAssignment>;
  publishAssignment(assignmentId: string): Promise<MockAssignment>;
  setAccommodation(input: SetAccommodationInput): Promise<void>;
  listAttemptsByAssignment(assignmentId: string): Promise<MockAttempt[]>;
  listAttemptsByStudent(studentId: string): Promise<MockAttempt[]>;
  getAttempt(attemptId: string): Promise<MockAttempt | null>;
  startAttempt(assignmentId: string): Promise<MockAttempt>;
  saveAnswers(attemptId: string, expectedRevision: number, answers: MockAnswerDraft[]): Promise<SaveAnswersResult>;
  submitAttempt(attemptId: string, expectedRevision: number, automatic?: boolean): Promise<MockAttempt>;
  beginReview(attemptId: string): Promise<{ reviewId: string; version: number }>;
  saveErrorReviews(reviewId: string, reviews: MockErrorReviewInput[]): Promise<void>;
  overrideAnswer(input: OverrideAnswerInput): Promise<MockAttempt>;
  publishReview(input: PublishReviewInput): Promise<MockPublishedResult>;
  reopenAttempt(attemptId: string, extraMinutes?: number): Promise<MockAttempt>;
  getPublishedResult(attemptId: string): Promise<MockPublishedResult | null>;
  completeAction(actionId: string): Promise<MockActionItem>;
}

const supabaseModulePath = './supabase-repo';

function lazySupabaseMockRepo(): MockRepo {
  const load = () => import(supabaseModulePath).then((module) => module.supabaseMockRepo as MockRepo);
  return new Proxy({} as MockRepo, {
    get: (_target, method: string | symbol) =>
      method === 'then' || typeof method === 'symbol'
        ? undefined
        : async (...args: unknown[]) => {
            const repo = await load();
            return (repo[method as keyof MockRepo] as (...values: unknown[]) => Promise<unknown>)(...args);
          },
  });
}

let supabaseInstance: MockRepo | null = null;

/** Load Supabase only when the LMS provider explicitly selects it. */
export function getMockRepo(): MockRepo {
  if (lmsProvider() === 'supabase') return (supabaseInstance ??= lazySupabaseMockRepo());
  return localMockRepo;
}
