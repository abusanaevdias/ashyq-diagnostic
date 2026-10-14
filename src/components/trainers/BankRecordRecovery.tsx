'use client';
import {useEffect,useState} from 'react';
import {useSession} from '@/lib/lms/hooks';
import {bankSourceIdentity,parseBankSourceRef,type BankSourceRef} from '@/lib/trainers/bank-sources';
import {bankRecordKey} from '@/lib/trainers/bank-records';
import {utf8Bytes} from '@/lib/trainers/checkpoints';
import styles from './TrainerCheckpoint.module.css';
function Recovery({recordKey,sourceRef}:{recordKey:string;sourceRef:BankSourceRef}){
 const [raw,setRaw]=useState<string|null|undefined>(undefined),[message,setMessage]=useState('');
 useEffect(()=>{const changed=(event:StorageEvent)=>{if(event.key===null||event.key===recordKey){setRaw(undefined);setMessage('Локальная запись могла измениться. Проверь её заново.');}};window.addEventListener('storage',changed);return()=>window.removeEventListener('storage',changed);},[recordKey]);
 function read(){try{const value=localStorage.getItem(recordKey);if(value!==null&&utf8Bytes(value)>10_000_000)throw Error('Запись превышает лимит файла восстановления. Она оставлена без изменений.');setRaw(value);setMessage(value===null?'В этом браузере записи этой версии для текущего аккаунта нет.':'Запись найдена. Можно скачать исходные данные без загрузки задания и проверки содержимого.');}catch(error){setRaw(undefined);setMessage(error instanceof DOMException?'Браузер не разрешил прочитать локальную запись. Данные не изменены.':error instanceof Error?error.message:'Не удалось прочитать локальную запись.');}}
 function download(){if(raw===null||raw===undefined)return;try{if(localStorage.getItem(recordKey)!==raw){setRaw(undefined);setMessage('Запись изменилась после проверки. Повтори проверку перед скачиванием.');return;}const url=URL.createObjectURL(new Blob([raw],{type:'text/plain;charset=utf-8'})),a=document.createElement('a');a.href=url;a.download=`ASHYQ-${sourceRef.unitId}-v${sourceRef.version}-recovery.txt`;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);setMessage('Исходные данные скачаны. Запись не изменена; прохождение этой версии остаётся недоступным.');}catch{setMessage('Браузер не разрешил скачать запись. Она не изменена.');}}
 return <section className={styles.panel} aria-label="Восстановление локальной записи недоступной версии"><h2>Сохрани прежнюю работу</h2><p>Если ты работал с этой версией раньше, можно скачать её запись из этого браузера. Задание и разбор не открываются; данные не отправляются на сервер. Файл сохраняет исходный текст записи, включая возможные повреждения.</p><div className={styles.actions}><button type="button" onClick={read}>Проверить прежнюю локальную запись</button>{raw!==undefined&&raw!==null&&<button type="button" onClick={download}>Скачать исходные данные этой версии</button>}</div>{message&&<p role="status">{message}</p>}</section>;
}
export default function BankRecordRecovery({source}:{source:BankSourceRef|null}){
 const {session,ready}=useSession(),resolved=parseBankSourceRef(source),scope=session?.user.id??'guest';
 if(!ready||!resolved||!scope||scope.length>200)return null;
 const key=bankRecordKey(scope,resolved);return <Recovery key={`${scope}:${bankSourceIdentity(resolved)}`} recordKey={key} sourceRef={resolved}/>;
}
