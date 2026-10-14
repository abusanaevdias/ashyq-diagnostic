import {bankSourceIdentity,parseBankSourceRef,trainerBank,type BankSourceRef} from './bank-sources';
import {bankRecordKey} from './bank-records';
import {draftArchives} from './draft-review';

export const MAX_BANK_INDEX_KEYS=5000;
export type BankPresence={kind:'ready';currentIds:string[];archives:BankSourceRef[]}|{kind:'unavailable';reason:'scope'|'blocked'|'capacity'|'changed'};
/** Read key names only. Presence is not valid work, completion, freshness or authorization. */
export function readBankPresence(scope:string,storage:Pick<Storage,'length'|'key'>):BankPresence{
 if(typeof scope!=='string'||!scope||scope.length>200)return {kind:'unavailable',reason:'scope'};
 try{
  const length=storage.length;if(!Number.isSafeInteger(length)||length<0||length>MAX_BANK_INDEX_KEYS)return {kind:'unavailable',reason:'capacity'};
  const current=new Map(trainerBank.sources.map(s=>[bankRecordKey(scope,s.ref),s.ref.unitId])),archived=new Map<string,BankSourceRef>();
  for(const batch of draftArchives)for(const unit of batch.units){const ref=parseBankSourceRef({batchId:batch.batch,version:String(batch.version),contentHash:batch.content_sha256,unitId:unit.id});if(!ref)return {kind:'unavailable',reason:'changed'};archived.set(bankRecordKey(scope,ref),ref);}
  const seen=new Set<string>(),ids=new Set<string>(),archives:BankSourceRef[]=[];
  for(let index=0;index<length;index++){
   const key=storage.key(index);if(typeof key!=='string'||seen.has(key))return {kind:'unavailable',reason:'changed'};seen.add(key);
   const id=current.get(key);if(id)ids.add(id);else{const ref=archived.get(key);if(ref)archives.push({...ref});}
  }
  if(storage.length!==length)return {kind:'unavailable',reason:'changed'};
  return {kind:'ready',currentIds:trainerBank.sources.filter(s=>ids.has(s.ref.unitId)).map(s=>s.ref.unitId),archives:archives.sort((a,b)=>bankSourceIdentity(a).localeCompare(bankSourceIdentity(b)))};
 }catch{return {kind:'unavailable',reason:'blocked'};}
}
