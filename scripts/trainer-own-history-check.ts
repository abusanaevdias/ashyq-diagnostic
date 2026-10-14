import assert from 'node:assert/strict';
import {blankOwnDraft,ownDraftFingerprint} from '../src/lib/writing-trainer/own-draft';
import {addOwnHistory,emptyOwnHistory,ownHistoryKey,ownHistoryExport,parseOwnHistory,parseOwnHistoryExport,mutateOwnHistory,replaceOwnHistory,type OwnHistory} from '../src/lib/writing-trainer/own-history';

async function main(){
 const values=new Map<string,string>(),storage={getItem:(key:string)=>values.get(key)??null,setItem:(key:string,value:string)=>{values.set(key,value);}},events:Event[]=[];
 let tail=Promise.resolve();
 Object.defineProperty(globalThis,'localStorage',{configurable:true,value:storage});
 Object.defineProperty(globalThis,'window',{configurable:true,value:{dispatchEvent:(e:Event)=>{events.push(e);return true;}}});
 Object.defineProperty(globalThis,'CustomEvent',{configurable:true,value:class extends Event{detail:unknown;constructor(name:string,options:{detail:unknown}){super(name);this.detail=options.detail;}}});
 Object.defineProperty(globalThis,'navigator',{configurable:true,value:{locks:{request:(_key:string,_options:unknown,fn:()=>unknown)=>{const result=tail.then(fn);tail=result.then(()=>undefined,()=>undefined);return result;}}}});
 const draft=blankOwnDraft();draft.prompt='  A fictional task?  ';draft.original='  A synthetic essay.\n  ';
 assert.equal(parseOwnHistory(null),null);assert.equal(parseOwnHistory(''),null);assert.equal(parseOwnHistory('{}'),null);
 assert.notEqual(ownHistoryKey('A:B'),ownHistoryKey('A%3AB'));assert.throws(()=>ownHistoryKey(''));
 let record=await mutateOwnHistory('A',null,old=>addOwnHistory(old,draft));assert.equal(record.entries.length,1);assert.deepEqual(record.entries[0].draft,draft);assert.deepEqual(parseOwnHistoryExport(ownHistoryExport(record)),record);
 const raw=values.get(ownHistoryKey('A'));const same=await mutateOwnHistory('A',record.revision,old=>addOwnHistory(old,draft));assert.equal(same.revision,record.revision);assert.equal(values.get(ownHistoryKey('A')),raw,'duplicate is a read, not a rewrite');
 const ordered={...draft,notes:{lexical:'',grammar:'',coherence:'',task:''}};assert.equal(ownDraftFingerprint(ordered),ownDraftFingerprint(draft));
 await assert.rejects(mutateOwnHistory('A',null,old=>addOwnHistory(old,draft)),/изменилась/);assert.equal(values.get(ownHistoryKey('A')),raw);
 const next=structuredClone(draft);next.working='Second working version';const stale=record.revision;const races=await Promise.allSettled([mutateOwnHistory('A',stale,old=>addOwnHistory(old,next)),mutateOwnHistory('A',stale,old=>addOwnHistory(old,{...next,working:'Third'}))]);assert.equal(races.filter(r=>r.status==='fulfilled').length,1);assert.equal(races.filter(r=>r.status==='rejected').length,1);
 record=parseOwnHistory(values.get(ownHistoryKey('A'))!)!;assert.equal(record.entries.length,2);assert.equal(values.has(ownHistoryKey('B')),false);
 const beforeClear=values.get(ownHistoryKey('A'))!;const tombstone=await replaceOwnHistory('A',beforeClear,emptyOwnHistory());assert.equal(tombstone.entries.length,0);assert.notEqual(tombstone.revision,'');await assert.rejects(mutateOwnHistory('A',null,old=>addOwnHistory(old,draft)),/изменилась/);await assert.rejects(replaceOwnHistory('A',beforeClear,record),/изменилась/);
 values.set(ownHistoryKey('A'),'{exact corrupt');await assert.rejects(mutateOwnHistory('A',null,old=>addOwnHistory(old,draft)),/повреждена/);assert.equal(values.get(ownHistoryKey('A')),'{exact corrupt');await replaceOwnHistory('A','{exact corrupt',record);assert.equal(parseOwnHistory(values.get(ownHistoryKey('A'))!)?.entries.length,2);
 let full:OwnHistory={...emptyOwnHistory(),revision:crypto.randomUUID()};for(let i=0;i<20;i++)full=addOwnHistory(full,{...draft,working:String(i)});assert.equal(full.entries.length,20);assert.throws(()=>addOwnHistory(full,{...draft,working:'21'}),/20 версий/);assert.equal(full.entries.length,20);
 for(const bad of [{...record,unknown:true},{...record,revision:''},{...record,entries:[record.entries[0],record.entries[0]]},{...record,entries:[{...record.entries[0],savedAt:'2026-02-30T00:00:00.000Z'}]},{...record,entries:[{...record.entries[0],draft:{...draft,step:.5}}]},{...record,entries:[{...record.entries[0],draft:{...draft,original:''}}]}])assert.equal(parseOwnHistory(JSON.stringify(bad)),null);
 const large={...draft,working:'字'.repeat(10000),original:'字'.repeat(10000),versions:{grammar:'字'.repeat(10000),task:'字'.repeat(10000),coherence:'字'.repeat(10000),lexical:'字'.repeat(10000)}};let maximum={...emptyOwnHistory(),revision:crypto.randomUUID()};let stopped=false;for(let i=0;i<20;i++){try{maximum=addOwnHistory(maximum,{...large,prompt:'Essay '+i});}catch{stopped=true;break;}}assert.ok(stopped);assert.ok(parseOwnHistory(JSON.stringify(maximum)));assert.ok(maximum.entries.length>1);
 const beforeQuota=values.get(ownHistoryKey('A'));await assert.rejects(replaceOwnHistory('A',beforeQuota!,emptyOwnHistory(),()=>false),/закрыта/);assert.equal(values.get(ownHistoryKey('A')),beforeQuota);storage.setItem=()=>{throw new DOMException('synthetic quota','QuotaExceededError');};await assert.rejects(replaceOwnHistory('A',beforeQuota!,emptyOwnHistory()),/quota/);assert.equal(values.get(ownHistoryKey('A')),beforeQuota);assert.ok(events.length>=4);
 console.log('PASS own-history strict portable schema/ISO/UUID/unknown fields, whitespace/source identity, dedupe without rewrite, 20/byte caps without deletion, actor isolation, concurrent CAS, tombstone, corrupt recovery and quota preservation. Synthetic storage/locks only; browser/auth/cloud/feedback quality not claimed.');
}
main().catch(error=>{console.error(error);process.exitCode=1;});
