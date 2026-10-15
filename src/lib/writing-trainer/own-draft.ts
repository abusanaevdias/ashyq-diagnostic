import {feedbackCriteria,sanitizeFeedback,type FeedbackCriterion,type WritingFeedback} from './ai-feedback';
import {buildPlainDocx,type DocxBlock} from '../trainers/docx-package';
export type OwnSavedFeedback={source:string;feedback:WritingFeedback;context?:{prompt:string;original:string}};
export type OwnDraft={prompt:string;original:string;working:string;step:number;notes:Record<FeedbackCriterion,string>;versions:Record<FeedbackCriterion,string>;ai:Partial<Record<FeedbackCriterion,OwnSavedFeedback>>};
export const MAX_OWN_DRAFT_BYTES=500_000;
export const OWN_DRAFT_LIMITATIONS='Private local practice. Free text and model suggestions are unverified; no IELTS score or verified achievement.';
export const ownDraftLabels:Record<FeedbackCriterion,string>={grammar:'Грамматика',task:'Ответ на вопрос',coherence:'Связность',lexical:'Лексика'};
export const blankOwnDraft=():OwnDraft=>({prompt:'',original:'',working:'',step:-1,notes:{grammar:'',task:'',coherence:'',lexical:''},versions:{grammar:'',task:'',coherence:'',lexical:''},ai:{}});
export const ownDraftKey=(actor:string)=>{if(typeof actor!=='string'||!actor||actor.length>200)throw Error('Не удалось определить аккаунт для черновика.');return `ashyq:writing-own:v1:${actor}`;};
export function ownStorageFailure(error:unknown){return error instanceof DOMException&&['QuotaExceededError','SecurityError'].includes(error.name)?'Браузер запретил сохранение или место закончилось. Работа остаётся на экране: скачай JSON или Word перед выходом.':error instanceof Error?error.message:'Сохранение не удалось. Скачай работу перед выходом.';}
const object=(v:unknown):v is Record<string,unknown>=>!!v&&typeof v==='object'&&!Array.isArray(v);
const exact=(v:Record<string,unknown>,keys:string[])=>Object.keys(v).length===keys.length&&keys.every(k=>Object.hasOwn(v,k));
const text=(v:unknown,max:number):v is string=>typeof v==='string'&&v.length<=max;
const byteLength=(s:string)=>new TextEncoder().encode(s).length;
const canonical=(v:unknown):string=>JSON.stringify(v&&typeof v==='object'?Array.isArray(v)?v.map(x=>JSON.parse(canonical(x))):Object.fromEntries(Object.entries(v).sort(([a],[b])=>a.localeCompare(b)).map(([k,x])=>[k,JSON.parse(canonical(x))])):v);
/** Strict legacy draft read. Never clips text, drops feedback or floors an invalid phase. */
export function parseOwnDraft(raw:string|null):OwnDraft|null{
 if(raw===null||!raw||raw.length>MAX_OWN_DRAFT_BYTES||byteLength(raw)>MAX_OWN_DRAFT_BYTES)return null;
 try{
  const v:unknown=JSON.parse(raw);if(!object(v)||!exact(v,['prompt','original','working','step','notes','versions','ai'])||!text(v.prompt,1000)||!text(v.original,10000)||!text(v.working,10000)||typeof v.step!=='number'||!Number.isInteger(v.step)||v.step< -1||v.step>4||!object(v.notes)||!exact(v.notes,[...feedbackCriteria])||!object(v.versions)||!exact(v.versions,[...feedbackCriteria])||!object(v.ai)||Object.keys(v.ai).some(k=>!feedbackCriteria.includes(k as FeedbackCriterion)))return null;
  for(const key of feedbackCriteria){if(!text(v.notes[key],1000)||!text(v.versions[key],10000))return null;const saved=v.ai[key];if(saved!==undefined){if(!object(saved)||!exact(saved,Object.hasOwn(saved,'context')?['source','feedback','context']:['source','feedback'])||!text(saved.source,10000))return null;if(Object.hasOwn(saved,'context')&&(!object(saved.context)||!exact(saved.context,['prompt','original'])||!text(saved.context.prompt,1000)||!text(saved.context.original,10000)||!saved.context.prompt.trim()||!saved.context.original.trim()))return null;const clean=sanitizeFeedback(saved.feedback,saved.source);if(!clean||canonical(clean)!==canonical(saved.feedback))return null;}}
  if(v.step>=0&&(!v.prompt.trim()||!v.original.trim()))return null;
  return v as OwnDraft;
 }catch{return null;}
}
export function serializeOwnDraft(draft:OwnDraft){const raw=JSON.stringify(draft);if(!parseOwnDraft(raw))throw Error('Черновик не соответствует формату или превышает лимит. Скопируй текст перед выходом.');return raw;}
export function ownDraftFingerprint(draft:OwnDraft){serializeOwnDraft(draft);return canonical(draft);}
export type OwnDraftRead={kind:'ready';raw:string|null;draft:OwnDraft}|{kind:'incompatible';raw:string}|{kind:'blocked'};
export function readOwnDraft(actor:string,storage:Pick<Storage,'getItem'>):OwnDraftRead{try{const raw=storage.getItem(ownDraftKey(actor));if(raw===null)return {kind:'ready',raw,draft:blankOwnDraft()};const draft=parseOwnDraft(raw);return draft?{kind:'ready',raw,draft}:{kind:'incompatible',raw};}catch{return {kind:'blocked'};}}
/** sessionStorage is tab-scoped. Synchronous revision check also protects same-origin frames. */
export function writeOwnDraft(actor:string,draft:OwnDraft,expected:string|null,storage:Pick<Storage,'getItem'|'setItem'>){const key=ownDraftKey(actor),raw=serializeOwnDraft(draft);if(storage.getItem(key)!==expected)throw Error('Черновик изменился в другом окне этой вкладки. Ничего не заменено. Скачай работу на экране перед повторной загрузкой.');storage.setItem(key,raw);return raw;}
export function clearOwnDraft(actor:string,expected:string|null,storage:Pick<Storage,'getItem'|'removeItem'>){const key=ownDraftKey(actor);if(storage.getItem(key)!==expected)throw Error('Сохранение изменилось. Оно не удалено; сначала проверь актуальную запись.');storage.removeItem(key);}
export function ownDraftExport(draft:OwnDraft){serializeOwnDraft(draft);return JSON.stringify({format:'ashyq-own-essay-v1',limitations:OWN_DRAFT_LIMITATIONS,draft},null,2);}
export function parseOwnDraftExport(raw:string):OwnDraft|null{if(typeof raw!=='string'||byteLength(raw)>MAX_OWN_DRAFT_BYTES*2)return null;try{const v:unknown=JSON.parse(raw);return object(v)&&exact(v,['format','limitations','draft'])&&v.format==='ashyq-own-essay-v1'&&v.limitations===OWN_DRAFT_LIMITATIONS?parseOwnDraft(JSON.stringify(v.draft)):null;}catch{return null;}}
export function ownDraftReportBlocks(draft:OwnDraft):DocxBlock[]{
 serializeOwnDraft(draft);const b:DocxBlock[]=[{kind:'heading1',text:'ASHYQ · IELTS Academic Task 2 · своё эссе'},{kind:'paragraph',text:'Личная практика. Ответы и заметки пользователя; правки и AI-предложения не подтверждают качество или IELTS band. Word — читаемый отчёт; JSON — восстановление.'},{kind:'heading2',text:'Задание'},{kind:'paragraph',text:draft.prompt},{kind:'heading2',text:'Исходный текст'},{kind:'paragraph',text:draft.original},{kind:'heading2',text:'Рабочая версия на экране'},{kind:'paragraph',text:draft.working}];
 for(const key of feedbackCriteria){b.push({kind:'heading2',text:ownDraftLabels[key]},{kind:'paragraph',text:`Заметка пользователя: ${draft.notes[key]||'не добавлена'}`},{kind:'paragraph',text:`Последняя сохранённая версия после этапа:\n${draft.versions[key]||'не сохранена'}`});const ai=draft.ai[key];if(ai){b.push({kind:'heading3',text:'Сохранённая AI-подсказка · предварительная, без подтверждённой оценки'},{kind:'paragraph',text:`Текст, для которого запрашивалась подсказка:\n${ai.source}`},{kind:'paragraph',text:ai.feedback.summary},{kind:'paragraph',text:ai.context?'Задание для этой подсказки:\n'+ai.context.prompt+'\nИсходный текст для этой подсказки:\n'+ai.context.original:'Контекст старой подсказки неизвестен; её соответствие текущему заданию не подтверждено.'});for(const issue of ai.feedback.issues)b.push({kind:'paragraph',text:`Цитата: ${issue.quote}\nОбъяснение модели: ${issue.why}\nПредложение модели: ${issue.suggestion}`});for(const strength of ai.feedback.strengths)b.push({kind:'paragraph',text:`Наблюдение модели: ${strength}`});b.push({kind:'paragraph',text:`Предложенный следующий шаг: ${ai.feedback.nextAction}`});}}
 return b;
}
export const ownDraftWord=(draft:OwnDraft)=>buildPlainDocx(ownDraftReportBlocks(draft));
