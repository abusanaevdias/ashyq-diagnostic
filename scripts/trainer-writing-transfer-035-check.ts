import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import {draftArchives,draftBatches} from '../src/lib/trainers/draft-review';
import {trainerBank} from '../src/lib/trainers/bank-sources';
import {parseDraftWriting,nextDraftWriting} from '../src/lib/trainers/draft-writing';
import {bankWritingPair} from '../src/lib/trainers/bank-writing-state';
import {publishedBankSources,writingPublicationUnitIds} from '../src/lib/trainers/bank-publication';
import {approvalMaterial} from '../src/lib/trainers/approval-material';

assert.deepEqual(trainerBank.errors,[]);assert.equal(trainerBank.sources.length,108);assert.equal(publishedBankSources.length,0);
for(const batch of [...draftBatches,...draftArchives])assert.equal(crypto.createHash('sha256').update(JSON.stringify(batch.units)).digest('hex'),batch.content_sha256);
const sources=trainerBank.sources.filter(s=>s.exercise.type==='writing-drill');assert.equal(sources.length,24);
const keys=new Set<number>();
for(const source of sources){
 const item=source.exercise.type==='writing-drill'?source.exercise.value:null;assert.ok(item?.transfer&&item.transfer_goal);
 const previous=draftArchives.find(b=>b.batch===source.ref.batchId&&String(b.version)===(source.ref.batchId==='01'?'3':'2'))!;
 const old=parseDraftWriting(previous.units.find(u=>u.id===item.id)!.exercise_data)!;
 const {transfer,transfer_goal,...unchanged}=item;assert.deepEqual(unchanged,old,'A preserved exactly; only B/target added');
 const pair=bankWritingPair(source)!;assert.equal(pair[1].id,`${item.id}-B`);assert.deepEqual(pair[1],transfer);assert.equal(nextDraftWriting(item,[item])?.id,transfer.id);assert.equal(nextDraftWriting(item,[]),null);
 assert.deepEqual(writingPublicationUnitIds(pair),[item.id]);
 assert.deepEqual(writingPublicationUnitIds([old,transfer]),[old.id,transfer.id],'legacy cross-module pairing still needs separate receipts');
 assert.deepEqual(writingPublicationUnitIds([item,{...transfer,title:'Unbound child'}]),[item.id,transfer.id],'mismatched child cannot use embedded receipt');
 assert.ok(transfer.task.includes('на английском'));assert.equal(transfer.mode,item.mode);assert.notDeepEqual(transfer.source,item.source);assert.notEqual(transfer.example,item.example);assert.equal(transfer.choices.filter(c=>c.best).length,1);keys.add(transfer.choices.findIndex(c=>c.best));
 const material=approvalMaterial(source);assert.equal(material.rounds.length,2);assert.ok(material.rounds[1].student.includes(transfer.source[0]));assert.ok(material.rounds.every(r=>r.teacher.includes(transfer_goal)));assert.ok(!material.rounds[1].student.includes(transfer.example));
 for(const invalid of [{...item,transfer:undefined},{...item,transfer_goal:undefined},{...item,transfer:{...transfer,id:item.id}},{...item,transfer:{...transfer,transfer_goal:'nested'}},{...item,transfer:{...transfer,source:item.source}},{...item,transfer:{...transfer,example:item.example}}])assert.equal(parseDraftWriting(invalid),null);
}
assert.equal(keys.size,3,'correct options are not always in one position');
const byId=(id:string)=>sources.find(s=>s.ref.unitId===id)!;
const child=(id:string)=>bankWritingPair(byId(id))![1];
assert.ok(child('D03').example.includes('Each of the volunteers')&&child('D03').example.includes('has'));
assert.ok(child('D13').example.includes('The number of visitors')&&child('D13').example.includes('has'));
assert.ok(child('D15').example.includes('must wear')&&child('D15').example.includes('have to check'));
assert.ok(child('D16').example.includes('an hour')&&child('D16').example.includes('a European'));
assert.ok(child('D18').example.includes('shorter and more convenient'));
console.log('PASS24 embedded Writing A→B targets, exact A preservation, distinct B/English/three key positions, sound/modal/comparative contrasts, source fingerprints, corrupt/nested fail-closed, two-round reviewer export and zero inferred publication. This does not grade free text or establish learning transfer.');
