import { getAuth } from '../lms/auth';
import { getRepos } from '../lms/repos';
import { lmsBus, newId, readJson, writeJson } from '../lms/store';
import { MOCK_TEMPLATE_IDENTITIES } from './catalog';
import { evaluateMockAnswer, transitionAllowed } from './domain';
import type {
  CreateMockAssignmentInput,
  MockRepo,
  OverrideAnswerInput,
  PublishReviewInput,
} from './repos';
import type {
  MockActionItem,
  MockAnswerDraft,
  MockAssignment,
  MockAttempt,
  MockErrorReviewInput,
  MockPublishedAnswer,
  MockPublishedResult,
  MockTemplateVersion,
} from './types';

type PrivateAnswer = MockAnswerDraft & { id: string; attemptId: string; acceptedAnswers: string[]; correctOverride?: boolean };
type StoredReview = { id: string; attemptId: string; version: number; reviews: MockErrorReviewInput[]; publishedResult?: MockPublishedResult };
type AuditEntry = {
  id: string;
  action: string;
  targetId: string;
  createdAt: string;
  data?: { assignmentId: string; studentId: string; extraMinutes: number };
};

const nowIso = () => new Date().toISOString();
const TEMPLATES_KEY = 'mock-templates';
const VERSIONS_KEY = 'mock-template-versions';
const ASSIGNMENTS_KEY = 'mock-assignments';
const ATTEMPTS_KEY = 'mock-attempts';
const ANSWERS_KEY = 'mock-answers';
const REVIEWS_KEY = 'mock-reviews';
const ACTIONS_KEY = 'mock-actions';
const AUDIT_KEY = 'mock-audit';

function read<T>(key: string): T[] {
  return readJson<T[]>(key, []);
}

function write<T>(key: string, value: T[]): void {
  writeJson(key, value);
  lmsBus.emit();
}

function audit(action: string, targetId: string): void {
  const entry: AuditEntry = { id: newId(), action, targetId, createdAt: nowIso() };
  write(AUDIT_KEY, [...read<AuditEntry>(AUDIT_KEY), entry]);
}

function requireAttempt(id: string): MockAttempt {
  const attempt = read<MockAttempt>(ATTEMPTS_KEY).find((item) => item.id === id);
  if (!attempt) throw new Error('Попытка mock-теста не найдена');
  return attempt;
}

function replaceAttempt(next: MockAttempt): MockAttempt {
  write(ATTEMPTS_KEY, read<MockAttempt>(ATTEMPTS_KEY).map((item) => (item.id === next.id ? next : item)));
  return next;
}

function requireAssignment(id: string): MockAssignment {
  const assignment = read<MockAssignment>(ASSIGNMENTS_KEY).find((item) => item.assignmentId === id);
  if (!assignment) throw new Error('Mock-задание не найдено');
  return assignment;
}

function requireVersion(id: string): MockTemplateVersion {
  const version = read<MockTemplateVersion>(VERSIONS_KEY).find((item) => item.id === id);
  if (!version) throw new Error('Версия mock-теста не найдена');
  return version;
}

function currentStudentId(): string {
  const user = getAuth().getSession()?.user;
  if (!user || user.role !== 'student') throw new Error('Войдите как ученик, чтобы начать mock-тест');
  return user.id;
}

function syntheticAnswers(attemptId: string): PrivateAnswer[] {
  return Array.from({ length: 40 }, (_, index) => {
    const questionNumber = index + 1;
    return {
      id: newId(),
      attemptId,
      questionId: `demo-question-${questionNumber}`,
      questionNumber,
      answerText: '',
      flaggedForReview: false,
      revision: 0,
      // Deliberately synthetic, generated only by the repository at runtime.
      acceptedAnswers: [`demo-answer-${questionNumber}`],
    };
  });
}

function ensureTemplatesStored(): void {
  if (read(TEMPLATES_KEY).length === 0) writeJson(TEMPLATES_KEY, MOCK_TEMPLATE_IDENTITIES);
}

/** Test-only demo seed. It contains generated placeholders, never a Cambridge answer key. */
export function seedSyntheticDemoTemplate(templateId: string): MockTemplateVersion {
  const identity = MOCK_TEMPLATE_IDENTITIES.find((item) => item.id === templateId);
  if (!identity) throw new Error('Шаблон mock-теста не найден');
  const existing = read<MockTemplateVersion>(VERSIONS_KEY).find((item) => item.templateId === templateId && item.versionNumber === 1);
  if (existing) return existing;
  const version: MockTemplateVersion = {
    id: `demo-version-${identity.id}`,
    templateId,
    versionNumber: 1,
    durationMinutes: identity.module === 'reading' ? 60 : 30,
    questionCount: 40,
    status: 'published',
    hasVerifiedKey: true,
    hasVerifiedBandScale: false,
  };
  write(VERSIONS_KEY, [...read<MockTemplateVersion>(VERSIONS_KEY), version]);
  return version;
}

