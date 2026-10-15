import {markerKinds} from './prompts';
import {validSpeakingTranscript,validSpeakingTranscriptText,type SpeakingTranscript} from './transcript';

export const SPEAKING_SELF_RATINGS=['Нужно поработать','Есть удачные и трудные места','Доволен этой попыткой'] as const;
export type IndependentSpeakingReview={recordingSeconds:number|null;markers:Array<{id:number;second:number|null;kind:string;note:string}>;ratings:string[];noSpecificMoments:boolean;plan:string};
export type SpeakingTranscriptReview={openedAt:string;first:IndependentSpeakingReview;draftText:string;original:SpeakingTranscript|null;revision:string;reflection:string;unchanged:boolean;skipped:boolean};
const object=(v:unknown):v is Record<string,unknown>=>!!v&&typeof v==='object'&&!Array.isArray(v);
const exact=(v:Record<string,unknown>,keys:string[])=>Object.keys(v).length===keys.length&&keys.every(k=>Object.hasOwn(v,k));
const text=(v:unknown,max:number):v is string=>typeof v==='string'&&v.length<=max;
export function validSpeakingTranscriptReview(value:unknown,recordingSeconds:number|null):value is SpeakingTranscriptReview{
 if(!object(value)||!exact(value,['openedAt','first','draftText','original','revision','reflection','unchanged','skipped'])||typeof value.openedAt!=='string'||!Number.isFinite(Date.parse(value.openedAt))||new Date(value.openedAt).toISOString()!==value.openedAt||!object(value.first)||!exact(value.first,['recordingSeconds','markers','ratings','noSpecificMoments','plan'])||!text(value.draftText,6000)||!text(value.revision,6000)||!text(value.reflection,1000)||typeof value.unchanged!=='boolean'||typeof value.skipped!=='boolean')return false;
 const first=value.first;
 if(first.recordingSeconds!==recordingSeconds||recordingSeconds!==null&&(!Number.isFinite(recordingSeconds)||recordingSeconds<0||recordingSeconds>1e12)||!Array.isArray(first.ratings)||first.ratings.length!==4||!first.ratings.every(r=>SPEAKING_SELF_RATINGS.some(allowed=>allowed===r))||!Array.isArray(first.markers)||first.markers.length>100||typeof first.noSpecificMoments!=='boolean'||first.noSpecificMoments!==(first.markers.length===0)||!text(first.plan,12000))return false;
 const ids:number[]=[];
 for(const m of first.markers){if(!object(m)||!exact(m,['id','second','kind','note'])||typeof m.id!=='number'||!Number.isSafeInteger(m.id)||m.id<=0||typeof m.kind!=='string'||!markerKinds.includes(m.kind)||!text(m.note,12000)||(m.second!==null&&(recordingSeconds===null||typeof m.second!=='number'||!Number.isFinite(m.second)||m.second<0||m.second>recordingSeconds)))return false;ids.push(m.id);}
 if(new Set(ids).size!==ids.length)return false;
 if(value.original===null)return value.revision===''&&value.reflection===''&&!value.unchanged;
 return !value.skipped&&validSpeakingTranscript(value.original)&&(value.original.kind!=='openai'||recordingSeconds!==null&&recordingSeconds>=0.2);
}
export function openSpeakingTranscriptReview(first:IndependentSpeakingReview):SpeakingTranscriptReview|null{
 const result:SpeakingTranscriptReview={openedAt:new Date().toISOString(),first:structuredClone(first),draftText:'',original:null,revision:'',reflection:'',unchanged:false,skipped:false};
 return validSpeakingTranscriptReview(result,first.recordingSeconds)?result:null;
}
export function speakingTranscriptReviewComplete(review:SpeakingTranscriptReview):boolean{
 return review.skipped||!!review.original&&validSpeakingTranscriptText(review.revision)&&!!review.reflection.trim()&&(review.revision!==review.original.text||review.unchanged);
}
/** Only the new optional group is normalized; legacy snapshots acquire no synthetic defaults. */
export function speakingReviewFingerprint(v:SpeakingTranscriptReview):string{
 const t=v.original;
 return JSON.stringify({openedAt:v.openedAt,first:{recordingSeconds:v.first.recordingSeconds,markers:v.first.markers.map(m=>({id:m.id,second:m.second,kind:m.kind,note:m.note})),ratings:v.first.ratings,noSpecificMoments:v.first.noSpecificMoments,plan:v.first.plan},draftText:v.draftText,original:t?{format:t.format,kind:t.kind,model:t.model,text:t.text,audioHash:t.audioHash,audioSeconds:t.audioSeconds,words:t.words?.map(w=>({word:w.word,start:w.start,end:w.end}))??null,timing:t.timing,savedAt:t.savedAt}:null,revision:v.revision,reflection:v.reflection,unchanged:v.unchanged,skipped:v.skipped});
}
