import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import batch from '../src/data/trainer-drafts/batch-03.json';
import { draftBatches, emptyDraftReview, parseDraftReview, reviewKey } from '../src/lib/trainers/draft-review';

assert.equal(batch.units.length, 18);
assert.equal(batch.methodically_approved, false);
assert.equal(crypto.createHash('sha256').update(JSON.stringify(batch.units)).digest('hex'), batch.content_sha256);
const allIds = draftBatches.flatMap(value => value.units.map(unit => unit.id));
assert.equal(new Set(allIds).size, allIds.length);
for (const mode of ['combine', 'grammar', 'argument']) {
  assert.equal(batch.units.filter(unit => unit.exercise_data.mode === mode).length, 6);
  const positions = batch.units.filter(unit => unit.exercise_data.mode === mode).map(unit => unit.exercise_data.choices.findIndex(choice => choice.best));
  assert.deepEqual([0, 1, 2].map(index => positions.filter(value => value === index).length), [2, 2, 2], 'avoid fixed answer-position cue');
}
const uniqueChoices = new Set<string>();
for (const unit of batch.units) {
  const data = unit.exercise_data;
  assert.equal(unit.status, 'DRAFT');
  assert.equal(data.publication_ready, false);
  assert.equal(data.kind, 'writing-drill-v1');
  assert.equal(data.id, unit.id);
  assert.equal(data.title, unit.title);
  assert.equal(data.choices.length, 3);
  assert.equal(data.choices.filter(choice => choice.best).length, 1);
  assert.equal(data.example, data.choices.find(choice => choice.best)?.text);
  assert.ok(data.source.length > 0 && data.source.every(text => text.trim()));
  assert.ok(data.accepted_alternatives.length && data.accepted_alternatives.every(text => text.trim()));
  assert.ok(data.review_notes.length && data.review_notes.every(text => text.trim()));
  assert.ok(data.task.trim() && data.explanation.trim() && data.criterion.trim());
  assert.ok(unit.student_markdown.includes(data.task));
  assert.ok(unit.student_markdown.includes('Сначала напиши свой вариант'));
  assert.ok(!unit.student_markdown.includes('Подходит:'));
  for (const choice of data.choices) {
    assert.ok(choice.text.trim() && choice.feedback.trim());
    assert.ok(!uniqueChoices.has(choice.text), 'distinct authored choices across this batch');
    uniqueChoices.add(choice.text);
    assert.ok(unit.teacher_markdown.includes(choice.text) && unit.teacher_markdown.includes(choice.feedback));
    // An unchanged erroneous source can be a distractor, but a new solution
    // must not leak into the student prompt before the learner's attempt.
    if (!data.source.includes(choice.text)) assert.ok(!unit.student_markdown.includes(choice.text));
  }
  assert.ok(unit.teacher_markdown.includes('не полный список верных формулировок'));
  assert.ok(unit.teacher_markdown.includes('не методическое утверждение'));
}
// Independent minimal transformations: don't merely compare an example with
// the key written by the same author. Preserve all non-target wording.
const transformations: Record<string, [string, string]> = {
  D13: [' have increased ', ' has increased '],
  D14: [' informations ', ' information '],
  D15: [' must to submit ', ' must submit '],
  D16: ['An university ', 'A university '],
  D17: [' needs ', ' need '],
  D18: [' more easier ', ' easier '],
};
for (const [id, [before, after]] of Object.entries(transformations)) {
  const unit = batch.units.find(value => value.id === id)!;
  assert.ok(unit.exercise_data.source[0].includes(before));
  assert.equal(unit.exercise_data.example, unit.exercise_data.source[0].replace(before, after), id);
}
const third = emptyDraftReview('synthetic-reviewer', batch);
for (const other of draftBatches.filter(value => value.batch !== batch.batch)) {
  assert.notEqual(reviewKey('synthetic-reviewer', other), reviewKey('synthetic-reviewer', batch));
  assert.equal(parseDraftReview(JSON.stringify(third), 'synthetic-reviewer', other), null);
}
assert.ok(parseDraftReview(JSON.stringify(third), 'synthetic-reviewer', batch));
console.log('PASS batch 03: 18 DRAFT drills, six per mode; alternatives, no pre-attempt key leak, balanced positions, six independent minimal grammar transformations, fingerprint and cross-batch isolation. No free-text grading, methodological approval or public exercise publication.');
