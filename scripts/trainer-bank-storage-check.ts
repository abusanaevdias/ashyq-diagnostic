import type { BankSnapshot } from '../src/lib/trainers/bank-records';
function task2(value:BankSnapshot|undefined){if(!value||value.type!=='task2')throw new Error('Expected Task2 record');return value;}
import assert from 'node:assert/strict';
import { build } from 'esbuild';
import { chromium, type Page } from 'playwright';
import type { BankTask2State } from '../src/lib/trainers/bank-task2-state';
import { emptyBankTask2State } from '../src/lib/trainers/bank-task2-state';
import type { BankRecord } from '../src/lib/trainers/bank-records';

type Harness={key:(scope:string,unit:string)=>string;read:(scope:string,unit:string)=>BankRecord|null;save:(scope:string,unit:string,expected:string|null,state:BankTask2State,mode?:string)=>Promise<BankRecord>;clear:(scope:string,unit:string,expected:string|null)=>Promise<BankRecord>;clearInvalid:(scope:string,unit:string,raw:string)=>Promise<BankRecord>;hold:(scope:string,unit:string)=>Promise<void>;release:()=>void;events:()=>number};
const harness = `
import {trainerBank} from './src/lib/trainers/bank-sources';
import {bankRecordKey,parseBankRecord,createBankEntry} from './src/lib/trainers/bank-records';
import {mutateBankRecord,clearBankRecord,clearInvalidBankRecord,BANK_RECORD_CHANGED} from './src/lib/trainers/bank-storage';
const source=(unit)=>{const value=trainerBank.sources.find(s=>s.ref.unitId===unit);if(!value)throw new Error('Unknown synthetic source');return value;};
let release=null,events=0;window.addEventListener(BANK_RECORD_CHANGED,()=>events++);
window.__trainerBank={key:(scope,unit)=>bankRecordKey(scope,source(unit).ref),read:(scope,unit)=>parseBankRecord(localStorage.getItem(bankRecordKey(scope,source(unit).ref)),source(unit)),events:()=>events,
save:(scope,unit,expected,state,mode)=>mutateBankRecord(scope,source(unit),expected,record=>mode==='wrong-source'?({...record,source:source('W02').ref}):mode==='invalid-state'?({...record,checkpoint:{...createBankEntry(source(unit),state),data:{...state,index:2}}}):mode==='oversize'?({...record,padding:'Я'.repeat(750001)}):({...record,checkpoint:createBankEntry(source(unit),state)})),
clear:(scope,unit,expected)=>clearBankRecord(scope,source(unit),expected),
clearInvalid:(scope,unit,raw)=>clearInvalidBankRecord(scope,source(unit),raw),
hold:async(scope,unit)=>{await new Promise(ready=>{navigator.locks.request(bankRecordKey(scope,source(unit).ref),()=>new Promise(done=>{release=done;ready();}));});},release:()=>{if(release){release();release=null;}}};
`;
function state(label:string):BankTask2State{return {...emptyBankTask2State(),started:true,attempt:{...emptyBankTask2State().attempt,argumentReason:label}};}
async function main(){
  const base=process.env.TRAINER_CHECK_BASE??'http://127.0.0.1:3043';assert.ok(['127.0.0.1','localhost'].includes(new URL(base).hostname));
  const bundled=await build({stdin:{contents:harness,resolveDir:process.cwd(),sourcefile:'synthetic-bank-storage-harness.ts',loader:'ts'},bundle:true,write:false,platform:'browser',format:'iife',tsconfig:'tsconfig.json',logLevel:'silent'});
  const browser=await chromium.launch({headless:true});
  try{
    const context=await browser.newContext(),a=await context.newPage(),b=await context.newPage(),errors:string[]=[],posts:string[]=[];
    context.on('request',r=>{if(['POST','PUT','PATCH','DELETE'].includes(r.method()))posts.push(r.url());});
    for(const page of [a,b]){page.on('pageerror',e=>errors.push(e.message));await page.goto(base+'/trainers');await page.addScriptTag({content:bundled.outputFiles[0].text});}
    const scope='synthetic-bank-storage',unit='W01';
    const save=(page:Page,expected:string|null,label:string,mode?:string)=>page.evaluate(({scope,unit,expected,value,mode})=>(window as unknown as {__trainerBank:Harness}).__trainerBank.save(scope,unit,expected,value,mode),{scope,unit,expected,value:state(label),mode});
    const read=(page:Page)=>page.evaluate(({scope,unit})=>(window as unknown as {__trainerBank:Harness}).__trainerBank.read(scope,unit),{scope,unit});
    const first=await save(a,null,'First partial independent notes.');assert.ok(first.revision);assert.equal(task2((await read(b))?.checkpoint?.data).attempt.argumentReason,'First partial independent notes.');
    await assert.rejects(save(b,null,'Stale initial write.'),/другой вкладке/);assert.equal((await read(a))?.revision,first.revision);
    const raced=await Promise.allSettled([save(a,first.revision,'Competing source-bound A.'),save(b,first.revision,'Competing source-bound B.')]);assert.equal(raced.filter(r=>r.status==='fulfilled').length,1);assert.equal(raced.filter(r=>r.status==='rejected').length,1);
    let current=(await read(a))!;assert.ok(['Competing source-bound A.','Competing source-bound B.'].includes(task2(current.checkpoint?.data).attempt.argumentReason));
    const unchanged=JSON.stringify(current);
    for(const mode of ['wrong-source','invalid-state'])await assert.rejects(save(a,current.revision,'Malformed transform should not write.',mode),/проверку версии/);
    await assert.rejects(save(a,current.revision,'Oversized transform should not write.','oversize'),/лимита/);
    assert.equal(JSON.stringify(await read(a)),unchanged);
    // Exact source/account partition, including punctuation in a scope.
    await a.evaluate(value=>(window as unknown as {__trainerBank:Harness}).__trainerBank.save('synthetic:other/account','W02',null,value),state('Different account and source.'));
    assert.equal(JSON.stringify(await read(a)),unchanged);
    const key=await a.evaluate(({scope,unit})=>(window as unknown as {__trainerBank:Harness}).__trainerBank.key(scope,unit),{scope,unit});
    await assert.rejects(a.evaluate(({scope,unit,raw})=>(window as unknown as {__trainerBank:Harness}).__trainerBank.clearInvalid(scope,unit,raw),{scope,unit,raw:unchanged}),/совместима/);
    for(const broken of ['','{bad raw\n']){
      await a.evaluate(({key,broken})=>localStorage.setItem(key,broken),{key,broken});await assert.rejects(save(a,current.revision,'Cannot overwrite a damaged record.'),/повреждена/);assert.equal(await b.evaluate(key=>localStorage.getItem(key),key),broken);
      await assert.rejects(a.evaluate(({scope,unit,raw})=>(window as unknown as {__trainerBank:Harness}).__trainerBank.clearInvalid(scope,unit,raw),{scope,unit,raw:broken+'stale'}),/изменилась/);assert.equal(await b.evaluate(key=>localStorage.getItem(key),key),broken);
      const recovered=await a.evaluate(({scope,unit,raw})=>(window as unknown as {__trainerBank:Harness}).__trainerBank.clearInvalid(scope,unit,raw),{scope,unit,raw:broken});assert.equal(recovered.checkpoint,null);assert.ok(recovered.revision);
    }
    await a.evaluate(({key,raw})=>localStorage.setItem(key,raw),{key,raw:unchanged});
    // Quota failure leaves the existing bytes intact.
    await a.evaluate(key=>{const saved=Storage.prototype.setItem;(window as unknown as {__restoreSetItem:()=>void}).__restoreSetItem=()=>{Storage.prototype.setItem=saved;};Storage.prototype.setItem=function(k,v){if(k===key)throw new DOMException('Synthetic quota','QuotaExceededError');return saved.call(this,k,v);};},key);
    await assert.rejects(save(a,current.revision,'Quota-blocked work.'),/quota/);assert.equal(await b.evaluate(key=>localStorage.getItem(key),key),unchanged);
    await a.evaluate(()=>(window as unknown as {__restoreSetItem:()=>void}).__restoreSetItem());
    // No unsafe read/modify/write fallback when Web Locks is unavailable.
    await a.evaluate(()=>Object.defineProperty(navigator,'locks',{value:undefined,configurable:true}));
    await assert.rejects(save(a,current.revision,'No-lock work.'),/блокировки/);assert.equal(await b.evaluate(key=>localStorage.getItem(key),key),unchanged);
    await a.evaluate(()=>Reflect.deleteProperty(navigator,'locks'));
    const cleared=await a.evaluate(({scope,unit,expected})=>(window as unknown as {__trainerBank:Harness}).__trainerBank.clear(scope,unit,expected),{scope,unit,expected:current.revision});
    assert.notEqual(cleared.revision,current.revision);assert.equal(cleared.checkpoint,null);assert.deepEqual(cleared.history,[]);
    await assert.rejects(save(b,current.revision,'Queued old work after clear.'),/другой вкладке/);await assert.rejects(save(b,null,'Queued missing-record write after clear.'),/другой вкладке/);assert.equal((await read(a))?.revision,cleared.revision);
    current=cleared;
    // Use actual Chromium Web Locks and its abort signal, not a JavaScript mutex substitute.
    await a.evaluate(({scope,unit})=>(window as unknown as {__trainerBank:Harness}).__trainerBank.hold(scope,unit),{scope,unit});
    const started=Date.now();await assert.rejects(save(b,current.revision,'Timed-out waiting work.'),/10 секунд/);assert.ok(Date.now()-started>=9000&&Date.now()-started<30000);assert.equal((await read(a))?.revision,current.revision);
    await a.evaluate(()=>(window as unknown as {__trainerBank:Harness}).__trainerBank.release());
    const retried=await save(b,current.revision,'Explicit retry after the lock was released.');assert.equal((await read(a))?.revision,retried.revision);
    assert.ok(await a.evaluate(()=>(window as unknown as {__trainerBank:Harness}).__trainerBank.events())>0);assert.deepEqual(errors,[]);assert.deepEqual(posts,[]);
    console.log('PASS actual Chromium source-bound bank storage: first/stale writes, two-tab same-source race, other source/account partition, malformed transform/corrupt-empty raw preservation, quota/no-lock refusal, deletion tombstone preventing queued resurrection, real10-second lock abort and explicit retry. Test harness exercises storage primitives only; learner UI/publication and other state adapters remain unverified.');
  }finally{await browser.close();}
}
main().catch(error=>{console.error(error);process.exitCode=1;});
