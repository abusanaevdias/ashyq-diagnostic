import {findBankSource,trainerBank,type BankSource} from './bank-sources';
import {nextDraftWriting,type DraftWritingDrill} from './draft-writing';
import {MAX_DRILL_CHOICES} from './drill-records';

export type BankWritingExposure='unknown'|'unseen'|'seen';
export type BankWritingRound={id:string;exposure:BankWritingExposure;draft:string;locked:boolean;choice:number|null;revealed:boolean;trail:number[];help:boolean;attempts:number;revision:string;reflection:string;acknowledged:boolean};
export type BankWritingState={type:'writing-drill';started:boolean;current:BankWritingRound;records:BankWritingRound[]};
export type BankWritingPair=[DraftWritingDrill,DraftWritingDrill];
/** Both tasks are covered by the same batch fingerprint; no unbound secondary source. */
export function bankWritingPair(source:BankSource):BankWritingPair|null{
 const trusted=findBankSource(source.ref);if(!trusted||trusted.exercise.type!=='writing-drill')return null;
 const pool=trainerBank.sources.filter(candidate=>candidate.ref.batchId===trusted.ref.batchId&&candidate.ref.version===trusted.ref.version&&candidate.ref.contentHash===trusted.ref.contentHash&&candidate.exercise.type==='writing-drill').map(candidate=>candidate.unit.exercise_data);
 const next=nextDraftWriting(trusted.exercise.value,pool);return next?[trusted.exercise.value,next]:null;
}
export const emptyBankWritingRound=(id:string):BankWritingRound=>({id,exposure:'unknown',draft:'',locked:false,choice:null,revealed:false,trail:[],help:false,attempts:0,revision:'',reflection:'',acknowledged:false});
export const emptyBankWritingState=(pair:BankWritingPair):BankWritingState=>({type:'writing-drill',started:false,current:emptyBankWritingRound(pair[0].id),records:[]});
const normalizedRound=(r:BankWritingRound)=>({id:r.id,exposure:r.exposure,draft:r.draft,locked:r.locked,choice:r.choice,revealed:r.revealed,trail:r.trail,help:r.help,attempts:r.attempts,revision:r.revision,reflection:r.reflection,acknowledged:r.acknowledged});
export const bankWritingFingerprint=(s:BankWritingState)=>JSON.stringify({type:s.type,started:s.started,current:normalizedRound(s.current),records:s.records.map(normalizedRound)});
const object=(v:unknown):v is Record<string,unknown>=>!!v&&typeof v==='object'&&!Array.isArray(v);
const exact=(v:Record<string,unknown>,keys:string[])=>Object.keys(v).length===keys.length&&keys.every(key=>Object.hasOwn(v,key));
const text=(v:unknown,max:number):v is string=>typeof v==='string'&&v.length<=max;
const choice=(v:unknown):v is number=>typeof v==='number'&&Number.isInteger(v)&&v>=0&&v<3;
function round(value:unknown,item:DraftWritingDrill,complete:boolean):value is BankWritingRound{
 if(!object(value)||!exact(value,['id','exposure','draft','locked','choice','revealed','trail','help','attempts','revision','reflection','acknowledged'])||value.id!==item.id||!['unknown','unseen','seen'].some(exposure=>exposure===value.exposure)||!text(value.draft,4000)||typeof value.locked!=='boolean'||(value.choice!==null&&!choice(value.choice))||typeof value.revealed!=='boolean'||!Array.isArray(value.trail)||value.trail.length>MAX_DRILL_CHOICES||!value.trail.every(choice)||typeof value.help!=='boolean'||typeof value.attempts!=='number'||!Number.isSafeInteger(value.attempts)||value.attempts<0||value.trail.length!==Math.min(value.attempts,MAX_DRILL_CHOICES)||!text(value.revision,4000)||!text(value.reflection,1500)||typeof value.acknowledged!=='boolean')return false;
 const r=value as BankWritingRound,best=item.choices.findIndex(c=>c.best);
 if(!r.locked)return !complete&&!r.revealed&&r.choice===null&&!r.trail.length&&!r.help&&r.attempts===0&&r.revision===''&&r.reflection===''&&!r.acknowledged;
 if(r.draft.trim().length<12)return false;
 if(!r.revealed)return !complete&&!r.help&&r.trail.every(c=>c!==best)&&r.revision===''&&r.reflection===''&&!r.acknowledged;
 if(r.help){if(r.trail.some(c=>c===best))return false;}else if(!r.attempts||r.choice!==best||r.trail.at(-1)!==best||r.trail.slice(0,-1).some(c=>c===best))return false;
 return !complete||r.acknowledged&&r.revision.trim().length>=12&&r.reflection.trim().length>=12;
}
/** Exposure and help remain explicit; a successful option choice does not grade the written response. */
export function validBankWritingState(value:unknown,pair:BankWritingPair):value is BankWritingState{
 if(!object(value)||!exact(value,['type','started','current','records'])||value.type!=='writing-drill'||typeof value.started!=='boolean'||!Array.isArray(value.records)||value.records.length>2||!value.records.every((r,i)=>round(r,pair[i],true)))return false;
 const currentIndex=value.records.length?1:0;
 if(!round(value.current,pair[currentIndex],value.records.length===2))return false;
 const s=value as BankWritingState;
 if(!s.started)return bankWritingFingerprint(s)===bankWritingFingerprint(emptyBankWritingState(pair));
 return s.records.length!==2||JSON.stringify(normalizedRound(s.current))===JSON.stringify(normalizedRound(s.records[1]));
}
