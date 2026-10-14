'use client';

import { useContext, useEffect, useLayoutEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react';
import {BankNavigationWarningContext} from './BankNavigationWarningContext';
import { useSession } from '@/lib/lms/hooks';
import { type BankSource } from '@/lib/trainers/bank-sources';
import { archiveBankEntry, bankRecordKey, createBankEntry, emptyBankRecord, MAX_BANK_RECORD_BYTES, parseBankRecord, validBankSnapshot, type BankEntry, type BankRecord, type BankSnapshot } from '@/lib/trainers/bank-records';
import { bankSnapshotFingerprint, bankSnapshotComplete, emptyBankSnapshot } from '@/lib/trainers/bank-snapshots';
import {bankReportBlocks} from '@/lib/trainers/bank-report';
import {buildPlainDocx,DOCX_MIME} from '@/lib/trainers/docx-package';
import { BANK_RECORD_CHANGED, clearBankRecord, clearInvalidBankRecord, mutateBankRecord } from '@/lib/trainers/bank-storage';
import styles from './TrainerCheckpoint.module.css';

type ReadState={kind:'ready';raw:string|null}|{kind:'blocked'|'not-ready'};
type Intent={kind:'replace'|'clear';revision:string|null}|{kind:'restore';revision:string;entry:BankEntry}|{kind:'import';revision:string|null;record:BankRecord}|{kind:'recover';raw:string};
function subscribe(callback:()=>void){window.addEventListener('storage',callback);window.addEventListener(BANK_RECORD_CHANGED,callback);return()=>{window.removeEventListener('storage',callback);window.removeEventListener(BANK_RECORD_CHANGED,callback);};}
function failure(error:unknown){return error instanceof DOMException&&['QuotaExceededError','SecurityError'].includes(error.name)?'Браузер не разрешил запись. Работа остаётся на экране: скачай её перед выходом.':error instanceof Error?error.message:'Не удалось выполнить действие. Работа остаётся на экране.';}

/** Manual, optional source-version checkpoints. Publication and review decisions use separate storage. */
export default function BankCheckpoint({source,data,onRestore,onDirty,onBusy,externalBusy=false,skipUnloadWarning}:{source:BankSource;data:BankSnapshot;onRestore:(data:BankSnapshot)=>void;onDirty:(dirty:boolean)=>void;onBusy:(busy:boolean)=>void;externalBusy?:boolean;skipUnloadWarning?:()=>boolean}){
  const skipPageWarning=useContext(BankNavigationWarningContext);
  const {session,ready}=useSession(),scope=session?.user.id??'guest';
  const key=ready&&scope.length>0&&scope.length<=200?bankRecordKey(scope,source.ref):null;
  const snapshot=useSyncExternalStore(subscribe,()=>{if(!key)return '{"kind":"not-ready"}';try{return JSON.stringify({kind:'ready',raw:localStorage.getItem(key)});}catch{return '{"kind":"blocked"}';}},()=>'{"kind":"not-ready"}');
  const read=JSON.parse(snapshot) as ReadState,raw=read.kind==='ready'?read.raw:null;
  const record=useMemo(()=>parseBankRecord(raw,source),[raw,source]);
  const [busy,setBusy]=useState(false),[message,setMessage]=useState(''),[intent,setIntent]=useState<Intent|null>(null);
  const heading=useRef<HTMLHeadingElement>(null),confirmation=useRef<HTMLDivElement>(null),messageNode=useRef<HTMLParagraphElement>(null);
  const [focusMessage,setFocusMessage]=useState(false);
  const titleId=`bank-checkpoint-${source.ref.unitId}-${source.ref.contentHash.slice(0,12)}`,importId=`${titleId}-import`;
  const [baseline,setBaseline]=useState<{key:string;revision:string}|null>(null),[persisted,setPersisted]=useState('');
  const valid=validBankSnapshot(source,data),fingerprint=valid?bankSnapshotFingerprint(data):'';
  const storedFingerprints=useMemo(()=>new Set(record?[...record.history,...record.checkpoint?[record.checkpoint]:[]].map(entry=>bankSnapshotFingerprint(entry.data)):[]),[record]);
  const currentStored=valid&&storedFingerprints.has(fingerprint);
  const empty=emptyBankSnapshot(source);
  const changed=valid&&!!empty&&fingerprint!==bankSnapshotFingerprint(empty)&&!currentStored;
  const blocked=busy||externalBusy;
  const dirty=blocked||changed;
  const checkpointFingerprint=useMemo(()=>record?.checkpoint?bankSnapshotFingerprint(record.checkpoint.data):'', [record]);
  const compatible=read.kind==='ready'&&(raw===null||!!record),owns=!!key&&baseline?.key===key&&baseline.revision===record?.revision&&(!record?.checkpoint||checkpointFingerprint===persisted);
  useLayoutEffect(()=>{onDirty(dirty);},[dirty,onDirty]);
  useLayoutEffect(()=>{onBusy(busy);},[busy,onBusy]);
  useEffect(()=>{if(intent){confirmation.current?.focus({preventScroll:true});confirmation.current?.scrollIntoView({block:'start',behavior:'instant'});}},[intent]);
  useEffect(()=>{if(!busy&&focusMessage){messageNode.current?.focus({preventScroll:true});messageNode.current?.scrollIntoView({block:'start',behavior:'instant'});setFocusMessage(false);}},[busy,focusMessage]);
  useEffect(()=>{if(!dirty)return;const warn=(event:BeforeUnloadEvent)=>{if(skipUnloadWarning?.()||skipPageWarning?.())return;event.preventDefault();event.returnValue='';};window.addEventListener('beforeunload',warn);return()=>window.removeEventListener('beforeunload',warn);},[dirty,skipUnloadWarning,skipPageWarning]);
  function download(content:string,suffix:string,mime:string){try{const url=URL.createObjectURL(new Blob([content],{type:mime})),a=document.createElement('a');a.href=url;a.download=`ASHYQ-${source.ref.unitId}-v${source.ref.version}-${suffix}`;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);setMessage('Файл скачан. Это локальная учебная работа, без оценки качества или решения о публикации.');}catch(error){setMessage(failure(error));}}
  function downloadCurrent(){try{const entry=createBankEntry(source,data),value={...emptyBankRecord(source),revision:crypto.randomUUID(),checkpoint:entry};const raw=JSON.stringify(value,null,2);if(!parseBankRecord(raw,source))throw new Error('Текущая работа не помещается в проверяемый файл. Скопируй тексты перед выходом.');download(raw,'current.json','application/json;charset=utf-8');}catch(error){setMessage(failure(error));}}
  function downloadWord(value:BankSnapshot,suffix:string,savedAt?:string){try{const blocks=bankReportBlocks(source,value);if(savedAt)blocks.splice(1,0,{kind:'paragraph',text:`Сохранённая версия из истории: ${savedAt}`});const bytes=buildPlainDocx(blocks),url=URL.createObjectURL(new Blob([bytes.buffer as ArrayBuffer],{type:DOCX_MIME})),a=document.createElement('a');a.href=url;a.download=`ASHYQ-${source.ref.unitId}-v${source.ref.version}-${suffix}.docx`;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);setMessage('Отчёт Word скачан: ответы и заметки пользователя, без экзаменационного балла. Для восстановления используй JSON.');}catch(error){setMessage(failure(error));}}
  async function write(expected:string|null,change:(record:BankRecord)=>BankRecord,savedFingerprint:string):Promise<BankRecord|null>{
    if(!key||blocked)return null;setBusy(true);setMessage('Сохраняю эту версию работы…');
    try{const next=await mutateBankRecord(scope,source,expected,change);setBaseline({key,revision:next.revision});setPersisted(savedFingerprint);setIntent(null);setMessage('Работа сохранена в этом браузере для этой версии задания. Другие аккаунты и версии имеют отдельные записи.');return next;}
    catch(error){setMessage(failure(error));return null;}finally{setBusy(false);setFocusMessage(true);}
  }
  function saveCurrent(confirmed=false,expected=record?.revision??null){
    if(blocked||!compatible||!valid)return;
    if(record?.checkpoint&&!owns&&!confirmed){setIntent({kind:'replace',revision:record.revision});return;}
    try{const entry=createBankEntry(source,data);void write(expected,old=>({...old,checkpoint:entry}),fingerprint);}catch(error){setMessage(failure(error));}
  }
  async function confirm(){
    if(!intent||!key||blocked)return;
    if(intent.kind==='replace'){saveCurrent(true,intent.revision);return;}
    if(intent.kind==='restore'){
      try{const latest=parseBankRecord(localStorage.getItem(key),source);if(!latest||latest.revision!==intent.revision)throw new Error('Сохранённая запись изменилась. Загрузка не выполнена; выбери актуальную версию.');onRestore(structuredClone(intent.entry.data));setBaseline({key,revision:latest.revision});setPersisted(bankSnapshotFingerprint(intent.entry.data));setIntent(null);setMessage('Загружена выбранная работа с исходной версией задания. Это не новая независимая попытка.');}catch(error){setMessage(failure(error));}return;
    }
    if(intent.kind==='import'){const imported=intent.record;const written=await write(intent.revision,()=>imported,imported.checkpoint?bankSnapshotFingerprint(imported.checkpoint.data):'');if(written&&imported.checkpoint)onRestore(structuredClone(imported.checkpoint.data));return;}
    setBusy(true);
    try{const next=intent.kind==='recover'?await clearInvalidBankRecord(scope,source,intent.raw):await clearBankRecord(scope,source,intent.revision);setBaseline({key,revision:next.revision});setPersisted('');setIntent(null);setMessage('Локальная запись и её история очищены. Текст на экране оставлен; он не сохранится снова без твоей кнопки.');}catch(error){setMessage(failure(error));}finally{setBusy(false);setFocusMessage(true);}
  }
  async function importFile(file:File|undefined){
    if(!file||blocked)return;setMessage('');setIntent(null);
    try{if(file.size>MAX_BANK_RECORD_BYTES)throw new Error('Файл больше1.5МБ. Существующая запись не изменена.');const value=parseBankRecord(await file.text(),source);if(!value)throw new Error('Файл повреждён, несовместим или относится к другой версии задания. Ничего не заменено.');setIntent({kind:'import',revision:record?.revision??null,record:value});}catch(error){setMessage(failure(error));}
  }
  async function archive(){if(blocked||!valid||!bankSnapshotComplete(data))return;try{const entry=createBankEntry(source,data);await write(record?.revision??null,old=>archiveBankEntry({...old,checkpoint:old.checkpoint&&bankSnapshotFingerprint(old.checkpoint.data)!==fingerprint?old.checkpoint:null},entry),fingerprint);}catch(error){setMessage(failure(error));}}
  return <section className={styles.panel} aria-labelledby={titleId}>
    <h4 ref={heading} tabIndex={-1} id={titleId}>Сохранение пробы · {source.ref.unitId} · версия {source.ref.version}</h4>
    <p>Сохранение по кнопке в этом браузере; записи аккаунтов разделены. На общем устройстве работу могут увидеть другие люди. Первая работа, разбор и пересмотр сохраняются отдельно внутри пробы. Запись не публикует материал, не отправляет текст на AI и не подтверждает освоение.</p>
    <p className={styles.status} role="status">{externalBusy?'Сначала закончи запись или отмени запрос микрофона. Сохранение заметок пока недоступно.':busy?'Идёт запись. Дождись результата.':changed?'Есть несохранённые изменения в пробе.':currentStored?'Текущая версия работы есть в локальной записи.':'Сохранение пробы ещё не выполнено.'}</p>
    {message&&<p ref={messageNode} tabIndex={-1} data-bank-message role="status">Последнее действие: {message}</p>}
    {record?.checkpoint&&!owns&&<p className={styles.warning}>Есть сохранённая работа этой версии. Продолжи её либо явно замени текущей; она не загружается автоматически.</p>}
    {read.kind==='blocked'&&<p className={styles.warning}>Локальное хранилище недоступно. Можно скачать текущую работу; сохранение и загрузка отключены.</p>}
    {read.kind==='ready'&&raw!==null&&!record&&<p className={styles.warning}>Локальная запись повреждена или несовместима. Она не заменена. Скачай исходные данные перед явной очисткой.</p>}
    <div className={styles.actions}>
      <button type="button" disabled={blocked||!compatible||!valid} onClick={()=>saveCurrent()}>Сохранить текущую пробу</button>
      <button type="button" disabled={blocked||!valid} onClick={downloadCurrent}>Скачать текущую работу</button>
      <button type="button" disabled={blocked||!valid} onClick={()=>downloadWord(data,'current')}>Скачать отчёт Word</button>
      {record?.checkpoint&&<button type="button" disabled={blocked} onClick={()=>setIntent({kind:'restore',revision:record.revision,entry:record.checkpoint!})}>Продолжить сохранённую пробу</button>}
      {record&&<button type="button" disabled={blocked} onClick={()=>download(raw!,'saved.json','application/json;charset=utf-8')}>Скачать сохранённую работу и историю</button>}
      {record&&<button type="button" disabled={blocked} onClick={()=>setIntent({kind:'clear',revision:record.revision})}>Очистить сохранённую работу и историю</button>}
      {compatible&&valid&&bankSnapshotComplete(data)&&<button type="button" disabled={blocked} onClick={archive}>Добавить завершённую пробу в историю</button>}
      {read.kind==='ready'&&raw!==null&&!record&&<><button type="button" disabled={blocked} onClick={()=>download(raw,'recovery.txt','text/plain;charset=utf-8')}>Скачать исходную запись пробы</button><button type="button" disabled={blocked} onClick={()=>setIntent({kind:'recover',raw})}>Очистить несовместимую запись</button></>}
    </div>
    <p>Word — читаемый отчёт текущего экрана. JSON — файл для восстановления работы и отдельной истории. Word не сохраняет пробу в браузере; аудиозаписи скачиваются отдельно.</p>
    <div className={styles.history}><label htmlFor={importId}>Восстановить файл этой версии задания</label><input id={importId} type="file" accept="application/json,.json" disabled={blocked||!compatible} onChange={event=>{void importFile(event.target.files?.[0]);event.target.value='';}}/></div>
    {record&&<details className={styles.history}><summary>История этой версии · {record.history.length} из20</summary><p>До20 записей, общий лимит1.5МБ. При достижении лимита скачай историю перед очисткой. Совпадающая работа не добавляется повторно; завершение не является оценкой.</p>{record.history.map(entry=><div className={styles.actions} key={entry.id}><span>{entry.savedAt} · {bankSnapshotComplete(entry.data)?'Проба завершена':'Работа в процессе'}</span><button type="button" disabled={blocked} onClick={()=>setIntent({kind:'restore',revision:record.revision,entry})}>Загрузить занятие {entry.savedAt}</button><button type="button" disabled={blocked} onClick={()=>downloadWord(entry.data,`history-${entry.id}`,entry.savedAt)}>Скачать Word занятия {entry.savedAt}</button></div>)}</details>}
    {intent&&<div ref={confirmation} tabIndex={-1} data-bank-confirm className={styles.warning} role="alert"><p>{intent.kind==='restore'?'Выбранная версия заменит текст на экране. Текущее несохранённое содержимое нужно сначала скачать.':intent.kind==='replace'?'Текущая проба заменит сохранённый черновик этой версии задания. История останется.':intent.kind==='import'?'Файл заменит локальный черновик и историю этой версии. Текущую работу и прежнюю историю нужно сначала скачать.':intent.kind==='recover'?'Будет очищена только эта несовместимая запись. Скачай исходные данные для восстановления до подтверждения.':'Будут очищены сохранённая работа и история этой версии. Текст на экране останется, сохранение по кнопке.'}</p><div className={styles.actions}><button type="button" disabled={blocked} onClick={()=>{void confirm();}}>Подтвердить {intent.kind==='restore'?'загрузку':intent.kind==='import'?'восстановление':intent.kind==='replace'?'замену':'очистку'}</button><button type="button" disabled={blocked} onClick={()=>{setIntent(null);heading.current?.focus({preventScroll:true});heading.current?.scrollIntoView({block:'start',behavior:'instant'});}}>Отменить действие</button></div></div>}
  </section>;
}
