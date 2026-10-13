import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import batch from '../src/data/trainer-drafts/batch-11.json';
import { draftBatches, emptyDraftReview, parseDraftReview, reviewKey } from '../src/lib/trainers/draft-review';
import { parseDraftMath, parseDraftMathNumber } from '../src/lib/trainers/draft-math';

assert.equal(batch.methodically_approved, false);
assert.equal(batch.units.length, 8);
assert.equal(batch.content_sha256, crypto.createHash('sha256').update(JSON.stringify(batch.units)).digest('hex'));
assert.ok(draftBatches.some(value => value.batch === batch.batch && value.content_sha256 === batch.content_sha256));
const ids = draftBatches.flatMap(value => value.units.map(unit => unit.id));
assert.equal(new Set(ids).size, ids.length);
// Independent numeric calculations, not extracted author answer strings or eval of the authored working.
const expected: Record<string, number[]> = {
  M09: [72 * 25 / 60, 54 * 40 / 60],
  M10: [60 / (30 / 15 + 30 / 30), 48 / (24 / 24 + 24 / 12)],
  M11: [100 * (100 - 80) / 80, 100 * (150 - 120) / 120],
  M12: [3, 4], M13: [(4 * 70 + 6 * 90) / 10, (5 * 12 + 3 * 20) / 8],
  M14: [24 * 3 ** 2, 180 * (1/2) ** 2],
  M15: [(-3 + Math.sqrt(9 + 160)) / 2, (-5 + Math.sqrt(25 + 336)) / 2],
  M16: [Math.sqrt(13 ** 2 - 5 ** 2), Math.sqrt(8 ** 2 + 15 ** 2)],
};
const firstInvalid: Record<string, number[]> = { M12: [2, 2], M13: [1, 2], M14: [1, 2] };
const bestPositions: Record<string, number[]> = { M09: [1, 0], M10: [2, 0], M11: [1, 2] };
const skills = new Set<string>();
for (const unit of batch.units) {
  assert.equal(unit.status, 'DRAFT');
  const pair = parseDraftMath(unit.exercise_data); assert.ok(pair, unit.id);
  skills.add(pair.skill);
  assert.equal(unit.student_markdown.includes(pair.rounds[1].prompt), false, 'fresh task is absent from the first worksheet');
  for (const [index, round] of pair.rounds.entries()) {
    assert.equal(round.answer, expected[unit.id][index], round.id);
    assert.equal(parseDraftMathNumber(String(round.answer)), round.answer);
    assert.ok(unit.teacher_markdown.includes(round.prompt));
    assert.ok(unit.teacher_markdown.includes(`Ответ: ${round.answer}`));
    assert.ok(unit.teacher_markdown.includes(round.explanation));
    for (const line of round.corrected_working) assert.ok(unit.teacher_markdown.includes(line));
    if (round.models) assert.equal(round.models.findIndex(model => model.best), bestPositions[unit.id][index]);
    if (round.steps) assert.equal(round.first_invalid, firstInvalid[unit.id][index]);
    for (const bad of [NaN, Infinity, 1e13, null, '25']) {
      const mutation = structuredClone(unit.exercise_data) as { rounds: Record<string, unknown>[] };
      mutation.rounds[index].answer = bad; assert.equal(parseDraftMath(mutation), null);
    }
  }
  const raw = JSON.stringify(emptyDraftReview('fixture', batch));
  assert.ok(parseDraftReview(raw, 'fixture', batch));
  assert.equal(parseDraftReview(raw, 'other', batch), null);
  assert.notEqual(reviewKey('fixture', batch), reviewKey('fixture', { ...batch, content_sha256: 'changed' }));
}
assert.equal(skills.size, 8);
for (const [x, offset, candidate] of [[3,6,-2],[4,12,-3]]) {
  assert.equal(Math.sqrt(x + offset), x);
  assert.ok(candidate + offset >= 0, 'extraneous candidates are defined but not solutions');
  assert.notEqual(Math.sqrt(candidate + offset), candidate);
}
assert.equal((15 + 30) / 2 === expected.M10[0], false);
assert.equal((70 + 90) / 2 === expected.M13[0], false);
assert.equal(100 * (100 - 80) / 100 === expected.M11[0], false);
assert.equal(24 * 3 === expected.M14[0], false);
assert.equal(5 * (5 + 3), 40); assert.equal(7 * (7 + 5), 84);
assert.equal(5 ** 2 + 12 ** 2, 13 ** 2); assert.equal(8 ** 2 + 15 ** 2, 17 ** 2);
assert.equal(JSON.stringify(batch).includes('33.3333333333'), false, 'no exact finite-answer pretence for a repeating decimal');
console.log(`PASS eight new Math pairs/sixteen original conditions, independent answers/model positions/first-invalid steps, domain and unit counterexamples, 80 invalid answers, exact finite numeric contract, fresh worksheet isolation, fingerprints and ${ids.length} unique DRAFT modules. No methodological approval.`);
