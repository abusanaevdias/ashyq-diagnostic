import type {DraftListeningPair} from './draft-listening';

export type BoundListeningPair=DraftListeningPair&{mediaIdentity:string};
export type BankListeningEvidence={played:boolean;ended:boolean;segment:boolean;transcript:boolean};
export type BankListeningAttempt={prediction:string;answer:string;repair:string;reflection:string;before:BankListeningEvidence;after:BankListeningEvidence};
export type BankListeningState={type:'listening';mediaIdentity:string;started:boolean;round:0|1;report:boolean;prediction:string;predictionLocked:boolean;answer:string;repair:string;reflection:string;locked:boolean;evidence:BankListeningEvidence;before:BankListeningEvidence;scriptVisible:boolean;attempts:BankListeningAttempt[]};
export const emptyBankListeningEvidence=():BankListeningEvidence=>({played:false,ended:false,segment:false,transcript:false});
export const emptyBankListeningState=(pair:BoundListeningPair):BankListeningState=>({type:'listening',mediaIdentity:pair.mediaIdentity,started:false,round:0,report:false,prediction:'',predictionLocked:false,answer:'',repair:'',reflection:'',locked:false,evidence:emptyBankListeningEvidence(),before:emptyBankListeningEvidence(),scriptVisible:false,attempts:[]});
const normalizedEvidence=(e:BankListeningEvidence)=>({played:e.played,ended:e.ended,segment:e.segment,transcript:e.transcript});
const normalizedAttempt=(a:BankListeningAttempt)=>({prediction:a.prediction,answer:a.answer,repair:a.repair,reflection:a.reflection,before:normalizedEvidence(a.before),after:normalizedEvidence(a.after)});
export const bankListeningFingerprint=(s:BankListeningState)=>JSON.stringify({type:s.type,mediaIdentity:s.mediaIdentity,started:s.started,round:s.round,report:s.report,prediction:s.prediction,predictionLocked:s.predictionLocked,answer:s.answer,repair:s.repair,reflection:s.reflection,locked:s.locked,evidence:normalizedEvidence(s.evidence),before:normalizedEvidence(s.before),scriptVisible:s.scriptVisible,attempts:s.attempts.map(normalizedAttempt)});
const object=(v:unknown):v is Record<string,unknown>=>!!v&&typeof v==='object'&&!Array.isArray(v);
const exact=(v:Record<string,unknown>,keys:string[])=>Object.keys(v).length===keys.length&&keys.every(key=>Object.hasOwn(v,key));
const text=(v:unknown,max:number):v is string=>typeof v==='string'&&v.length<=max;
const evidence=(v:unknown):v is BankListeningEvidence=>object(v)&&exact(v,['played','ended','segment','transcript'])&&Object.values(v).every(flag=>typeof flag==='boolean');
const emptyEvidence=(v:BankListeningEvidence)=>!v.played&&!v.ended&&!v.segment&&!v.transcript;
const monotonic=(before:BankListeningEvidence,after:BankListeningEvidence)=>Object.keys(before).every(key=>!before[key as keyof BankListeningEvidence]||after[key as keyof BankListeningEvidence]);
const prediction=(v:string)=>v===v.trim()&&v.length>=3;
function attempt(v:unknown):v is BankListeningAttempt{return object(v)&&exact(v,['prediction','answer','repair','reflection','before','after'])&&text(v.prediction,1000)&&prediction(v.prediction)&&text(v.answer,60)&&!!v.answer.trim()&&text(v.repair,60)&&!!v.repair.trim()&&text(v.reflection,1000)&&v.reflection.trim().length>=12&&evidence(v.before)&&!v.before.segment&&(v.before.played||v.before.transcript)&&evidence(v.after)&&monotonic(v.before,v.after);}
/** Player events are retained as events, not proof of attentive listening. No playback position/audio object is restored. */
export function validBankListeningState(value:unknown,pair:BoundListeningPair):value is BankListeningState{
 if(!object(value)||!exact(value,['type','mediaIdentity','started','round','report','prediction','predictionLocked','answer','repair','reflection','locked','evidence','before','scriptVisible','attempts'])||value.type!=='listening'||value.mediaIdentity!==pair.mediaIdentity||!text(value.mediaIdentity,12000)||typeof value.started!=='boolean'||(value.round!==0&&value.round!==1)||typeof value.report!=='boolean'||!text(value.prediction,1000)||typeof value.predictionLocked!=='boolean'||!text(value.answer,60)||!text(value.repair,60)||!text(value.reflection,1000)||typeof value.locked!=='boolean'||!evidence(value.evidence)||!evidence(value.before)||typeof value.scriptVisible!=='boolean'||!Array.isArray(value.attempts)||value.attempts.length>2||!value.attempts.every(attempt))return false;
 const s=value as BankListeningState;
 if(!s.started)return bankListeningFingerprint(s)===bankListeningFingerprint(emptyBankListeningState(pair));
 if(s.attempts.length!==(s.report?2:s.round)||s.scriptVisible!==s.evidence.transcript)return false;
 if(!s.predictionLocked)return !s.locked&&!s.report&&s.answer===''&&s.repair===''&&s.reflection===''&&emptyEvidence(s.evidence)&&emptyEvidence(s.before);
 if(!prediction(s.prediction))return false;
 if(!s.locked)return !s.report&&s.repair===''&&s.reflection===''&&emptyEvidence(s.before)&&!s.evidence.segment;
 if(!s.answer.trim()||s.before.segment||(!s.before.played&&!s.before.transcript)||!monotonic(s.before,s.evidence))return false;
 if(s.report){const current={prediction:s.prediction,answer:s.answer,repair:s.repair,reflection:s.reflection,before:s.before,after:s.evidence};if(s.round!==1||!attempt(current)||JSON.stringify(normalizedAttempt(current))!==JSON.stringify(normalizedAttempt(s.attempts[1])))return false;}
 return true;
}
