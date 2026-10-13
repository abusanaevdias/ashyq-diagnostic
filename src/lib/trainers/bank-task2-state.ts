import { task2Words, type DraftTask2, type Task2Correction } from './draft-task2';

export type BankTask2Attempt = { corrections: Task2Correction[]; noIssues: boolean; argumentQuote: string; argumentReason: string; revision: string; reflection: string };
export type BankTask2State = { type: 'task2'; started: boolean; index: 0 | 1; revealed: boolean; result: boolean; attempt: BankTask2Attempt; saved: BankTask2Attempt[]; checked: boolean };
export const blankBankTask2Attempt = (): BankTask2Attempt => ({corrections:[{quote:'',replacement:'',reason:''}],noIssues:false,argumentQuote:'',argumentReason:'',revision:'',reflection:''});
export const emptyBankTask2State = (): BankTask2State => ({type:'task2',started:false,index:0,revealed:false,result:false,attempt:blankBankTask2Attempt(),saved:[],checked:false});
const normalizedAttempt = (value:BankTask2Attempt):BankTask2Attempt => ({corrections:value.corrections.map(row=>({quote:row.quote,replacement:row.replacement,reason:row.reason})),noIssues:value.noIssues,argumentQuote:value.argumentQuote,argumentReason:value.argumentReason,revision:value.revision,reflection:value.reflection});
export const bankTask2Fingerprint = (state:BankTask2State) => JSON.stringify({type:state.type,started:state.started,index:state.index,revealed:state.revealed,result:state.result,attempt:normalizedAttempt(state.attempt),saved:state.saved.map(normalizedAttempt),checked:state.checked});
const object=(v:unknown):v is Record<string,unknown>=>!!v&&typeof v==='object'&&!Array.isArray(v);
const exact=(v:Record<string,unknown>,keys:string[])=>Object.keys(v).length===keys.length&&keys.every(key=>Object.hasOwn(v,key));
const text=(v:unknown,max:number):v is string=>typeof v==='string'&&v.length<=max;
function attemptShape(v:unknown):v is BankTask2Attempt {
  return object(v)&&exact(v,['corrections','noIssues','argumentQuote','argumentReason','revision','reflection'])&&typeof v.noIssues==='boolean'&&text(v.argumentQuote,2000)&&text(v.argumentReason,3000)&&text(v.revision,24000)&&text(v.reflection,3000)&&Array.isArray(v.corrections)&&v.corrections.length<=12&&v.corrections.every(row=>object(row)&&exact(row,['quote','replacement','reason'])&&text(row.quote,1000)&&text(row.replacement,1500)&&text(row.reason,1500));
}
function validRevealedAttempt(attempt: BankTask2Attempt,text: string,complete: boolean): boolean {
  if(attempt.noIssues ? attempt.corrections.length!==0 : !attempt.corrections.length||attempt.corrections.some(row=>!row.quote.trim()||row.quote!==row.quote.trim()||!text.includes(row.quote)||row.replacement.trim().length<2||row.reason.trim().length<3))return false;
  if(!attempt.argumentQuote.trim()||attempt.argumentQuote!==attempt.argumentQuote.trim()||!text.includes(attempt.argumentQuote)||attempt.argumentReason.trim().length<12)return false;
  return !complete||task2Words(attempt.revision)>=250&&attempt.reflection.trim().length>=12;
}
/** Source-specific state invariants; never treats matching text or completion as a quality grade. */
export function validBankTask2State(value: unknown,pair: DraftTask2): value is BankTask2State {
  if(!object(value)||!exact(value,['type','started','index','revealed','result','attempt','saved','checked'])||value.type!=='task2'||typeof value.started!=='boolean'||(value.index!==0&&value.index!==1)||typeof value.revealed!=='boolean'||typeof value.result!=='boolean'||typeof value.checked!=='boolean'||!attemptShape(value.attempt)||!Array.isArray(value.saved)||value.saved.length>2||!value.saved.every(attemptShape))return false;
  const state=value as BankTask2State;
  if(!state.started)return bankTask2Fingerprint(state)===bankTask2Fingerprint(emptyBankTask2State());
  if(state.saved.length!==(state.result?2:state.index))return false;
  if(state.result&&(!state.revealed||state.index!==1||!state.checked||JSON.stringify(normalizedAttempt(state.attempt))!==JSON.stringify(normalizedAttempt(state.saved[1]))))return false;
  if(!state.revealed&&(state.result||state.checked||state.attempt.revision!==''||state.attempt.reflection!==''))return false;
  if(state.revealed&&!validRevealedAttempt(state.attempt,pair.rounds[state.index].text,false))return false;
  if(!state.revealed&&!state.attempt.noIssues&&!state.attempt.corrections.length)return false;
  if(state.saved.some((attempt,index)=>!validRevealedAttempt(attempt,pair.rounds[index].text,true)))return false;
  return true;
}
