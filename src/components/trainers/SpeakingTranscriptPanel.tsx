'use client';
import {useEffect,useId,useRef,useState} from 'react';
import Link from 'next/link';
import {getAuth} from '@/lib/lms/auth';
import {useSession} from '@/lib/lms/hooks';
import {awaitWritingRequest as abortable} from '@/lib/writing-trainer/ai-feedback';
import {manualSpeakingTranscript,validSpeakingTranscript,validSpeakingTranscriptText,speakingTextObservations} from '@/lib/speaking-second-take/transcript';
import {prepareSpeakingUpload} from '@/lib/speaking-second-take/transcription-client';
import type {SpeakingTranscriptReview} from '@/lib/speaking-second-take/transcript-review';
import {speakingCriteria} from '@/lib/speaking-second-take/prompts';
import styles from './SpeakingSecondTake.module.css';

type Props={value:SpeakingTranscriptReview;audioUrl:string|null;audioBlob?:Blob|null;recordedSeconds:number|null;onEdit:(patch:Partial<SpeakingTranscriptReview>)=>void;onReplace:(expected:SpeakingTranscriptReview,next:SpeakingTranscriptReview)=>void;disabled?:boolean;readOnly?:boolean;onSeek?:(second:number)=>void;onBusy?:(busy:boolean)=>void};
export function SpeakingTranscriptSummary({value}:{value?:SpeakingTranscriptReview}){
 if(!value?.original||!validSpeakingTranscriptText(value.revision))return <p className={styles.note}>{value?.skipped?'Ты выбрал обойтись без расшифровки.':'Расшифровка в этой записи не добавлена.'}</p>;
 const observed=speakingTextObservations(value.original,value.revision);
 return <p className={styles.note}>{value.original.kind==='manual'?'Ручной текст':'Распознанный текст'}: {observed.wordCount} слов; групп повторов по 2–4 слова: {observed.repeatedPhrases.length}. {observed.gaps===null?'Временные отметки недоступны.':`Промежутков от 1 с между отметками модели: ${observed.gaps.length}.`} Это наблюдения по тексту, не оценка речи.</p>;
}
export default function SpeakingTranscriptPanel(props:Props){const {session,ready}=useSession(),actor=ready?`${session?.user.id??'guest'}:${session?.user.role??'guest'}`:'loading';return <TranscriptEditor key={actor+':'+props.value.openedAt+':'+(props.audioUrl??'no-audio')} {...props} actor={actor}/>;}
function TranscriptEditor({value,audioUrl,audioBlob,recordedSeconds,onEdit,onReplace,disabled=false,readOnly=false,onSeek,onBusy,actor}:Props&{actor:string}){
 const fieldId=useId();
 const [consent,setConsent]=useState(false),[busy,setBusy]=useState(false),[error,setError]=useState(''),[status,setStatus]=useState('');const request=useRef<AbortController|null>(null),alive=useRef(true);
 useEffect(()=>{alive.current=true;return()=>{alive.current=false;request.current?.abort();onBusy?.(false);};},[onBusy]);
 useEffect(()=>()=>{request.current?.abort();},[value]);
 const original=value.original,observations=original&&validSpeakingTranscriptText(value.revision)?speakingTextObservations(original,value.revision):null;
 const change=(patch:Partial<SpeakingTranscriptReview>)=>{request.current?.abort();setConsent(false);setError('');onEdit(patch);};
 async function recognize(){
  if(!consent||request.current||!audioUrl||!audioBlob||disabled||readOnly||original||value.skipped)return;
  const controller=new AbortController();request.current=controller;setBusy(true);onBusy?.(true);setConsent(false);setError('');setStatus('Получаем доступ к пилоту…');const expected=value;
  const timer=window.setTimeout(()=>controller.abort(new DOMException('Время ожидания истекло. Запись остаётся в этой вкладке.','TimeoutError')),65_000);
  try{
   const token=await abortable(getAuth().accessToken?.()??Promise.resolve(null),controller.signal);if(!token)throw Error('Для распознавания нужен вход в разрешённый аккаунт пилота. Ручная расшифровка доступна без него.');
   setStatus('Готовим копию аудио в этом браузере…');const prepared=await prepareSpeakingUpload(audioBlob,controller.signal,recordedSeconds);controller.signal.throwIfAborted();setStatus('Распознаём запись…');
   const form=new FormData();form.set('audio',new Blob([prepared.bytes.slice().buffer],{type:'audio/wav'}),'take.wav');form.set('consent','true');
   const response=await fetch('/api/speaking/transcription',{method:'POST',headers:{Authorization:`Bearer ${token}`},body:form,cache:'no-store',signal:controller.signal});const body:unknown=await response.json();const result=body&&typeof body==='object'?body as Record<string,unknown>:{};
   if(!response.ok)throw Error(typeof result.error==='string'?result.error:'Распознавание временно недоступно.');
   const transcript=result.transcript;if(!validSpeakingTranscript(transcript)||transcript.kind!=='openai'||transcript.audioHash!==prepared.hash)throw Error('Ответ не соответствует этой записи. Локальная работа не заменена.');
   const current=getAuth().getSession();if(!controller.signal.aborted&&`${current?.user.id??'guest'}:${current?.user.role??'guest'}`===actor)onReplace(expected,{...expected,original:transcript,revision:transcript.text,reflection:'',unchanged:false});
  }catch(cause){if(alive.current&&(!controller.signal.aborted||controller.signal.reason?.name==='TimeoutError'))setError(cause instanceof Error?cause.message:'Не удалось распознать запись.');}
  finally{window.clearTimeout(timer);if(request.current===controller)request.current=null;if(alive.current){setBusy(false);setStatus('');onBusy?.(false);}}
 }
 return <section aria-label="Расшифровка и наблюдения" className={styles.transcript} aria-busy={busy}>
  <h3>Расшифровка после твоей самопроверки</h3><p className={styles.note}>Это работа с текстом ответа, без оценки IELTS. Ошибки распознавания могут менять слова и скрывать повторы. Переслушай запись перед выводами.</p>
  <details><summary>Первая самопроверка до расшифровки</summary><dl>{value.first.ratings.map((rating,i)=><div key={i}><dt>{speakingCriteria[i].name}</dt><dd>{rating}</dd></div>)}</dl><ul>{value.first.markers.map(m=><li key={m.id}>{m.kind}: {m.note}</li>)}</ul>{value.first.noSpecificMoments&&<p>Отдельные моменты не были выделены.</p>}<p className={styles.saved}>{value.first.plan||'До расшифровки план ещё не был записан.'}</p></details>
  {value.skipped?<p>Ты выбрал продолжить без расшифровки. Сравнение опирается на твою самопроверку.</p>:!original?<>
   <label htmlFor={fieldId+':draft'}>Твоя расшифровка на английском</label><textarea id={fieldId+':draft'} lang="en" value={value.draftText} maxLength={6000} disabled={disabled||readOnly||busy} onChange={e=>change({draftText:e.target.value})}/><p className={styles.note}>До 600 слов и 6000 символов. Это самостоятельная запись текста; её соответствие аудио автоматически не подтверждается.</p>
   {!readOnly&&<div className={styles.transcriptActions}><button type="button" className={styles.secondary} disabled={disabled||busy} onClick={()=>{const transcript=manualSpeakingTranscript(value.draftText);if(!transcript){setError('Добавь расшифровку: от одного слова до 600 слов и 6000 символов.');return;}onReplace(value,{...value,original:transcript,revision:transcript.text});}}>Зафиксировать расшифровку</button><button type="button" className={styles.secondary} disabled={disabled||busy} onClick={()=>change({skipped:true})}>Продолжить без расшифровки</button></div>}
   {process.env.NEXT_PUBLIC_SPEAKING_AI_ENABLED==='1'&&!readOnly&&<><h4>Распознать аудио · закрытый пилот</h4>{(!audioUrl||!audioBlob)&&<p className={styles.note}>Аудио этой попытки недоступно в текущей вкладке. Распознавание после восстановления заметок не запускается.</p>}<label className={styles.check}><input type="checkbox" checked={consent} disabled={disabled||busy||!audioUrl||!audioBlob} onChange={e=>setConsent(e.target.checked)}/>Я согласен отправить копию этой записи в OpenAI для одного распознавания. Другие записи и заметки не отправляются.</label><Link href="/privacy">Как обрабатывается запись</Link><div className={styles.transcriptActions}><button type="button" className={styles.secondary} disabled={disabled||busy||!audioUrl||!audioBlob||!consent} onClick={()=>{void recognize();}}>Распознать эту запись</button>{busy&&<button type="button" className={styles.secondary} onClick={()=>request.current?.abort()}>Отменить распознавание</button>}</div></>}
  </>:<>
   <p className={styles.note}>{original.kind==='manual'?'Источник: твоя ручная расшифровка.':'Источник: сохранённое распознавание OpenAI; точность не подтверждена.'} Аудио не входит в JSON, историю или Word.</p><details><summary>Исходная расшифровка · не изменяется</summary><p lang="en" className={styles.saved}>{original.text}</p>{value.draftText&&value.draftText!==original.text&&<><h4>Текст, набранный до фиксации</h4><p lang="en" className={styles.saved}>{value.draftText}</p></>}</details>
   <label htmlFor={fieldId+':revision'}>Твоя уточнённая расшифровка</label><textarea id={fieldId+':revision'} lang="en" value={value.revision} maxLength={6000} disabled={disabled||readOnly} onChange={e=>change({revision:e.target.value,unchanged:false})}/>
   {observations?<div aria-label="Наблюдения по расшифровке"><p><strong>{observations.wordCount}</strong> слов в тексте. Это не измерение качества речи.</p><h4>Повторяющиеся фразы</h4>{observations.repeatedPhrases.length?<ul>{observations.repeatedPhrases.map((p,i)=><li key={i}><span lang="en">{p.quote}</span> · {p.occurrences.length} вхождений{p.occurrences.map((span,j)=><details key={j}><summary>Фрагмент {j+1}</summary><p lang="en">{value.revision.slice(span.start,span.end)}</p>{audioUrl&&span.second!==null&&onSeek&&<button type="button" className={styles.secondary} onClick={()=>onSeek(span.second!)}>Перейти к отметке модели</button>}</details>)}</li>)}</ul>:<p>В этом тексте не найдено повторяющихся фраз длиной 2–4 слова. Это не доказывает отсутствие повторов в аудио.</p>}<h4>Что ещё переслушать</h4><p>Соседних повторов одного слова в тексте: {observations.repeatedWords.length}. Они не обязательно являются речевыми сбоями.</p>{observations.vocabulary.map(v=><p key={v.word}><span lang="en">{v.word}</span>: {v.occurrences.length} вхождений. Проверь, уместно ли слово; частота сама по себе не ошибка.</p>)}
    {observations.gaps===null?<p>Временные отметки недоступны или текст изменён. Число пауз и темп речи не определены.</p>:<><p>Промежутков от 1 секунды между отметками модели: {observations.gaps.length}. Это не акустическое измерение пауз.</p><p>{Math.round(observations.wordsPerRecordingMinute!)} слов расшифровки на минуту записи — без оценки беглости.</p></>}
   </div>:<p>Добавь текст до 600 слов, чтобы увидеть наблюдения.</p>}
   <label htmlFor={fieldId+':reflection'}>Что ты проверил по расшифровке?</label><textarea id={fieldId+':reflection'} value={value.reflection} maxLength={1000} disabled={disabled||readOnly} onChange={e=>change({reflection:e.target.value})}/><label className={styles.check}><input type="checkbox" checked={value.unchanged} disabled={disabled||readOnly||value.revision!==original.text} onChange={e=>change({unchanged:e.target.checked})}/>Проверил текст и оставляю расшифровку без изменений</label>
  </>}
  {busy&&<p role="status">{status}</p>}{error&&<p role="alert" className={styles.warning}>{error}</p>}
 </section>;
}
