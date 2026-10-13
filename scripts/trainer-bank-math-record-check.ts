import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import {trainerBank} from '../src/lib/trainers/bank-sources';
import {bankMathFingerprint,emptyBankMathState,validBankMathState,type BankMathAttempt,type BankMathState} from '../src/lib/trainers/bank-math-state';
import {parseDraftMathNumber} from '../src/lib/trainers/draft-math';
import {archiveBankEntry,createBankEntry,emptyBankRecord,parseBankRecord,validBankSnapshot} from '../src/lib/trainers/bank-records';
import {bankSnapshotFingerprint,emptyBankSnapshot,bankSnapshotComplete} from '../src/lib/trainers/bank-snapshots';
const sources=trainerBank.sources.filter(source=>source.exercise.type==='math');assert.equal(sources.length,16);
const reverse=(v:unknown):unknown=>Array.isArray(v)?v.map(reverse):v&&typeof v==='object'?Object.fromEntries(Object.entries(v).reverse().map(([key,value])=>[key,reverse(value)])):v;
let rejected=0;
for(const source of sources){
 if(source.exercise.type!=='math')throw new Error('Math');const pair=source.exercise.value,empty=emptyBankMathState();
 const attempts:BankMathAttempt[]=pair.rounds.map(()=>({working:'Synthetic original reasoning, not evaluated.',answer:' -123,5 ',numericAnswer:-123.5,choice:0,reflection:'Synthetic reflection after help.',repairedWorking:'Deliberately incorrect revised reasoning remains ungraded.',repairedAnswer:'987.25',repairedNumericAnswer:987.25}));
 const done:BankMathState={type:'math',started:true,round:1,report:true,working:attempts[1].working,answer:attempts[1].answer,choice:0,locked:true,checked:true,reflection:attempts[1].reflection,repairedWorking:attempts[1].repairedWorking,repairedAnswer:attempts[1].repairedAnswer,attempts};
 assert.ok(validBankSnapshot(source,done),'incorrect answers are valid saved work');assert.ok(validBankMathState(reverse(done),pair));assert.deepEqual(emptyBankSnapshot(source),empty);assert.equal(bankSnapshotFingerprint(reverse(done) as BankMathState),bankMathFingerprint(done));assert.ok(bankSnapshotComplete(done));assert.equal(bankSnapshotComplete(empty),false);
 const partial={...empty,started:true,working:'Unfinished equation',answer:'-'};assert.ok(validBankSnapshot(source,partial));
 const locked={...empty,started:true,working:'x=3',answer:' 0,25 ',locked:true,choice:pair.family==='method-switch'?0:null};assert.ok(validBankSnapshot(source,locked));
 const checked={...locked,checked:true,choice:0,repairedWorking:'Unfinished revision',repairedAnswer:'-'};assert.ok(validBankSnapshot(source,checked));
 const fresh={...empty,started:true,round:1,attempts:[attempts[0]]};assert.ok(validBankSnapshot(source,fresh));
 const bad:unknown[]=[null,[],{}, {...empty,type:'reading'}, {...partial,started:false}, {...empty,round:2}, {...empty,extra:true}, {...partial,working:'Я'.repeat(601)}, {...partial,answer:'1'.repeat(61)}, {...partial,choice:-1}, {...partial,choice:0.5}, {...partial,choice:99}, {...partial,checked:true}, {...partial,repairedWorking:'premature revision'}, {...partial,repairedAnswer:'2'}, {...partial,reflection:'premature reflection'}, {...locked,working:' '}, {...locked,answer:'1e3'}, {...locked,answer:'1/2'}, {...checked,locked:false}, {...done,round:0}, {...done,checked:false}, {...done,report:false}, {...done,attempts:[]}, {...done,reflection:'only current differs'}, {...done,attempts:attempts.map(a=>({...a,numericAnswer:123}))}, {...done,attempts:attempts.map(a=>({...a,repairedNumericAnswer:0}))}, {...done,attempts:attempts.map(a=>({...a,reflection:' '}))}, {...done,attempts:attempts.map(a=>({...a,choice:99}))}, {...done,attempts:attempts.map(a=>({...a,extra:true}))}];
 if(pair.family==='method-switch')bad.push({...locked,choice:null});else bad.push({...partial,choice:0});
 for(const value of bad){assert.equal(validBankMathState(value,pair),false,JSON.stringify(value));rejected++;}
 const entry=createBankEntry(source,done),record={...emptyBankRecord(source),revision:crypto.randomUUID(),checkpoint:entry};assert.ok(parseBankRecord(JSON.stringify(record),source));
 const archived=archiveBankEntry(record,entry);assert.equal(archived.history.length,1);assert.equal(archived.checkpoint,null);assert.equal(archiveBankEntry(archived,{...entry,id:crypto.randomUUID(),data:reverse(done) as BankMathState}).history.length,1);
 for(const other of trainerBank.sources.filter(other=>other!==source))assert.equal(parseBankRecord(JSON.stringify(record),other),null);
 const beyond={...locked,choice:8};assert.equal(validBankSnapshot({...source,exercise:{type:'math',value:{...pair,family:'forensics',rounds:pair.rounds.map(r=>({...r,steps:Array.from({length:10},()=>({statement:'Synthetic',valid:true,explanation:'Synthetic'}))}))}}},beyond),false,'caller exercise cannot increase trusted choice bound');
 const wide=structuredClone(done);wide.attempts.forEach(a=>{a.working='\0'.repeat(600);a.repairedWorking='\0'.repeat(600);a.reflection='\0'.repeat(600);});wide.working=wide.attempts[1].working;wide.repairedWorking=wide.attempts[1].repairedWorking;wide.reflection=wide.attempts[1].reflection;assert.ok(validBankSnapshot(source,wide));assert.ok(parseBankRecord(JSON.stringify({...record,checkpoint:createBankEntry(source,wide)}),source));
 assert.equal(parseDraftMathNumber(done.answer),attempts[1].numericAnswer);
}
console.log(`PASS16 Math adapters across three families; ${rejected} malformed/phase/source-choice mutations rejected, partial numbers, frozen first versus separate revised answers, exact numeric-string consistency, wrong repair retained, fresh/report invariants, key-order dedupe, trusted choice bounds and source isolation. No reasoning grade, score or duration invented.`);
