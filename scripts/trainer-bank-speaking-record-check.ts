import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import {trainerBank} from '../src/lib/trainers/bank-sources';
import {emptyBankSpeakingState,type BankSpeakingState} from '../src/lib/trainers/bank-speaking-state';
import {archiveBankEntry,bankRecordKey,createBankEntry,emptyBankRecord,parseBankRecord} from '../src/lib/trainers/bank-records';
import {bankSnapshotComplete,emptyBankSnapshot} from '../src/lib/trainers/bank-snapshots';
const sources=trainerBank.sources.filter(s=>s.exercise.type==='speaking');assert.equal(sources.length,10);
for(const source of sources){
 const state:BankSpeakingState={...emptyBankSpeakingState(),phase:'result',takeIndex:2,notes:'Third frozen preparation.',noMarkers:true,takes:Array.from({length:3},(_,i)=>({seconds:i===0?2.5:null,markers:[],ratings:Array(4).fill('Нужно поработать'),plan:'Synthetic next answer plan.',confirmed:true,preparationNotes:i===2?'Third frozen preparation.':`Original notes ${i}`,noSpecificMoments:true}))};
 assert.deepEqual(emptyBankSnapshot(source),emptyBankSpeakingState());assert.equal(bankSnapshotComplete(state),true);assert.equal(bankSnapshotComplete(emptyBankSpeakingState()),false);
 const entry=createBankEntry(source,state),record={...emptyBankRecord(source),revision:crypto.randomUUID(),checkpoint:entry};assert.ok(parseBankRecord(JSON.stringify(record),source));
 assert.notEqual(bankRecordKey('synthetic-a',source.ref),bankRecordKey('synthetic-b',source.ref));
 const archived=archiveBankEntry(record,entry);assert.equal(archived.history.length,1);assert.equal(archiveBankEntry(archived,{...entry,id:crypto.randomUUID()}).history.length,1);
 for(const other of trainerBank.sources.filter(s=>s!==source))assert.equal(parseBankRecord(JSON.stringify(record),other),null);
 for(const data of [{...state,audioIncluded:true},{...state,blobUrl:'blob:private'},{...state,takes:state.takes.map(t=>({...t,url:'blob:private'}))},{...state,takes:state.takes.map(t=>({...t,currentTime:1}))},{...state,notes:'Overwritten original notes.'},{...state,takes:state.takes.map(t=>({...t,noSpecificMoments:null}))}])assert.equal(parseBankRecord(JSON.stringify({...record,checkpoint:{...entry,data}}),source),null);
}
console.log('PASS10 Speaking record adapters: source/actor isolation, metadata-only recording provenance, frozen notes, completion, history dedupe and foreign/audio/invalid declarations rejected. No speech quality claim.');
