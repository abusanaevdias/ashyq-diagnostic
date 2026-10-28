'use client';
import {FeedbackSummary} from '@/components/ui/LearningFeedback';
import {isPublishedBankSource} from '@/lib/trainers/bank-publication';
import TrainerCheckpoint from '@/components/trainers/TrainerCheckpoint';
import Link from 'next/link';
import BankCheckpoint from './BankCheckpoint';
import type {BankSource} from '@/lib/trainers/bank-sources';
import type {BankSpeakingState} from '@/lib/trainers/bank-speaking-state';
import { useEffect, useRef, useState } from 'react';
import { markerKinds, speakingCriteria, speakingPrompts, timeLabel } from '@/lib/speaking-second-take/prompts';
import type { DraftSpeakingPair } from '@/lib/trainers/draft-speaking';
import SpeakingTranscriptPanel,{SpeakingTranscriptSummary} from './SpeakingTranscriptPanel';
import {openSpeakingTranscriptReview,speakingTranscriptReviewComplete,type SpeakingTranscriptReview} from '@/lib/speaking-second-take/transcript-review';
import styles from './SpeakingSecondTake.module.css';

type Phase = 'start' | 'prepare' | 'capture' | 'review' | 'compare' | 'result';
type Marker = { id: number; second: number | null; kind: string; note: string };
type Take = { url: string | null; seconds: number | null; markers: Marker[]; ratings: string[]; plan: string; confirmed: boolean; preparationNotes?: string; noSpecificMoments?:boolean|null;transcriptReview?:SpeakingTranscriptReview };
const blankTake = (url: string | null, seconds: number | null, preparationNotes: string): Take => ({ url, seconds, markers: [], ratings: ['', '', '', ''], plan: '', confirmed: false, preparationNotes, noSpecificMoments:null });

