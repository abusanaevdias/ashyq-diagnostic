import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import {readBankSummary} from '../src/lib/trainers/bank-navigation';
import {trainerBank} from '../src/lib/trainers/bank-sources';
import {archiveBankEntry,bankRecordKey,createBankEntry,emptyBankRecord} from '../src/lib/trainers/bank-records';
import {emptyBankSnapshot} from '../src/lib/trainers/bank-snapshots';
import {emptyBankSpeakingState,type BankSpeakingState} from '../src/lib/trainers/bank-speaking-state';
for(const source of trainerBank.sources){
 const empty=emptyBankSnapshot(source);assert.ok(empty);const entry=createBankEntry(source,empty),record={...emptyBankRecord(source),revision:crypto.randomUUID(),checkpoint:entry},raw=JSON.stringify(record);let reads=0;
 const storage={getItem:(key:string)=>{reads++;assert.equal(key,bankRecordKey('synthetic-summary',source.ref));return raw;}};
 const summary=readBankSummary('synthetic-summary',source.ref,storage);assert.equal(reads,1);assert.equal(summary.kind,'ready');if(summary.kind!=='ready')throw new Error('Ready');assert.equal(summary.current?.state,'not-started');assert.deepEqual(summary.history,[]);assert.equal('data' in summary.current!,false);
 assert.deepEqual(readBankSummary('synthetic-summary',source.ref,{getItem:()=>null}),{kind:'empty'});
 for(const raw of ['', '{broken',JSON.stringify({...record,source:{...source.ref,version:'99.0'}}),'x'.repeat(1500001)])assert.deepEqual(readBankSummary('synthetic-summary',source.ref,{getItem:()=>raw}),{kind:'incompatible'});
 assert.deepEqual(readBankSummary('synthetic-summary',source.ref,{getItem:()=>{throw new DOMException('blocked','SecurityError');}}),{kind:'unavailable'});
 for(const scope of ['', 'x'.repeat(201),123 as unknown as string])assert.deepEqual(readBankSummary(scope,source.ref,storage),{kind:'unavailable'});assert.equal(reads,1);assert.deepEqual(readBankSummary('synthetic-summary',{...source.ref,version:'99.0'},storage),{kind:'source-unavailable'});assert.equal(reads,1);
 const tombstone=JSON.stringify({...emptyBankRecord(source),revision:crypto.randomUUID()});const cleared=readBankSummary('synthetic-summary',source.ref,{getItem:()=>tombstone});assert.deepEqual(cleared,{kind:'ready',current:null,history:[]});
}
const source=trainerBank.sources.find(s=>s.exercise.type==='speaking')!,takes=Array.from({length:3},()=>({seconds:null,markers:[],ratings:Array(4).fill('Нужно поработать'),plan:'Private synthetic plan must not enter directory metadata.',confirmed:true,preparationNotes:'Private preparation.',noSpecificMoments:true})),done:BankSpeakingState={...emptyBankSpeakingState(),phase:'result',takeIndex:2,takes,notes:'Private preparation.',noMarkers:true};
const entry=createBankEntry(source,done),record={...emptyBankRecord(source),revision:crypto.randomUUID(),checkpoint:entry},summary=readBankSummary('synthetic-summary',source.ref,{getItem:()=>JSON.stringify(record)});assert.equal(summary.kind,'ready');if(summary.kind!=='ready')throw new Error('Ready');assert.equal(summary.current?.state,'complete');assert.equal(JSON.stringify(summary).includes('Private'),false);
const archived=archiveBankEntry(record,entry),history=readBankSummary('synthetic-summary',source.ref,{getItem:()=>JSON.stringify(archived)});assert.equal(history.kind,'ready');if(history.kind!=='ready')throw new Error('Ready');assert.equal(history.current,null);assert.equal(history.history[0].state,'complete');assert.equal(history.history.length,1);
console.log('PASS100 lazy one-record summaries: no global scan/write, pristine versus completion, corrupt/empty/oversize/source mismatch versus absent/blocked, revision tombstones and metadata-only completed/history output. UI refresh/account handling remains a separate gate; no score or mastery inference.');
