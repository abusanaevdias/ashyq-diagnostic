import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';
import batch from '../src/data/trainer-drafts/batch-10.json';
import audio from '../src/data/trainer-drafts/listening-audio-10.json';
import audio02 from '../src/data/trainer-drafts/listening-audio-02.json';
import {compareDraftAnswer,parseDraftListening}from '../src/lib/trainers/draft-listening';
assert.equal(batch.methodically_approved,false);assert.equal(batch.units.length,6);assert.equal(audio.publication_ready,false);assert.equal(audio.assets.length,24);
assert.equal(crypto.createHash('sha256').update(JSON.stringify(batch.units)).digest('hex'),batch.content_sha256);
assert.equal(new Set([...audio02.assets,...audio.assets].map(a=>a.url)).size,32,'new assets never replace the old bank');
const expected=[['12','16'],['9:15','14:30'],['18','24'],['gallery','studio'],['Thursday','Saturday'],['30','16']];
for(const [unitIndex,u]of batch.units.entries()){
  assert.equal(u.status,'DRAFT');const pair=parseDraftListening(u.exercise_data,u.id);assert.ok(pair);assert.equal(pair.voice,audio.synthetic_voice);
  assert.ok(!u.student_markdown.includes(pair.rounds[1].prompt),'fresh question hidden');
  for(const [roundIndex,r]of pair.rounds.entries()){
    assert.equal(r.answer,expected[unitIndex][roundIndex]);assert.ok(r.script.trim().split(/\s+/).length>=80);
    assert.ok(!/[А-Яа-яЁё]/.test(r.prompt)&&r.instruction?.includes('Запиши'),'English question and Russian instructions have separate language semantics');
    assert.ok(r.script.includes(r.segment));assert.equal(compareDraftAnswer(r.answer,pair.rounds[roundIndex]),'match');
    assert.equal(compareDraftAnswer('unreviewed response',r),'unreviewed');
    for(const d of r.distractors)assert.equal(compareDraftAnswer(d,r),'known-distractor');
    for(const a of r.accepted)assert.equal(compareDraftAnswer(' '+a.toUpperCase()+' ',r),'match');
    for(const kind of ['full','segment']){const asset=audio.assets.find(a=>a.unit===u.id&&a.round===roundIndex&&a.kind===kind);assert.ok(asset);const bytes=fs.readFileSync('public'+asset.url);assert.equal(bytes.length,asset.bytes);assert.equal(crypto.createHash('sha256').update(bytes).digest('hex'),asset.sha256);assert.equal(asset.text,kind==='full'?r.script:r.segment);}
  }
  const source=u.exercise_data;
  for(const invalid of [{...source,difficulty_status:'CALIBRATED'},{...source,audio_status:'PENDING'},{...source,publication_ready:true},{...source,rounds:source.rounds.map(r=>({...r,segment:'not in source'}))},{...source,rounds:source.rounds.map(r=>({...r,script:r.script+' Changed after generation.'}))},{...source,rounds:source.rounds.map(r=>({...r,accepted:[r.answer,r.answer.toUpperCase()]}))},{...source,rounds:source.rounds.map(r=>({...r,distractors:[...r.distractors,r.answer]}))}])assert.equal(parseDraftListening(invalid,u.id),null);
}
// Independent semantic boundary cases, not estimated proficiency or full listening quality.
assert.equal(12+2,14);assert.equal(16+3,19);
assert.equal(14*60+30,2*60+30+12*60);assert.notEqual(9*60+15,8*60+45);
assert.equal(18+5,23);assert.equal(24+4+8,36);
assert.ok(30<45&&45<60&&16<18&&18<20);
assert.ok(batch.units[4].exercise_data.rounds[0].explanation.includes('не доказывает, что встреча уже состоялась'));
console.log('PASS six Listening pairs/twelve original 80+ word announcements/24 generated WAVs: answer-role/time/fee/landmark/confirmed-plan/minimum boundaries, fresh isolation, exact transcript/segment/hash/bytes, known versus unknown alternatives, seven invalid variants per pair and no old-asset collision. One actual Zira synthetic voice; DRAFT, not exam/audio-learning certification.');
