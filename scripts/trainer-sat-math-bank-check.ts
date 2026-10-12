import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import batch from '../src/data/trainer-drafts/batch-05.json';
import { draftBatches, emptyDraftReview, parseDraftReview, reviewKey } from '../src/lib/trainers/draft-review';

assert.equal(batch.units.length, 6);
assert.equal(batch.methodically_approved, false);
assert.equal(crypto.createHash('sha256').update(JSON.stringify(batch.units)).digest('hex'), batch.content_sha256);
const ids = draftBatches.flatMap(value => value.units.map(unit => unit.id));
assert.equal(new Set(ids).size, ids.length);
const prompts = new Set<string>(), roundIds = new Set<string>();
for (const family of ['translation', 'forensics', 'method-switch']) assert.equal(batch.units.filter(unit => unit.exercise_data.family === family).length, 2);
for (const unit of batch.units) {
  const data = unit.exercise_data;
  assert.equal(unit.status, 'DRAFT'); assert.equal(data.publication_ready, false);
  assert.equal(data.kind, 'sat-math-pair-v1'); assert.equal(data.difficulty_status, 'AUTHOR_ESTIMATE_UNCALIBRATED');
  assert.ok(data.skill.trim() && data.review_notes.length > 0);
  assert.equal(data.rounds.length, 2);
  assert.ok(!unit.student_markdown.includes(data.rounds[1].prompt));
  for (const round of data.rounds) {
    assert.ok(!roundIds.has(round.id) && !prompts.has(round.prompt)); roundIds.add(round.id); prompts.add(round.prompt);
    assert.ok(Number.isFinite(round.answer) && round.variable.trim() && round.explanation.trim());
    assert.ok(round.corrected_working.length >= 3 && round.corrected_working.every(line => line.trim()));
    assert.ok(unit.teacher_markdown.includes(round.explanation));
    if (data.family === 'translation') {
      assert.ok('models' in round);
      assert.equal(round.models!.length, 3); assert.equal(round.models!.filter(value => value.best).length, 1);
      for (const model of round.models!) { assert.ok(model.equation.trim() && model.feedback.trim()); assert.ok(!unit.student_markdown.includes(model.equation)); }
    }
    if (data.family === 'forensics') {
      assert.ok('steps' in round && 'first_invalid' in round);
      assert.equal(round.steps!.length, 3); assert.equal(round.steps!.findIndex(value => !value.valid), round.first_invalid);
      assert.ok(round.steps!.every(value => value.statement.trim() && value.explanation.trim()));
    }
    if (data.family === 'method-switch') {
      assert.ok('methods' in round);
      assert.equal(round.methods!.length, 2);
      assert.ok(round.methods!.every(value => value.title.trim() && value.working.length >= 2 && value.tradeoff.trim()));
    }
  }
}
assert.equal(prompts.size, 12);
const rounds = (id: string) => batch.units.find(unit => unit.id === id)!.exercise_data.rounds;
const money = (text: string) => [...text.matchAll(/\$(\d+)/g)].map(value => Number(value[1]));
for (const round of rounds('M03')) {
  const [setup, rate, total] = money(round.prompt);
  assert.equal((total - setup) / rate, round.answer);
  assert.equal(setup + rate * round.answer, total);
  assert.notEqual((setup + rate) * round.answer, total, 'repeating setup is not the given model');
}
for (const round of rounds('M04')) {
  const [budget, setup, rate] = money(round.prompt);
  assert.equal(Math.floor((budget - setup) / rate), round.answer);
  assert.ok(setup + rate * round.answer <= budget);
  assert.ok(setup + rate * (round.answer + 1) > budget);
}
for (const [index, round] of rounds('M05').entries()) {
  assert.ok('steps' in round);
  const [initial] = money(round.prompt), percents = [...round.prompt.matchAll(/(\d+)%/g)].map(value => Number(value[1]) / 100);
  const afterFirst = initial * (1 + (index === 0 ? -1 : 1) * percents[0]);
  const final = afterFirst * (1 + (index === 0 ? 1 : -1) * percents[1]);
  assert.equal(final, round.answer);
  assert.notEqual(initial * (1 + (index === 0 ? -1 : 1) * (percents[0] - percents[1])), final, 'adding percentage points uses a different base');
  assert.deepEqual(round.steps!.map(value => value.valid), index === 0 ? [true,true,false] : [true,false,false]);
}
const algebra = [{ outer: 4, innerX: 1, innerConstant: -3, rightX: 2, rightConstant: 10, wrongAnswer: 6.5 }, { outer: 3, innerX: 2, innerConstant: 5, rightX: 4, rightConstant: 23, wrongAnswer: 9 }];
for (const [index, round] of rounds('M06').entries()) {
  const { outer, innerX, innerConstant, rightX, rightConstant, wrongAnswer } = algebra[index];
  assert.equal((rightConstant - outer * innerConstant) / (outer * innerX - rightX), round.answer);
  assert.equal(outer * (innerX * round.answer + innerConstant), rightX * round.answer + rightConstant);
  assert.notEqual(outer * (innerX * wrongAnswer + innerConstant), rightX * wrongAnswer + rightConstant);
}
// Independently solve both systems, including the changed requested variable.
const systems = [{ a: 2,b: 3,c: 19,d: 2,e: 1,f: 9,target: 'p' }, { a: 3,b: 2,c: 22,d: 1,e: 2,f: 14,target: 'n' }];
for (const [index, round] of rounds('M07').entries()) {
  const { a,b,c,d,e,f,target } = systems[index], determinant = a * e - b * d;
  assert.notEqual(determinant, 0);
  const n = (c * e - b * f) / determinant, p = (a * f - c * d) / determinant;
  assert.equal(a * n + b * p, c); assert.equal(d * n + e * p, f);
  assert.equal(target === 'p' ? p : n, round.answer); assert.ok(n > 0 && p > 0);
}
for (const round of rounds('M08')) {
  const [setupA,rateA,setupB,rateB] = money(round.prompt);
  assert.equal((setupA - setupB) / (rateB - rateA), round.answer);
  assert.equal(setupA + rateA * round.answer, setupB + rateB * round.answer);
  assert.notEqual(setupA + rateA * (round.answer + 1), setupB + rateB * (round.answer + 1));
}
const review = emptyDraftReview('synthetic-reviewer', batch);
for (const other of draftBatches.filter(value => value.batch !== batch.batch)) { assert.notEqual(reviewKey('synthetic-reviewer', other), reviewKey('synthetic-reviewer', batch)); assert.equal(parseDraftReview(JSON.stringify(review), 'synthetic-reviewer', other), null); }
console.log('PASS batch 05: six DRAFT SAT Math pairs / twelve unique conditions, three families; independent fee/budget/changed-percent-base/equation/substitution/system/tariff arithmetic, incorrect-model counterexamples, fresh-task isolation and review fingerprint isolation. No methodology approval, difficulty calibration or publication.');
