import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import { draftBatches, draftArchives, type DraftBatch } from '../src/lib/trainers/draft-review';
import { trainerCatalog } from '../src/lib/trainers/catalog';
import { bankSourceIdentity, bankSourceQuery, createBankSources, findBankSource, parseBankExercise, parseBankSourceQuery, parseBankSourceRef, sameBankSource, trainerBank } from '../src/lib/trainers/bank-sources';
assert.deepEqual(trainerBank.errors,[]);assert.equal(trainerBank.sources.length,100);assert.equal(new Set(trainerBank.sources.map(s=>s.ref.unitId)).size,100);
for(const batch of draftBatches)assert.equal(crypto.createHash('sha256').update(JSON.stringify(batch.units)).digest('hex'),batch.content_sha256,`trusted bundled content hash ${batch.batch}`);
const counts=Object.fromEntries(trainerCatalog.map(trainer=>[trainer.id,trainerBank.sources.filter(s=>s.trainer===trainer.id).length]));
assert.deepEqual(counts,{'reading-evidence':10,'listening-replay':8,'speaking-second-take':10,'task1-overview':8,'writing-task2':8,'writing-drills':24,'sat-optionless':8,'sat-distractor':8,'math-forensics':7,'sat-translation':5,'math-method-switch':4});
assert.deepEqual([...new Set(trainerBank.sources.map(s=>s.trainer))].sort(),trainerCatalog.map(t=>t.id).sort());
for(const source of trainerBank.sources){
  assert.ok(source.skill.trim()&&source.practiceType.trim());assert.equal(source.difficulty,'uncalibrated');assert.equal(source.unit.status,'DRAFT');
  const ref=parseBankSourceRef(source.ref);assert.ok(ref);assert.notEqual(ref,source.ref);assert.equal(findBankSource(ref),source);
  assert.deepEqual(parseBankSourceQuery(new URLSearchParams(bankSourceQuery(ref))),ref);assert.ok(sameBankSource(ref,source.ref));
  const identity=bankSourceIdentity(ref);
  for(const changed of [{...ref,unitId:'UNKNOWN'},{...ref,batchId:'9999'},{...ref,version:'99.99'},{...ref,contentHash:'0'.repeat(64)}]){assert.notEqual(bankSourceIdentity(changed),identity);assert.equal(findBankSource(changed),null);assert.equal(sameBankSource(ref,changed),false);}
  for(const key of ['sourceBatch','sourceVersion','sourceHash','sourceUnit']){
    const duplicated:URLSearchParams=new URLSearchParams(bankSourceQuery(ref));duplicated.append(key,duplicated.get(key)!);assert.equal(parseBankSourceQuery(duplicated),null,`even identical duplicate ${key} rejected`);
    const missing:URLSearchParams=new URLSearchParams(bankSourceQuery(ref));missing.delete(key);assert.equal(parseBankSourceQuery(missing),null);
  }
  const tracking=new URLSearchParams(bankSourceQuery(ref));tracking.set('utm_source','synthetic');assert.deepEqual(parseBankSourceQuery(tracking),ref,'unrelated tracking does not alter source identity');
}
const ref=trainerBank.sources[0].ref;
for(const bad of [null,[],{}, {...ref,version:1}, {...ref,batchId:'../01'}, {...ref,unitId:'../../secret'}, {...ref,version:'1e2'}, {...ref,contentHash:ref.contentHash.toUpperCase()}, {...ref,contentHash:'x'.repeat(64)}, {...ref,extra:'ignored?'}])assert.equal(parseBankSourceRef(bad),null);
for(const archived of draftArchives)for(const unit of archived.units)assert.equal(findBankSource({batchId:archived.batch,version:String(archived.version),contentHash:archived.content_sha256,unitId:unit.id}),null,'archived content is never silently reinterpreted as current');
const clone=():DraftBatch[]=>JSON.parse(JSON.stringify(draftBatches));
const invalidBatches:DraftBatch[][]=[];
for(const mutate of [(b:DraftBatch[])=>{b[0].units[0].exercise_data=null;},(b:DraftBatch[])=>{b[0].units[0].status='APPROVED';},(b:DraftBatch[])=>{b[0].methodically_approved=true;},(b:DraftBatch[])=>{b[0].version='../../bad';},(b:DraftBatch[])=>{b[0].content_sha256='broken';},(b:DraftBatch[])=>{b[0].units[0].title='';},(b:DraftBatch[])=>{b[1].units[0].id=b[0].units[0].id;},(b:DraftBatch[])=>{b[0].units[0].exercise_data={kind:'unknown'};}]){const value=clone();mutate(value);invalidBatches.push(value);}
for(const value of invalidBatches){const parsed=createBankSources(value);assert.ok(parsed.errors.length);assert.deepEqual(parsed.sources,[],'no partial bank silently drops or substitutes a bad unit');}
const writing=trainerBank.sources.find(s=>s.exercise.type==='writing-drill')!;assert.equal(parseBankExercise(writing.unit.exercise_data,'OTHER'),null,'structured drill ID is bound to outer source');
for(const source of trainerBank.sources){assert.equal(parseBankExercise(source.unit.exercise_data,'UNKNOWN'),null,'source family is bound to its outer ID prefix');if(['reading','math','sat-rw'].includes(source.exercise.type)){const raw=structuredClone(source.unit.exercise_data) as {rounds:{id:string}[]};raw.rounds[0].id='OTHER-A';assert.equal(parseBankExercise(raw,source.ref.unitId),null,'round identity is bound to the unit, not merely different between two rounds');}}
assert.equal(parseBankExercise({kind:'unknown',publication_ready:false},'W01'),null);
console.log('PASS100 source-bound normalized exercises/11 trainer families, independent counts/all14 content hashes, explicit uncalibrated metadata, strict four-part refs/query duplicates, stale version/hash/archive/unknown source rejection and eight whole-bank failure mutations. Registry is not methodological approval, publication or live-session completion.');
