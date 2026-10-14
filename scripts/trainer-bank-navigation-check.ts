import assert from 'node:assert/strict';
import {bankPage,bankPracticeHref,canRehearseBank,filterBankSources,type BankFilters} from '../src/lib/trainers/bank-navigation';
import {findBankSource,parseBankSourceQuery,sameBankSource,trainerBank} from '../src/lib/trainers/bank-sources';
import {trainerCatalog} from '../src/lib/trainers/catalog';
const all=filterBankSources({exam:'all',trainer:'all',query:''});assert.equal(all.length,100);
for(const role of [null,undefined,'guest','student','admin','Teacher',' teacher'])assert.equal(canRehearseBank(role),false);for(const role of ['teacher','author'])assert.ok(canRehearseBank(role));
let speaking=0;
for(const source of all){
 const href=bankPracticeHref(source.ref);assert.ok(href);const url=new URL(href,'https://example.invalid');
 const ref=source.exercise.type==='speaking'?{batchId:url.searchParams.get('reviewBatch')!,version:url.searchParams.get('reviewVersion')!,contentHash:url.searchParams.get('reviewHash')!,unitId:url.searchParams.get('reviewUnit')!}:parseBankSourceQuery(url.searchParams);
 assert.ok(ref&&findBankSource(ref));assert.ok(sameBankSource(ref,source.ref));assert.equal(url.pathname,source.exercise.type==='speaking'?'/trainers/speaking-second-take':'/trainers/bank/practice');if(source.exercise.type==='speaking')speaking++;
 assert.equal(bankPracticeHref({...source.ref,version:'99.0'}),null);assert.equal(bankPracticeHref({...source.ref,contentHash:'0'.repeat(64)}),null);
 assert.ok(filterBankSources({exam:'all',trainer:'all',query:' '+source.ref.unitId.toLowerCase()+' '}).some(s=>sameBankSource(s.ref,source.ref)));
}
assert.equal(speaking,10);
for(const trainer of trainerCatalog){const items=filterBankSources({exam:trainer.exam,trainer:trainer.id,query:''});assert.ok(items.length);assert.ok(items.every(s=>s.trainer===trainer.id));}
assert.equal(filterBankSources({exam:'all',trainer:'all',query:'unmatched synthetic query'}).length,0);assert.equal(filterBankSources({exam:'all',trainer:'all',query:'x'.repeat(201)}).length,0);assert.equal(filterBankSources({exam:'BAD',trainer:'all',query:''} as unknown as BankFilters).length,0);
const visited=[];for(let page=0;page<9;page++){const result=bankPage(all,page);assert.equal(result.pages,9);assert.equal(result.total,100);assert.ok(result.items.length<=12);visited.push(...result.items.map(s=>s.ref.unitId));}assert.equal(new Set(visited).size,100);assert.equal(visited.length,100);assert.equal(bankPage(all,999).page,8);for(const page of [-1,NaN,Infinity,0.5])assert.equal(bankPage(all,page).page,0);assert.deepEqual(bankPage([],999),{page:0,pages:1,total:0,items:[]});assert.equal(trainerBank.sources.length,100);
console.log('PASS100 immutable source links, ten existing native Speaking microphone routes,11 trainer filters, bounded search,12-card pagination without loss/duplicates and local teacher/author eligibility. Helper-only; no directory/practice/history UI evidence.');
