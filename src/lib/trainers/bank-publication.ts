import manifest from '@/data/trainer-publications/release.json';
import {bankSourceIdentity,findBankSource,parseBankSourceRef,trainerBank,type BankSourceRef} from './bank-sources';
import {bankWritingPair} from './bank-writing-state';

export const PUBLICATION_CHECKS=['instructions','answers','alternatives','repair','transfer'] as const;
export type BankPublication={source:BankSourceRef;reviewer:string;reviewedAt:string;approvalEvidence:string;checks:Record<typeof PUBLICATION_CHECKS[number],true>};
export type BankPublicationManifest={format:'ashyq-bank-publication-v1';preparedAt:string|null;releases:BankPublication[]};
const object=(v:unknown):v is Record<string,unknown>=>!!v&&typeof v==='object'&&!Array.isArray(v);
const exact=(v:Record<string,unknown>,keys:readonly string[])=>Object.keys(v).length===keys.length&&keys.every(k=>Object.hasOwn(v,k));
const text=(v:unknown,min:number,max:number):v is string=>typeof v==='string'&&v.trim().length>=min&&v.length<=max&&!/[\u0000-\u001f\u007f]/.test(v);

/** Build input from an explicit human approval receipt, never a browser recommendation.
 * Validation establishes source/checklist integrity, not the truth of a human attestation.
 * Deployment operators must verify the supplied approval evidence before publication. */
export function parseBankPublication(value:unknown):BankPublicationManifest|null{
 if(!object(value)||!exact(value,['format','preparedAt','releases'])||value.format!=='ashyq-bank-publication-v1'||!Array.isArray(value.releases)||value.releases.length>200)return null;
 if(value.releases.length?(typeof value.preparedAt!=='string'||!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(value.preparedAt)||!Number.isFinite(Date.parse(value.preparedAt))||new Date(value.preparedAt).toISOString()!==value.preparedAt):value.preparedAt!==null)return null;
 const releases:BankPublication[]=[],seen=new Set<string>();
 for(const item of value.releases){
  if(!object(item)||!exact(item,['source','reviewer','reviewedAt','approvalEvidence','checks']))return null;
  const ref=parseBankSourceRef(item.source);
  if(!ref||!findBankSource(ref)||seen.has(bankSourceIdentity(ref))||!text(item.reviewer,2,100)||!text(item.approvalEvidence,20,3000)||typeof item.reviewedAt!=='string'||!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(item.reviewedAt)||!Number.isFinite(Date.parse(item.reviewedAt))||Date.parse(item.reviewedAt)>Date.parse(value.preparedAt as string)||new Date(item.reviewedAt).toISOString()!==item.reviewedAt||!object(item.checks)||!exact(item.checks,PUBLICATION_CHECKS)||!PUBLICATION_CHECKS.every(k=>(item.checks as Record<string,unknown>)[k]===true))return null;
  seen.add(bankSourceIdentity(ref));releases.push({source:ref,reviewer:item.reviewer,reviewedAt:item.reviewedAt,approvalEvidence:item.approvalEvidence,checks:{instructions:true,answers:true,alternatives:true,repair:true,transfer:true}});
 }
 // A short-Writing module opens a second module's example. Both source versions
 // need independent approval; approval of one cannot publish its draft companion.
 for(const release of releases){const source=findBankSource(release.source)!;if(source.exercise.type==='writing-drill'){const pair=bankWritingPair(source);if(!pair)return null;for(const unit of pair){const companion=trainerBank.sources.find(s=>s.ref.unitId===unit.id);if(!companion||!seen.has(bankSourceIdentity(companion.ref)))return null;}}}
 return {format:'ashyq-bank-publication-v1',preparedAt:value.preparedAt as string|null,releases};
}
export const bankPublication=parseBankPublication(manifest);
/** Malformed/stale publication input releases nothing; no inferred approval. */
export const publishedBankSources=bankPublication?bankPublication.releases.map(r=>findBankSource(r.source)!):[];
export function isPublishedBankSource(ref:BankSourceRef):boolean{const normalized=parseBankSourceRef(ref);return !!normalized&&publishedBankSources.some(s=>bankSourceIdentity(s.ref)===bankSourceIdentity(normalized));}
