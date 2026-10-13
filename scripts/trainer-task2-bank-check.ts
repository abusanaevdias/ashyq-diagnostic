import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import batch from '../src/data/trainer-drafts/batch-08.json';
import batch13 from '../src/data/trainer-drafts/batch-13.json';
import { draftBatches, emptyDraftReview, reviewKey } from '../src/lib/trainers/draft-review';
import { mentionsTask2Issue, parseDraftTask2, task2Words } from '../src/lib/trainers/draft-task2';

assert.equal(batch.methodically_approved,false); assert.equal(batch.units.length,3);
assert.equal(crypto.createHash('sha256').update(JSON.stringify(batch.units)).digest('hex'),batch.content_sha256);
assert.equal(batch13.methodically_approved,false); assert.equal(batch13.units.length,3);
assert.equal(crypto.createHash('sha256').update(JSON.stringify(batch13.units)).digest('hex'),batch13.content_sha256);
const prompts = new Set<string>(), texts = new Set<string>();
for (const unit of [...batch.units,...batch13.units]) {
  assert.equal(unit.status,'DRAFT'); const pair=parseDraftTask2(unit.exercise_data);assert.ok(pair);
  assert.equal(pair.rounds.length,2);
  for(const r of pair.rounds) {
    assert.ok(!prompts.has(r.prompt)&&!texts.has(r.text));prompts.add(r.prompt);texts.add(r.text);
    assert.equal(r.issues.length,6);assert.ok(task2Words(r.text)>=250&&task2Words(r.text)<=350);assert.ok(task2Words(r.example)>=250);
    assert.equal(r.text.split('\n\n').length,4);assert.equal(r.example.split('\n\n').length,4);
    // Language-only changes must leave the deliberately weak argument intact.
    assert.ok(r.languageOnly.includes(r.argument.before)); assert.ok(!r.example.includes(r.argument.before));
    assert.equal(r.languageOnly.split('\n\n')[0],r.example.split('\n\n')[0]);
    assert.equal(r.languageOnly.split('\n\n').at(-1),r.example.split('\n\n').at(-1),'stance/conclusion preserved');
    for(const i of r.issues) {
      assert.equal(mentionsTask2Issue([{quote:i.before,replacement:'deliberately wrong',reason:'synthetic'}],i),true,'mentioned does not mean correct');
      assert.equal(mentionsTask2Issue([{quote:'unrelated excerpt',replacement:i.after,reason:'synthetic'}],i),false,'replacement alone cannot invent a found source');
      assert.ok(i.why.length>10&&i.alternatives.length>0);
    }
  }
  assert.ok(!unit.student_markdown.includes(pair.rounds[1].prompt),'fresh worksheet hidden');
  assert.equal(emptyDraftReview('fixture',batch).source_sha256,batch.content_sha256);
  assert.notEqual(reviewKey('fixture',batch),reviewKey('fixture',draftBatches[0]));
}
const original=batch.units[0].exercise_data;
const mutate=(fn:(v: typeof original)=>void)=>{const value=structuredClone(original);fn(value);return value;};
const invalid:unknown[]=[null,[],{}, {...original,publication_ready:true}, {...original,difficulty_status:'CALIBRATED'}, {...original,rounds:[original.rounds[0],original.rounds[0]]},
  mutate(v=>{v.rounds[0].issues[0].before='not in text';}),mutate(v=>{v.rounds[0].issues[1].id=v.rounds[0].issues[0].id;}),mutate(v=>{v.rounds[0].issues[1]=structuredClone(v.rounds[0].issues[0]);}),
  mutate(v=>{v.rounds[0].languageOnly+=' untracked change';}),mutate(v=>{v.rounds[0].example=v.rounds[0].languageOnly;}),mutate(v=>{v.rounds[0].criteria.pop();}),mutate(v=>{v.rounds[0].argument.before='not in source';}),mutate(v=>{v.rounds[0].issues[0].alternatives=[];})];
invalid.forEach(value=>assert.equal(parseDraftTask2(value),null));
// Individually reviewed collocation/parallelism edge cases; don't teach blanket bans.
assert.ok(batch.units[1].exercise_data.rounds[1].issues.some(i=>i.why.includes('relevant for не следует автоматически')));
assert.ok(batch.units[2].exercise_data.rounds[1].issues.some(i=>i.why.includes('A person still struggles')));
assert.ok(batch.units[0].exercise_data.rounds[0].issues.some(i=>i.why.includes('не универсальный запрет will')));
assert.equal(prompts.size,12);
for (const unit of batch13.units) {
  for (const round of unit.exercise_data.rounds) {
    assert.ok(round.criteria.every(criterion => criterion.note.length > 80));
    assert.ok(unit.teacher_markdown.includes(round.argument.explanation));
    assert.ok(round.issues.every(value=>unit.teacher_markdown.includes(value.why)));
    const changed = structuredClone(unit.exercise_data);
    changed.rounds[0].text = 'short text'; assert.equal(parseDraftTask2(changed),null);
  }
  assert.notEqual(reviewKey('fixture',batch13),reviewKey('fixture',batch));
}
assert.equal(batch13.units[0].exercise_data.rounds[0].issues[1].before,'without to travel to school');
assert.ok(batch13.units[0].exercise_data.rounds[0].issues.some(value=>value.why.includes('с to или без to')));
assert.ok(batch13.units[2].exercise_data.rounds[0].issues.some(value=>value.why.includes('без инверсии')));
assert.ok(batch13.units[2].exercise_data.rounds[1].criteria[0].note.includes('потенциально небезопасную'));
console.log('PASS six original Task2 pairs/twelve full essays/72 target spans: exact minimal transformations, separately developed arguments, unchanged stance/conclusions, alternatives and non-universal grammar boundaries, fresh isolation, malformed-source and short-text cases, fingerprint/review isolation. DRAFT/manual free response, no calibrated band or approval.');
