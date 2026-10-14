import {bankSourceQuery,findBankSource,trainerBank,type BankSource,type BankSourceRef} from './bank-sources';
import {trainerCatalog,type TrainerId} from './catalog';
import {bankRecordKey,parseBankRecord,type BankEntry} from './bank-records';
import {bankSnapshotComplete,bankSnapshotFingerprint,emptyBankSnapshot} from './bank-snapshots';
import {bankWritingPair} from './bank-writing-state';
import {bankSkillLabel} from './bank-skill-labels';

export type BankFilters={exam:'all'|'IELTS'|'SAT';trainer:'all'|TrainerId;query:string};
export const BANK_PAGE_SIZE=12;
/** Author rehearsal suggestions, never inferred difficulty/mastery or prior exposure. */
export function bankNextPractice(ref:BankSourceRef):BankSource[]{
 const current=findBankSource(ref);if(!current)return [];
 const pool=trainerBank.sources.filter(source=>source.trainer===current.trainer),index=pool.findIndex(source=>source===current),used=current.exercise.type==='writing-drill'?new Set(bankWritingPair(current)?.map(item=>item.id)??[]):null;
 const ordered=Array.from({length:pool.length-1},(_,offset)=>pool[(index+offset+1)%pool.length]);
 const candidates=[...ordered.filter(source=>source.practiceType===current.practiceType),...ordered.filter(source=>source.practiceType!==current.practiceType)],next:BankSource[]=[];
 for(const source of candidates){if(next.length===2)break;if(used&&bankWritingPair(source)?.some(item=>used.has(item.id)))continue;next.push(source);}
 return next;
}
/** Bundled DRAFT rehearsals only. This local UI predicate is not server authorization. */
export function canRehearseBank(role:string|null|undefined):boolean{return role==='teacher'||role==='author';}
export function bankPracticeHref(ref:BankSourceRef):string|null{
 const source=findBankSource(ref);if(!source)return null;
 // Speaking needs a native document at its existing microphone-policy route.
 if(source.exercise.type==='speaking')return '/trainers/speaking-second-take?'+new URLSearchParams({reviewBatch:source.ref.batchId,reviewVersion:source.ref.version,reviewUnit:source.ref.unitId,reviewHash:source.ref.contentHash});
 return '/trainers/bank/practice?'+bankSourceQuery(source.ref);
}
export function filterBankSources(filters:BankFilters):BankSource[]{
 if(!['all','IELTS','SAT'].includes(filters.exam)||filters.trainer!=='all'&&!trainerCatalog.some(t=>t.id===filters.trainer)||typeof filters.query!=='string'||filters.query.length>200)return [];
 const query=filters.query.normalize('NFC').trim().toLocaleLowerCase('ru');
 return trainerBank.sources.filter(source=>{
  const trainer=trainerCatalog.find(t=>t.id===source.trainer)!;
  return (filters.exam==='all'||trainer.exam===filters.exam)&&(filters.trainer==='all'||source.trainer===filters.trainer)&&(!query||`${source.ref.unitId} ${source.title} ${source.skill} ${bankSkillLabel(source.skill)} ${source.practiceType} ${trainer.title} ${trainer.skill}`.normalize('NFC').toLocaleLowerCase('ru').includes(query));
 });
}
export function bankPage(sources:BankSource[],requestedPage:number){
 const pages=Math.max(1,Math.ceil(sources.length/BANK_PAGE_SIZE)),page=Number.isSafeInteger(requestedPage)?Math.max(0,Math.min(pages-1,requestedPage)):0;
 return {page,pages,total:sources.length,items:sources.slice(page*BANK_PAGE_SIZE,(page+1)*BANK_PAGE_SIZE)};
}
export type BankEntrySummary={id:string;savedAt:string;state:'not-started'|'in-progress'|'complete'};
export type BankSummary={kind:'empty'}|{kind:'unavailable'}|{kind:'source-unavailable'}|{kind:'incompatible'}|{kind:'ready';current:BankEntrySummary|null;history:BankEntrySummary[]};
/** Read one explicitly requested record, never scan or parse the entire bank. No writes. */
export function readBankSummary(scope:string,ref:BankSourceRef,storage:Pick<Storage,'getItem'>):BankSummary{
 const source=findBankSource(ref);if(!source)return {kind:'source-unavailable'};
 if(typeof scope!=='string'||!scope||scope.length>200)return {kind:'unavailable'};
 try{
  const raw=storage.getItem(bankRecordKey(scope,source.ref));if(raw===null)return {kind:'empty'};
  const record=parseBankRecord(raw,source);if(!record)return {kind:'incompatible'};
  const pristine=emptyBankSnapshot(source),emptyFingerprint=pristine?bankSnapshotFingerprint(pristine):null;
  const summary=(entry:BankEntry):BankEntrySummary=>({id:entry.id,savedAt:entry.savedAt,state:bankSnapshotComplete(entry.data)?'complete':bankSnapshotFingerprint(entry.data)===emptyFingerprint?'not-started':'in-progress'});
  return {kind:'ready',current:record.checkpoint?summary(record.checkpoint):null,history:record.history.map(summary)};
 }catch{return {kind:'unavailable'};}
}
