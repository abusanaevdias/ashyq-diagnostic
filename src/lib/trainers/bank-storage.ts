import type { BankSource } from './bank-sources';
import { bankRecordKey, emptyBankRecord, MAX_BANK_RECORD_BYTES, parseBankRecord, type BankRecord } from './bank-records';
import { utf8Bytes } from './checkpoints';

export const BANK_RECORD_CHANGED = 'ashyq:bank-record-changed';
/** Atomic browser storage only; scope is a partition, never an authorization credential. */
export async function mutateBankRecord(scope: string,source: BankSource,expectedRevision: string | null,change: (record: BankRecord)=>BankRecord): Promise<BankRecord> {
  if(typeof navigator==='undefined'||!navigator.locks)throw new Error('Без безопасной блокировки запись недоступна. Скачай работу перед выходом.');
  const key=bankRecordKey(scope,source.ref),abort=new AbortController(),timer=setTimeout(()=>abort.abort(),10000);
  try{
    return await navigator.locks.request(key,{mode:'exclusive',signal:abort.signal},()=>{
      const raw=localStorage.getItem(key),current=raw===null?emptyBankRecord(source):parseBankRecord(raw,source);
      if(!current)throw new Error('Сохранённая запись повреждена или относится к другой версии. Она не заменена; сначала скачай её для восстановления.');
      if((raw===null?null:current.revision)!==expectedRevision)throw new Error('Запись изменилась в другой вкладке. Твоя работа остаётся на экране; скачай её или заново выбери сохранённую версию.');
      const next={...change(structuredClone(current)),revision:crypto.randomUUID()};
      const serialized=JSON.stringify(next);
      if(utf8Bytes(serialized)>MAX_BANK_RECORD_BYTES)throw new Error('Файл занятий достиг лимита. Скачай работу и историю перед очисткой; существующая запись не изменена.');
      if(!parseBankRecord(serialized,source))throw new Error('Состояние не прошло проверку версии задания. Существующая запись не изменена.');
      localStorage.setItem(key,serialized);window.dispatchEvent(new Event(BANK_RECORD_CHANGED));return next;
    });
  }catch(error){
    if(error instanceof DOMException&&error.name==='AbortError')throw new Error('Ожидание записи заняло больше10 секунд. Работа остаётся на экране; повтори запись или скачай файл.');
    throw error;
  }finally{clearTimeout(timer);}
}
/** Retain an empty revision tombstone so a queued older write cannot resurrect deleted work. */
export const clearBankRecord = (scope:string,source:BankSource,expectedRevision:string|null) => mutateBankRecord(scope,source,expectedRevision,()=>emptyBankRecord(source));

/** Explicit recovery action only: exact invalid bytes must still match under the lock. */
export async function clearInvalidBankRecord(scope:string,source:BankSource,expectedRaw:string):Promise<BankRecord>{
  if(typeof navigator==='undefined'||!navigator.locks)throw new Error('Без безопасной блокировки очистка недоступна. Скачай исходную запись.');
  const key=bankRecordKey(scope,source.ref),abort=new AbortController(),timer=setTimeout(()=>abort.abort(),10000);
  try{return await navigator.locks.request(key,{mode:'exclusive',signal:abort.signal},()=>{
    const raw=localStorage.getItem(key);
    if(raw!==expectedRaw||parseBankRecord(raw,source))throw new Error('Запись изменилась или уже совместима. Очистка не выполнена.');
    const next={...emptyBankRecord(source),revision:crypto.randomUUID()};localStorage.setItem(key,JSON.stringify(next));window.dispatchEvent(new Event(BANK_RECORD_CHANGED));return next;
  });}catch(error){if(error instanceof DOMException&&error.name==='AbortError')throw new Error('Ожидание очистки заняло больше10 секунд. Исходная запись не изменена.');throw error;}finally{clearTimeout(timer);}
}