function moveAttempt(attempt: MockAttempt, nextStatus: MockAttempt['status'], fields: Partial<MockAttempt> = {}): MockAttempt {
  if (!transitionAllowed(attempt.status, nextStatus)) throw new Error('Этот переход статуса mock-попытки недопустим');
  return replaceAttempt({ ...attempt, ...fields, status: nextStatus, serverRevision: attempt.serverRevision + 1 });
}

export const localMockRepo: MockRepo = {
  async listTemplates() {
    ensureTemplatesStored();
    return read(TEMPLATES_KEY);
  },

  async listTemplateVersions(templateId) {
    if (!MOCK_TEMPLATE_IDENTITIES.some((item) => item.id === templateId)) return [];
    return read<MockTemplateVersion>(VERSIONS_KEY).filter((item) => item.templateId === templateId);
  },

  async listAssignmentsByClass(classId) {
    const assignmentIds = new Set((await getRepos().assignments.listByClass(classId)).map((item) => item.id));
    return read<MockAssignment>(ASSIGNMENTS_KEY).filter((item) => assignmentIds.has(item.assignmentId));
  },

  async getAssignment(assignmentId) {
    return read<MockAssignment>(ASSIGNMENTS_KEY).find((item) => item.assignmentId === assignmentId) ?? null;
  },

  async createAssignment(input: CreateMockAssignmentInput) {
    if (!Number.isInteger(input.attemptLimit) || input.attemptLimit < 1) throw new Error('Лимит попыток должен быть целым числом не меньше 1');
    if (Number.isNaN(Date.parse(input.availableAt))) throw new Error('Укажите дату открытия mock-теста');
    if (!(await getRepos().assignments.get(input.assignmentId))) throw new Error('Сначала создайте обычное задание для этого mock-теста');
    requireVersion(input.templateVersionId);
    if (read<MockAssignment>(ASSIGNMENTS_KEY).some((item) => item.assignmentId === input.assignmentId)) throw new Error('Для этого задания mock-тест уже создан');
    const assignment: MockAssignment = { ...input, availableAt: new Date(input.availableAt).toISOString(), status: 'draft' };
    write(ASSIGNMENTS_KEY, [...read<MockAssignment>(ASSIGNMENTS_KEY), assignment]);
    audit('mock.assignment_created', assignment.assignmentId);
    return assignment;
  },

  async publishAssignment(assignmentId) {
    const assignment = requireAssignment(assignmentId);
    if (assignment.publishedAt) return assignment;
    const version = requireVersion(assignment.templateVersionId);
    if (!version.hasVerifiedKey) throw new Error('Нельзя опубликовать mock-тест без проверенного ключа ответов');
    const status = Date.parse(assignment.availableAt) > Date.now() ? 'scheduled' : 'active';
    const next = { ...assignment, status, publishedAt: nowIso() } as MockAssignment;
    write(ASSIGNMENTS_KEY, read<MockAssignment>(ASSIGNMENTS_KEY).map((item) => (item.assignmentId === assignmentId ? next : item)));
    audit('mock.assignment_published', assignmentId);
    return next;
  },

  async setAccommodation(input) {
    if (!Number.isInteger(input.extraMinutes) || input.extraMinutes < 0) throw new Error('Дополнительное время должно быть целым числом от 0 минут');
    requireAssignment(input.assignmentId);
    const all = read<AuditEntry>(AUDIT_KEY);
    const next = [
      ...all.filter((item) => item.action !== 'mock.accommodation_set' || item.data?.assignmentId !== input.assignmentId || item.data.studentId !== input.studentId),
      { id: newId(), action: 'mock.accommodation_set', targetId: input.assignmentId, createdAt: nowIso(), data: input },
    ];
    write(AUDIT_KEY, next);
  },

  async listAttemptsByAssignment(assignmentId) {
    return read<MockAttempt>(ATTEMPTS_KEY).filter((item) => item.assignmentId === assignmentId);
  },

  async listAttemptsByStudent(studentId) {
    return read<MockAttempt>(ATTEMPTS_KEY).filter((item) => item.studentId === studentId);
  },

  async getAttempt(attemptId) {
    return read<MockAttempt>(ATTEMPTS_KEY).find((item) => item.id === attemptId) ?? null;
  },

  async startAttempt(assignmentId) {
    const studentId = currentStudentId();
    const assignment = requireAssignment(assignmentId);
    if (assignment.status !== 'active') throw new Error('Этот mock-тест пока недоступен');
    const previous = read<MockAttempt>(ATTEMPTS_KEY).filter((item) => item.assignmentId === assignmentId && item.studentId === studentId);
    const unfinished = previous.find((item) => item.status === 'in_progress' || item.status === 'reopened');
    if (unfinished) return unfinished;
    if (previous.length >= assignment.attemptLimit) throw new Error('Лимит попыток для этого mock-теста исчерпан');
    const version = requireVersion(assignment.templateVersionId);
    const accommodation = read<AuditEntry>(AUDIT_KEY).find((item) => item.action === 'mock.accommodation_set' && item.data?.assignmentId === assignmentId && item.data.studentId === studentId)?.data;
    const startedAt = nowIso();
    const attempt: MockAttempt = {
      id: newId(), assignmentId, studentId, attemptNumber: previous.length + 1, status: 'in_progress', startedAt,
      expiresAt: new Date(Date.parse(startedAt) + (version.durationMinutes + (accommodation?.extraMinutes ?? 0)) * 60_000).toISOString(),
      serverRevision: 0, reopenCount: 0,
    };
    write(ATTEMPTS_KEY, [...read<MockAttempt>(ATTEMPTS_KEY), attempt]);
    write(ANSWERS_KEY, [...read<PrivateAnswer>(ANSWERS_KEY), ...syntheticAnswers(attempt.id)]);
    audit('mock.attempt_started', attempt.id);
    return attempt;
  },

  async saveAnswers(attemptId, expectedRevision, drafts) {
    const attempt = requireAttempt(attemptId);
    if (attempt.status !== 'in_progress' && attempt.status !== 'reopened') throw new Error('Ответы этой попытки больше нельзя изменять');
    if (attempt.serverRevision !== expectedRevision) throw new Error('Ответы уже изменены в другой вкладке — обновите страницу');
    const existing = read<PrivateAnswer>(ANSWERS_KEY).filter((item) => item.attemptId === attemptId);
    if (existing.length === 0) throw new Error('Ключ ответов для этой попытки не найден');
    const byQuestion = new Map(drafts.map((item) => [item.questionId, item]));
    const updated = existing.map((item) => {
      const draft = byQuestion.get(item.questionId);
      return draft ? { ...item, answerText: draft.answerText, flaggedForReview: draft.flaggedForReview, revision: draft.revision } : item;
    });
    write(ANSWERS_KEY, [...read<PrivateAnswer>(ANSWERS_KEY).filter((item) => item.attemptId !== attemptId), ...updated]);
    const next = replaceAttempt({ ...attempt, serverRevision: attempt.serverRevision + 1 });
    audit('mock.answers_saved', attemptId);
    return { serverRevision: next.serverRevision, savedAt: nowIso(), attemptStatus: next.status };
  },

  async submitAttempt(attemptId, expectedRevision, automatic = false) {
    const attempt = requireAttempt(attemptId);
    if (attempt.serverRevision !== expectedRevision) throw new Error('Ответы уже изменены в другой вкладке — обновите страницу');
    const answers = read<PrivateAnswer>(ANSWERS_KEY).filter((item) => item.attemptId === attemptId);
    if (answers.length === 0) throw new Error('Ключ ответов для этой попытки не найден');
    const rawScore = answers.reduce((total, answer) => total + Number(answer.correctOverride ?? evaluateMockAnswer(answer.answerText, answer.acceptedAnswers, null).correct), 0);
    const next = moveAttempt(attempt, 'submitted', { submittedAt: nowIso(), rawScore });
    audit(automatic ? 'mock.attempt_auto_submitted' : 'mock.attempt_submitted', attemptId);
    return next;
  },

  async beginReview(attemptId) {
    const attempt = requireAttempt(attemptId);
    const next = moveAttempt(attempt, 'in_review');
    const previous = read<StoredReview>(REVIEWS_KEY).filter((item) => item.attemptId === attemptId);
    const review: StoredReview = { id: newId(), attemptId, version: previous.length + 1, reviews: [] };
    write(REVIEWS_KEY, [...read<StoredReview>(REVIEWS_KEY), review]);
    audit('mock.review_started', next.id);
    return { reviewId: review.id, version: review.version };
  },

  async saveErrorReviews(reviewId, reviews) {
    const existing = read<StoredReview>(REVIEWS_KEY).find((item) => item.id === reviewId);
    if (!existing) throw new Error('Разбор ошибок не найден');
    if (requireAttempt(existing.attemptId).status !== 'in_review') throw new Error('Разбор уже нельзя изменять');
    write(REVIEWS_KEY, read<StoredReview>(REVIEWS_KEY).map((item) => (item.id === reviewId ? { ...item, reviews } : item)));
    audit('mock.review_saved', reviewId);
  },

  async overrideAnswer(input: OverrideAnswerInput) {
    const attempt = requireAttempt(input.attemptId);
    if (attempt.status !== 'in_review') throw new Error('Ответ можно переопределить только во время разбора');
    const answers = read<PrivateAnswer>(ANSWERS_KEY);
    const answer = answers.find((item) => item.attemptId === input.attemptId && item.questionId === input.questionId);
    if (!answer) throw new Error('Ответ mock-теста не найден');
    write(ANSWERS_KEY, answers.map((item) => (item.id === answer.id ? { ...item, correctOverride: input.correct } : item)));
    const rawScore = answers.filter((item) => item.attemptId === input.attemptId).reduce((total, item) => total + Number(item.id === answer.id ? input.correct : item.correctOverride ?? evaluateMockAnswer(item.answerText, item.acceptedAnswers, null).correct), 0);
    const next = replaceAttempt({ ...attempt, rawScore, serverRevision: attempt.serverRevision + 1 });
    audit('mock.answer_overridden', input.attemptId);
    return next;
  },

  async publishReview(input: PublishReviewInput) {
    const attempt = requireAttempt(input.attemptId);
    const review = read<StoredReview>(REVIEWS_KEY).find((item) => item.id === input.reviewId && item.attemptId === input.attemptId);
    if (!review) throw new Error('Разбор ошибок не найден');
    const privateAnswers = read<PrivateAnswer>(ANSWERS_KEY).filter((item) => item.attemptId === input.attemptId);
    if (privateAnswers.length === 0) throw new Error('Ключ ответов для этой попытки не найден');
    const publishedAttempt = moveAttempt(attempt, 'published', { publishedAt: nowIso() });
    const answers: MockPublishedAnswer[] = privateAnswers.map((answer) => ({
      questionNumber: answer.questionNumber,
      answerText: answer.answerText,
      acceptedAnswers: answer.acceptedAnswers,
      correct: answer.correctOverride ?? evaluateMockAnswer(answer.answerText, answer.acceptedAnswers, null).correct,
      review: review.reviews.find((item) => item.answerId === answer.id),
    }));
    const actions = review.reviews.filter((item) => item.actionText?.trim()).map((item) => ({ id: newId(), title: item.actionText!.trim(), status: 'open' as const }));
    write(ACTIONS_KEY, [...read<MockActionItem>(ACTIONS_KEY), ...actions]);
    const result: MockPublishedResult = { attempt: publishedAttempt, summaryText: input.summaryText.trim(), reviewVersion: review.version, answers, actions };
    write(REVIEWS_KEY, read<StoredReview>(REVIEWS_KEY).map((item) => (item.id === review.id ? { ...item, publishedResult: result } : item)));
    audit('mock.review_published', input.attemptId);
    return result;
  },

  async reopenAttempt(attemptId, extraMinutes = 0) {
    if (!Number.isInteger(extraMinutes) || extraMinutes < 0) throw new Error('Дополнительное время должно быть целым числом от 0 минут');
    const attempt = requireAttempt(attemptId);
    const next = moveAttempt(attempt, 'reopened', {
      expiresAt: new Date(Date.parse(attempt.expiresAt) + extraMinutes * 60_000).toISOString(),
      reopenCount: attempt.reopenCount + 1,
    });
    audit('mock.attempt_reopened', attemptId);
    return next;
  },

  async getPublishedResult(attemptId) {
    const attempt = await this.getAttempt(attemptId);
    if (!attempt || attempt.status !== 'published') return null;
    return read<StoredReview>(REVIEWS_KEY).find((item) => item.attemptId === attemptId)?.publishedResult ?? null;
  },

  async completeAction(actionId) {
    const action = read<MockActionItem>(ACTIONS_KEY).find((item) => item.id === actionId);
    if (!action) throw new Error('Действие по mock-тесту не найдено');
    if (action.status === 'done') return action;
    const next: MockActionItem = { ...action, status: 'done', completedAt: nowIso() };
    write(ACTIONS_KEY, read<MockActionItem>(ACTIONS_KEY).map((item) => (item.id === actionId ? next : item)));
    audit('mock.action_completed', actionId);
    return next;
  },
};
