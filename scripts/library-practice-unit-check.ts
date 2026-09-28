import assert from 'node:assert/strict';
import raw from '../src/data/free-library-content.json';
import { LIBRARY_CHAPTERS } from '../src/data/free-library';
import type { LibrarySection } from '../src/lib/free-library';
import { buildLibraryPractice, checkPracticeAnswer } from '../src/lib/library-practice';

const sections = raw.sections as LibrarySection[];
const sets = LIBRARY_CHAPTERS.flatMap((chapter) => buildLibraryPractice(sections.filter((section) => section.source === chapter.source && section.page >= chapter.start && section.page <= chapter.end)));
const questions = sets.flatMap((set) => set.questions);
assert.equal(questions.length, 322);
assert.equal(new Set(questions.map((question) => question.id)).size, 322);
assert.equal(questions.filter((question) => question.mode === 'auto').length, 148);
assert.equal(questions.filter((question) => question.mode === 'compare').length, 174);
assert.ok(!sets.some((set) => set.code === 'S-REVIEW'), 'Speaking rubric is feedback, not another set of questions');
for (const question of questions) {
  assert.ok(question.prompt.trim(), question.id);
  assert.ok(sections.some((section) => section.code === question.sourceSection && section.page === question.sourcePage));
  if (question.mode === 'auto') {
    assert.ok(question.model, question.id);
    assert.ok(question.accepted.length, question.id);
    for (const answer of question.accepted) assert.equal(checkPracticeAnswer(question, `  ${answer.toUpperCase()}  `), true, question.id);
    assert.equal(checkPracticeAnswer(question, 'unrelated definitely wrong answer'), false, question.id);
    assert.equal(checkPracticeAnswer(question, ''), null, question.id);
    if (question.options.length) assert.ok(question.accepted.every((answer) => question.options.some((option) => option.value === answer)), question.id);
  } else assert.equal(checkPracticeAnswer(question, question.model), null, question.id);
}
function question(id: string) { return questions.find((question) => question.id === id)!; }
assert.deepEqual(question('R01-01').accepted, ['FALSE']);
assert.equal(checkPracticeAnswer(question('R01-07'), 'not   given'), true);
assert.deepEqual(question('R02-01').accepted, ['iii']);
assert.ok(question('R02-01').options[2].label.includes('unfinished work'));
assert.deepEqual(question('R03-07').accepted, ['guess']);
assert.deepEqual(question('G1-01').accepted, ['lives']);
assert.deepEqual(question('L01-02').accepted, ['10:30', 'ten thirty']);
assert.deepEqual(question('L03-05').accepted, ['8', 'eight', '20:00']);
assert.deepEqual(question('U01-01').accepted, ['B']);
assert.equal(question('U01-02').mode, 'compare');
assert.equal(question('X01').mode, 'compare');
assert.ok(question('X01').model.includes('practical project'));
assert.ok(question('SP3-01').model.includes('Возможный путь'));
assert.equal(question('SP3-01').mode, 'compare');
console.log(`PASS practice: ${questions.length} unique source-backed questions; ${questions.filter((question) => question.mode === 'auto').length} automatic, ${questions.filter((question) => question.mode === 'compare').length} comparison; empty/wrong/case/variants/open-answer boundaries`);
if (process.env.PRACTICE_AUDIT) console.log(questions.filter((question) => question.mode === 'auto').map((question) => `${question.id}: ${question.accepted.join(' / ')}`).join('\n'));
