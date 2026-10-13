import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import batch from '../src/data/trainer-drafts/batch-12.json';
import original from '../src/data/trainer-drafts/batch-04.json';
import { draftBatches, emptyDraftReview, parseDraftReview, reviewKey } from '../src/lib/trainers/draft-review';
import { draftSatChoiceText, parseDraftSatPair } from '../src/lib/trainers/draft-sat-rw';

assert.equal(batch.units.length, 8); assert.equal(batch.methodically_approved, false);
assert.equal(batch.content_sha256, crypto.createHash('sha256').update(JSON.stringify(batch.units)).digest('hex'));
assert.ok(draftBatches.some(value => value.batch === batch.batch && value.content_sha256 === batch.content_sha256));
const allIds = draftBatches.flatMap(value => value.units.map(unit => unit.id));
assert.equal(new Set(allIds).size, allIds.length);
assert.equal(batch.units.filter(unit => unit.exercise_data.trainer === 'sat-optionless').length, 4);
const keys: Record<string, number[]> = { RW09:[0,2], RW10:[1,3], RW11:[2,0], RW12:[1,3], RW13:[2,0], RW14:[3,1], RW15:[1,3], RW16:[0,2] };
const passages = new Set(original.units.flatMap(unit => unit.exercise_data.rounds.map(round => round.passage)));
const keyCount = [0,0,0,0];
for (const unit of batch.units) {
  assert.equal(unit.status, 'DRAFT');
  const pair = parseDraftSatPair(unit.exercise_data); assert.ok(pair, unit.id);
  assert.equal(unit.student_markdown.includes(pair.rounds[1].passage), false);
  for (const [index, round] of pair.rounds.entries()) {
    assert.equal(round.key, keys[unit.id][index]); keyCount[round.key]++;
    assert.equal(passages.has(round.passage), false); passages.add(round.passage);
    assert.ok(round.passage.includes(round.evidence));
    assert.ok(unit.teacher_markdown.includes(round.evidence));
    for (const choice of round.choices) {
      assert.ok(unit.teacher_markdown.includes(choice.feedback));
      assert.equal(choice.best, choice.trap === 'none');
    }
    for (const changes of [{key:4}, {evidence:'This sentence is absent.'}, {choices:[]}, {choices:round.choices.map(choice=>({...choice,best:true}))}]) {
      const mutation = structuredClone(unit.exercise_data);
      Object.assign(mutation.rounds[index], changes);
      assert.equal(parseDraftSatPair(mutation), null);
    }
  }
  const review = JSON.stringify(emptyDraftReview('fixture', batch));
  for (const other of draftBatches.filter(value=>value.batch !== batch.batch)) {
    assert.notEqual(reviewKey('fixture', batch), reviewKey('fixture', other));
    assert.equal(parseDraftReview(review, 'fixture', other), null);
  }
}
assert.deepEqual(keyCount,[4,4,4,4]);
assert.equal(draftSatChoiceText(';'), 'Semicolon (;)');
assert.equal(draftSatChoiceText(','), 'Comma (,)');
assert.equal(draftSatChoiceText('.'), 'Full stop (.)');
assert.equal(draftSatChoiceText('[no punctuation]'), 'No punctuation (leave the gap empty)');
assert.equal(draftSatChoiceText('Original sentence'), 'Original sentence');
const round = (id: string) => batch.units.flatMap(unit=>unit.exercise_data.rounds).find(value=>value.id===id)!;
assert.equal(round('RW13-A').choices[2].text,'limited');
assert.equal(round('RW13-B').choices[0].text,'altered');
assert.equal(round('RW14-A').choices[3].text,'tentative');
assert.equal(round('RW14-B').choices[1].text,'sufficient');
for (const id of ['RW15-A','RW15-B']) {
  const value = round(id);
  assert.equal(value.choices[value.key].text, ';');
  assert.ok(value.choices.some(choice=>choice.text==='.' && choice.trap==='capitalisation'));
  const complete = value.passage.replace('____',value.choices[value.key].text);
  assert.ok(complete.includes('; however,') || complete.includes('; nevertheless,'));
}
for (const id of ['RW16-A','RW16-B']) assert.equal(round(id).choices[round(id).key].text, ',');
assert.ok(round('RW11-A').passage.includes('Sunday mornings'));
assert.ok(round('RW11-A').choices[2].text.includes('better access'));
assert.ok(round('RW12-A').choices[1].text.includes('beyond the conditions'));
assert.ok(round('RW12-B').choices[3].text.includes('excludes some relevant residents'));
assert.ok(round('RW10-A').choices[1].text.includes('did not cover'));
assert.ok(round('RW10-B').choices[3].text.includes('untested demand'));
assert.ok(round('RW09-A').evidence.includes('useful display need not contain many objects'));
assert.ok(round('RW09-B').evidence.includes('small adjustment can improve'));
console.log(`PASS eight new SAT R&W pairs/sixteen texts, eight skills, four optionless/four distractor, balanced keys, exact relevant evidence, rhetorical/cross-text/context/boundary counterexamples, 64 malformed rounds, fresh isolation and ${allIds.length} unique DRAFT modules. Semantic source review is authored reasoning, not methodological or learner-quality certification.`);
