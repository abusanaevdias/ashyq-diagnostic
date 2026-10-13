import assert from 'node:assert/strict';
import fs from 'node:fs';
import crypto from 'node:crypto';
import { parseDraftTask2, task2Words } from '../src/lib/trainers/draft-task2';
import { parseDraftWriting, nextDraftWriting } from '../src/lib/trainers/draft-writing';
import { parseDraftReading } from '../src/lib/trainers/draft-reading';
import { parseDraftMath } from '../src/lib/trainers/draft-math';
import { draftBatches, emptyDraftReview, parseDraftReview, reviewKey, type DraftBatch } from '../src/lib/trainers/draft-review';
const proposed=JSON.parse(fs.readFileSync(process.argv[2]??'src/data/trainer-drafts/batch-01.json','utf8')) as DraftBatch;
const archive=JSON.parse(fs.readFileSync('src/data/trainer-draft-archives/batch-01-v1.json','utf8')) as DraftBatch;
assert.equal(archive.version,'1.0');assert.equal(proposed.version,'2.0');
assert.equal(archive.content_sha256,'2854e1937321d3472b1d432578d135372768d35122ccad7959ae49a5dd32c422');
for(const b of [archive,proposed])assert.equal(crypto.createHash('sha256').update(JSON.stringify(b.units)).digest('hex'),b.content_sha256);
assert.equal(proposed.units.length,12);assert.equal(proposed.methodically_approved,false);assert.notEqual(proposed.content_sha256,archive.content_sha256);
assert.deepEqual(proposed.units.map(u=>u.id),archive.units.map(u=>u.id));
const all=[...draftBatches.filter(b=>b.batch!=='01'),proposed].flatMap(b=>b.units);assert.equal(all.length,100);assert.equal(new Set(all.map(u=>u.id)).size,100);assert.ok(all.every(u=>'exercise_data' in u&&u.exercise_data));
const reviewer='synthetic-legacy-review';
const old=emptyDraftReview(reviewer,archive);old.decisions.W01={decision:'recommend',attested:true,comment:'Synthetic old-source recommendation',savedAt:'2026-10-13T00:00:00Z'};
assert.ok(parseDraftReview(JSON.stringify(old),reviewer,archive));assert.equal(parseDraftReview(JSON.stringify(old),reviewer,proposed),null);assert.notEqual(reviewKey(reviewer,archive),reviewKey(reviewer,proposed));
const current=emptyDraftReview(reviewer,proposed);assert.deepEqual(current.decisions,{});assert.equal(parseDraftReview(JSON.stringify(current),reviewer,archive),null);assert.equal(parseDraftReview(JSON.stringify(old),'another-account',archive),null);
let spans=0;
for(const u of proposed.units){
  assert.equal(u.status,'DRAFT');const value=u.exercise_data as {kind:string;publication_ready:boolean};assert.equal(value.publication_ready,false);
  if(u.id.startsWith('W')){
    const pair=parseDraftTask2(value);assert.ok(pair,u.id);
    const oldUnit=archive.units.find(v=>v.id===u.id)!;
    assert.equal(pair.rounds[0].text,oldUnit.student_markdown.split('### Учебное эссе\n\n')[1].split('\n\n### Твои действия')[0]);assert.equal(pair.rounds[0].languageOnly,oldUnit.language_only_markdown);
    assert.ok(!u.student_markdown.includes(pair.rounds[1].prompt),'fresh essay prompt not disclosed');
    for(const r of pair.rounds){
      assert.ok(task2Words(r.text)>=250&&task2Words(r.text)<=600);assert.ok(task2Words(r.example)>=250);
      assert.equal(r.languageOnly.split('\n\n')[0],r.example.split('\n\n')[0],'argument development preserves the language-corrected introduction');
      assert.equal(r.text.split('\n\n').at(-1),r.example.split('\n\n').at(-1),'conclusion retained');
      assert.notEqual(r.languageOnly,r.example);assert.ok(r.languageOnly.includes(r.argument.before));assert.ok(!r.example.includes(r.argument.before));
      assert.ok(r.issues.every(i=>r.text.split(i.before).length===2&&i.alternatives.includes(i.after)));spans+=r.issues.length;
      for(const malformed of [{...value,publication_ready:true},{...value,rounds:[r,r]},{...value,rounds:[{...r,languageOnly:r.text},pair.rounds[1]]}])assert.equal(parseDraftTask2(malformed),null);
    }
    if(u.id==='W02'){assert.ok(pair.rounds[0].example.includes('homework is harmful and should never be given'));assert.ok(pair.rounds[0].criteria[0].note.includes('остаётся'));assert.ok(pair.rounds[0].argument.explanation.includes('should never be given'));}
  }else if(u.id.startsWith('D')){
    const item=parseDraftWriting(value);assert.ok(item,u.id);const next=nextDraftWriting(item,all.map(v=>'exercise_data' in v?v.exercise_data:undefined));assert.ok(next);assert.equal(next.mode,item.mode);assert.notEqual(next.id,item.id);
    if(item.mode==='grammar'){const before=u.id==='D03'?'have':'advices',after=u.id==='D03'?'has':'advice';assert.equal(item.example,item.source[0].replace(before,after));}
    if(item.mode==='argument')for(const text of [item.example,...item.accepted_alternatives])assert.ok(task2Words(text)>=50&&task2Words(text)<=70,`${u.id}: complete50–70word example`);
    assert.equal(parseDraftWriting({...value,example:'A different prepared key'}),null);
  }else if(u.id.startsWith('R')){
    const pair=parseDraftReading(value);assert.ok(pair,u.id);assert.equal(pair.rounds.length,2);
    for(const round of pair.rounds){assert.equal(round.claims.length,3);assert.deepEqual([...round.claims.map(c=>c.answer)].sort(),['FALSE','NOT GIVEN','TRUE']);assert.ok(round.claims.every(c=>round.text.includes(c.evidence)));}
    assert.ok(!u.student_markdown.includes(pair.rounds[1].text));
    assert.equal(parseDraftReading({...value,rounds:[pair.rounds[0],pair.rounds[0]]}),null);
  }else if(u.id.startsWith('M')){
    const pair=parseDraftMath(value);assert.ok(pair,u.id);assert.equal(pair.family,'forensics');
    const expected=u.id==='M01'?[(132-36)/12,(124-34)/10]:[80*120*75/10000,200*110*90/10000];assert.deepEqual(pair.rounds.map(r=>r.answer),expected);
    assert.deepEqual(pair.rounds.map(r=>r.first_invalid),u.id==='M01'?[1,1]:[2,2]);assert.ok(!u.student_markdown.includes(pair.rounds[1].prompt));
    for(const round of pair.rounds)assert.equal(parseDraftMath({...value,rounds:[{...round,first_invalid:0},pair.rounds[1]]}),null);
  }else assert.fail('Unexpected legacy ID');
}
assert.equal(spans,29);
console.log('PASS proposed legacy v2: exact archived v1/old-source review isolation, same12 IDs/100 structured DRAFT inventory, four full essays29targets and explicit remaining argument, six drills/full50–70word examples, four Reading texts12claims, four Math independent keys and malformed inputs. No old recommendation migrates; no methodological approval/publication.');
