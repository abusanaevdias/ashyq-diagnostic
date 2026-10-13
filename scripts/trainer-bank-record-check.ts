import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import { trainerBank, type BankSource } from '../src/lib/trainers/bank-sources';
import { bankTask2Fingerprint, blankBankTask2Attempt, emptyBankTask2State, validBankTask2State, type BankTask2Attempt, type BankTask2State } from '../src/lib/trainers/bank-task2-state';
import { archiveBankEntry, bankRecordKey, createBankEntry, emptyBankRecord, MAX_BANK_HISTORY, MAX_BANK_RECORD_BYTES, MAX_BANK_SNAPSHOT_BYTES, parseBankRecord, validBankSnapshot, type BankRecord } from '../src/lib/trainers/bank-records';
import { utf8Bytes } from '../src/lib/trainers/checkpoints';

const sources=trainerBank.sources.filter(s=>s.exercise.type==='task2');assert.equal(sources.length,8);
function complete(source:BankSource):BankTask2State{
  assert.equal(source.exercise.type,'task2');if(source.exercise.type!=='task2')throw new Error('test source');
  const saved=source.exercise.value.rounds.map(r=>({corrections:[{quote:r.issues[0].before,replacement:'An intentionally wrong repair remains ungraded.',reason:'Synthetic independent explanation.'}],noIssues:false,argumentQuote:r.argument.before,argumentReason:'Synthetic argument reasoning, not a quality judgment.',revision:r.text,reflection:'Synthetic manual reflection after comparison.'}));
  return {type:'task2',started:true,index:1,revealed:true,result:true,attempt:structuredClone(saved[1]),saved,checked:true};
}
const reversed=(value:unknown):unknown=>Array.isArray(value)?value.map(reversed):value&&typeof value==='object'?Object.fromEntries(Object.entries(value).reverse().map(([key,v])=>[key,reversed(v)])):value;
let invalid=0;
for(const source of sources){
  if(source.exercise.type!=='task2')throw new Error('test source');const pair=source.exercise.value;
  const start=emptyBankTask2State(),done=complete(source);
  assert.ok(validBankTask2State(start,pair));assert.ok(validBankTask2State(reversed(start),pair),'object key order does not determine state validity');assert.ok(validBankTask2State(done,pair));assert.ok(validBankTask2State(reversed(done),pair));
  assert.equal(bankTask2Fingerprint(done),bankTask2Fingerprint(reversed(done) as BankTask2State));
  const typing={...start,started:true,attempt:{...blankBankTask2Attempt(),corrections:[{quote:'unfinished excerpt',replacement:'',reason:''}],argumentReason:'unfinished notes'}};
  assert.ok(validBankTask2State(typing,pair),'partial own text can be saved before reveal');
  const noFindings={...typing,revealed:true,attempt:{...done.saved[0],noIssues:true,corrections:[],revision:'',reflection:''}};
  assert.ok(validBankTask2State(noFindings,pair));
  const bad:unknown[]=[null,[],{}, {...start,type:'unknown'}, {...start,index:-1}, {...start,index:2}, {...start,index:NaN}, {...start,extra:true}, {...typing,started:false}, {...typing,checked:true}, {...typing,attempt:{...typing.attempt,revision:'premature revision'}}, {...typing,attempt:{...typing.attempt,reflection:'premature reflection'}}, {...typing,attempt:{...typing.attempt,corrections:[]}}, {...done,saved:[]}, {...done,index:0}, {...done,result:false}, {...done,revealed:false}, {...done,checked:false}, {...done,attempt:{...done.attempt,reflection:'changed only current version'}}, {...done,attempt:{...done.attempt,corrections:[{quote:'not in this source',replacement:'something',reason:'reason'}]}}, {...noFindings,attempt:{...noFindings.attempt,corrections:[{quote:'',replacement:'',reason:''}]}}, {...noFindings,attempt:{...noFindings.attempt,argumentQuote:'not in this source'}}, {...typing,attempt:{...typing.attempt,argumentQuote:'x'.repeat(2001)}}, {...typing,attempt:{...typing.attempt,corrections:Array(13).fill({quote:'',replacement:'',reason:''})}}, {...typing,attempt:{...typing.attempt,corrections:[{quote:'x'.repeat(1001),replacement:'',reason:''}]}}, {...typing,attempt:{...typing.attempt,corrections:[{quote:'',replacement:'x'.repeat(1501),reason:''}]}}, {...done,saved:[{...done.saved[0],revision:Array(249).fill('word').join(' ')},done.saved[1]]}, {...done,saved:[{...done.saved[0],argumentQuote:pair.rounds[1].argument.before},done.saved[1]]}];
  bad.push(JSON.parse(JSON.stringify(typing).replace('"type":','"__proto__":{"polluted":true},"type":')));
  for(const value of bad){assert.equal(validBankTask2State(value,pair),false);invalid++;}
  assert.ok(validBankSnapshot(source,done));
  const entry=createBankEntry(source,done,new Date('2026-10-13T00:00:00.000Z'));
  assert.notEqual(entry.data,done);assert.equal(entry.data.type,'task2');if(entry.data.type!=='task2')throw new Error('Unexpected adapter');assert.notEqual(entry.data.attempt,done.attempt);
  const record:BankRecord={...emptyBankRecord(source),revision:crypto.randomUUID(),checkpoint:entry};
  assert.equal(parseBankRecord(JSON.stringify(record).replace('"format":','"__proto__":{"polluted":true},"format":'),source),null);assert.equal(({} as Record<string,unknown>).polluted,undefined);
  assert.ok(parseBankRecord(JSON.stringify(record),source));assert.ok(parseBankRecord(JSON.stringify(reversed(record)),source));
  assert.equal(parseBankRecord(JSON.stringify({...record,limitations:'Verified official score'}),source),null);
  const archived=archiveBankEntry(record,entry);assert.equal(archived.checkpoint,null);assert.equal(archived.history.length,1);
  assert.equal(archiveBankEntry(archived,{...entry,id:crypto.randomUUID(),data:reversed(done) as BankTask2State}).history.length,1,'semantic duplicate does not inflate history');
  for(const wrong of sources.filter(s=>s!==source))assert.equal(parseBankRecord(JSON.stringify(record),wrong),null);
  for(const changed of [{...source,ref:{...source.ref,version:'99.0'}},{...source,ref:{...source.ref,contentHash:'0'.repeat(64)}}]){assert.equal(parseBankRecord(JSON.stringify(record),changed),null);assert.equal(validBankSnapshot(changed,done),false);}
  for(const broken of [null,'','{bad',JSON.stringify({...record,format:'ashyq-trainer-export-v1'}),JSON.stringify({...record,trainer:'reading-evidence'}),JSON.stringify({...record,revision:''}),JSON.stringify({...record,extra:'ignored?'}),JSON.stringify({...record,checkpoint:{...entry,id:'INVALID'}}),JSON.stringify({...record,checkpoint:{...entry,id:entry.id.toUpperCase()}}),JSON.stringify({...record,checkpoint:{...entry,savedAt:'13 October 2026'}}),JSON.stringify({...record,history:[entry,entry]}),JSON.stringify({...record,history:Array(21).fill(entry)}),JSON.stringify({...record,checkpoint:{...entry,data:{...done,index:2}}})])assert.equal(parseBankRecord(broken,source),null);
  assert.notEqual(bankRecordKey('actor-a',source.ref),bankRecordKey('actor-b',source.ref));assert.ok(bankRecordKey('actor:a/b',source.ref).includes('actor%3Aa%2Fb'));
}
const source=sources[0],done=complete(source);if(source.exercise.type!=='task2')throw new Error('test source');
// A caller-supplied exercise cannot redefine a genuine bundled reference.
const other=sources[1];assert.equal(validBankSnapshot({...source,exercise:other.exercise},complete(other)),false);
assert.equal(emptyBankRecord({...source,trainer:'reading-evidence'}).trainer,'writing-task2');
assert.equal(parseBankRecord(JSON.stringify({...emptyBankRecord(source),trainer:'reading-evidence'}),{...source,trainer:'reading-evidence'}),null);
const largeAttempt=(index:number):BankTask2Attempt=>({noIssues:false,corrections:Array.from({length:12},()=>({quote:source.exercise.type==='task2'?source.exercise.value.rounds[index].issues[0].before:'',replacement:'\u0000'.repeat(1500),reason:'\u0000'.repeat(1500)})),argumentQuote:source.exercise.type==='task2'?source.exercise.value.rounds[index].argument.before:'',argumentReason:'\u0000'.repeat(3000),revision:(Array(250).fill('word').join(' ')+' ').padEnd(24000,'\u0000'),reflection:'\u0000'.repeat(3000)});
const saved=[largeAttempt(0),largeAttempt(1)],large={...done,saved,attempt:structuredClone(saved[1])};assert.equal(large.attempt.revision.length,24000);
assert.ok(validBankSnapshot(source,large),'legal maximum-length escaped fields fit the snapshot budget');assert.ok(utf8Bytes(JSON.stringify(large))<MAX_BANK_SNAPSHOT_BYTES);
const largeEntry=createBankEntry(source,large),largeRecord={...emptyBankRecord(source),revision:crypto.randomUUID(),checkpoint:largeEntry};assert.ok(parseBankRecord(JSON.stringify(largeRecord),source));
assert.ok(utf8Bytes(JSON.stringify({...largeRecord,history:[largeEntry]}))>MAX_BANK_RECORD_BYTES);assert.equal(parseBankRecord(JSON.stringify({...largeRecord,history:[largeEntry]}),source),null,'bounded record rejects oversized history without writing');
const unicodeTooLarge=JSON.stringify({...emptyBankRecord(source),extra:'Я'.repeat(750001)});assert.ok(unicodeTooLarge.length<MAX_BANK_RECORD_BYTES);assert.equal(parseBankRecord(unicodeTooLarge,source),null,'UTF8 byte bound, not JS character count');
let history=emptyBankRecord(source);for(let i=0;i<MAX_BANK_HISTORY+2;i++){const distinct=structuredClone(done);distinct.attempt.reflection+=String(i);distinct.saved[1].reflection=distinct.attempt.reflection;history=archiveBankEntry(history,createBankEntry(source,distinct));}assert.equal(history.history.length,MAX_BANK_HISTORY);
assert.equal(validBankSnapshot(trainerBank.sources.find(s=>s.exercise.type==='reading')!,done),false,'other adapters are not falsely marked implemented');
console.log(`PASS8 source-specific Task2 state/record adapters; ${invalid} rejected state mutations, partial/frozen/repair/result and first/fresh source invariants, JSON-order-independent dedupe, trusted bundled source over caller data, all-source/version/actor isolation, UUID/ISO/prototype-shape/UTF8 budgets, legal maximum inputs, bounded20 history. Storage/UI integration and other adapters remain separate gates; no approval or quality grade.`);
