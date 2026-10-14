import assert from 'node:assert/strict';
import {trainerBank} from '../src/lib/trainers/bank-sources';
import {bankWritingPair} from '../src/lib/trainers/bank-writing-state';
import {bankPublication,isPublishedBankSource,parseBankPublication,publishedBankSources,PUBLICATION_CHECKS} from '../src/lib/trainers/bank-publication';
const receipt=(index:number)=>({source:trainerBank.sources[index].ref,reviewer:'Synthetic reviewer',reviewedAt:'2026-10-14T12:00:00.000Z',approvalEvidence:'SYNTHETIC CHECK ONLY: this is not human approval evidence.',checks:Object.fromEntries(PUBLICATION_CHECKS.map(k=>[k,true]))});
const packet=(releases:unknown[])=>({format:'ashyq-bank-publication-v1',releases});
assert.deepEqual(bankPublication,packet([]));assert.equal(publishedBankSources.length,0);for(const source of trainerBank.sources)assert.equal(isPublishedBankSource(source.ref),false);
for(const [index,source] of trainerBank.sources.entries()){
 const releases=[receipt(index)];if(source.exercise.type==='writing-drill'){for(let cursor=0;cursor<releases.length;cursor++){const current=trainerBank.sources.find(s=>s.ref.unitId===releases[cursor].source.unitId)!;for(const unit of bankWritingPair(current)!){const companion=trainerBank.sources.findIndex(s=>s.ref.unitId===unit.id);if(!releases.some(r=>r.source.unitId===unit.id))releases.push(receipt(companion));}}assert.equal(parseBankPublication(packet([receipt(index)])),null,'companion closure requires separate approval');}
 const value=packet(releases);assert.ok(parseBankPublication(value));assert.equal(parseBankPublication({...value,untrusted:true}),null);assert.equal(parseBankPublication(packet([...releases,releases[0]])),null);assert.equal(parseBankPublication(packet(releases.map((r,i)=>i?r:{...r,source:{...r.source,contentHash:'a'.repeat(64)}}))),null);
 for(const k of PUBLICATION_CHECKS)assert.equal(parseBankPublication(packet(releases.map((r,i)=>i?r:{...r,checks:{...r.checks,[k]:false}}))),null);
 for(const change of [{reviewer:''},{reviewedAt:'2026-02-30T12:00:00.000Z'},{reviewedAt:'today'},{reviewedAt:'2099-01-01T12:00:00.000Z'},{approvalEvidence:'recommend'},{approvalEvidence:'x'.repeat(3001)},{reviewer:'bad\u0000name'},{extra:true}])assert.equal(parseBankPublication(packet(releases.map((r,i)=>i?r:{...r,...change}))),null);
}
assert.equal(parseBankPublication({format:'ashyq-draft-review-v1',decisions:{}}),null);assert.equal(parseBankPublication(packet(Array(101).fill(receipt(0)))),null);assert.equal(parseBankPublication(packet([JSON.parse('{"__proto__":{"reviewer":"forged"}}')])),null);
console.log('PASS100 source-bound synthetic approval receipt/checklist/version/hash/duplicate/date/shape boundaries and short-Writing companion closure; bundled publication remains empty. Receipt integrity is not human approval, public delivery, calibration or server authorization.');
