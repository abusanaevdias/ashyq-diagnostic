export type MockModule = 'reading' | 'listening';
export type MockAssignmentStatus = 'draft' | 'scheduled' | 'active' | 'closed';
export type MockAttemptStatus = 'in_progress' | 'submitted' | 'in_review' | 'published' | 'reopened';
export type MockSkillStatus = 'insufficient' | 'attention' | 'improving' | 'consolidating';
export type MockSaveStatus = 'idle' | 'saving' | 'saved' | 'offline' | 'conflict' | 'error';

export interface MockTemplateIdentity {
  id: string;
  code: string;
  exam: 'ielts_academic';
  series: 'Cambridge IELTS Academic';
  volume: 16 | 17 | 18 | 19 | 20 | 21;
  testNumber: 1 | 2 | 3 | 4;
  module: MockModule;
}

export interface MockTemplateVersion {
  id: string;
  templateId: string;
  versionNumber: number;
  durationMinutes: number;
  questionCount: 40;
  status: 'draft' | 'published' | 'archived';
  hasVerifiedKey: boolean;
  hasVerifiedBandScale: boolean;
}

export interface MockQuestion {
  id: string;
  templateVersionId: string;
  questionNumber: number;
  sectionNumber: number;
  questionTypeCode: string;
  skillCode: string;
  wordLimit: number | null;
}

export interface MockAssignment {
  assignmentId: string;
  templateVersionId: string;
  availableAt: string;
  attemptLimit: number;
  status: MockAssignmentStatus;
  publishedAt?: string;
}

export interface MockAttempt {
  id: string;
  assignmentId: string;
  studentId: string;
  attemptNumber: number;
  status: MockAttemptStatus;
  startedAt: string;
  expiresAt: string;
  submittedAt?: string;
  publishedAt?: string;
  rawScore?: number;
  estimatedBand?: number;
  serverRevision: number;
  reopenCount: number;
}

export interface MockAnswerDraft {
  questionId: string;
  questionNumber: number;
  answerText: string;
  flaggedForReview: boolean;
  revision: number;
}

export interface SaveAnswersResult {
  serverRevision: number;
  savedAt: string;
  attemptStatus: MockAttemptStatus;
}

export interface MockErrorReviewInput {
  answerId: string;
  questionTypeCode: string;
  skillCode: string;
  primaryCauseCode: string;
  secondaryCauseCode?: string;
  teacherNote?: string;
  actionText?: string;
}

export interface MockPublishedAnswer {
  questionNumber: number;
  answerText: string;
  acceptedAnswers: string[];
  correct: boolean;
  review?: MockErrorReviewInput;
}

export interface MockPublishedResult {
  attempt: MockAttempt;
  summaryText: string;
  reviewVersion: number;
  answers: MockPublishedAnswer[];
  actions: MockActionItem[];
}

export interface MockActionItem {
  id: string;
  title: string;
  status: 'open' | 'done';
  completedAt?: string;
}
