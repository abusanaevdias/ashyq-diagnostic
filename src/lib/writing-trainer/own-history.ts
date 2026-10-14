import {OWN_DRAFT_LIMITATIONS,parseOwnDraft,serializeOwnDraft,ownDraftFingerprint,type OwnDraft} from './own-draft';
export const MAX_OWN_HISTORY=20,MAX_OWN_HISTORY_BYTES=1_500_000;
export const OWN_HISTORY_CHANGED='ashyq:own-history-changed';
export type OwnHistoryEntry={id:string;savedAt:string;draft:OwnDraft};
export type OwnHistory={format:'ashyq-own-history-v1';limitations:typeof OWN_DRAFT_LIMITATIONS;revision:string;entries:OwnHistoryEntry[]};
const uuid=(v:unknown):v is string=>typeof v==='string'&&/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/.test(v);
const object=(v:unknown):v is Record<string,unknown>=>!!v&&typeof v==='object'&&!Array.isArray(v);
const exact=(v:Record<string,unknown>,keys:string[])=>Object.keys(v).length===keys.length&&keys.every(k=>Object.hasOwn(v,k));
const bytes=(s:string)=>new TextEncoder().encode(s).length;
export const emptyOwnHistory=():OwnHistory=>({format:'ashyq-own-history-v1',limitations:OWN_DRAFT_LIMITATIONS,revision:'',entries:[]});
export function ownHistoryKey(actor:string){if(typeof actor!=='string'||!actor||actor.length>200)throw Error('Не удалось определить аккаунт истории.');return `ashyq:writing-own-history:v1:${encodeURIComponent(actor)}`;}
export function parseOwnHistory(raw:string|null):OwnHistory|null{
 if(raw===null||!raw||raw.length>MAX_OWN_HISTORY_BYTES||bytes(raw)>MAX_OWN_HISTORY_BYTES)return null;
 try{const v:unknown=JSON.parse(raw);if(!object(v)||!exact(v,['format','limitations','revision','entries'])||v.format!=='ashyq-own-history-v1'||v.limitations!==OWN_DRAFT_LIMITATIONS||(v.revision!==''&&!uuid(v.revision))||!Array.isArray(v.entries)||v.entries.length>MAX_OWN_HISTORY||v.revision===''&&v.entries.length)return null;
 if(!v.entries.every(e=>object(e)&&exact(e,['id','savedAt','draft'])&&uuid(e.id)&&typeof e.savedAt==='string'&&e.savedAt.length===24&&Number.isFinite(Date.parse(e.savedAt))&&new Date(e.savedAt).toISOString()===e.savedAt&&parseOwnDraft(JSON.stringify(e.draft))&&!!(e.draft as OwnDraft).prompt.trim()&&!!(e.draft as OwnDraft).original.trim())||new Set(v.entries.map(e=>e.id)).size!==v.entries.length)return null;return v as OwnHistory;}catch{return null;}
}
export function ownHistoryExport(record:OwnHistory){const raw=JSON.stringify(record,null,2);if(!parseOwnHistory(JSON.stringify(record)))throw Error('История не соответствует формату или превышает лимит.');return raw;}
export function parseOwnHistoryExport(raw:string){if(typeof raw!=='string'||bytes(raw)>MAX_OWN_HISTORY_BYTES*2)return null;try{return parseOwnHistory(JSON.stringify(JSON.parse(raw)));}catch{return null;}}
export function addOwnHistory(record:OwnHistory,draft:OwnDraft):OwnHistory{
 serializeOwnDraft(draft);if(!draft.prompt.trim()||!draft.original.trim())throw Error('Добавь задание и исходное эссе перед сохранением версии.');const fingerprint=ownDraftFingerprint(draft);if(record.entries.some(e=>ownDraftFingerprint(e.draft)===fingerprint))return record;
 if(record.entries.length>=MAX_OWN_HISTORY)throw Error('В истории уже 20 версий. Скачай историю перед явной очисткой; прежние работы не удалены.');const entry={id:crypto.randomUUID(),savedAt:new Date().toISOString(),draft:structuredClone(draft)},next={...record,entries:[entry,...record.entries]};if(!parseOwnHistory(JSON.stringify({...next,revision:crypto.randomUUID()})))throw Error('История превышает 1,5 МБ. Скачай её перед явной очисткой.');return next;
}
/** Manual opt-in local history, no auto migration/restore and no score or mastery inference. */
async function ownHistoryLock<T>(actor:string,operation:(key:string)=>T):Promise<T>{
 if(!navigator.locks)throw Error('Браузер не поддерживает безопасную историю между вкладками. Скачай текущую работу в JSON.');const key=ownHistoryKey(actor),controller=new AbortController(),timeout=setTimeout(()=>controller.abort(),10000);
 try{return await navigator.locks.request(key,{signal:controller.signal},()=>operation(key));}catch(e){if(e instanceof DOMException&&e.name==='AbortError')throw Error('История занята другой вкладкой. Запись не выполнена; попробуй позже.');throw e;}finally{clearTimeout(timeout);}
}
function storeHistory(key:string,record:OwnHistory){const next={...record,revision:crypto.randomUUID()};if(!parseOwnHistory(JSON.stringify(next)))throw Error('История не соответствует формату или превышает лимит.');localStorage.setItem(key,JSON.stringify(next));window.dispatchEvent(new CustomEvent(OWN_HISTORY_CHANGED,{detail:{key}}));return next;}
export async function mutateOwnHistory(actor:string,expected:string|null,change:(record:OwnHistory)=>OwnHistory):Promise<OwnHistory>{return ownHistoryLock(actor,key=>{const raw=localStorage.getItem(key),record=raw===null?emptyOwnHistory():parseOwnHistory(raw);if(!record)throw Error('История повреждена. Исходные данные не заменены.');if((raw===null?null:record.revision)!==expected)throw Error('История изменилась в другой вкладке. Ничего не заменено; проверь актуальные записи.');const next=change(structuredClone(record));if(JSON.stringify(next)===JSON.stringify(record))return record;return storeHistory(key,next);});}
/** Explicit confirmed recovery/replacement. Exact raw CAS also preserves incompatible bytes. */
export async function replaceOwnHistory(actor:string,expectedRaw:string|null,record:OwnHistory,isActive:()=>boolean=()=>true):Promise<OwnHistory>{return ownHistoryLock(actor,key=>{if(!isActive())throw Error('Рабочая область закрыта. История не заменена.');if(localStorage.getItem(key)!==expectedRaw)throw Error('История изменилась в другой вкладке. Ничего не заменено; проверь актуальные записи.');return storeHistory(key,record);});}
