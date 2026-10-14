'use client';
import Link from 'next/link';
import {useSearchParams} from 'next/navigation';
import {useCallback,useEffect,useRef,useState} from 'react';
import BankRecordRecovery from './BankRecordRecovery';
import RequireRole from '@/components/lms/RequireRole';
import {useSession} from '@/lib/lms/hooks';
import {roleAllowed} from '@/lib/lms/permissions';
import {bankSourceIdentity,bankSourceQuery,findBankSource,parseBankSourceQuery,type BankSource} from '@/lib/trainers/bank-sources';
import {bankPracticeHref} from '@/lib/trainers/bank-navigation';
import {canOpenBankSource} from '@/lib/trainers/bank-delivery';
import {isPublishedBankSource} from '@/lib/trainers/bank-publication';
import {trainerById} from '@/lib/trainers/catalog';
import {BankNavigationWarningContext} from './BankNavigationWarningContext';
import DraftWritingPreview from './DraftWritingPreview';
import DraftTask2Preview from './DraftTask2Preview';
import DraftTask1Preview from './DraftTask1Preview';
import DraftReadingPreview from './DraftReadingPreview';
import DraftListeningPreview from './DraftListeningPreview';
import DraftSatPreview from './DraftSatPreview';
import DraftMathPreview from './DraftMathPreview';
import styles from './BankPracticeEntry.module.css';

