import assert from 'node:assert/strict';
import fs from 'node:fs';
import crypto from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {draftArchives,draftBatches,emptyDraftReview,parseDraftReview,reviewKey} from '../src/lib/trainers/draft-review';
import {findBankSource,trainerBank,type BankSourceRef} from '../src/lib/trainers/bank-sources';
import {bankRecordKey} from '../src/lib/trainers/bank-records';
import {parseDraftListening} from '../src/lib/trainers/draft-listening';
import audio02 from '../src/data/trainer-drafts/listening-audio-02.json';
import audio10 from '../src/data/trainer-drafts/listening-audio-10.json';
let rejected=0,assets=0;
for(const id of ['02','10']){
 const current=draftBatches.find(batch=>batch.batch===id)!,old=draftArchives.find(batch=>batch.batch===id)!;assert.equal(current.version,'2.0');assert.equal(old.version,1);assert.equal(current.methodically_approved,false);assert.equal(old.methodically_approved,false);assert.equal(current.units.length,6);assert.equal(old.units.length,6);assert.notEqual(current.content_sha256,old.content_sha256);
 const originalBytes=execFileSync('git',['show',`4761531:src/data/trainer-drafts/batch-${id}.json`]);assert.ok(fs.readFileSync(`src/data/trainer-draft-archives/batch-${id}-v1.json`).equals(originalBytes),'archive preserves exact old source bytes');assert.equal(crypto.createHash('sha256').update(JSON.stringify(current.units)).digest('hex'),current.content_sha256);assert.equal(crypto.createHash('sha256').update(JSON.stringify(old.units)).digest('hex'),old.content_sha256);
 const archivedReview=emptyDraftReview('synthetic-media-binding',old);archivedReview.decisions[old.units[0].id]={decision:'recommend',attested:true,comment:'Synthetic archive-only attestation.',savedAt:'2026-10-13T00:00:00.000Z'};assert.ok(parseDraftReview(JSON.stringify(archivedReview),'synthetic-media-binding',old));assert.equal(parseDraftReview(JSON.stringify(archivedReview),'synthetic-media-binding',current),null);assert.notEqual(reviewKey('synthetic-media-binding',old),reviewKey('synthetic-media-binding',current));
 for(const [index,unit]of current.units.entries()){
  const archived=old.units[index];assert.equal(unit.id,archived.id);assert.equal(unit.status,'DRAFT');const value=unit.exercise_data;if(!value||typeof value!=='object'||!('kind'in value)||value.kind!=='listening-pair-v1'){assert.deepEqual(unit,archived);continue;}
  const stripped=structuredClone(unit);delete (stripped.exercise_data as Record<string,unknown>).media_identity;assert.deepEqual(stripped,archived,'no worksheet/script/key rewritten by media binding');
  const pair=parseDraftListening(value,unit.id);assert.ok(pair);const media=(value as {media_identity:unknown}).media_identity as {format:string;voice:string;rate:number;assets:{round:number;kind:string;url:string;sha256:string;bytes:number}[]};assert.equal(pair.mediaIdentity,JSON.stringify(media));
  for(const asset of media.assets){const file=fs.readFileSync('public'+asset.url);assert.equal(file.length,asset.bytes);assert.equal(crypto.createHash('sha256').update(file).digest('hex'),asset.sha256);assets++;}
  const malformed=[{...value,media_identity:undefined},{...value,media_identity:{...media,voice:'Different voice'}},{...value,media_identity:{...media,rate:media.rate+1}},{...value,media_identity:{...media,extra:true}},{...value,media_identity:{...media,assets:media.assets.slice(1)}},{...value,media_identity:{...media,assets:[...media.assets].reverse()}},{...value,media_identity:{...media,assets:media.assets.map(a=>({...a,sha256:'0'.repeat(64)}))}},{...value,media_identity:{...media,assets:media.assets.map(a=>({...a,bytes:a.bytes+1}))}},{...value,media_identity:{...media,assets:media.assets.map(a=>({...a,url:a.url+'?changed'}))}},{...value,media_identity:{...media,assets:media.assets.map(a=>({...a,extra:true}))}},{...value,media_identity:{...media,assets:media.assets.map(a=>({...a,bytes:String(a.bytes)}))}}];for(const candidate of malformed){assert.equal(parseDraftListening(candidate,unit.id),null);rejected++;}
  const reordered={...value,media_identity:Object.fromEntries(Object.entries({...media,assets:media.assets.map(a=>Object.fromEntries(Object.entries(a).reverse()))}).reverse())};assert.equal(parseDraftListening(reordered,unit.id)?.mediaIdentity,pair.mediaIdentity,'canonical physical identity ignores object-key order');
 }
 for(const unit of current.units){const active=trainerBank.sources.find(source=>source.ref.unitId===unit.id)!;const oldRef:BankSourceRef={batchId:id,version:String(old.version),contentHash:old.content_sha256,unitId:unit.id};assert.equal(findBankSource(oldRef),null);assert.notEqual(bankRecordKey('synthetic-media-binding',oldRef),bankRecordKey('synthetic-media-binding',active.ref),'unchanged Task1/Speaking units also retain distinct old recovery keys');}
}
assert.equal(assets,32);assert.equal(trainerBank.sources.length,100);assert.equal(draftArchives.length,3);assert.equal([...audio02.assets,...audio10.assets].length,32);
console.log(`PASS8 Listening source/media bindings/32 exact WAVs; ${rejected} voice/rate/hash/bytes/path/shape mutations reject. Two v2 batches preserve exact v1 archives, scripts/keys and old review/bank namespaces without migration; all100 active modules remain DRAFT. Recovery UI and listening durability are separate gates.`);
