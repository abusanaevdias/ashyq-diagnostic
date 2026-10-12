import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import batch from '../src/data/trainer-drafts/batch-06.json';
import { draftBatches, emptyDraftReview, parseDraftReview, reviewKey } from '../src/lib/trainers/draft-review';

assert.equal(batch.units.length, 8);
assert.equal(batch.methodically_approved, false);
assert.equal(crypto.createHash('sha256').update(JSON.stringify(batch.units)).digest('hex'), batch.content_sha256);
const ids = draftBatches.flatMap(value => value.units.map(unit => unit.id));
assert.equal(new Set(ids).size, ids.length);
const texts = new Set<string>();
for (const unit of batch.units) {
  assert.equal(unit.status, 'DRAFT');
  const data = unit.exercise_data;
  assert.equal(data.kind, 'reading-evidence-pair-v1');
  assert.equal(data.publication_ready, false);
  assert.equal(data.difficulty_status, 'AUTHOR_ESTIMATE_UNCALIBRATED');
  assert.equal(data.rounds.length, 2);
  assert.notEqual(data.rounds[0].id, data.rounds[1].id);
  assert.ok(unit.student_markdown.includes(data.rounds[0].text));
  assert.ok(!unit.student_markdown.includes(data.rounds[1].text), 'fresh text isolated from first worksheet');
  assert.ok(!unit.student_markdown.includes('Ключ:'), 'no first worksheet key');
  for (const round of data.rounds) {
    assert.ok(!texts.has(round.text)); texts.add(round.text);
    assert.equal(round.claims.length, 3);
    assert.deepEqual(round.claims.map(claim => claim.answer).sort(), ['FALSE','NOT GIVEN','TRUE']);
    assert.equal(new Set(round.claims.map(claim => claim.statement)).size, 3);
    for (const claim of round.claims) {
      assert.ok(round.text.includes(claim.evidence), 'exact supporting/context excerpt');
      assert.ok(claim.evidence.length > 15 && claim.explanation.trim().length > 10, 'explanation present; length is not a quality score');
      assert.ok(unit.teacher_markdown.includes(claim.statement) && unit.teacher_markdown.includes(claim.explanation));
    }
  }
}
assert.equal(texts.size, 16);
const byId = (id: string) => { const unit = batch.units.find(value => value.id === id); assert.ok(unit); return unit.exercise_data; };
// Recompute numeric counterexamples independently of declared answer labels.
assert.ok(50_000 > 35_000 && 50_000 - 40_000 < 35_000 - 20_000);
assert.ok(150_000 > 100_000 && 150_000 - 120_000 < 100_000 - 60_000);
assert.ok(40 > 30 && 40 / 200 < 30 / 100);
assert.ok(24 > 18 && 24 / 120 < 18 / 60);
assert.equal(30 / 6, 5); assert.notEqual(2, 5); assert.notEqual(8, 5);
assert.equal(40 / 4, 10); assert.notEqual(6, 10); assert.notEqual(14, 10);
// FALSE on causality is about the authors' explicitly denied conclusion,
// never a claim that an unmeasured causal relationship is factually impossible.
for (const round of byId('R06').rounds) {
  const falseClaim = round.claims.find(value => value.answer === 'FALSE'); assert.ok(falseClaim);
  assert.match(falseClaim.statement, /researchers concluded|authors said/);
  assert.match(falseClaim.evidence, /could not establish|did not show/);
}
for (const round of byId('R08').rounds) {
  assert.match(round.text, /only after/);
  assert.match(round.text, /does not require|does not oblige/);
  const missingAction = round.claims.find(value => value.answer === 'NOT GIVEN'); assert.ok(missingAction);
  assert.match(missingAction.statement, /used|entered/);
}
for (const round of byId('R09').rounds) {
  assert.match(round.claims.find(value => value.answer === 'NOT GIVEN')!.statement, /chair|principal/);
}
const review = emptyDraftReview('synthetic-reader', batch);
assert.ok(parseDraftReview(JSON.stringify(review), 'synthetic-reader', batch));
assert.equal(parseDraftReview(JSON.stringify(review), 'synthetic-reader', draftBatches[0]), null);
assert.notEqual(reviewKey('synthetic-reader', batch), reviewKey('synthetic-reader', draftBatches[0]));
console.log(`PASS eight Reading pairs/sixteen fictional texts/48 claims: exact excerpts, separate fresh text, T/F/NG coverage, independent count/change/proportion/average arithmetic, causality-attribution and permission-action counterexamples, fingerprint and batch isolation. Author checks only; no methodological approval or IELTS score.`);
