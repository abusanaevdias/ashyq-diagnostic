import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import batch from '../src/data/trainer-drafts/batch-04.json';
import { draftBatches, emptyDraftReview, parseDraftReview, reviewKey } from '../src/lib/trainers/draft-review';

assert.equal(batch.units.length, 8);
assert.equal(batch.methodically_approved, false);
assert.equal(crypto.createHash('sha256').update(JSON.stringify(batch.units)).digest('hex'), batch.content_sha256);
const allIds = draftBatches.flatMap(value => value.units.map(unit => unit.id));
assert.equal(new Set(allIds).size, allIds.length);
assert.equal(batch.units.filter(unit => unit.exercise_data.trainer === 'sat-optionless').length, 4);
assert.equal(batch.units.filter(unit => unit.exercise_data.trainer === 'sat-distractor').length, 4);
const passages = new Set<string>();
const roundIds = new Set<string>();
const keyPositions = new Set<number>();
for (const unit of batch.units) {
  const data = unit.exercise_data;
  assert.equal(unit.status, 'DRAFT');
  assert.equal(data.kind, 'sat-rw-pair-v1');
  assert.equal(data.publication_ready, false);
  assert.equal(data.difficulty_status, 'AUTHOR_ESTIMATE_UNCALIBRATED');
  assert.equal(data.rounds.length, 2);
  assert.ok(data.review_notes.length > 0);
  assert.notEqual(data.rounds[0].passage, data.rounds[1].passage);
  assert.notEqual(data.rounds[0].evidence, data.rounds[1].evidence);
  assert.ok(!unit.student_markdown.includes(data.rounds[1].passage), 'fresh transfer is not disclosed in initial prompt');
  for (const round of data.rounds) {
    assert.ok(!passages.has(round.passage) && !roundIds.has(round.id));
    passages.add(round.passage); roundIds.add(round.id); keyPositions.add(round.key);
    assert.equal(round.skill, data.skill);
    assert.equal(round.choices.length, 4);
    assert.equal(new Set(round.choices.map(choice => choice.text)).size, 4);
    assert.equal(round.choices.filter(choice => choice.best).length, 1);
    assert.equal(round.choices[round.key].best, true);
    assert.ok(round.passage.includes(round.evidence), 'evidence must be an exact excerpt, not an invented paraphrase');
    assert.ok(round.explanation.trim() && round.prediction_guidance.trim() && round.repair_prompt.trim());
    assert.equal(round.choices[round.key].trap, 'none');
    for (const choice of round.choices) {
      assert.ok(choice.text.trim() && choice.feedback.trim());
      assert.equal(choice.best, choice.trap === 'none');
      assert.ok(unit.teacher_markdown.includes(choice.text) && unit.teacher_markdown.includes(choice.feedback));
      assert.ok(!unit.student_markdown.includes(choice.text), 'no option/key leakage before prediction');
    }
  }
}
assert.equal(passages.size, 16);
assert.equal(keyPositions.size, 4);
for (const skill of ['central-idea', 'inference', 'evidence-boundary', 'transition']) assert.equal(batch.units.filter(unit => unit.exercise_data.skill === skill).length, 2);
// Counterexample corpus checks: a true detail can still be a weak main idea;
// higher final count is not change/rate; no completed prerequisite is not a
// failed attempt. These assertions check the supplied evidence boundary, not
// an automated proof of every natural-language inference.
const round = (id: string) => batch.units.flatMap(unit => unit.exercise_data.rounds).find(value => value.id === id)!;
assert.equal(round('RW05-A').choices[2].trap, 'detail');
assert.ok(round('RW05-A').passage.includes('several supports would be difficult to attach'));
assert.equal(round('RW07-A').choices[0].trap, 'unsupported');
assert.ok(round('RW07-A').evidence.includes('not counted flowers before'));
assert.equal(round('RW07-B').choices[1].trap, 'unsupported');
assert.ok(round('RW07-B').evidence.includes('how much time'));
assert.equal(round('RW06-A').choices[3].trap, 'unsupported');
assert.ok(round('RW06-A').passage.includes('must both'));
assert.ok(round('RW06-B').passage.includes('only after'));
const review = emptyDraftReview('synthetic-reviewer', batch);
for (const other of draftBatches.filter(value => value.batch !== batch.batch)) {
  assert.notEqual(reviewKey('synthetic-reviewer', other), reviewKey('synthetic-reviewer', batch));
  assert.equal(parseDraftReview(JSON.stringify(review), 'synthetic-reviewer', other), null);
}
console.log('PASS batch 04: eight DRAFT SAT R&W modules / sixteen distinct texts; four skills, exact evidence, unique alternatives/keys, fresh-transfer isolation, explicit prerequisite/cause/rate/detail counterexamples and independent review fingerprints. Difficulty uncalibrated; no methodology approval or public publication.');