export default function SpeakingSecondTake({ draft }: { draft?: { pair: DraftSpeakingPair; unitId: string; title: string; source:BankSource } } = {}) {
  const [bankDirty,setBankDirty]=useState(false),[bankBusy,setBankBusy]=useState(false),[bankGeneration,setBankGeneration]=useState(0);
  const [preparationInterrupted,setPreparationInterrupted]=useState(false);
  const [leaveHref,setLeaveHref]=useState<string|null>(null),[resetIntent,setResetIntent]=useState<'start'|'begin'|null>(null);
  const allowLeave=useRef(false),confirmation=useRef<HTMLElement|null>(null);
  useEffect(()=>{if(leaveHref||resetIntent){confirmation.current?.focus({preventScroll:true});confirmation.current?.scrollIntoView({block:'start',behavior:'instant'});}},[leaveHref,resetIntent]);
  const [phase, setPhase] = useState<Phase>('start');
  const [takeIndex, setTakeIndex] = useState(0);
  const [takes, setTakes] = useState<Take[]>([]);
  const [notes, setNotes] = useState('');
  const [remaining, setRemaining] = useState(60);
  const [elapsed, setElapsed] = useState(0);
  const [pending, setPending] = useState(false);
  const [recording, setRecording] = useState(false);
  const [kind, setKind] = useState(markerKinds[0]);
  const [markerNote, setMarkerNote] = useState('');
  const [error, setError] = useState('');
  const [noMarkers, setNoMarkers] = useState(false);
  const [transcriptBusy,setTranscriptBusy]=useState(false);
  const requestId = useRef(0);
  const recorder = useRef<MediaRecorder | null>(null);
  const stream = useRef<MediaStream | null>(null);
  const startTime = useRef(0);
  const stopTime = useRef(0);
  function stopRecording() { if (recorder.current?.state === 'recording') { stopTime.current = performance.now(); recorder.current.stop(); } }
  const preparationEnd = useRef(0);
  const clock = useRef<ReturnType<typeof setInterval> | null>(null);
  const recordingLimit = useRef<ReturnType<typeof setTimeout> | null>(null);
  const urls = useRef(new Set<string>());
  const audioTypes = useRef(new Map<string, string>());
  const [audioBlobs,setAudioBlobs]=useState<Record<string,Blob>>({});
  const markerId = useRef(0);
  const audio = useRef<HTMLAudioElement | null>(null);
  const root = useRef<HTMLElement | null>(null);
  function pauseAudio(active?: HTMLAudioElement) { root.current?.querySelectorAll('audio').forEach(element => { if (element !== active) element.pause(); }); }
  const current = takes[takeIndex];
  const topic = draft?.pair.topics[takeIndex === 2 ? 1 : 0];
  const prompt = topic ? { title: topic.prompt, bullets: topic.cues } : speakingPrompts[takeIndex === 2 ? 1 : 0];
  const draftHasWork = !!draft && (bankDirty || takes.some(t=>!!t.url) || pending || recording || bankBusy || transcriptBusy);
  const bankData:BankSpeakingState={type:'speaking',audioIncluded:false,phase,takeIndex:takeIndex as 0|1|2,takes:takes.map(t=>({seconds:t.seconds,markers:t.markers,ratings:t.ratings,plan:t.plan,confirmed:t.confirmed,preparationNotes:t.preparationNotes??null,noSpecificMoments:t.noSpecificMoments??null,...(t.transcriptReview===undefined?{}:{transcriptReview:t.transcriptReview})})),notes,kind,markerNote,noMarkers};
  useEffect(() => {
    if (!draftHasWork) return;
    const warn = (event: BeforeUnloadEvent) => { if(allowLeave.current)return;event.preventDefault(); event.returnValue = ''; };
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [draftHasWork]);
  useEffect(()=>{if(bankBusy)pauseAudio();},[bankBusy]);
  useEffect(()=>{
    if(!draft)return;
    const intercept=(event:MouseEvent)=>{
      if(event.defaultPrevented||event.button!==0||event.metaKey||event.ctrlKey||event.shiftKey||event.altKey)return;
      const link=(event.target as Element)?.closest?.('a');if(!link||link.hasAttribute('download')||link.target&&link.target!=='_self')return;
      const href=new URL(link.href,location.href);if(!['http:','https:'].includes(href.protocol)||href.href===location.href||href.origin===location.origin&&href.pathname===location.pathname&&href.search===location.search)return;
      if(!draftHasWork)return;event.preventDefault();event.stopPropagation();
      if(bankBusy||recording||pending||transcriptBusy){setError('Сначала закончи запись, отмени запрос микрофона или дождись сохранения.');return;}
      setLeaveHref(href.href);
    };
    document.addEventListener('click',intercept,true);return()=>document.removeEventListener('click',intercept,true);
  },[draft,draftHasWork,bankBusy,recording,pending,transcriptBusy]);
  function downloadTake(take: Take, index: number) {
    if (!take.url) return;
    try {
      const mime = audioTypes.current.get(take.url);
      if (!mime?.startsWith('audio/')) throw new Error('Audio format is unavailable');
      const extension = mime.includes('mp4') ? 'm4a' : mime.includes('ogg') ? 'ogg' : 'webm';
      const link = document.createElement('a');
      link.href = take.url; link.download = `ASHYQ-speaking-${draft ? `${draft.unitId}-v${draft.source.ref.version}-${draft.source.ref.contentHash.slice(0,12)}-` : ''}answer-${index + 1}.${extension}`;
      document.body.appendChild(link); link.click(); link.remove();
      setError('');
    } catch { setError('Не удалось скачать запись. Пока она доступна в этой вкладке, попробуй ещё раз перед обновлением страницы.'); }
  }

  function clearClock() { if (clock.current) clearInterval(clock.current); clock.current = null; if (recordingLimit.current) clearTimeout(recordingLimit.current); recordingLimit.current = null; }
  function releaseMicrophone() { stream.current?.getTracks().forEach(track => track.stop()); stream.current = null; }
  function cancelCapture() { requestId.current += 1; clearClock(); if (recorder.current?.state === 'recording') { recorder.current.onstop = null; recorder.current.ondataavailable = null; recorder.current.stop(); } recorder.current = null; releaseMicrophone(); setPending(false); setRecording(false); }
  useEffect(() => () => {
    requestId.current += 1;
    if (clock.current) clearInterval(clock.current);
    if (recordingLimit.current) clearTimeout(recordingLimit.current);
    if (recorder.current?.state === 'recording') { recorder.current.onstop = null; recorder.current.ondataavailable = null; recorder.current.stop(); }
    stream.current?.getTracks().forEach(track => track.stop());
    urls.current.forEach(url => URL.revokeObjectURL(url));
    audioTypes.current.clear();
  }, []);
  useEffect(() => { const heading=phase==='start'?root.current?.querySelector('h1'):document.getElementById('speaking-stage-title'); heading?.scrollIntoView({block:'start',behavior:'instant'});heading?.focus({preventScroll:true}); },[phase,takeIndex]);
  function updateTake(update: Partial<Take>) { setTakes(previous => previous.map((take, index) => index === takeIndex ? { ...take, ...update } : take)); }
  function prepare(index: number) {
    pauseAudio(); clearClock(); setError(''); setTakeIndex(index); setNotes(''); setNoMarkers(false); setMarkerNote(''); setElapsed(0); setRemaining(60); setPreparationInterrupted(false); setPhase('prepare');
    preparationEnd.current = performance.now() + 60_000;
    clock.current = setInterval(() => { const left = Math.max(0, Math.ceil((preparationEnd.current - performance.now()) / 1000)); setRemaining(left); if (left === 0) { clearClock(); setPhase('capture'); } }, 250);
  }
  function begin() { pauseAudio(); cancelCapture(); urls.current.forEach(url => URL.revokeObjectURL(url)); urls.current.clear(); audioTypes.current.clear();setAudioBlobs({}); setTakes([]); markerId.current=0; setKind(markerKinds[0]); prepare(0); }
  function storeTake(take: Take) {
    setTakes(previous => { const next = [...previous]; next[takeIndex] = take; return next; }); setNoMarkers(false); setMarkerNote(''); setPhase('review');
  }
  async function startRecording() {
    if (pending || recording || bankBusy) return;
    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === 'undefined') { setError('В этом браузере запись недоступна. Попробуй другой браузер или самостоятельную попытку без аудио.'); return; }
    const request = ++requestId.current; setPending(true); setError('');
    try {
      const input = await navigator.mediaDevices.getUserMedia({ audio: true });
      if (request !== requestId.current) { input.getTracks().forEach(track => track.stop()); return; }
      stream.current = input;
      const mime = ['audio/webm;codecs=opus', 'audio/mp4', 'audio/webm'].find(value => MediaRecorder.isTypeSupported(value));
      const capture = new MediaRecorder(input, mime ? { mimeType: mime } : undefined);
      const chunks: BlobPart[] = []; recorder.current = capture;
      capture.ondataavailable = event => { if (event.data.size) chunks.push(event.data); };
      capture.onerror = () => { if (request !== requestId.current) return; cancelCapture(); setError('Запись прервалась. Попробуй снова; эта попытка не сохранена.'); };
      capture.onstop = () => {
        clearClock(); releaseMicrophone(); recorder.current = null;
        if (request !== requestId.current) return;
        setRecording(false); setPending(false);
        const seconds = ((stopTime.current || performance.now()) - startTime.current) / 1000;
        const blob = new Blob(chunks, { type: capture.mimeType || 'audio/webm' });
        if (!blob.size || seconds < 0.2) { setError('Получилась пустая или слишком короткая запись. Попробуй ещё раз.'); return; }
        const url = URL.createObjectURL(blob); urls.current.add(url); audioTypes.current.set(url, blob.type); setAudioBlobs(previous=>({...previous,[url]:blob})); storeTake(blankTake(url, seconds, notes));
      };
      capture.start(); stopTime.current = 0; startTime.current = performance.now(); setPending(false); setRecording(true); setElapsed(0);
      clock.current = setInterval(() => setElapsed(Math.floor((performance.now() - startTime.current) / 1000)), 250);
      recordingLimit.current = setTimeout(stopRecording, 120_000);
    } catch {
      if (request !== requestId.current) return;
      clearClock(); releaseMicrophone(); recorder.current = null; setPending(false); setRecording(false); setError('Микрофон не разрешён или недоступен. Можно повторить запрос или продолжить без записи.');
    }
  }
  function addMarker() {
    if (!markerNote.trim() || !current) { setError('Опиши конкретный момент, который хочешь проверить.'); return; }
    if(current.markers.length>=50||!Number.isSafeInteger(markerId.current+1)||!draft&&markerId.current>=1e9){setError('Лимит — 50 наблюдений на ответ. Удали лишнее перед новой отметкой.');return;}
    const second = current.url ? Math.min(current.seconds ?? 0, Math.max(0, audio.current?.currentTime ?? 0)) : null;
    updateTake({ markers: [...current.markers, { id: ++markerId.current, second, kind, note: markerNote.trim() }] }); setMarkerNote('');setNoMarkers(false); setError('');
  }
  function finishReview() {
    if(transcriptBusy){setError('Дождись распознавания или отмени его перед завершением.');return;}
    if(current?.transcriptReview&&!speakingTranscriptReviewComplete(current.transcriptReview)){setError('Заверши работу с расшифровкой: проверь текст и объясни свои изменения либо выбери продолжение без расшифровки.');return;}
    if(markerNote.trim()){setError('Добавь написанное наблюдение кнопкой или очисти поле перед завершением.');return;}
    if (!current?.confirmed || current.ratings.some(value => !value) || !current.plan.trim() || (!current.markers.length && !noMarkers)) { setError('Подтверди самопроверку, заполни четыре критерия и план. Добавь наблюдение или отметь, что не выделил отдельные моменты.'); return; }
    updateTake({noSpecificMoments:current.markers.length===0&&noMarkers});setNoMarkers(current.markers.length===0&&noMarkers);setMarkerNote('');pauseAudio(); setError(''); setPhase(takeIndex === 0 ? 'compare' : takeIndex === 1 ? 'compare' : 'result');
  }
  function openTranscript(){
    if(!current||current.transcriptReview)return;
    if(markerNote.trim()||!current.markers.length&&!noMarkers){setError('Сначала добавь наблюдение или отметь, что отдельные моменты не выделены. Незавершённую заметку добавь кнопкой.');return;}
    const review=openSpeakingTranscriptReview({recordingSeconds:current.seconds,markers:current.markers,ratings:current.ratings,noSpecificMoments:current.markers.length===0&&noMarkers,plan:current.plan});
    if(!review){setError('Сначала заполни четыре пункта самооценки.');return;}updateTake({transcriptReview:review});setError('');
  }
  function editTranscript(patch:Partial<SpeakingTranscriptReview>){const opened=current?.transcriptReview?.openedAt;setTakes(previous=>previous.map((t,i)=>i===takeIndex&&t.transcriptReview?.openedAt===opened&&t.transcriptReview?{...t,transcriptReview:{...t.transcriptReview,...patch}}:t));}
  function replaceTranscript(expected:SpeakingTranscriptReview,next:SpeakingTranscriptReview){const url=current?.url;setTakes(previous=>previous.map((t,i)=>i===takeIndex&&t.url===url&&t.transcriptReview===expected?{...t,transcriptReview:next}:t));}
  function releaseAudio(){pauseAudio();cancelCapture();urls.current.forEach(url=>URL.revokeObjectURL(url));urls.current.clear();audioTypes.current.clear();setAudioBlobs({});audio.current=null;}
  function resetBank(){releaseAudio();markerId.current=0;setPhase('start');setTakeIndex(0);setTakes([]);setNotes('');setKind(markerKinds[0]);setMarkerNote('');setNoMarkers(false);setRemaining(60);setElapsed(0);setPreparationInterrupted(false);setError('');setBankGeneration(n=>n+1);}
  function restoreBank(saved:import('@/lib/trainers/bank-snapshots').BankSnapshot){
    if(saved.type!=='speaking')return;releaseAudio();markerId.current=Math.max(0,...saved.takes.flatMap(t=>t.markers.map(m=>m.id)));setPhase(saved.phase);setTakeIndex(saved.takeIndex);setTakes(saved.takes.map(t=>({...t,url:null,preparationNotes:t.preparationNotes??undefined})));setNotes(saved.notes);setKind(saved.kind);setMarkerNote(saved.markerNote);setNoMarkers(saved.noMarkers);setElapsed(0);setRemaining(0);setPreparationInterrupted(saved.phase==='prepare');setError('');
  }
  function takeSummary(take: Take, index: number) { return <section className={styles.panel} data-study-panel key={index}><h3>{index === 0 ? 'Первый ответ' : index === 1 ? 'Второй ответ на ту же тему' : 'Ответ на новую тему'}</h3>{draft && <><p lang="en">{draft.pair.topics[index === 2 ? 1 : 0].prompt}</p><p className={styles.note}>{index === 1 ? 'Повтор знакомой темы после разбора первой попытки.' : 'Первая попытка по теме; идеи показаны после её фиксации. Предварительный просмотр материала рецензентом мог повлиять на ответ.'}</p></>}<p>{take.url ? `Время записи: ${timeLabel(take.seconds ?? 0)} (не время звучащей речи).` : take.seconds !== null ? 'Запись была сделана (' + timeLabel(take.seconds) + '), но аудио не входит в сохранение. Открой скачанный файл отдельно.' : 'Самостоятельная попытка без аудиозаписи.'}</p>{take.url && <audio controls preload="metadata" src={take.url} onPlay={event => {if(bankBusy)event.currentTarget.pause();else pauseAudio(event.currentTarget);}}/> }<p>Твоих отметок: {take.markers.length}.</p>{take.noSpecificMoments===true&&<p className={styles.note}>Отдельные трудные моменты не выделены — по твоему самоотчёту.</p>}{take.url && <button type="button" className={styles.secondary} onClick={() => { void downloadTake(take, index); }}>Скачать аудио ответа {index + 1}</button>}<ul>{take.markers.map(marker => <li key={marker.id}>{marker.second === null ? 'Без таймкода' : timeLabel(marker.second)} · {marker.kind}: {marker.note}</li>)}</ul><dl>{speakingCriteria.map((criterion, criterionIndex) => <div key={criterion.name}><dt>{criterion.name}</dt><dd>{take.ratings[criterionIndex]}</dd></div>)}</dl><h4>Заметки до этого ответа</h4><p className={styles.saved}>{take.preparationNotes === undefined ? 'Исходные заметки не были записаны в этой старой версии сохранения.' : take.preparationNotes || 'До ответа заметки не добавлены.'}</p><h4>Твой план проверки</h4><p className={styles.saved}>{take.plan}</p><SpeakingTranscriptSummary value={take.transcriptReview}/>{take.transcriptReview&&<details><summary>Расшифровка и наблюдения ответа {index+1}</summary><SpeakingTranscriptPanel value={take.transcriptReview} audioUrl={take.url} recordedSeconds={take.seconds} readOnly onEdit={()=>{}} onReplace={()=>{}}/></details>}</section>; }

  return <main ref={root} className={styles.page} data-study-active={phase !== 'start'} data-study-phase={phase} data-study-kind="SpeakingSecondTake"><div className={styles.topline}>{draft ? <a href={draft.source&&isPublishedBankSource(draft.source.ref)?'/trainers/bank':'/trainers/material-review'}>{draft.source&&isPublishedBankSource(draft.source.ref)?'← К банку практики':'← К проверке материалов'}</a> : <Link href="/trainers">← Все тренажёры</Link>}<span>ASHYQ · SECOND TAKE</span></div><header className={styles.hero} data-study-header><p className={styles.eyebrow}>IELTS-STYLE · SPEAKING PART 2</p><h1 tabIndex={-1}>{draft ? `Speaking-проба · ${draft.unitId} · ${draft.source&&isPublishedBankSource(draft.source.ref)?'ПРАКТИКА':'DRAFT'}` : 'Услышь свой ответ. Попробуй ещё раз.'}</h1>{draft && <p className={styles.warning}>{draft.source&&isPublishedBankSource(draft.source.ref)?'Тема задания':'Черновая тема'}: {draft.title}. Заметки и самопроверку можно сохранить по кнопке в этом браузере или скачать файлом. Аудио скачивается отдельно: файл заметок его не содержит. Работа не одобряет материал. Предварительный просмотр ключа влияет на независимость ответа.</p>}<details data-study-instructions open={phase === 'start'}><summary>Инструкции и ограничения</summary><p>Запиши первый ответ, найди конкретные моменты для правки и повтори ту же тему. Затем проверь себя на новой теме.</p><p className={styles.note}>Аудио хранится в памяти этой вкладки и исчезнет при обновлении. Расшифровку и самопроверку можно сохранить отдельно; это не оценка IELTS. Не называй личные данные; можно рассказать вымышленную историю. Внешнее распознавание — отдельный закрытый пилот с согласием на каждый запрос.</p></details></header>
    {!draft && <TrainerCheckpoint trainer="speaking-second-take" data={{ phase, takeIndex, takes: takes.map(take => ({ ...take, url: null })), notes, kind, markerNote, noMarkers }} completed={phase === 'result'} busy={recording || pending || transcriptBusy} ephemeral={takes.some(take=>!!take.url)} onRestore={saved => { releaseAudio(); markerId.current = Math.max(0, ...saved.takes.flatMap(take => take.markers.map(marker => marker.id))); setRemaining(0); setElapsed(0); setPreparationInterrupted(saved.phase==='prepare'); setPhase(saved.phase); setTakeIndex(saved.takeIndex); setTakes(saved.takes); setNotes(saved.notes); setKind(saved.kind); setMarkerNote(saved.markerNote); setNoMarkers(saved.noMarkers&&!saved.takes[saved.takeIndex]?.markers.length); setError(''); }} />}
    <fieldset disabled={bankBusy} style={{border:0,padding:0,margin:0,minWidth:0}}>{phase === 'start' ? <section className={styles.panel} data-study-panel><h2>Сначала слушаешь себя</h2><ol><li>До минуты на заметки; затем до двух минут записи.</li><li>Отметь момент в аудио и проверь четыре аспекта речи.</li><li>Составь план и запиши ту же тему второй раз.</li><li>Ответь на новую тему, чтобы не ограничиться заученным ответом.</li></ol><p className={styles.note}>Микрофон включается только по отдельной кнопке после подготовки. Можно пройти самопроверку без аудиозаписи.</p><button type="button" className={styles.primary} onClick={begin}>Начать подготовку →</button></section> : <section className={styles.lesson} data-study-lesson aria-labelledby="speaking-stage-title"><div className={styles.lessonTop}><button type="button" onClick={() => {if(draft){setResetIntent('start');return;}pauseAudio(); cancelCapture(); setPhase('start'); setError('');}}>← К началу</button><span>{takeIndex === 0 ? 'Первый ответ' : takeIndex === 1 ? 'Второй ответ · та же тема' : 'Новая тема'}</span></div><h2 id="speaking-stage-title" tabIndex={-1}>{phase === 'prepare' ? '1. Подготовь заметки' : phase === 'capture' ? '2. Ответь вслух' : phase === 'review' ? current?.url ? '3. Прослушай и проверь себя' : '3. Вспомни ответ и проверь себя' : phase === 'compare' ? 'Сравнение и следующий ответ' : 'Три попытки: что ты заметил'}</h2>
      {phase !== 'result' && <details className={styles.prompt} open={phase === 'prepare' || phase === 'capture'}><summary>Тема и опоры ответа</summary><h3 lang="en">{draft ? prompt.title : `Describe: ${prompt.title}`}</h3><ul lang="en">{prompt.bullets.map(bullet => <li key={bullet}>{bullet}</li>)}</ul></details>}
      {draft && topic && (phase === 'compare' || phase === 'review' && !!current?.transcriptReview) && <section className={styles.panel} data-study-panel aria-labelledby="speaking-draft-help-title"><h3 id="speaking-draft-help-title">Идеи после попытки{draft.source&&isPublishedBankSource(draft.source.ref)?'':' · DRAFT'}</h3><p>Это необязательные идеи для развития ответа, а не образец для заучивания или оценка твоей речи. Выбери одну цель для следующего ответа. Просмотр этих идей — помощь, которую нужно учитывать при сравнении.</p><ul lang="en">{topic.ideas.map(idea => <li key={idea}>{idea}</li>)}</ul><p lang="en">Дополнительный вопрос: {topic.followup}</p></section>}
      {phase === 'prepare' && <div className={styles.panel} data-study-panel><p className={styles.timer}>{preparationInterrupted?'Подготовка восстановлена без таймера':`Подготовка: ${timeLabel(remaining)}`}</p>{preparationInterrupted&&<p role="status">Оставшееся время не сохранялось. Продолжи заметки и нажми «Я готов к ответу», когда закончишь.</p>}<label htmlFor="speaking-notes">Твои заметки: ключевые идеи, не готовый текст</label><textarea id="speaking-notes" value={notes} maxLength={3000} onChange={event => setNotes(event.target.value)}/>{takeIndex > 0 && takes[takeIndex - 1] && <p className={styles.saved}>План после предыдущего ответа: {takes[takeIndex - 1].plan}</p>}<button className={styles.primary} type="button" onClick={() => { clearClock(); setPhase('capture'); }}>Я готов к ответу →</button></div>}
      {phase === 'capture' && <div className={styles.panel} data-study-panel>{notes && <details><summary>Мои заметки</summary><p className={styles.saved}>{notes}</p></details>}{recording ? <><p className={styles.timer} role="status">Идёт запись · {timeLabel(elapsed)} / 2:00</p><p>Целевой лимит — две минуты. Можно закончить раньше; в фоновой вкладке браузер может задержать остановку.</p><button type="button" className={styles.primary} onClick={stopRecording}>Закончить запись</button></> : pending ? <><p role="status">Ожидаем решение о доступе к микрофону…</p><button type="button" onClick={cancelCapture}>Отменить запрос</button></> : <><p>Микрофон ещё не включён. Записывай ответ на английском без личных данных.</p><button type="button" className={styles.primary} onClick={startRecording}>Разрешить микрофон и начать запись</button><p className={styles.note}>Браузер спросит разрешение. Само нажатие записи не отправляет аудио на сервер.</p><button type="button" className={styles.secondary} onClick={() => { setError(''); storeTake(blankTake(null, null, notes)); }}>Самостоятельная попытка без аудио →</button><p className={styles.note}>В этом режиме ответь вслух самостоятельно, затем запиши наблюдения. Аудио и его длительность не измеряются.</p></>}</div>}
      {phase === 'review' && current && <div className={styles.panel} data-study-panel>{current.url ? <><audio ref={audio} src={current.url} controls preload="metadata" onPlay={event => {if(bankBusy)event.currentTarget.pause();else pauseAudio(event.currentTarget);}}/><button type="button" className={styles.secondary} onClick={() => { void downloadTake(current, takeIndex); }}>Скачать эту аудиозапись</button><p className={styles.note}>Поставь аудио на нужный момент; кнопка ниже сохранит текущую позицию проигрывания.</p></> : <p className={styles.saved}>{current.seconds!==null?'Запись была сделана, но аудио не входит в сохранение. Открой скачанный файл отдельно. Прежние таймкоды оставлены; новые наблюдения здесь будут без таймкода.':'Ответь вслух самостоятельно и вспомни, где было трудно. Это режим без аудиозаписи и таймкодов.'}</p>}<label htmlFor="speaking-marker-kind">Что заметил?</label><select id="speaking-marker-kind" value={kind} onChange={event => setKind(event.target.value)}>{markerKinds.map(value => <option key={value}>{value}</option>)}</select><label htmlFor="speaking-marker-note">Конкретный момент: слово, фраза или идея</label><textarea id="speaking-marker-note" value={markerNote} maxLength={1000} onChange={event => setMarkerNote(event.target.value)}/><button type="button" className={styles.secondary} onClick={addMarker}>{current.url ? 'Отметить текущий момент' : 'Добавить наблюдение без таймкода'}</button><ul>{current.markers.map(marker => <li key={marker.id}>{marker.second === null ? 'Без таймкода' : timeLabel(marker.second)} · {marker.kind}: {marker.note} <button type="button" aria-label={`Удалить наблюдение ${marker.id}`} onClick={() => updateTake({ markers: current.markers.filter(value => value.id !== marker.id) })}>Удалить</button></li>)}</ul><label className={styles.check}><input type="checkbox" disabled={current.markers.length>0} checked={noMarkers&&current.markers.length===0} onChange={event => setNoMarkers(event.target.checked)}/>Не выделил отдельные моменты; всё равно проверю четыре аспекта</label><h3>Твоя самооценка, без балла</h3>{speakingCriteria.map((criterion, index) => <div key={criterion.name}><label htmlFor={`speaking-rating-${index}`}>{criterion.name}</label><p className={styles.note}>{criterion.help}</p><select id={`speaking-rating-${index}`} value={current.ratings[index]} onChange={event => { const ratings = [...current.ratings]; ratings[index] = event.target.value; updateTake({ ratings }); }}><option value="">Выбери своё наблюдение</option><option>Нужно поработать</option><option>Есть удачные и трудные места</option><option>Доволен этой попыткой</option></select></div>)}<div className={styles.transcriptActions}>{current.transcriptReview ? <SpeakingTranscriptPanel value={current.transcriptReview} audioUrl={current.url} audioBlob={current.url?audioBlobs[current.url]:null} recordedSeconds={current.seconds} disabled={bankBusy} onBusy={setTranscriptBusy} onEdit={editTranscript} onReplace={replaceTranscript} onSeek={second=>{if(audio.current){audio.current.currentTime=second;audio.current.focus();}}}/> : <button type="button" className={styles.secondary} onClick={openTranscript}>Зафиксировать самооценку и открыть расшифровку</button>}</div><label htmlFor="speaking-plan">План: что конкретно сделаешь в следующем ответе?</label><textarea id="speaking-plan" value={current.plan} maxLength={3000} onChange={event => updateTake({ plan: event.target.value })}/><label className={styles.check}><input type="checkbox" checked={current.confirmed} onChange={event => updateTake({ confirmed: event.target.checked })}/>{current.url||current.seconds!==null ? 'Я прослушал запись и заполнил самопроверку' : 'Я ответил вслух самостоятельно и заполнил самопроверку'}</label><button type="button" className={styles.primary} onClick={finishReview}>Сохранить самопроверку →</button></div>}
      {phase === 'compare' && <><div className={styles.grid}>{takes.map(takeSummary)}</div><p className={styles.note}>Длительность записи, твои отметки и самооценка не являются оценкой качества. Меньше отметок или более длинный ответ сами по себе не означают улучшения.</p><button type="button" className={styles.primary} onClick={() => prepare(takeIndex === 0 ? 1 : 2)}>{takeIndex === 0 ? 'Повторить ту же тему по плану →' : 'Проверить себя на новой теме →'}</button></>}
      {phase === 'result' && <><FeedbackSummary title="Практика завершена. Это самопроверка" checks={[{label:'Попытки и заметки',state:'neutral',value:'Сохранены на экране'},{label:'Качество речи и IELTS Band',state:'neutral',value:'Не оценивались автоматически'}]} next={takes.some(take => !!take.url) ? "Сравни три попытки и свои наблюдения. Скачай аудио перед уходом: оно не входит в сохранение заметок." : "Сравни три попытки и свои наблюдения. Сохрани заметки или скачай файл работы в разделе сохранения."}/><div className={styles.grid}>{takes.map(takeSummary)}</div><p className={styles.note}>Повтор знакомой темы может стать легче из-за подготовки. Сравни с новой темой. Сравнение расшифровок — наблюдения по тексту и отметкам модели, если они есть. Здесь нет измерения качества пауз, произношения, грамматики или IELTS band.</p><button type="button" className={styles.primary} data-trainer-replace="speaking-second-take" onClick={()=>draft?setResetIntent('begin'):begin()}>Начать заново →</button></>}
      {error && <p className={styles.warning} role="alert">{error}</p>}
    </section>}</fieldset>
    {draft&&<BankCheckpoint key={bankGeneration} source={draft.source} data={bankData} onRestore={restoreBank} onDirty={setBankDirty} onBusy={setBankBusy} externalBusy={pending||recording||transcriptBusy} skipUnloadWarning={()=>allowLeave.current}/>}
    {(leaveHref||resetIntent)&&<section ref={confirmation} tabIndex={-1} className={`${styles.warning} ${styles.confirmation}`} role="alert" aria-label="Подтверждение выхода"><p>{leaveHref?'Перейти со страницы? Несохранённые заметки и аудио из этой вкладки будут потеряны.':'Начать заново? Текущие заметки и аудио будут удалены с экрана. Сохранённая работа и история останутся.'}</p><button type="button" disabled={bankBusy||pending||recording} onClick={()=>{if(leaveHref){allowLeave.current=true;pauseAudio();cancelCapture();location.assign(leaveHref);}else{const restart=resetIntent==='begin';resetBank();if(restart)prepare(0);}setResetIntent(null);}}>Подтвердить {leaveHref?'переход':'сброс'}</button><button type="button" onClick={()=>{setLeaveHref(null);setResetIntent(null);const heading=phase==='start'?root.current?.querySelector('h1'):document.getElementById('speaking-stage-title');heading?.focus({preventScroll:true});}}>Остаться в пробе</button></section>}
    <p className={styles.note}>О формате и критериях: <a href="https://ielts.org/take-a-test/test-types/ielts-academic-test/ielts-academic-format-speaking" target="_blank" rel="noopener noreferrer">официальный IELTS Speaking ↗</a></p></main>;
}