function Practice({source}:{source:BankSource}){
 const [dirty,setDirty]=useState(false),[busy,setBusy]=useState(false),[href,setHref]=useState<string|null>(null),[message,setMessage]=useState('');
 const allowLeave=useRef(false),confirmation=useRef<HTMLElement|null>(null),returnFocus=useRef<HTMLAnchorElement|null>(null);
 const skipWarning=useCallback(()=>allowLeave.current,[]),trainer=trainerById(source.trainer);
 useEffect(()=>{
  if(!dirty&&!busy)return;
  const warn=(event:BeforeUnloadEvent)=>{if(allowLeave.current)return;event.preventDefault();event.returnValue='';};
  const leave=(event:MouseEvent)=>{
   if(event.defaultPrevented||event.button!==0||event.metaKey||event.ctrlKey||event.shiftKey||event.altKey)return;
   const anchor=event.target instanceof Element?event.target.closest('a'):null;if(!anchor||anchor.hasAttribute('download')||anchor.target&&anchor.target!=='_self')return;
   const target=new URL(anchor.href,location.href);if(!['http:','https:'].includes(target.protocol)||target.origin===location.origin&&target.pathname===location.pathname&&target.search===location.search)return;
   event.preventDefault();event.stopImmediatePropagation();
   if(busy){setMessage('Дождись завершения сохранения перед переходом.');return;}
   returnFocus.current=anchor;setHref(target.href);
  };
  window.addEventListener('beforeunload',warn);document.addEventListener('click',leave,true);return()=>{window.removeEventListener('beforeunload',warn);document.removeEventListener('click',leave,true);};
 },[dirty,busy]);
 useEffect(()=>{if(href){confirmation.current?.focus({preventScroll:true});confirmation.current?.scrollIntoView({block:'start',behavior:'instant'});}},[href]);
 const published=isPublishedBankSource(source.ref);
 const props={value:source.unit.exercise_data,source,onDirty:setDirty,onBusy:setBusy};
 const exercise=source.exercise.type==='writing-drill'?<DraftWritingPreview {...props}/>:source.exercise.type==='task2'?<DraftTask2Preview {...props}/>:source.exercise.type==='reading'?<DraftReadingPreview {...props}/>:source.exercise.type==='listening'?<DraftListeningPreview {...props} unitId={source.ref.unitId}/>:source.exercise.type==='sat-rw'?<DraftSatPreview {...props}/>:source.exercise.type==='math'?<DraftMathPreview {...props}/>:['task1-line','task1-categories','task1-diagrams'].includes(source.exercise.type)?<DraftTask1Preview {...props}/>:<p role="alert">Тип задания не поддерживается. Другой материал не подставлен.</p>;
 return <BankNavigationWarningContext.Provider value={skipWarning}><div className={styles.practice}><Link className={styles.back} href="/trainers/bank">← К банку практики</Link><header className={styles.header}><p>{trainer.exam} · {trainer.skill} · {source.ref.unitId} · версия {source.ref.version} · {published?'ПРАКТИКА':'DRAFT'}</p><h1 className={styles.title}>{source.title}</h1><p>{published?'Задание из опубликованного банка.':'Проба авторского черновика.'} Сначала ответь самостоятельно, затем сравни с разбором. Первая работа и правка сохраняются раздельно; завершение не является оценкой навыка или экзаменационным баллом.</p></header>{exercise}
  {busy&&message&&<p role="status">{message}</p>}
  {href&&<section ref={confirmation} tabIndex={-1} role="alert" aria-label="Подтверждение перехода" className={styles.confirmation}><p>{dirty?'Есть несохранённая работа. Сохрани или скачай её внутри пробы перед выходом. Перейти без сохранения?':'Перейти на выбранную страницу?'}</p><div className={styles.actions}><button type="button" disabled={busy} onClick={()=>{allowLeave.current=true;location.assign(href);}}>Перейти без сохранения</button><button type="button" onClick={()=>{setHref(null);returnFocus.current?.focus({preventScroll:true});}}>Остаться в пробе</button></div></section>}
 </div></BankNavigationWarningContext.Provider>;
}
export default function BankPracticeEntry(){
 const params=useSearchParams(),{session,ready}=useSession(),ref=parseBankSourceQuery(params),source=ref?findBankSource(ref):null;
 const nativeFlag=params.getAll('nativeStart'),invalidNativeFlag=params.has('nativeStart')&&(nativeFlag.length!==1||nativeFlag[0]!=='1'),nativeHref=source?bankPracticeHref(source.ref):null;
 const forceNative=!!nativeHref&&!invalidNativeFlag&&nativeFlag.length===1&&ready&&!!source&&canOpenBankSource(source.ref,session?.user.role);
 // Login uses SPA navigation. Start the editing document before mounting any response fields.
 useEffect(()=>{if(forceNative&&nativeHref)location.replace(nativeHref);},[forceNative,nativeHref]);
 if(!source||invalidNativeFlag)return <><h1>Версия задания недоступна</h1><p>Нужна полная ссылка на одну актуальную версию. Другое задание не подставлено.</p><Link href="/trainers/bank">Выбрать задание →</Link><BankRecordRecovery source={ref}/></>;
 if(!ready)return <p role="status">Проверяем вход…</p>;
 if(!isPublishedBankSource(source.ref)&&!session){const next='/trainers/bank/practice?'+bankSourceQuery(source.ref)+'&nativeStart=1';return <><h1>Нужно войти для пробы</h1><p>Черновые материалы предназначены для учителя и автора. После входа откроется эта же версия задания.</p><a href={'/login?next='+encodeURIComponent(next)}>Войти и продолжить →</a><BankRecordRecovery source={ref}/></>;}
 if(!isPublishedBankSource(source.ref)&&(!session||!roleAllowed(session.user.role,['teacher','author'])))return <><RequireRole roles={['teacher','author']}>{()=>null}</RequireRole><BankRecordRecovery source={ref}/></>;
 if(forceNative)return <p role="status">Открываем пробу…</p>;
 if(source.exercise.type==='speaking')return <><h1>Speaking открывается отдельной страницей</h1><p>Микрофон будет доступен там по отдельной кнопке. Эта ссылка сохранит выбранную тему и её версию.</p><a href={bankPracticeHref(source.ref)!}>Открыть Speaking-пробу →</a><p><Link href="/trainers/bank">К банку практики →</Link></p></>;
 return <Practice key={`${session?.user.id??'guest'}:${bankSourceIdentity(source.ref)}`} source={source}/>;
}
