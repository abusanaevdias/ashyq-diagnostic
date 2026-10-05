'use client';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { markerKinds, speakingCriteria, speakingPrompts, timeLabel } from '@/lib/speaking-second-take/prompts';
import styles from './SpeakingSecondTake.module.css';

type Phase = 'start' | 'prepare' | 'capture' | 'review' | 'compare' | 'result';
type Marker = { id: number; second: number | null; kind: string; note: string };
type Take = { url: string | null; seconds: number | null; markers: Marker[]; ratings: string[]; plan: string; confirmed: boolean };
const blankTake = (url: string | null, seconds: number | null): Take => ({ url, seconds, markers: [], ratings: ['', '', '', ''], plan: '', confirmed: false });

export default function SpeakingSecondTake() {
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
  const markerId = useRef(0);
  const audio = useRef<HTMLAudioElement | null>(null);
  const root = useRef<HTMLElement | null>(null);
  function pauseAudio(active?: HTMLAudioElement) { root.current?.querySelectorAll('audio').forEach(element => { if (element !== active) element.pause(); }); }
  const current = takes[takeIndex];
  const prompt = speakingPrompts[takeIndex === 2 ? 1 : 0];

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
  }, []);
  useEffect(() => { if (phase !== 'start') { const heading = document.getElementById('speaking-stage-title'); heading?.scrollIntoView({ block: 'start', behavior: 'instant' }); heading?.focus({ preventScroll: true }); } }, [phase, takeIndex]);
  function updateTake(update: Partial<Take>) { setTakes(previous => previous.map((take, index) => index === takeIndex ? { ...take, ...update } : take)); }
  function prepare(index: number) {
    pauseAudio(); clearClock(); setError(''); setTakeIndex(index); setNotes(''); setNoMarkers(false); setMarkerNote(''); setElapsed(0); setRemaining(60); setPhase('prepare');
    preparationEnd.current = performance.now() + 60_000;
    clock.current = setInterval(() => { const left = Math.max(0, Math.ceil((preparationEnd.current - performance.now()) / 1000)); setRemaining(left); if (left === 0) { clearClock(); setPhase('capture'); } }, 250);
  }
  function begin() { pauseAudio(); cancelCapture(); urls.current.forEach(url => URL.revokeObjectURL(url)); urls.current.clear(); setTakes([]); prepare(0); }
  function storeTake(take: Take) {
    setTakes(previous => { const next = [...previous]; next[takeIndex] = take; return next; }); setNoMarkers(false); setMarkerNote(''); setPhase('review');
  }
  async function startRecording() {
    if (pending || recording) return;
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
        const url = URL.createObjectURL(blob); urls.current.add(url); storeTake(blankTake(url, seconds));
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
    const second = current.url ? Math.min(current.seconds ?? 0, Math.max(0, audio.current?.currentTime ?? 0)) : null;
    updateTake({ markers: [...current.markers, { id: ++markerId.current, second, kind, note: markerNote.trim() }] }); setMarkerNote(''); setError('');
  }
  function finishReview() {
    if (!current?.confirmed || current.ratings.some(value => !value) || !current.plan.trim() || (!current.markers.length && !noMarkers)) { setError('Подтверди самопроверку, заполни четыре критерия и план. Добавь наблюдение или отметь, что не выделил отдельные моменты.'); return; }
    pauseAudio(); setError(''); setPhase(takeIndex === 0 ? 'compare' : takeIndex === 1 ? 'compare' : 'result');
  }
  function takeSummary(take: Take, index: number) { return <section className={styles.panel} key={index}><h3>{index === 0 ? 'Первый ответ' : index === 1 ? 'Второй ответ на ту же тему' : 'Ответ на новую тему'}</h3><p>{take.url ? `Время записи: ${timeLabel(take.seconds ?? 0)} (не время звучащей речи).` : 'Самостоятельная попытка без аудиозаписи.'}</p>{take.url && <audio controls preload="metadata" src={take.url} onPlay={event => pauseAudio(event.currentTarget)}/> }<p>Твоих отметок: {take.markers.length}.</p><ul>{take.markers.map(marker => <li key={marker.id}>{marker.second === null ? 'Без таймкода' : timeLabel(marker.second)} · {marker.kind}: {marker.note}</li>)}</ul><dl>{speakingCriteria.map((criterion, criterionIndex) => <div key={criterion.name}><dt>{criterion.name}</dt><dd>{take.ratings[criterionIndex]}</dd></div>)}</dl><h4>Твой план проверки</h4><p className={styles.saved}>{take.plan}</p></section>; }

  return <main ref={root} className={styles.page}><div className={styles.topline}><Link href="/trainers">← Все тренажёры</Link><span>ASHYQ · SECOND TAKE</span></div><header className={styles.hero}><p className={styles.eyebrow}>IELTS-STYLE · SPEAKING PART 2</p><h1>Услышь свой ответ. Попробуй ещё раз.</h1><p>Запиши первый ответ, найди конкретные моменты для правки и повтори ту же тему. Затем проверь себя на новой теме.</p><p className={styles.note}>Аудио остаётся в памяти этой вкладки, не загружается на сервер и исчезнет при обновлении. Нет транскрипции, AI-проверки или band. Не называй личные данные; можно рассказать вымышленную историю.</p></header>
    {phase === 'start' ? <section className={styles.panel}><h2>Сначала слушаешь себя</h2><ol><li>До минуты на заметки; затем до двух минут записи.</li><li>Отметь момент в аудио и проверь четыре аспекта речи.</li><li>Составь план и запиши ту же тему второй раз.</li><li>Ответь на новую тему, чтобы не ограничиться заученным ответом.</li></ol><p className={styles.note}>Микрофон включается только по отдельной кнопке после подготовки. Можно пройти самопроверку без аудиозаписи.</p><button type="button" className={styles.primary} onClick={begin}>Начать подготовку →</button></section> : <section className={styles.lesson} aria-labelledby="speaking-stage-title"><div className={styles.lessonTop}><button type="button" onClick={() => { pauseAudio(); cancelCapture(); setPhase('start'); setError(''); }}>← К началу</button><span>{takeIndex === 0 ? 'Первый ответ' : takeIndex === 1 ? 'Второй ответ · та же тема' : 'Новая тема'}</span></div><h2 id="speaking-stage-title" tabIndex={-1}>{phase === 'prepare' ? '1. Подготовь заметки' : phase === 'capture' ? '2. Ответь вслух' : phase === 'review' ? current?.url ? '3. Прослушай и проверь себя' : '3. Вспомни ответ и проверь себя' : phase === 'compare' ? 'Сравнение и следующий ответ' : 'Три попытки: что ты заметил'}</h2>
      {phase !== 'result' && <aside className={styles.prompt}><h3 lang="en">Describe: {prompt.title}</h3><ul lang="en">{prompt.bullets.map(bullet => <li key={bullet}>{bullet}</li>)}</ul></aside>}
      {phase === 'prepare' && <div className={styles.panel}><p className={styles.timer}>Подготовка: {timeLabel(remaining)}</p><label htmlFor="speaking-notes">Твои заметки: ключевые идеи, не готовый текст</label><textarea id="speaking-notes" value={notes} maxLength={3000} onChange={event => setNotes(event.target.value)}/>{takeIndex > 0 && takes[takeIndex - 1] && <p className={styles.saved}>План после предыдущего ответа: {takes[takeIndex - 1].plan}</p>}<button className={styles.primary} type="button" onClick={() => { clearClock(); setPhase('capture'); }}>Я готов к ответу →</button></div>}
      {phase === 'capture' && <div className={styles.panel}>{notes && <details><summary>Мои заметки</summary><p className={styles.saved}>{notes}</p></details>}{recording ? <><p className={styles.timer} role="status">Идёт запись · {timeLabel(elapsed)} / 2:00</p><p>Целевой лимит — две минуты. Можно закончить раньше; в фоновой вкладке браузер может задержать остановку.</p><button type="button" className={styles.primary} onClick={stopRecording}>Закончить запись</button></> : pending ? <><p role="status">Ожидаем решение о доступе к микрофону…</p><button type="button" onClick={cancelCapture}>Отменить запрос</button></> : <><p>Микрофон ещё не включён. Записывай ответ на английском без личных данных.</p><button type="button" className={styles.primary} onClick={startRecording}>Разрешить микрофон и начать запись</button><p className={styles.note}>Браузер спросит разрешение. Запись не покидает вкладку.</p><button type="button" className={styles.secondary} onClick={() => { setError(''); storeTake(blankTake(null, null)); }}>Самостоятельная попытка без аудио →</button><p className={styles.note}>В этом режиме ответь вслух самостоятельно, затем запиши наблюдения. Аудио и его длительность не измеряются.</p></>}</div>}
      {phase === 'review' && current && <div className={styles.panel}>{current.url ? <><audio ref={audio} src={current.url} controls preload="metadata" onPlay={event => pauseAudio(event.currentTarget)}/><p className={styles.note}>Поставь аудио на нужный момент; кнопка ниже сохранит текущую позицию проигрывания.</p></> : <p className={styles.saved}>Ответь вслух самостоятельно и вспомни, где было трудно. Это режим без аудиозаписи и таймкодов.</p>}<label htmlFor="speaking-marker-kind">Что заметил?</label><select id="speaking-marker-kind" value={kind} onChange={event => setKind(event.target.value)}>{markerKinds.map(value => <option key={value}>{value}</option>)}</select><label htmlFor="speaking-marker-note">Конкретный момент: слово, фраза или идея</label><textarea id="speaking-marker-note" value={markerNote} maxLength={1000} onChange={event => setMarkerNote(event.target.value)}/><button type="button" className={styles.secondary} onClick={addMarker}>{current.url ? 'Отметить текущий момент' : 'Добавить наблюдение без таймкода'}</button><ul>{current.markers.map(marker => <li key={marker.id}>{marker.second === null ? 'Без таймкода' : timeLabel(marker.second)} · {marker.kind}: {marker.note} <button type="button" aria-label={`Удалить наблюдение ${marker.id}`} onClick={() => updateTake({ markers: current.markers.filter(value => value.id !== marker.id) })}>Удалить</button></li>)}</ul><label className={styles.check}><input type="checkbox" checked={noMarkers} onChange={event => setNoMarkers(event.target.checked)}/>Не выделил отдельные моменты; всё равно проверю четыре аспекта</label><h3>Твоя самооценка, без балла</h3>{speakingCriteria.map((criterion, index) => <div key={criterion.name}><label htmlFor={`speaking-rating-${index}`}>{criterion.name}</label><p className={styles.note}>{criterion.help}</p><select id={`speaking-rating-${index}`} value={current.ratings[index]} onChange={event => { const ratings = [...current.ratings]; ratings[index] = event.target.value; updateTake({ ratings }); }}><option value="">Выбери своё наблюдение</option><option>Нужно поработать</option><option>Есть удачные и трудные места</option><option>Доволен этой попыткой</option></select></div>)}<label htmlFor="speaking-plan">План: что конкретно сделаешь в следующем ответе?</label><textarea id="speaking-plan" value={current.plan} maxLength={3000} onChange={event => updateTake({ plan: event.target.value })}/><label className={styles.check}><input type="checkbox" checked={current.confirmed} onChange={event => updateTake({ confirmed: event.target.checked })}/>{current.url ? 'Я прослушал запись и заполнил самопроверку' : 'Я ответил вслух самостоятельно и заполнил самопроверку'}</label><button type="button" className={styles.primary} onClick={finishReview}>Сохранить самопроверку →</button></div>}
      {phase === 'compare' && <><div className={styles.grid}>{takes.map(takeSummary)}</div><p className={styles.note}>Длительность записи, твои отметки и самооценка не являются оценкой качества. Меньше отметок или более длинный ответ сами по себе не означают улучшения.</p><button type="button" className={styles.primary} onClick={() => prepare(takeIndex === 0 ? 1 : 2)}>{takeIndex === 0 ? 'Повторить ту же тему по плану →' : 'Проверить себя на новой теме →'}</button></>}
      {phase === 'result' && <><div className={styles.grid}>{takes.map(takeSummary)}</div><p className={styles.note}>Повтор знакомой темы может стать легче из-за подготовки. Сравни с новой темой. Это наблюдения ученика, без AI-анализа пауз, произношения, грамматики или IELTS band.</p><button type="button" className={styles.primary} onClick={begin}>Начать заново →</button></>}
      {error && <p className={styles.warning} role="alert">{error}</p>}
    </section>}<p className={styles.note}>О формате и критериях: <a href="https://ielts.org/take-a-test/test-types/ielts-academic-test/ielts-academic-format-speaking" target="_blank" rel="noopener noreferrer">официальный IELTS Speaking ↗</a></p></main>;
}
