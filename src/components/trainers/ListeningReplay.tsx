'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { answerMatches, answerTypes, diagnoses, helpLevels, listeningCases, maskedSegment, type ListeningItem } from '@/lib/listening-replay/cases';
import styles from './ListeningReplay.module.css';

type Phase = 'choose' | 'predict' | 'answer' | 'diagnose' | 'repair' | 'review' | 'result';
type Attempt = { answer: string; type: string; cue: string; confidence: string; diagnosis: string; level: number | null; repaired: string; textMode: boolean; textHelp: boolean; stopped: boolean };

export default function ListeningReplay() {
  const [caseIndex, setCaseIndex] = useState<number | null>(null);
  const [round, setRound] = useState<'first' | 'transfer'>('first');
  const [phase, setPhase] = useState<Phase>('choose');
  const [prediction, setPrediction] = useState('');
  const [cue, setCue] = useState('');
  const [answer, setAnswer] = useState('');
  const [confidence, setConfidence] = useState('');
  const [diagnosis, setDiagnosis] = useState('');
  const [repair, setRepair] = useState('');
  const [level, setLevel] = useState(0);
  const [attemptedLevel, setAttemptedLevel] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [textMode, setTextMode] = useState(false);
  const [textHelp, setTextHelp] = useState(false);
  const [stopped, setStopped] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [error, setError] = useState('');
  const [first, setFirst] = useState<Attempt | null>(null);
  const [transfer, setTransfer] = useState<Attempt | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const requestRef = useRef(0);
  const current = caseIndex === null ? null : listeningCases[caseIndex];
  const item = current?.[round];

  function stopAudio() {
    requestRef.current += 1;
    const audio = audioRef.current;
    if (audio) { audio.pause(); audio.onended = null; audio.onerror = null; }
    audioRef.current = null;
    setPlaying(false);
  }
  useEffect(() => () => { requestRef.current += 1; audioRef.current?.pause(); }, []);
  useEffect(() => {
    if (phase !== 'choose') {
      const heading = document.getElementById('listening-stage-title');
      heading?.scrollIntoView({ block: 'start' });
      heading?.focus({ preventScroll: true });
    }
  }, [phase, round, caseIndex, level]);

  function resetRound() {
    stopAudio(); setPrediction(''); setCue(''); setAnswer(''); setConfidence(''); setDiagnosis(''); setRepair(''); setLevel(0); setAttemptedLevel(false); setFeedback(''); setTextMode(false); setTextHelp(false); setStopped(false); setError(''); setPhase('predict');
  }
  function start(index: number) { setCaseIndex(index); setRound('first'); setFirst(null); setTransfer(null); resetRound(); }
  function canStart() {
    if (!prediction || !cue) { setError('Выбери ожидаемый тип ответа и слово-ориентир.'); return false; }
    setError(''); return true;
  }
  async function play(initial = false) {
    if (!item || playing || audioRef.current || (initial && !canStart())) return;
    stopAudio(); setError('');
    const request = ++requestRef.current;
    const audio = new Audio(`/audio/trainers/${item.id}${!initial && level === 1 ? '-segment' : ''}.wav`);
    audioRef.current = audio; setPlaying(true);
    audio.onended = () => { if (request !== requestRef.current) return; setPlaying(false); audioRef.current = null; if (initial) setPhase('answer'); };
    const failed = () => { if (request !== requestRef.current) return; setPlaying(false); audioRef.current = null; setError('Запись не удалось воспроизвести. Попробуй снова или открой текстовый режим. Неудачный запуск не считается прослушиванием.'); };
    audio.onerror = failed;
    try { await audio.play(); } catch { failed(); }
  }
  function textFallback() {
    if (phase === 'predict' && !canStart()) return;
    stopAudio(); setError('');
    if (phase === 'predict') { setTextMode(true); setPhase('answer'); }
    else { setTextHelp(true); setLevel(3); setAttemptedLevel(false); setFeedback(''); }
  }
  function stopInitial() { stopAudio(); setStopped(true); setPhase('answer'); }
  function commitAnswer() {
    if (!answer.trim() || !confidence) { setError('Запиши одно слово и выбери уверенность.'); return; }
    setError(''); setPhase('diagnose');
  }
  function save(repaired: string, help: number | null) {
    const attempt = { answer, type: prediction, cue, confidence, diagnosis, level: help, repaired, textMode, textHelp, stopped };
    if (round === 'first') { setFirst(attempt); setPhase('review'); }
    else { setTransfer(attempt); setPhase('result'); }
    stopAudio(); setError('');
  }
  function openRepair() {
    if (!item || !diagnosis) { setError('Отметь, что произошло, или выбери «Пока не знаю».'); return; }
    setError('');
    if (answerMatches(answer, item)) save(answer, null);
    else { setRepair(''); setLevel(textMode ? 3 : 0); setPhase('repair'); }
  }
  function checkRepair() {
    if (!item || !repair.trim()) { setError('Запиши исправленный ответ: одно слово.'); return; }
    setError(''); setAttemptedLevel(true);
    if (answerMatches(repair, item)) save(repair, level);
    else setFeedback(level < 3 ? 'Этот ответ пока не совпал с записью. Попробуй ещё раз или открой следующую помощь.' : `В записи ответ «${item.answer}». Проверь написание и форму слова, затем внеси правку.`);
  }
  function nextHelp() { stopAudio(); setLevel((value) => Math.min(3, value + 1)); setAttemptedLevel(false); setFeedback(''); setError(''); }

  function report(attempt: Attempt, source: ListeningItem) {
    return <div className={styles.report}>
      <p className={styles.miniLabel}>ТВОЯ ПЕРВАЯ ПОПЫТКА</p><p><strong>{attempt.answer}</strong> · {answerMatches(attempt.answer, source) ? 'совпала с записью' : 'потребовала исправления'} · уверенность: {attempt.confidence}</p>
      <p>Твой прогноз: {attempt.type}; ориентир: «{attempt.cue}». По вопросу ожидаем: {source.answerType}; «{source.cue}» помогает отслеживать нужную информацию.</p>
      <p>Самонаблюдение: {attempt.diagnosis}.</p>
      <p><strong>{attempt.level === null ? 'Ответ совпал с первой попытки.' : `${answerMatches(attempt.repaired, source) ? 'Ответ восстановлен' : 'Ответ пока не восстановлен'}: ${attempt.repaired}. Открытый уровень помощи: ${helpLevels[attempt.level]}.`}</strong></p>
      {attempt.textMode && <p className={styles.warning}>Первая попытка сделана в текстовом режиме: это чтение, а не проверка слуха.</p>}
      {attempt.stopped && <p className={styles.warning}>Первое прослушивание остановлено раньше конца: результат нельзя сравнивать с полным прослушиванием.</p>}
      {attempt.textHelp && <p className={styles.note}>Во время разбора использован переход к полному тексту из-за недоступного звука.</p>}
      <p className={styles.note}>Уровень показывает доступную помощь, а не доказывает, какая подсказка привела к исправлению.</p>
      <p className={styles.takeaway}>{source.explanation}</p><details><summary>Прочитать полную запись</summary><p lang="en">{source.transcript}</p></details>
    </div>;
  }

  return <main className={styles.page}>
    <div className={styles.topline}><Link href="/trainers">← Все тренажёры</Link><span>ASHYQ · LISTENING LAB</span></div>
    <header className={styles.hero}><p className={styles.eyebrow}>IELTS-STYLE · АВТОРСКИЕ ЗАПИСИ</p><h1>Услышь, где меняется ответ</h1><p>Предскажи тип ответа, послушай один раз и запиши услышанное. Затем восстанови ответ с постепенной помощью и попробуй новую запись.</p><p className={styles.note}>Короткий пилот с синтетическим английским голосом. Он не воспроизводит условия IELTS и не оценивает band. Ответы остаются в открытой вкладке.</p></header>
    {phase === 'choose' && <section><h2>Выбери навык</h2><div className={styles.caseGrid}>{listeningCases.map((entry, index) => <article className={styles.caseCard} key={entry.id}><h3>{entry.title}</h3><p>Две разные записи: первая попытка, разбор и новый пример.</p><button type="button" className={styles.primary} onClick={() => start(index)}>Начать →</button></article>)}</div></section>}
    {current && item && phase !== 'choose' && <section className={styles.lesson} aria-labelledby="listening-stage-title">
      <div className={styles.lessonTop}><button type="button" onClick={() => { stopAudio(); setPhase('choose'); setCaseIndex(null); window.scrollTo({top:0}); }}>← К выбору</button><span>{round === 'first' ? 'Первая запись' : 'Новая запись'} · {current.title}</span></div>
      <h2 id="listening-stage-title" tabIndex={-1}>{phase === 'predict' ? '1. Что ты ожидаешь услышать?' : phase === 'answer' ? '2. Запиши услышанный ответ' : phase === 'diagnose' ? '3. Что произошло во время попытки?' : phase === 'repair' ? '4. Восстанови ответ' : phase === 'review' ? '5. Сверь попытку с записью' : 'Результат двух разных записей'}</h2>
      {['predict','answer','diagnose','repair'].includes(phase) && <div className={styles.taskGrid}><section className={styles.passage}><p className={styles.miniLabel}>ЗАДАНИЕ · ONE WORD ONLY</p><h3 lang="en">{item.question}</h3><p>В ответе должно быть одно слово. Сначала прогноз — без текста записи.</p>{phase !== 'predict' && <p className={styles.note}>Прогноз зафиксирован: {prediction}. Ориентир: «{cue}».</p>}</section><section className={styles.response}>
        {phase === 'predict' && <><label htmlFor="listening-type">Какой тип ответа подходит в пропуск?</label><select id="listening-type" value={prediction} disabled={playing} onChange={(event) => setPrediction(event.target.value)}><option value="">Выбери тип</option>{answerTypes.map((value) => <option key={value}>{value}</option>)}</select><label htmlFor="listening-cue">Какое слово поможет отслеживать нужную информацию?</label><select id="listening-cue" value={cue} disabled={playing} onChange={(event) => setCue(event.target.value)}><option value="">Выбери ориентир</option>{item.cues.map((value) => <option key={value}>{value}</option>)}</select><p className={styles.note}>Проверь звук. После начала первое прослушивание нельзя повторить до фиксации ответа.</p>{playing ? <><p role="status">Запись воспроизводится…</p><button type="button" className={styles.secondary} onClick={stopInitial}>Остановить и перейти к ответу</button></> : <button type="button" className={styles.primary} onClick={() => void play(true)}>Слушать первую попытку →</button>}<button type="button" className={styles.textButton} disabled={playing} onClick={textFallback}>Не могу слушать: использовать текст</button></>}
        {phase === 'answer' && <>{textMode && <div className={styles.transcript}><p className={styles.miniLabel}>ТЕКСТОВЫЙ РЕЖИМ · НЕ ПРОВЕРКА СЛУХА</p><p lang="en">{item.transcript}</p></div>}{stopped && <p className={styles.warning}>Ты остановил запись раньше конца. Это будет отмечено в разборе.</p>}<label htmlFor="listening-answer">Твой ответ: одно слово</label><input id="listening-answer" value={answer} autoComplete="off" maxLength={60} onChange={(event) => setAnswer(event.target.value)} /><label htmlFor="listening-confidence">Насколько ты уверен?</label><select id="listening-confidence" value={confidence} onChange={(event) => setConfidence(event.target.value)}><option value="">Выбери уверенность</option>{['Низкая','Средняя','Высокая'].map((value) => <option key={value}>{value}</option>)}</select><button type="button" className={styles.primary} onClick={commitAnswer}>Зафиксировать ответ →</button></>}
        {phase === 'diagnose' && <><p>Твой ответ: <strong>{answer}</strong>. До разбора отметь, что заметил в своей попытке.</p><label htmlFor="listening-diagnosis">Что произошло?</label><select id="listening-diagnosis" value={diagnosis} onChange={(event) => setDiagnosis(event.target.value)}><option value="">Выбери наблюдение</option>{diagnoses.map((value) => <option key={value}>{value}</option>)}</select><p className={styles.note}>Это твоё самонаблюдение. Система не определяет причину ошибки автоматически.</p><button type="button" className={styles.primary} onClick={openRepair}>Перейти к проверке →</button></>}
        {phase === 'repair' && <><p className={styles.warning}>Первый ответ «{answer}» не совпал с записью. Попробуй восстановить его сам.</p><p className={styles.miniLabel}>ПОМОЩЬ {level + 1} ИЗ 4 · {helpLevels[level]}</p>{level < 2 && <><button type="button" className={styles.secondary} disabled={playing} onClick={() => void play()}>{playing ? 'Запись воспроизводится…' : level === 0 ? 'Послушать всю запись' : 'Послушать нужный фрагмент'}</button>{playing && <button type="button" className={styles.textButton} onClick={stopAudio}>Остановить запись</button>}<button type="button" className={styles.textButton} onClick={textFallback}>Звук недоступен: открыть текст</button></>}{level === 2 && <div className={styles.transcript}><p lang="en">{maskedSegment(item)}</p></div>}{level === 3 && <div className={styles.transcript}><p lang="en">{item.transcript}</p></div>}<label htmlFor="listening-repair">Исправленный ответ: одно слово</label><input id="listening-repair" value={repair} maxLength={60} autoComplete="off" onChange={(event) => setRepair(event.target.value)} /><button type="button" className={styles.primary} disabled={playing} onClick={checkRepair}>Проверить исправление →</button>{feedback && <p role="status" className={styles.warning}>{feedback}</p>}{attemptedLevel && level < 3 && <button type="button" className={styles.textButton} onClick={nextHelp}>Нужна следующая помощь →</button>}{level === 3 && attemptedLevel && <button type="button" className={styles.textButton} onClick={() => save(repair,3)}>Завершить с текущим ответом</button>}</>}
        {error && <p role="alert" className={styles.error}>{error}</p>}
      </section></div>}
      {phase === 'review' && first && <>{report(first,current.first)}<button type="button" className={styles.primary} onClick={() => { setRound('transfer'); resetRound(); }}>Попробовать новую запись →</button></>}
      {phase === 'result' && first && transfer && <><div className={styles.resultGrid}><section><h3>Первая запись</h3>{report(first,current.first)}</section><section><h3>Новая запись</h3>{report(transfer,current.transfer)}</section></div><p className={styles.note}>Две короткие записи не подтверждают устойчивый навык или рост балла IELTS. Сравни свои действия и попробуй другой сценарий.</p><button type="button" className={styles.primary} onClick={() => start(caseIndex === 0 ? 1 : 0)}>Другой навык →</button></>}
    </section>}
  </main>;
}
