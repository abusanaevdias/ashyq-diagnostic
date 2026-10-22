'use client';

import { useState } from 'react';
import { trainerById } from '@/lib/trainers/catalog';
import { practiceNeeds } from '@/lib/trainers/journey';
import TrainerPracticeLink from './TrainerPracticeLink';
import styles from './LearnerJourney.module.css';

export default function PracticeGuide() {
  const [selected, setSelected] = useState<string | null>(null);
  const need = practiceNeeds.find(item => item.id === selected);
  const trainer = need && trainerById(need.trainer);
  return <section id="choose-practice" className={styles.panel} aria-labelledby="practice-guide-title">
    <p className={styles.label}>С ЧЕГО НАЧАТЬ</p><h2 id="practice-guide-title">Что хочешь улучшить?</h2>
    <p>Выбери знакомое затруднение. Мы предложим отправную точку — это выбор упражнения, а не оценка твоего уровня.</p>
    <div className={styles.choices}><label htmlFor="practice-need">Моё затруднение</label><select id="practice-need" value={selected ?? ''} aria-controls="practice-suggestion" onChange={event => setSelected(event.target.value)}><option value="" disabled>Выбери, что хочешь улучшить</option>{practiceNeeds.map(item => <option key={item.id} value={item.id}>{item.label}</option>)}</select></div>
    <div id="practice-suggestion" aria-live="polite" aria-atomic="true">{need && trainer ? <div className={styles.suggestion}>
      <p className={styles.label}>{trainer.exam} · {trainer.skill}</p><h3>{trainer.title}</h3><p>{need.why}</p>
      <TrainerPracticeLink className={styles.action} href={trainer.href}>Начать это упражнение →</TrainerPracticeLink>
      <p className={styles.note}>Сначала своя попытка → разбор → исправление → новый пример. Письменные ответы — на английском.</p>
    </div> : <p className={styles.note}>Можно пропустить выбор и посмотреть все тренажёры ниже.</p>}</div>
    <a className={styles.secondary} href="#all-trainers">Посмотреть весь каталог ↓</a>
  </section>;
}
