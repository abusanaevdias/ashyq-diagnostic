import assert from 'node:assert/strict';
import {MAX_BANK_INDEX_KEYS,readBankPresence} from '../src/lib/trainers/bank-presence';
import {trainerBank,parseBankSourceRef} from '../src/lib/trainers/bank-sources';
import {bankRecordKey} from '../src/lib/trainers/bank-records';
import {draftArchives} from '../src/lib/trainers/draft-review';
const actor='synthetic-presence',keys=trainerBank.sources.map(s=>bankRecordKey(actor,s.ref));
const storage=(keys:string[])=>({length:keys.length,key:(index:number)=>keys[index]??null,getItem:()=>{throw new Error('Record values must never be read');}});
const all=readBankPresence(actor,storage([...keys].reverse()));assert.equal(all.kind,'ready');if(all.kind!=='ready')throw new Error('Ready');assert.deepEqual(all.currentIds,trainerBank.sources.map(s=>s.ref.unitId));assert.deepEqual(all.archives,[]);
for(const source of trainerBank.sources){const own=readBankPresence(actor,storage([bankRecordKey('other-actor',source.ref),bankRecordKey(actor,source.ref),'unrelated-session-key']));assert.deepEqual(own,{kind:'ready',currentIds:[source.ref.unitId],archives:[]});}
const archive=draftArchives[0],unit=archive.units[0],ref=parseBankSourceRef({batchId:archive.batch,version:String(archive.version),contentHash:archive.content_sha256,unitId:unit.id});assert.ok(ref);const past=readBankPresence(actor,storage([bankRecordKey(actor,ref)]));assert.deepEqual(past,{kind:'ready',currentIds:[],archives:[ref]});
assert.deepEqual(readBankPresence(actor,storage([])),{kind:'ready',currentIds:[],archives:[]});for(const actor of ['',123 as unknown as string,'x'.repeat(201)])assert.deepEqual(readBankPresence(actor,storage(keys)),{kind:'unavailable',reason:'scope'});
for(const length of [-1,0.5,NaN,Infinity,MAX_BANK_INDEX_KEYS+1])assert.deepEqual(readBankPresence(actor,{length,key:()=>{throw new Error('No partial enumeration');}}),{kind:'unavailable',reason:'capacity'});
assert.deepEqual(readBankPresence(actor,{length:1,key:()=>null}),{kind:'unavailable',reason:'changed'});assert.deepEqual(readBankPresence(actor,storage([keys[0],keys[0]])),{kind:'unavailable',reason:'changed'});assert.deepEqual(readBankPresence(actor,{length:1,key:()=>{throw new DOMException('blocked','SecurityError');}}),{kind:'unavailable',reason:'blocked'});
let reads=0;assert.deepEqual(readBankPresence(actor,{get length(){return ++reads===1?1:2;},key:()=>keys[0]}),{kind:'unavailable',reason:'changed'});
console.log('PASS100 exact current-source key namespaces, foreign actors ignored, known archives retained separately, no record-value reads/writes, capacity/blocked/changing/duplicate/null key failures do not return partial results. Presence is not valid work or completion; UI remains separate.');
