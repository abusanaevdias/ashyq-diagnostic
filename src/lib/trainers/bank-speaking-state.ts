import {markerKinds} from '../speaking-second-take/prompts';
import type {DraftSpeakingPair} from './draft-speaking';
import {validSpeakingTranscriptReview,speakingTranscriptReviewComplete,speakingReviewFingerprint,type SpeakingTranscriptReview} from '../speaking-second-take/transcript-review';

export type BankSpeakingPhase='start'|'prepare'|'capture'|'review'|'compare'|'result';
export type BankSpeakingMarker={id:number;second:number|null;kind:string;note:string};
export type BankSpeakingTake={seconds:number|null;markers:BankSpeakingMarker[];ratings:string[];plan:string;confirmed:boolean;preparationNotes:string|null;noSpecificMoments:boolean|null;transcriptReview?:SpeakingTranscriptReview};
export type BankSpeakingState={type:'speaking';audioIncluded:false;phase:BankSpeakingPhase;takeIndex:0|1|2;takes:BankSpeakingTake[];notes:string;kind:string;markerNote:string;noMarkers:boolean};
export const BANK_SPEAKING_RATINGS=['','Нужно поработать','Есть удачные и трудные места','Доволен этой попыткой'] as const;
export const emptyBankSpeakingState=():BankSpeakingState=>({type:'speaking',audioIncluded:false,phase:'start',takeIndex:0,takes:[],notes:'',kind:markerKinds[0],markerNote:'',noMarkers:false});
const normalizedMarker=(m:BankSpeakingMarker)=>({id:m.id,second:m.second,kind:m.kind,note:m.note});
const normalizedTake=(t:BankSpeakingTake)=>({seconds:t.seconds,markers:t.markers.map(normalizedMarker),ratings:t.ratings,plan:t.plan,confirmed:t.confirmed,preparationNotes:t.preparationNotes,noSpecificMoments:t.noSpecificMoments,...(t.transcriptReview===undefined?{}:{transcriptReview:JSON.parse(speakingReviewFingerprint(t.transcriptReview))})});
export const bankSpeakingFingerprint=(s:BankSpeakingState)=>JSON.stringify({type:s.type,audioIncluded:s.audioIncluded,phase:s.phase,takeIndex:s.takeIndex,takes:s.takes.map(normalizedTake),notes:s.notes,kind:s.kind,markerNote:s.markerNote,noMarkers:s.noMarkers});
const object=(v:unknown):v is Record<string,unknown>=>!!v&&typeof v==='object'&&!Array.isArray(v);
const exact=(v:Record<string,unknown>,keys:string[])=>Object.keys(v).length===keys.length&&keys.every(key=>Object.hasOwn(v,key));
const text=(v:unknown,max:number):v is string=>typeof v==='string'&&v.length<=max;
const duration=(v:unknown):v is number=>typeof v==='number'&&Number.isFinite(v)&&v>=0.2&&v<=1e12;
function take(v:unknown):v is BankSpeakingTake{
 if(!object(v)||!exact(v,Object.hasOwn(v,'transcriptReview')?['seconds','markers','ratings','plan','confirmed','preparationNotes','noSpecificMoments','transcriptReview']:['seconds','markers','ratings','plan','confirmed','preparationNotes','noSpecificMoments'])||(v.seconds!==null&&!duration(v.seconds))||!Array.isArray(v.markers)||v.markers.length>50||!Array.isArray(v.ratings)||v.ratings.length!==4||!v.ratings.every(r=>BANK_SPEAKING_RATINGS.some(allowed=>allowed===r))||!text(v.plan,3000)||typeof v.confirmed!=='boolean'||(v.preparationNotes!==null&&!text(v.preparationNotes,3000))||(v.noSpecificMoments!==null&&typeof v.noSpecificMoments!=='boolean'))return false;
 if(Object.hasOwn(v,'transcriptReview')){if(!validSpeakingTranscriptReview(v.transcriptReview,v.seconds as number|null))return false;const first=v.transcriptReview.first;if(!take({seconds:first.recordingSeconds,markers:first.markers,ratings:first.ratings,plan:first.plan,confirmed:false,preparationNotes:null,noSpecificMoments:first.noSpecificMoments}))return false;}
 if(v.noSpecificMoments===true&&v.markers.length!==0)return false;
 const seconds=v.seconds;
 return v.markers.every(m=>object(m)&&exact(m,['id','second','kind','note'])&&typeof m.id==='number'&&Number.isSafeInteger(m.id)&&m.id>0&&(m.second===null||seconds!==null&&typeof m.second==='number'&&Number.isFinite(m.second)&&m.second>=0&&m.second<=seconds)&&typeof m.kind==='string'&&markerKinds.includes(m.kind)&&text(m.note,1000)&&m.note.trim()===m.note&&!!m.note)&&new Set(v.markers.map(m=>m.id)).size===v.markers.length;
}
const completed=(t:BankSpeakingTake)=>t.confirmed&&t.ratings.every(Boolean)&&!!t.plan.trim()&&(t.markers.length>0?t.noSpecificMoments===false:t.noSpecificMoments===true)&&(!t.transcriptReview||speakingTranscriptReviewComplete(t.transcriptReview));
/** Metadata-only snapshots. Self-ratings, marker counts and recording duration are not speech evaluation. */
export function validBankSpeakingState(value:unknown,pair:DraftSpeakingPair):value is BankSpeakingState{
 if(pair.topics.length!==2||pair.topics[0].prompt===pair.topics[1].prompt||!object(value)||!exact(value,['type','audioIncluded','phase','takeIndex','takes','notes','kind','markerNote','noMarkers'])||value.type!=='speaking'||value.audioIncluded!==false||typeof value.phase!=='string'||!['start','prepare','capture','review','compare','result'].includes(value.phase)||(value.takeIndex!==0&&value.takeIndex!==1&&value.takeIndex!==2)||!Array.isArray(value.takes)||value.takes.length>3||!value.takes.every(take)||!text(value.notes,3000)||typeof value.kind!=='string'||!markerKinds.includes(value.kind)||!text(value.markerNote,1000)||typeof value.noMarkers!=='boolean')return false;
 const s=value as BankSpeakingState,ids=s.takes.flatMap(t=>t.markers.map(m=>m.id));if(new Set(ids).size!==ids.length)return false;
 if(s.phase==='start')return bankSpeakingFingerprint(s)===bankSpeakingFingerprint(emptyBankSpeakingState());
 if(s.phase==='prepare'||s.phase==='capture')return s.takes.length===s.takeIndex&&s.takes.every(completed)&&s.markerNote===''&&!s.noMarkers;
 if(s.takes.length!==s.takeIndex+1||s.takes.slice(0,-1).some(t=>!completed(t)))return false;
 const current=s.takes[s.takeIndex];if(current.preparationNotes!==null&&current.preparationNotes!==s.notes)return false;
 if(s.phase==='review')return !s.noMarkers||current.markers.length===0;
 if(!s.takes.every(completed)||s.markerNote!==''||s.noMarkers!==current.noSpecificMoments)return false;
 return s.phase==='compare'?s.takeIndex!==2:s.phase==='result'&&s.takeIndex===2;
}
