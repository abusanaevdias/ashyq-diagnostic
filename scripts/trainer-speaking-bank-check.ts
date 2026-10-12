import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import batch from '../src/data/trainer-drafts/batch-07.json';
import { draftBatches, emptyDraftReview, parseDraftReview, reviewKey } from '../src/lib/trainers/draft-review';

assert.equal(batch.units.length, 8);
assert.equal(batch.methodically_approved, false);
assert.equal(crypto.createHash('sha256').update(JSON.stringify(batch.units)).digest('hex'), batch.content_sha256);
const ids = draftBatches.flatMap(value => value.units.map(unit => unit.id));
assert.equal(new Set(ids).size, ids.length);
const prompts: string[] = [];
for (const bank of draftBatches) for (const unit of bank.units) {
  const data = 'exercise_data' in unit ? unit.exercise_data : null;
  if (!data || typeof data !== 'object' || !('topics' in data) || !Array.isArray(data.topics)) continue;
  for (const topic of data.topics) if (topic && typeof topic === 'object' && 'prompt' in topic && typeof topic.prompt === 'string') prompts.push(topic.prompt);
}
assert.equal(new Set(prompts).size, prompts.length, 'no duplicate Speaking prompt across authored batches');
for (const unit of batch.units) {
  assert.equal(unit.status, 'DRAFT');
  const data = unit.exercise_data;
  assert.equal(data.kind, 'speaking-pair-v1');
  assert.equal(data.publication_ready, false);
  assert.equal(data.difficulty_status, 'AUTHOR_ESTIMATE_UNCALIBRATED');
  assert.equal(data.topics.length, 2);
  assert.notEqual(data.topics[0].prompt, data.topics[1].prompt);
  assert.ok(unit.student_markdown.includes(data.topics[0].prompt));
  assert.ok(!unit.student_markdown.includes(data.topics[1].prompt), 'fresh topic hidden from first worksheet');
  assert.match(unit.student_markdown, /вымышленную ситуацию/);
  assert.match(unit.student_markdown, /личные имена, адреса и чувствительные подробности не нужны/i);
  assert.match(unit.teacher_markdown, /По одному письменному плану произношение не оценивать/);
  assert.match(unit.teacher_markdown, /Свободная|Все наблюдения требуют ручного/);
  for (const topic of data.topics) {
    assert.equal(topic.cues.length, 4);
    assert.equal(topic.ideas.length, 3);
    assert.equal(new Set(topic.cues).size, 4);
    assert.equal(new Set(topic.ideas).size, 3);
    assert.ok(topic.followup.length > 20);
    assert.ok(topic.cues.every(cue => cue.trim().length > 8));
    assert.ok(topic.ideas.every(idea => idea.trim().length > 20));
    for (const idea of topic.ideas) assert.ok(!unit.student_markdown.includes(idea), 'support ideas not shown before independent attempt');
    assert.ok(unit.teacher_markdown.includes(topic.prompt) && unit.teacher_markdown.includes(topic.followup));
  }
}
assert.equal(new Set(batch.units.map(unit => unit.exercise_data.skill)).size, 8);
const find = (id: string) => { const unit = batch.units.find(unit => unit.id === id); assert.ok(unit); return unit; };
assert.match(find('S08').teacher_markdown, /Тема не требует уже совершённого изменения/);
assert.match(find('S10').teacher_markdown, /Возможная причина не должна оцениваться как факт/);
assert.match(find('S11').teacher_markdown, /Гипотетический ответ допустим/);
assert.match(find('S12').teacher_markdown, /План не выдаётся за состоявшийся результат/);
const review = emptyDraftReview('synthetic-speaker', batch);
assert.ok(parseDraftReview(JSON.stringify(review), 'synthetic-speaker', batch));
assert.equal(parseDraftReview(JSON.stringify(review), 'synthetic-speaker', draftBatches[1]), null);
assert.notEqual(reviewKey('synthetic-speaker', batch), reviewKey('synthetic-speaker', draftBatches[1]));
console.log('PASS eight Speaking DRAFT pairs/sixteen original topics, eight discourse skills, distinct prompts across banks, four cues/three post-attempt ideas/follow-up per topic, fresh-topic isolation, optional fiction/privacy/manual-audio boundaries, explicit plan/observation/causality alternatives and source/review fingerprint isolation. No pronunciation, band, methodological approval or publication claim.');
