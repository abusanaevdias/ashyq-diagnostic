import {parseDraftMathNumber,type DraftMathPair} from './draft-math';

export type BankMathAttempt={working:string;answer:string;numericAnswer:number;choice:number;reflection:string;repairedWorking:string;repairedAnswer:string;repairedNumericAnswer:number};
export type BankMathState={type:'math';started:boolean;round:0|1;report:boolean;working:string;answer:string;choice:number|null;locked:boolean;checked:boolean;reflection:string;repairedWorking:string;repairedAnswer:string;attempts:BankMathAttempt[]};
export const emptyBankMathState=():BankMathState=>({type:'math',started:false,round:0,report:false,working:'',answer:'',choice:null,locked:false,checked:false,reflection:'',repairedWorking:'',repairedAnswer:'',attempts:[]});
const normalizedAttempt=(a:BankMathAttempt)=>({working:a.working,answer:a.answer,numericAnswer:a.numericAnswer,choice:a.choice,reflection:a.reflection,repairedWorking:a.repairedWorking,repairedAnswer:a.repairedAnswer,repairedNumericAnswer:a.repairedNumericAnswer});
export const bankMathFingerprint=(s:BankMathState)=>JSON.stringify({type:s.type,started:s.started,round:s.round,report:s.report,working:s.working,answer:s.answer,choice:s.choice,locked:s.locked,checked:s.checked,reflection:s.reflection,repairedWorking:s.repairedWorking,repairedAnswer:s.repairedAnswer,attempts:s.attempts.map(normalizedAttempt)});
const object=(v:unknown):v is Record<string,unknown>=>!!v&&typeof v==='object'&&!Array.isArray(v);
const exact=(v:Record<string,unknown>,keys:string[])=>Object.keys(v).length===keys.length&&keys.every(key=>Object.hasOwn(v,key));
const text=(v:unknown,max=600):v is string=>typeof v==='string'&&v.length<=max;
function validChoice(choice:unknown,pair:DraftMathPair,index:number):choice is number{const r=pair.rounds[index],size=pair.family==='translation'?r.models!.length:pair.family==='forensics'?r.steps!.length:r.methods!.length;return typeof choice==='number'&&Number.isInteger(choice)&&choice>=0&&choice<size;}
function attempt(v:unknown,pair:DraftMathPair,index:number):v is BankMathAttempt{
 if(!object(v)||!exact(v,['working','answer','numericAnswer','choice','reflection','repairedWorking','repairedAnswer','repairedNumericAnswer'])||!text(v.working)||!text(v.answer,60)||!text(v.reflection)||!text(v.repairedWorking)||!text(v.repairedAnswer,60)||!validChoice(v.choice,pair,index))return false;
 const original=parseDraftMathNumber(v.answer),revised=parseDraftMathNumber(v.repairedAnswer);
 return v.working.trim().length>=3&&v.reflection.trim().length>=3&&v.repairedWorking.trim().length>=3&&original!==null&&revised!==null&&v.numericAnswer===original&&v.repairedNumericAnswer===revised;
}
/** Validity preserves wrong first/revised answers. It is not a proof of reasoning quality. */
export function validBankMathState(value:unknown,pair:DraftMathPair):value is BankMathState{
 if(!object(value)||!exact(value,['type','started','round','report','working','answer','choice','locked','checked','reflection','repairedWorking','repairedAnswer','attempts'])||value.type!=='math'||typeof value.started!=='boolean'||(value.round!==0&&value.round!==1)||typeof value.report!=='boolean'||typeof value.locked!=='boolean'||typeof value.checked!=='boolean'||!text(value.working)||!text(value.answer,60)||!text(value.reflection)||!text(value.repairedWorking)||!text(value.repairedAnswer,60)||!Array.isArray(value.attempts)||value.attempts.length>2||(value.choice!==null&&!validChoice(value.choice,pair,value.round)))return false;
 const s=value as BankMathState;
 if(!s.started)return bankMathFingerprint(s)===bankMathFingerprint(emptyBankMathState());
 if(s.attempts.length!==(s.report?2:s.round)||s.attempts.some((a,i)=>!attempt(a,pair,i)))return false;
 if(!s.locked&&(s.checked||s.report||pair.family!=='method-switch'&&s.choice!==null))return false;
 if(s.locked&&(s.working.trim().length<3||parseDraftMathNumber(s.answer)===null||pair.family==='method-switch'&&s.choice===null))return false;
 if(s.checked&&(!s.locked||s.choice===null))return false;
 if(!s.checked&&(s.reflection!==''||s.repairedWorking!==''||s.repairedAnswer!==''))return false;
 if(s.report){const current={working:s.working,answer:s.answer,numericAnswer:parseDraftMathNumber(s.answer)!,choice:s.choice!,reflection:s.reflection,repairedWorking:s.repairedWorking,repairedAnswer:s.repairedAnswer,repairedNumericAnswer:parseDraftMathNumber(s.repairedAnswer)!};if(s.round!==1||!s.checked||!attempt(current,pair,1)||JSON.stringify(normalizedAttempt(current))!==JSON.stringify(normalizedAttempt(s.attempts[1])))return false;}
 return true;
}
