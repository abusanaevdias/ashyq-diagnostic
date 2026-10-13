import {draftTask1Words,type DraftTask1Chart} from './draft-task1';
import type {Task1CategoryChart} from './draft-task1-categories';
import type {Task1Diagram} from './draft-task1-diagrams';

export type BankTask1Pair={charts:(DraftTask1Chart|Task1CategoryChart|Task1Diagram)[]};
export type BankTask1Attempt={selected:number[];overview:string;evidence:Record<number,string>;draft:string;revision:string;reflection:string};
export type BankTask1State={type:'task1';started:boolean;round:0|1;phase:'overview'|'draft'|'feedback'|'report';selected:number[];overview:string;evidence:Record<number,string>;draft:string;revision:string;reflection:string;reviewed:boolean;attempts:BankTask1Attempt[]};
export const emptyBankTask1State=():BankTask1State=>({type:'task1',started:false,round:0,phase:'overview',selected:[],overview:'',evidence:{},draft:'',revision:'',reflection:'',reviewed:false,attempts:[]});
const normalizedEvidence=(v:Record<number,string>)=>Object.fromEntries(Object.entries(v).sort(([a],[b])=>Number(a)-Number(b)));
const normalizedAttempt=(a:BankTask1Attempt)=>({selected:a.selected,overview:a.overview,evidence:normalizedEvidence(a.evidence),draft:a.draft,revision:a.revision,reflection:a.reflection});
export const bankTask1Fingerprint=(s:BankTask1State)=>JSON.stringify({type:s.type,started:s.started,round:s.round,phase:s.phase,selected:s.selected,overview:s.overview,evidence:normalizedEvidence(s.evidence),draft:s.draft,revision:s.revision,reflection:s.reflection,reviewed:s.reviewed,attempts:s.attempts.map(normalizedAttempt)});
const object=(v:unknown):v is Record<string,unknown>=>!!v&&typeof v==='object'&&!Array.isArray(v);
const exact=(v:Record<string,unknown>,keys:string[])=>Object.keys(v).length===keys.length&&keys.every(key=>Object.hasOwn(v,key));
const text=(v:unknown,max:number):v is string=>typeof v==='string'&&v.length<=max;
const selected=(v:unknown):v is number[]=>Array.isArray(v)&&v.length<=6&&new Set(v).size===v.length&&v.every(n=>Number.isInteger(n)&&n>=0&&n<6);
const evidence=(v:unknown):v is Record<number,string>=>object(v)&&Object.entries(v).every(([key,value])=>/^[0-5]$/.test(key)&&text(value,600));
function overview(a:Pick<BankTask1Attempt,'selected'|'overview'|'evidence'>){return a.selected.length===3&&a.overview.trim().length>=12&&a.selected.every(index=>(a.evidence[index]??'').trim().length>=3);}
function attempt(v:unknown):v is BankTask1Attempt{return object(v)&&exact(v,['selected','overview','evidence','draft','revision','reflection'])&&selected(v.selected)&&text(v.overview,1800)&&evidence(v.evidence)&&text(v.draft,10000)&&text(v.revision,10000)&&text(v.reflection,600)&&overview(v as BankTask1Attempt)&&draftTask1Words(v.draft)>=150&&draftTask1Words(v.revision)>=150&&v.reflection.trim().length>=3;}
/** Author-feature agreement is not free-text quality; wrong selections/revisions remain valid work. */
export function validBankTask1State(value:unknown,pair:BankTask1Pair):value is BankTask1State{
 if(pair.charts.length!==2||pair.charts.some(chart=>chart.claims.length!==6)||!object(value)||!exact(value,['type','started','round','phase','selected','overview','evidence','draft','revision','reflection','reviewed','attempts'])||value.type!=='task1'||typeof value.started!=='boolean'||(value.round!==0&&value.round!==1)||(typeof value.phase!=='string'||!['overview','draft','feedback','report'].includes(value.phase))||!selected(value.selected)||!text(value.overview,1800)||!evidence(value.evidence)||!text(value.draft,10000)||!text(value.revision,10000)||!text(value.reflection,600)||typeof value.reviewed!=='boolean'||!Array.isArray(value.attempts)||value.attempts.length>2||!value.attempts.every(attempt))return false;
 const s=value as BankTask1State;
 if(!s.started)return bankTask1Fingerprint(s)===bankTask1Fingerprint(emptyBankTask1State());
 if(s.attempts.length!==(s.phase==='report'?2:s.round))return false;
 if(s.phase==='overview')return s.draft===''&&s.revision===''&&s.reflection===''&&!s.reviewed;
 if(!overview(s))return false;
 if(s.phase==='draft')return s.revision===''&&s.reflection===''&&!s.reviewed;
 if(draftTask1Words(s.draft)<150)return false;
 if(s.phase==='report'&&(s.round!==1||!s.reviewed||!attempt(normalizedAttempt(s))||JSON.stringify(normalizedAttempt(s))!==JSON.stringify(normalizedAttempt(s.attempts[1]))))return false;
 return true;
}
