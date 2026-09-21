import assert from 'node:assert/strict';
import {
  calculateSkillStatus,
  evaluateMockAnswer,
  normalizeMockAnswer,
  transitionAllowed,
} from '../src/lib/mocks/domain';
import { MOCK_TEMPLATE_IDENTITIES } from '../src/lib/mocks/catalog';
import { can } from '../src/lib/lms/permissions';
import { getAuth } from '../src/lib/lms/auth';
import { getRepos } from '../src/lib/lms/repos';
import { applyDemoSeed, DEMO_EMAILS, DEMO_PASSWORD } from '../src/lib/lms/seed';
import { seedSyntheticDemoTemplate } from '../src/lib/mocks/local-repo';
import { getMockRepo } from '../src/lib/mocks/repos';

assert.equal(normalizeMockAnswer('  New   York  '), 'new york');
assert.equal(normalizeMockAnswer('O’Connor'), "o'connor");
assert.equal(evaluateMockAnswer('Colour', ['colour', 'color'], 1).correct, true);
assert.equal(evaluateMockAnswer('colur', ['colour'], 1).correct, false);
assert.equal(evaluateMockAnswer('two words here', ['two words here'], 2).wordLimitExceeded, true);
assert.equal(MOCK_TEMPLATE_IDENTITIES.length, 48);
assert.equal(new Set(MOCK_TEMPLATE_IDENTITIES.map((item) => item.code)).size, 48);
assert.equal(transitionAllowed('in_progress', 'submitted'), true);
assert.equal(transitionAllowed('published', 'reopened'), false);
assert.equal(can('student', 'mock.attempt'), true);
assert.equal(can('teacher', 'mock.review'), true);
assert.deepEqual(
  calculateSkillStatus({ questions: 8, errors: 1, attempts: 2, currentAccuracy: 87.5, previousAccuracy: 75, repeatedCause: false }),
  { status: 'consolidating', sampleSize: 8 },
);
assert.equal(calculateSkillStatus({ questions: 8, errors: 1, attempts: 2, currentAccuracy: 80, previousAccuracy: 70, repeatedCause: false }).status, 'consolidating');
assert.equal(calculateSkillStatus({ questions: 6, errors: 2, attempts: 2, currentAccuracy: 75, previousAccuracy: 60, repeatedCause: false }).status, 'improving');
assert.equal(calculateSkillStatus({ questions: 4, errors: 2, attempts: 1, currentAccuracy: 50, previousAccuracy: null, repeatedCause: false }).status, 'attention');
assert.equal(calculateSkillStatus({ questions: 4, errors: 1, attempts: 1, currentAccuracy: 75, previousAccuracy: null, repeatedCause: false }).status, 'insufficient');

async function checkLocalWorkflow() {
  applyDemoSeed();
  const auth = getAuth();
  const repos = getRepos();
  const mocks = getMockRepo();
  const teacher = (await auth.signIn(DEMO_EMAILS.teacher, DEMO_PASSWORD)).user;
  const [cls] = await repos.classes.listForUser(teacher);
  assert(cls);
  const base = await repos.assignments.create({
    classId: cls.id, teacherId: teacher.id, title: 'Синтетический mock', brief: 'Тестовые ответы, не Cambridge',
    dueAt: new Date(Date.now() + 3_600_000).toISOString(), maxPoints: 40,
  });
  const version = seedSyntheticDemoTemplate(MOCK_TEMPLATE_IDENTITIES[0].id);
  await mocks.createAssignment({ assignmentId: base.id, templateVersionId: version.id, availableAt: new Date(Date.now() - 60_000).toISOString(), attemptLimit: 1 });
  await mocks.publishAssignment(base.id);

  const student = (await auth.signIn(DEMO_EMAILS.student, DEMO_PASSWORD)).user;
  const attempt = await mocks.startAttempt(base.id);
  assert.equal(attempt.studentId, student.id);
  assert.equal((await mocks.startAttempt(base.id)).id, attempt.id, 'start is idempotent');
  assert.equal(await mocks.getPublishedResult(attempt.id), null, 'unpublished key is hidden');
  await assert.rejects(mocks.saveAnswers(attempt.id, 0, [{ questionId: 'unknown', questionNumber: 1, answerText: 'x', flaggedForReview: false, revision: 1 }]), /неизвестный/);
  const saved = await mocks.saveAnswers(attempt.id, 0, [{ questionId: 'demo-question-1', questionNumber: 1, answerText: 'demo-answer-1', flaggedForReview: false, revision: 1 }]);
  await assert.rejects(mocks.saveAnswers(attempt.id, 0, []), /другой вкладке/);
  const submitted = await mocks.submitAttempt(attempt.id, saved.serverRevision);
  assert.equal(submitted.status, 'submitted');
  assert.equal(submitted.rawScore, undefined, 'student does not see score before review');
  assert.equal((await mocks.submitAttempt(attempt.id, saved.serverRevision)).id, attempt.id, 'submit is idempotent');
  assert.equal((await mocks.getAttempt(attempt.id))?.rawScore, undefined);
  await assert.rejects(mocks.startAttempt(base.id), /Лимит попыток/);

  await auth.signIn(DEMO_EMAILS.student2, DEMO_PASSWORD);
  await assert.rejects(mocks.getAttempt(attempt.id), /Нет доступа/);
  await assert.rejects(mocks.getPublishedResult(attempt.id), /Нет доступа/);

  await auth.signIn(DEMO_EMAILS.teacher, DEMO_PASSWORD);
  assert.equal((await mocks.getAttempt(attempt.id))?.rawScore, 1);
  const review = await mocks.beginReview(attempt.id);
  await assert.rejects(mocks.publishReview({ attemptId: attempt.id, reviewId: review.reviewId, summaryText: ' ' }), /итоговый комментарий/);
  const published = await mocks.publishReview({ attemptId: attempt.id, reviewId: review.reviewId, summaryText: 'Синтетический тест.' });
  assert.equal(published.attempt.status, 'published');
  await assert.rejects(mocks.reopenAttempt(attempt.id), /недопустим/);

  await auth.signIn(DEMO_EMAILS.student, DEMO_PASSWORD);
  const visible = await mocks.getPublishedResult(attempt.id);
  assert.equal(visible?.answers[0].acceptedAnswers[0], 'demo-answer-1');
  await assert.rejects(mocks.saveAnswers(attempt.id, 2, []), /больше нельзя/);
}

checkLocalWorkflow().then(() => {
  console.log('PASS mock unit: normalization, exact grading, catalog, transitions, permissions, progress, demo workflow and pre-publication secrecy');
}).catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
