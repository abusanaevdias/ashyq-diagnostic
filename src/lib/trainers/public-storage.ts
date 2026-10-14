import {checkpointKey,emptyRecord,MAX_RECORD_BYTES,parseRecord,utf8Bytes,type TrainerRecord} from './checkpoints';
import type {TrainerId} from './catalog';
export const PUBLIC_RECORD_CHANGED='ashyq:trainer-checkpoint-change';
/** Manual replacement uses exact bytes and a shared lock. Browser actor scope is not auth. */
export async function replacePublicRecord(scope:string,trainer:TrainerId,expectedRaw:string|null,next:TrainerRecord,isActive:()=>boolean=()=>true):Promise<TrainerRecord>{
 if(typeof scope!=='string'||!scope||scope.length>200)throw Error('Не удалось определить аккаунт для записи.');
 if(!navigator.locks)throw Error('Браузер не поддерживает безопасную запись. Скачай работу перед выходом.');const key=checkpointKey(trainer,scope),abort=new AbortController(),timeout=setTimeout(()=>abort.abort(),10000);
 try{return await navigator.locks.request(`ashyq-trainer:${key}`,{signal:abort.signal},()=>{if(!isActive())throw Error('Рабочая область закрыта. Запись не заменена.');if(localStorage.getItem(key)!==expectedRaw)throw Error('Запись изменилась после выбора действия. Ничего не заменено; сначала проверь актуальное сохранение.');const record={...next,revision:crypto.randomUUID()},raw=JSON.stringify(record);if(utf8Bytes(raw)>MAX_RECORD_BYTES||!parseRecord(raw,trainer))throw Error('Запись не подходит формату или превышает лимит. Прежняя работа не заменена.');localStorage.setItem(key,raw);window.dispatchEvent(new Event(PUBLIC_RECORD_CHANGED));return record;});}catch(e){if(e instanceof DOMException&&e.name==='AbortError')throw Error('Запись занята больше 10 секунд. Ничего не заменено; повтори действие позже.');throw e;}finally{clearTimeout(timeout);}
}
/** Revision tombstone prevents an older queued initial write from reviving deleted data. */
export const clearPublicRecord=(scope:string,trainer:TrainerId,expectedRaw:string|null,isActive?:()=>boolean)=>replacePublicRecord(scope,trainer,expectedRaw,emptyRecord(trainer),isActive);
