import { isReadingLabel, type DraftReadingPair, type ReadingLabel } from './draft-reading';

export type BankReadingResponse = { choice: ReadingLabel | ''; excerpt: string; reason: string };
export type BankReadingAttempt = { first: BankReadingResponse[]; repair: ReadingLabel[]; reflection: string };
export type BankReadingState = { type:'reading'; started:boolean; round:0|1; report:boolean; responses:BankReadingResponse[]; frozen:BankReadingResponse[]|null; repairs:(ReadingLabel|'')[]; reflection:string; attempts:BankReadingAttempt[] };
export const blankBankReadingResponses=():BankReadingResponse[]=>Array.from({length:3},()=>({choice:'',excerpt:'',reason:''}));
export const emptyBankReadingState=():BankReadingState=>({type:'reading',started:false,round:0,report:false,responses:blankBankReadingResponses(),frozen:null,repairs:['','',''],reflection:'',attempts:[]});
const normalizedResponses=(values:BankReadingResponse[])=>values.map(row=>({choice:row.choice,excerpt:row.excerpt,reason:row.reason}));
const normalizedAttempt=(value:BankReadingAttempt)=>({first:normalizedResponses(value.first),repair:value.repair,reflection:value.reflection});
export const bankReadingFingerprint=(value:BankReadingState)=>JSON.stringify({type:value.type,started:value.started,round:value.round,report:value.report,responses:normalizedResponses(value.responses),frozen:value.frozen&&normalizedResponses(value.frozen),repairs:value.repairs,reflection:value.reflection,attempts:value.attempts.map(normalizedAttempt)});
const object=(v:unknown):v is Record<string,unknown>=>!!v&&typeof v==='object'&&!Array.isArray(v);
const exact=(v:Record<string,unknown>,keys:string[])=>Object.keys(v).length===keys.length&&keys.every(key=>Object.hasOwn(v,key));
const text=(v:unknown):v is string=>typeof v==='string'&&v.length<=600;
const responses=(v:unknown):v is BankReadingResponse[]=>Array.isArray(v)&&v.length===3&&v.every(row=>object(row)&&exact(row,['choice','excerpt','reason'])&&(row.choice===''||isReadingLabel(row.choice))&&text(row.excerpt)&&text(row.reason));
const repairs=(v:unknown):v is (ReadingLabel|'')[]=>Array.isArray(v)&&v.length===3&&v.every(choice=>choice===''||isReadingLabel(choice));
function revealed(values:BankReadingResponse[],sourceText:string){return values.every(row=>isReadingLabel(row.choice)&&row.reason.trim().length>=3&&(row.choice==='NOT GIVEN'||row.excerpt.trim().length>=3)&&(!row.excerpt.trim()||sourceText.includes(row.excerpt.trim())));}
function completed(value:BankReadingAttempt,pair:DraftReadingPair,index:number){return revealed(value.first,pair.rounds[index].text)&&value.repair.every((choice,i)=>choice===pair.rounds[index].claims[i].answer)&&value.reflection.trim().length>=3;}
/** Checks source/phase integrity, not the quality of free-text evidence or reasoning. */
export function validBankReadingState(value:unknown,pair:DraftReadingPair):value is BankReadingState{
  if(!object(value)||!exact(value,['type','started','round','report','responses','frozen','repairs','reflection','attempts'])||value.type!=='reading'||typeof value.started!=='boolean'||(value.round!==0&&value.round!==1)||typeof value.report!=='boolean'||!responses(value.responses)||(value.frozen!==null&&!responses(value.frozen))||!repairs(value.repairs)||!text(value.reflection)||!Array.isArray(value.attempts)||value.attempts.length>2||!value.attempts.every(a=>object(a)&&exact(a,['first','repair','reflection'])&&responses(a.first)&&Array.isArray(a.repair)&&a.repair.length===3&&a.repair.every(isReadingLabel)&&text(a.reflection)))return false;
  const state=value as BankReadingState;
  if(!state.started)return bankReadingFingerprint(state)===bankReadingFingerprint(emptyBankReadingState());
  if(state.attempts.length!==(state.report?2:state.round)||state.attempts.some((attempt,index)=>!completed(attempt,pair,index)))return false;
  if(state.frozen===null)return !state.report&&state.repairs.every(choice=>choice==='')&&state.reflection==='';
  if(!revealed(state.frozen,pair.rounds[state.round].text)||JSON.stringify(normalizedResponses(state.responses))!==JSON.stringify(normalizedResponses(state.frozen)))return false;
  if(state.report&&(state.round!==1||JSON.stringify(normalizedAttempt({first:state.frozen,repair:state.repairs as ReadingLabel[],reflection:state.reflection}))!==JSON.stringify(normalizedAttempt(state.attempts[1]))))return false;
  return true;
}
