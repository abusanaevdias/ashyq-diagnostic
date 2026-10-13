'use client';

import {useState,useSyncExternalStore} from 'react';
import {bankRecordKey} from '@/lib/trainers/bank-records';
import type {BankSourceRef} from '@/lib/trainers/bank-sources';
import {BANK_RECORD_CHANGED} from '@/lib/trainers/bank-storage';
import styles from './TrainerCheckpoint.module.css';

function subscribe(callback:()=>void){window.addEventListener('storage',callback);window.addEventListener(BANK_RECORD_CHANGED,callback);return()=>{window.removeEventListener('storage',callback);window.removeEventListener(BANK_RECORD_CHANGED,callback);};}
/** Opaque recovery only. Never interprets an old checkpoint as current work or migrates approval. */
export default function ArchivedBankWork({scope,source}:{scope:string;source:BankSourceRef}){
 const key=scope&&scope.length<=200?bankRecordKey(scope,source):null;
 const snapshot=useSyncExternalStore(subscribe,()=>{if(!key)return '{"kind":"blocked"}';try{return JSON.stringify({kind:'ready',raw:localStorage.getItem(key)});}catch{return '{"kind":"blocked"}';}},()=>'{"kind":"not-ready"}');
 const read=JSON.parse(snapshot) as {kind:'ready';raw:string|null}|{kind:'blocked'}|{kind:'not-ready'},[message,setMessage]=useState('');
 if(read.kind==='not-ready'||read.kind==='ready'&&read.raw===null)return null;
 const titleId=`archived-bank-${source.batchId}-${source.unitId}-${source.contentHash.slice(0,12)}`;
 function download(){if(read.kind!=='ready'||read.raw===null)return;try{const url=URL.createObjectURL(new Blob([read.raw],{type:'text/plain;charset=utf-8'})),anchor=document.createElement('a');anchor.href=url;anchor.download=`ASHYQ-${source.unitId}-v${source.version}-archived-work-recovery.txt`;document.body.appendChild(anchor);anchor.click();anchor.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);setMessage('Исходная работа прежней версии выгружена. Локальная запись оставлена без изменений.');}catch{setMessage('Не удалось скачать прежнюю работу. Исходная запись оставлена без изменений.');}}
 return <section className={styles.panel} aria-labelledby={titleId}><h4 id={titleId}>Работа прежней версии · {source.unitId} · версия {source.version}</h4><p>Эта локальная запись относится к архивному заданию. Она не загружается в новую версию и не переносит результат или подтверждение проверки. Скачай исходные данные вместе с архивным материалом для ручного восстановления. На общем устройстве запись могут увидеть другие люди.</p>{read.kind==='blocked'?<p role="status">Чтение прежней работы в этом браузере недоступно.</p>:<><p>Размер исходной записи: {new TextEncoder().encode(read.raw??'').byteLength} Б.</p><button type="button" onClick={download}>Скачать исходную работу {source.unitId} версии {source.version}</button></>}{message&&<p role="status">{message}</p>}</section>;
}
