import { findBankSource, parseBankSourceRef, sameBankSource, type BankSource, type BankSourceRef } from './bank-sources';
import { bankTask2Fingerprint, validBankTask2State, type BankTask2State } from './bank-task2-state';
import { utf8Bytes } from './checkpoints';
import type { TrainerId } from './catalog';

export const BANK_RECORD_FORMAT = 'ashyq-bank-record-v2';
export const BANK_RECORD_LIMITATIONS = 'Local source-bound practice. Free text is ungraded; completion is not verified achievement or an official IELTS/SAT score.';
export const MAX_BANK_RECORD_BYTES = 1_500_000;
export const MAX_BANK_SNAPSHOT_BYTES = 1_450_000;
export const MAX_BANK_HISTORY = 20;
export type BankSnapshot = BankTask2State;
export type BankEntry = { id: string; savedAt: string; data: BankSnapshot };
export type BankRecord = { format: typeof BANK_RECORD_FORMAT; limitations: typeof BANK_RECORD_LIMITATIONS; source: BankSourceRef; trainer: TrainerId; revision: string; checkpoint: BankEntry | null; history: BankEntry[] };
const object=(v:unknown):v is Record<string,unknown>=>!!v&&typeof v==='object'&&!Array.isArray(v);
const exact=(v:Record<string,unknown>,keys:string[])=>Object.keys(v).length===keys.length&&keys.every(key=>Object.hasOwn(v,key));
const uuid=(v:unknown):v is string=>typeof v==='string'&&/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/.test(v);
const iso=(v:unknown):v is string=>typeof v==='string'&&v.length===24&&!Number.isNaN(Date.parse(v))&&new Date(v).toISOString()===v;
export function validBankSnapshot(source: BankSource,value: unknown): value is BankSnapshot {
  const trusted=findBankSource(source.ref);
  if(!trusted||trusted.exercise.type!=='task2'||!validBankTask2State(value,trusted.exercise.value))return false;
  try{return utf8Bytes(JSON.stringify(value))<=MAX_BANK_SNAPSHOT_BYTES;}catch{return false;}
}
export function emptyBankRecord(source: BankSource): BankRecord {
  const trusted=findBankSource(source.ref);if(!trusted)throw new Error('Версия задания недоступна. Другая версия не подставлена.');
  return {format:BANK_RECORD_FORMAT,limitations:BANK_RECORD_LIMITATIONS,source:{...trusted.ref},trainer:trusted.trainer,revision:'',checkpoint:null,history:[]};
}
export function parseBankRecord(raw: string | null,source: BankSource): BankRecord | null {
  if(raw===null||!raw||raw.length>MAX_BANK_RECORD_BYTES||utf8Bytes(raw)>MAX_BANK_RECORD_BYTES||!findBankSource(source.ref))return null;
  try{
    const value:unknown=JSON.parse(raw);
    if(!object(value)||!exact(value,['format','limitations','source','trainer','revision','checkpoint','history'])||value.format!==BANK_RECORD_FORMAT||value.limitations!==BANK_RECORD_LIMITATIONS||value.trainer!==findBankSource(source.ref)!.trainer||(value.revision!==''&&!uuid(value.revision))||!Array.isArray(value.history)||value.history.length>MAX_BANK_HISTORY)return null;
    const ref=parseBankSourceRef(value.source);if(!ref||!sameBankSource(ref,source.ref))return null;
    const entry=(v:unknown):v is BankEntry=>object(v)&&exact(v,['id','savedAt','data'])&&uuid(v.id)&&iso(v.savedAt)&&validBankSnapshot(source,v.data);
    if(value.checkpoint!==null&&!entry(value.checkpoint))return null;
    if(!value.history.every(entry)||new Set(value.history.map(v=>v.id)).size!==value.history.length)return null;
    if(value.revision===''&&(value.checkpoint!==null||value.history.length))return null;
    return value as BankRecord;
  }catch{return null;}
}
export function createBankEntry(source: BankSource,data: BankSnapshot,now=new Date()): BankEntry {
  if(!validBankSnapshot(source,data))throw new Error('Состояние не соответствует этой версии задания. Другая версия не подставлена.');
  return {id:crypto.randomUUID(),savedAt:now.toISOString(),data:structuredClone(data)};
}
export function archiveBankEntry(record: BankRecord,entry: BankEntry): BankRecord {
  const checkpoint=record.checkpoint?.id===entry.id?null:record.checkpoint;
  if(record.history.some(old=>bankTask2Fingerprint(old.data)===bankTask2Fingerprint(entry.data)))return {...record,checkpoint};
  return {...record,checkpoint,history:[entry,...record.history].slice(0,MAX_BANK_HISTORY)};
}
export function bankRecordKey(scope: string,source: BankSourceRef): string {
  const ref=parseBankSourceRef(source);
  if(!ref||!scope||scope.length>200)throw new Error('Неверная область сохранения задания.');
  return `ashyq:trainer-bank:v2:${encodeURIComponent(scope)}:${ref.batchId}:${ref.version}:${ref.contentHash}:${ref.unitId}`;
}
