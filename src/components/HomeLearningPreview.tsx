'use client';
import Link from 'next/link';
import {useState} from 'react';
import styles from './HomeLearningPreview.module.css';

export default function HomeLearningPreview(){
 const [revealed,setRevealed]=useState(false);
 return <section className={styles.preview} aria-label="Учебный пример работы тренажёра">
  <span data-motion-outline data-motion-ambient="outline" aria-hidden="true"><svg width="100%" height="100%" focusable="false"><rect width="100%" height="100%" rx="28" pathLength="1" /></svg></span>
  <header data-motion-piece="heading" data-motion-ambient="piece"><strong>Сначала своя попытка. Затем понятный разбор.</strong><span>Короткий учебный пример</span></header>
  <div className={styles.grid}>
   <div><p className={styles.label}>IELTS WRITING · СОГЛАСОВАНИЕ</p><h2 data-motion-piece="heading" data-motion-ambient="piece">Одно предложение.<br/>Один понятный шаг.</h2><p className={styles.sentence} lang="en" data-motion-piece="copy" data-motion-ambient="piece">Natural talent <mark className={revealed?styles.fixed:undefined} data-motion-word data-preview-corrected={revealed} data-motion-ambient="word">{revealed?'makes':'make'}</mark> a difference,<br/>but regular practice helps people improve.</p><p className={styles.steps} data-motion-steps data-motion-ambient="steps"><span>1 · Заметь</span><span>2 · Исправь</span><span>3 · Попробуй снова</span></p></div>
   <aside className={styles.tip} data-motion-piece="explanation" data-motion-ambient="piece"><p className={styles.label}>{revealed?'ПОЧЕМУ MAKES':'ПОПРОБУЙ ЗАМЕТИТЬ САМ'}</p><h3>{revealed?'Найди главное слово':'Какую форму ты бы выбрал?'}</h3><p aria-live="polite">{revealed?'Главное слово talent — единственное число. В Present Simple здесь нужна форма makes. Во второй части подлежащее practice также требует helps.':'Прочитай предложение. Проверь, с каким словом согласуется глагол make, прежде чем открывать объяснение.'}</p><button type="button" aria-expanded={revealed} onClick={()=>setRevealed(v=>!v)}>{revealed?'Вернуться к своей попытке':'Показать объяснение'} <span aria-hidden="true">→</span></button><Link href="/trainers">Выбрать настоящий тренажёр →</Link></aside>
  </div>
 </section>;
}
