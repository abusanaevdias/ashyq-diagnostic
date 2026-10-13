import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import {trainerBank,type BankSource} from '../src/lib/trainers/bank-sources';
import {bankReadingFingerprint,emptyBankReadingState,validBankReadingState,type BankReadingState} from '../src/lib/trainers/bank-reading-state';
import {archiveBankEntry,createBankEntry,emptyBankRecord,parseBankRecord,validBankSnapshot} from '../src/lib/trainers/bank-records';
import {bankSnapshotComplete,bankSnapshotFingerprint,emptyBankSnapshot} from '../src/lib/trainers/bank-snapshots';
import {emptyBankTask2State} from '../src/lib/trainers/bank-task2-state';
const sources=trainerBank.sources.filter(source=>source.exercise.type==='reading');assert.equal(sources.length,10);
const reverse=(v:unknown):unknown=>Array.isArray(v)?v.map(reverse):v&&typeof v==='object'?Object.fromEntries(Object.entries(v).reverse().map(([key,value])=>[key,reverse(value)])):v;
function fixture(source:BankSource):BankReadingState{
 if(source.exercise.type!=='reading')throw new Error('Reading fixture');
 const attempts=source.exercise.value.rounds.map(round=>({first:round.claims.map(claim=>({choice:claim.answer,excerpt:claim.answer==='NOT GIVEN'?'':claim.evidence,reason:'Synthetic reasoning quality is unknown.'})),repair:round.claims.map(claim=>claim.answer),reflection:'Synthetic plan after feedback.'}));
 return {type:'reading',started:true,round:1,report:true,responses:structuredClone(attempts[1].first),frozen:structuredClone(attempts[1].first),repairs:[...attempts[1].repair],reflection:attempts[1].reflection,attempts};
}
let rejected=0;
for(const source of sources){
 if(source.exercise.type!=='reading')throw new Error('Reading source');const pair=source.exercise.value,empty=emptyBankReadingState(),done=fixture(source);
 assert.ok(validBankReadingState(empty,pair));assert.ok(validBankSnapshot(source,done));assert.ok(bankSnapshotComplete(done));assert.equal(bankSnapshotComplete(empty),false);
 assert.deepEqual(emptyBankSnapshot(source),empty);assert.ok(validBankReadingState(reverse(done),pair));assert.equal(bankReadingFingerprint(done),bankSnapshotFingerprint(reverse(done) as BankReadingState));
 const partial={...empty,started:true,responses:empty.responses.map((row,i)=>i?row:{...row,excerpt:'Unfinished citation not yet source-checked.',reason:'Я'.repeat(600)})};assert.ok(validBankSnapshot(source,partial));
 const revealed={...empty,started:true,responses:done.attempts[0].first,frozen:done.attempts[0].first};assert.ok(validBankSnapshot(source,revealed));
 const wrongRepair={...revealed,repairs:['FALSE','FALSE','FALSE'],reflection:'Partial repair may still be wrong.'};assert.ok(validBankSnapshot(source,wrongRepair),'wrong intermediate repair can be saved, not graded');
 const fresh={...empty,started:true,round:1,attempts:[done.attempts[0]]};assert.ok(validBankSnapshot(source,fresh));
 const bad:unknown[]=[null,[],{}, {...empty,type:'task2'}, {...partial,started:false}, {...empty,round:2}, {...empty,extra:true}, {...partial,responses:[]}, {...partial,responses:partial.responses.map(row=>({...row,extra:true}))}, {...partial,responses:partial.responses.map(row=>({...row,reason:'x'.repeat(601)}))}, {...partial,responses:partial.responses.map(row=>({...row,choice:'MAYBE'}))}, {...partial,reflection:'before reveal'}, {...partial,repairs:['TRUE','','']}, {...revealed,frozen:revealed.frozen.map(row=>({...row,excerpt:'Not contained in this passage.'}))}, {...revealed,responses:revealed.responses.map(row=>({...row,reason:'Changed after freezing'}))}, {...revealed,frozen:revealed.frozen.map(row=>({...row,reason:' '}))}, {...revealed,frozen:revealed.frozen.map(row=>({...row,choice:'TRUE',excerpt:''})),responses:revealed.responses.map(row=>({...row,choice:'TRUE',excerpt:''}))}, {...done,round:0}, {...done,frozen:null}, {...done,report:false}, {...done,attempts:[]}, {...done,reflection:'changed current'}, {...done,attempts:done.attempts.map(a=>({...a,repair:['TRUE','TRUE','TRUE']}))}, {...done,attempts:done.attempts.map(a=>({...a,reflection:' '}))}, {...fresh,attempts:[done.attempts[1]]}, {...fresh,attempts:[{...done.attempts[0],extra:true}]}];
 for(const value of bad){assert.equal(validBankReadingState(value,pair),false,JSON.stringify(value));rejected++;}
 const entry=createBankEntry(source,done),record={...emptyBankRecord(source),revision:crypto.randomUUID(),checkpoint:entry};assert.ok(parseBankRecord(JSON.stringify(record),source));
 const archived=archiveBankEntry(record,entry);assert.equal(archived.checkpoint,null);assert.equal(archived.history.length,1);assert.equal(archiveBankEntry(archived,{...entry,id:crypto.randomUUID(),data:reverse(done) as BankReadingState}).history.length,1);
 for(const other of trainerBank.sources.filter(other=>other!==source)){assert.equal(parseBankRecord(JSON.stringify(record),other),null);if(other.exercise.type==='reading')assert.equal(validBankSnapshot({...source,exercise:other.exercise},fixture(other)),false,'trusted bundled passage required');}
 assert.equal(validBankSnapshot(source,emptyBankTask2State()),false);assert.equal(parseBankRecord(JSON.stringify({...record,checkpoint:{...entry,data:emptyBankTask2State()}}),source),null);
 const wide=structuredClone(done);for(const a of wide.attempts){a.reflection='\0'.repeat(600);a.first.forEach(row=>row.reason='\0'.repeat(600));}wide.responses=structuredClone(wide.attempts[1].first);wide.frozen=structuredClone(wide.responses);wide.reflection=wide.attempts[1].reflection;assert.ok(validBankSnapshot(source,wide));assert.ok(parseBankRecord(JSON.stringify({...record,checkpoint:createBankEntry(source,wide)}),source));
}
console.log(`PASS10 source-bound Reading state/record adapters; ${rejected} malformed/phase/source mutations rejected; partial typing, exact source quotes, frozen response equality, separate repair/fresh/report, wrong intermediate repair retained, strict complete keys, key-order dedupe, trusted source/Task2 isolation and escaped maximum text. Reasoning remains ungraded.`);
