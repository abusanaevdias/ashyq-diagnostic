import assert from 'node:assert/strict';
import {
  calculateSkillStatus,
  evaluateMockAnswer,
  normalizeMockAnswer,
  transitionAllowed,
} from '../src/lib/mocks/domain';
import { MOCK_TEMPLATE_IDENTITIES } from '../src/lib/mocks/catalog';
import { can } from '../src/lib/lms/permissions';

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

console.log('PASS mock unit: normalization, exact grading, catalog, transitions, permissions, progress');
