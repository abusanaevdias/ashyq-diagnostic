import type {DraftSatPair} from './draft-sat-rw';

export type BankSatAttempt={id:string;prediction:string;choice:number;reasons:string[];repair:string};
export type BankSatState={type:'sat-rw';started:boolean;roundIndex:0|1;prediction:string;locked:boolean;choice:number|null;reasons:string[];checked:boolean;repair:string;attempts:BankSatAttempt[];report:boolean};
export const emptyBankSatState=():BankSatState=>({type:'sat-rw',started:false,roundIndex:0,prediction:'',locked:false,choice:null,reasons:['','','',''],checked:false,repair:'',attempts:[],report:false});
const normalizedAttempt=(a:BankSatAttempt)=>({id:a.id,prediction:a.prediction,choice:a.choice,reasons:a.reasons,repair:a.repair});
export const bankSatFingerprint=(s:BankSatState)=>JSON.stringify({type:s.type,started:s.started,roundIndex:s.roundIndex,prediction:s.prediction,locked:s.locked,choice:s.choice,reasons:s.reasons,checked:s.checked,repair:s.repair,attempts:s.attempts.map(normalizedAttempt),report:s.report});
const object=(v:unknown):v is Record<string,unknown>=>!!v&&typeof v==='object'&&!Array.isArray(v);
const exact=(v:Record<string,unknown>,keys:string[])=>Object.keys(v).length===keys.length&&keys.every(key=>Object.hasOwn(v,key));
const text=(v:unknown):v is string=>typeof v==='string'&&v.length<=600;
const choice=(v:unknown):v is number=>typeof v==='number'&&Number.isInteger(v)&&v>=0&&v<4;
const reasons=(v:unknown):v is string[]=>Array.isArray(v)&&v.length===4&&v.every(text);
function checkedReasons(values:string[],selected:number,pair:DraftSatPair){return pair.trainer==='sat-optionless'?values.every(value=>value===''):values.every((value,i)=>i===selected||value.trim().length>=12);}
function attempt(value:unknown,pair:DraftSatPair,index:number):value is BankSatAttempt{return object(value)&&exact(value,['id','prediction','choice','reasons','repair'])&&value.id===pair.rounds[index].id&&text(value.prediction)&&value.prediction.trim().length>=12&&choice(value.choice)&&reasons(value.reasons)&&checkedReasons(value.reasons,value.choice,pair)&&text(value.repair)&&value.repair.trim().length>=12;}
/** Keeps original prediction/selection/reasons separate from feedback reflection; no free-text grade. */
export function validBankSatState(value:unknown,pair:DraftSatPair):value is BankSatState{
 if(!object(value)||!exact(value,['type','started','roundIndex','prediction','locked','choice','reasons','checked','repair','attempts','report'])||value.type!=='sat-rw'||typeof value.started!=='boolean'||(value.roundIndex!==0&&value.roundIndex!==1)||!text(value.prediction)||typeof value.locked!=='boolean'||(value.choice!==null&&!choice(value.choice))||!reasons(value.reasons)||typeof value.checked!=='boolean'||!text(value.repair)||!Array.isArray(value.attempts)||value.attempts.length>2||typeof value.report!=='boolean')return false;
 const s=value as BankSatState;
 if(!s.started)return bankSatFingerprint(s)===bankSatFingerprint(emptyBankSatState());
 if(s.attempts.length!==(s.report?2:s.roundIndex)||s.attempts.some((a,i)=>!attempt(a,pair,i)))return false;
 if(!s.locked&&(s.choice!==null||s.checked||s.report||s.reasons.some(value=>value!=='')))return false;
 if(s.locked&&s.prediction.trim().length<12)return false;
 if(s.choice===null&&s.reasons.some(value=>value!==''))return false;
 if(pair.trainer==='sat-optionless'&&s.reasons.some(value=>value!==''))return false;
 if(s.checked&&(!s.locked||s.choice===null||!checkedReasons(s.reasons,s.choice,pair)))return false;
 if(!s.checked&&s.repair!=='')return false;
 if(s.report){const current={id:pair.rounds[s.roundIndex].id,prediction:s.prediction,choice:s.choice!,reasons:s.reasons,repair:s.repair};if(s.roundIndex!==1||!s.checked||!attempt(current,pair,1)||JSON.stringify(normalizedAttempt(current))!==JSON.stringify(normalizedAttempt(s.attempts[1])))return false;}
 return true;
}
