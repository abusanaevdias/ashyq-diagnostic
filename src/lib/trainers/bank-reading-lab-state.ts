import {readingLabAnswerMatches,readingLabContainsWord,readingLabText,type ReadingLabPair,type ReadingLabRound} from './draft-reading-lab';
export type ReadingLabResponse={prediction:string;answer:string;quote:string;reason:string;confidence:''|'low'|'medium'|'high'};
export type ReadingLabRepair={answer:string;reason:string;alternative:boolean};
export type ReadingLabAttempt={first:ReadingLabResponse;repair:ReadingLabRepair};
export type BankReadingLabState={type:'reading-lab';started:boolean;round:0|1;report:boolean;predictionLocked:boolean;response:ReadingLabResponse;frozen:ReadingLabResponse|null;repair:ReadingLabRepair;attempts:ReadingLabAttempt[]};
export const emptyReadingLabResponse=():ReadingLabResponse=>({prediction:'',answer:'',quote:'',reason:'',confidence:''});
export const emptyReadingLabRepair=():ReadingLabRepair=>({answer:'',reason:'',alternative:false});
export const emptyBankReadingLabState=():BankReadingLabState=>({type:'reading-lab',started:false,round:0,report:false,predictionLocked:false,response:emptyReadingLabResponse(),frozen:null,repair:emptyReadingLabRepair(),attempts:[]});
const object=(v:unknown):v is Record<string,unknown>=>!!v&&typeof v==='object'&&!Array.isArray(v);
const exact=(v:Record<string,unknown>,keys:string[])=>Object.keys(v).length===keys.length&&keys.every(k=>Object.hasOwn(v,k));
const bounded=(v:unknown,max:number):v is string=>typeof v==='string'&&v.length<=max;
const normalResponse=(r:ReadingLabResponse)=>({prediction:r.prediction,answer:r.answer,quote:r.quote,reason:r.reason,confidence:r.confidence});
const normalRepair=(r:ReadingLabRepair)=>({answer:r.answer,reason:r.reason,alternative:r.alternative});
export const bankReadingLabFingerprint=(s:BankReadingLabState)=>JSON.stringify({type:s.type,started:s.started,round:s.round,report:s.report,predictionLocked:s.predictionLocked,response:normalResponse(s.response),frozen:s.frozen?normalResponse(s.frozen):null,repair:normalRepair(s.repair),attempts:s.attempts.map(a=>({first:normalResponse(a.first),repair:normalRepair(a.repair)}))});
export function readingLabPredictionReady(pair:ReadingLabPair,r:ReadingLabResponse):boolean{const count=r.prediction.trim().split(/\s+/u).length;return pair.mode==='headings'?count>=5&&count<=8:r.prediction.trim().length>=3;}
export function readingLabFirstReady(pair:ReadingLabPair,round:ReadingLabRound,r:ReadingLabResponse):boolean{return readingLabPredictionReady(pair,r)&&!!r.confidence&&r.reason.trim().length>=12&&r.quote.trim().length>=3&&readingLabText(round).includes(r.quote.trim())&&(pair.mode==='summary'?r.answer.trim().length>0&&r.answer.trim().split(/\s+/u).length===1&&readingLabContainsWord(round,r.answer):round.options.some(o=>o.id===r.answer));}
export function readingLabRepairReady(pair:ReadingLabPair,round:ReadingLabRound,r:ReadingLabRepair):boolean{return r.reason.trim().length>=12&&(readingLabAnswerMatches(round,r.answer)?!r.alternative:pair.mode==='summary'&&r.alternative&&r.answer.trim().length>0&&r.answer.trim().split(/\s+/u).length===1&&readingLabContainsWord(round,r.answer));}
function response(v:unknown,r:ReadingLabRound,pair:ReadingLabPair,complete=false):v is ReadingLabResponse{if(!object(v)||!exact(v,['prediction','answer','quote','reason','confidence'])||!bounded(v.prediction,400)||!bounded(v.answer,40)||!bounded(v.quote,1000)||!bounded(v.reason,1000)||!['','low','medium','high'].includes(v.confidence as string))return false;if(pair.mode!=='summary'&&v.answer!==''&&!r.options.some(o=>o.id===v.answer))return false;return !complete||readingLabFirstReady(pair,r,v as ReadingLabResponse);}
function repair(v:unknown,pair:ReadingLabPair,r:ReadingLabRound,complete=false):v is ReadingLabRepair{if(!object(v)||!exact(v,['answer','reason','alternative'])||!bounded(v.answer,40)||!bounded(v.reason,1500)||typeof v.alternative!=='boolean'||pair.mode!=='summary'&&(v.alternative||v.answer!==''&&!r.options.some(o=>o.id===v.answer)))return false;return !complete||readingLabRepairReady(pair,r,v as ReadingLabRepair);}
export function validBankReadingLabState(value:unknown,pair:ReadingLabPair):value is BankReadingLabState{
 if(!object(value)||!exact(value,['type','started','round','report','predictionLocked','response','frozen','repair','attempts'])||value.type!=='reading-lab'||typeof value.started!=='boolean'||![0,1].includes(value.round as number)||typeof value.report!=='boolean'||typeof value.predictionLocked!=='boolean'||!Array.isArray(value.attempts)||value.attempts.length>2)return false;
 const current=pair.rounds[value.round as 0|1];if(!response(value.response,current,pair)||!repair(value.repair,pair,current)||(value.frozen!==null&&!response(value.frozen,current,pair,true)))return false;
 for(const [i,a] of value.attempts.entries())if(!object(a)||!exact(a,['first','repair'])||!response(a.first,pair.rounds[i],pair,true)||!repair(a.repair,pair,pair.rounds[i],true))return false;
 const s=value as BankReadingLabState;
 if(!s.started)return bankReadingLabFingerprint(s)===bankReadingLabFingerprint(emptyBankReadingLabState());
 if(s.round!==Math.min(s.attempts.length,1)||s.report!==(s.attempts.length===2))return false;
 if(s.predictionLocked&&!readingLabPredictionReady(pair,s.response))return false;
 if(!s.predictionLocked&&pair.mode!=='inference'&&(s.response.answer!==''||s.response.quote!==''||s.response.reason!==''||s.response.confidence!==''||s.frozen!==null))return false;
 if(s.frozen&&(JSON.stringify(normalResponse(s.response))!==JSON.stringify(normalResponse(s.frozen))||pair.mode!=='inference'&&!s.predictionLocked))return false;
 if(!s.frozen&&JSON.stringify(normalRepair(s.repair))!==JSON.stringify(emptyReadingLabRepair()))return false;
 if(s.report&&(!s.frozen||JSON.stringify(normalResponse(s.frozen))!==JSON.stringify(normalResponse(s.attempts[1].first))||JSON.stringify(normalRepair(s.repair))!==JSON.stringify(normalRepair(s.attempts[1].repair))))return false;
 return true;
}
