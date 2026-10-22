'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import styles from './ApprovedHome.module.css';

const KEY = 'ashyq:home-example:v1';
const options = ['help', 'helps', 'helping'];

export default function ApprovedPractice() {
  const [answer, setAnswer] = useState<string | null>(null), [ready, setReady] = useState(false), [review, setReview] = useState(false);
  useEffect(() => { try { const value = localStorage.getItem(KEY); if (value && options.includes(value)) { setAnswer(value); setReview(true); } } catch { /* The example remains usable without browser storage. */ } setReady(true); }, []);
  function choose(value: string) { setAnswer(value); setReview(true); if (ready) try { localStorage.setItem(KEY, value); } catch { /* Session-only answer. */ } }
  function retry() { setAnswer(null); setReview(false); try { localStorage.removeItem(KEY); } catch { /* Session-only answer. */ } }
  return <section id="practice" className={styles.practice} aria-labelledby="approved-practice-title">
    <div id="process" className={styles.practiceIntro}><p className={styles.eyebrow}>КАК ЭТО РАБОТАЕТ</p><h2 id="approved-practice-title">Знать ответ.<br />Понимать почему.</h2><p>Сначала находишь ошибку сам. Затем открываешь разбор и пробуешь ещё раз.</p><Link href="/trainers" className={styles.textLink}>Выбрать настоящий тренажёр <span aria-hidden="true">→</span></Link></div>
    <div className={styles.workbook}><div className={styles.workbookHead}><span>Короткий учебный пример</span><div role="group" aria-label="Этапы учебного примера"><button type="button" aria-pressed={!review} onClick={() => setReview(false)}>Твоя попытка</button><button type="button" aria-pressed={review} disabled={!answer} onClick={() => setReview(true)}>Разбор</button></div></div>
      <p className={styles.eyebrow}>IELTS WRITING · СОГЛАСОВАНИЕ</p>
      <p className={styles.sentence} lang="en">Regular practice <span className={review ? styles.corrected : undefined}>{review ? 'helps' : '___'}</span> students improve.</p>
      {!review ? <><p>Какая форма здесь подходит?</p><div className={styles.choices} role="group" aria-label="Выбери форму глагола">{options.map(value => <button type="button" key={value} onClick={() => choose(value)} aria-pressed={answer === value}>{value}</button>)}</div><p className={styles.fine}>После твоей попытки появится объяснение.</p></> : <div className={`${styles.feedback} ${answer === 'helps' ? styles.success : styles.correction}`} role="status"><strong>{answer === 'helps' ? '✓ Верно: helps' : '✕ Пока неверно. Нужна форма helps.'}</strong><p>Твой ответ: <b lang="en">{answer}</b>. Главное слово <b lang="en">practice</b> — единственное число. В Present Simple к <b lang="en">help</b> добавляется <b lang="en">-s</b>.</p><button type="button" onClick={retry}>Попробовать ещё раз <span aria-hidden="true">→</span></button></div>}
    </div>
  </section>;
}
