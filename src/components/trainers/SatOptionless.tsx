'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { optionlessCases, type OptionlessItem } from '@/lib/sat-optionless/cases';
import styles from './SatOptionless.module.css';

type Attempt = { prediction: string; choiceIndex: number };
type Phase = 'choose' | 'predict' | 'options' | 'review' | 'result';
type Round = 'first' | 'transfer';

export default function SatOptionless() {
  const [caseIndex, setCaseIndex] = useState<number | null>(null);
  const [phase, setPhase] = useState<Phase>('choose');
  const [round, setRound] = useState<Round>('first');
  const [prediction, setPrediction] = useState('');
  const [choiceIndex, setChoiceIndex] = useState<number | null>(null);
  const [first, setFirst] = useState<Attempt | null>(null);
  const [transfer, setTransfer] = useState<Attempt | null>(null);
  const [error, setError] = useState('');
  const current = caseIndex === null ? null : optionlessCases[caseIndex];
  const item: OptionlessItem | null = current ? current[round] : null;

  useEffect(() => {
    if (phase !== 'choose') {
      const heading = document.getElementById('optionless-stage-title');
      heading?.scrollIntoView({ block: 'start' });
      heading?.focus({ preventScroll: true });
    }
  }, [phase, round, caseIndex]);

  function start(index: number) {
    setCaseIndex(index); setRound('first'); setPrediction(''); setChoiceIndex(null);
    setFirst(null); setTransfer(null); setError(''); setPhase('predict');
  }
  function commitPrediction() {
    if (!current) return;
    const minimum = current.predictionType === 'punctuation' ? 1 : current.predictionType === 'relation' || current.id === 'words' ? 3 : 12;
    if (prediction.trim().length < minimum) {
      setError(current.predictionType === 'punctuation' ? 'Впиши знак до просмотра вариантов.' : 'Сначала запиши свой прогноз. Он будет сохранён для сравнения.');
      return;
    }
    setError(''); setPhase('options');
  }
  function commitChoice() {
    if (choiceIndex === null) { setError('Выбери один из четырёх вариантов.'); return; }
    const attempt = { prediction: prediction.trim(), choiceIndex };
    if (round === 'first') { setFirst(attempt); setPhase('review'); }
    else { setTransfer(attempt); setPhase('result'); }
    setError('');
  }
  function nextRound() { setRound('transfer'); setPrediction(''); setChoiceIndex(null); setError(''); setPhase('predict'); }

  function predictionStatus(value: string, model: string) {
    if (!current) return '';
    if (current.predictionType === 'text') return 'Свободный прогноз не оценивался автоматически. Сравни его смысл с авторским ориентиром.';
    return value.trim().toLowerCase() === model.trim().toLowerCase() ? 'Прогноз совпал с авторским ориентиром.' : 'Прогноз отличается от авторского ориентира.';
  }

  return <main className={styles.page}>
    <div className={styles.topline}><Link href="/trainers">← Все тренажёры</Link><span>ASHYQ · SAT R&W LAB</span></div>
    <header className={styles.hero}><p className={styles.eyebrow}>SAT READING & WRITING · УЧЕБНЫЕ ПРИМЕРЫ</p><h1>Реши до вариантов</h1><p>Сначала запиши, что думаешь сам. Четыре варианта появятся только после этого. Сравни первый прогноз, выбранный ответ и новый пример того же навыка.</p></header>
    {phase === 'choose' && <section aria-labelledby="optionless-stage-title"><div className={styles.sectionHead}><h2 id="optionless-stage-title">Выбери навык</h2><p>Пять коротких авторских сценариев. Ответы хранятся только пока открыт экран.</p></div><div className={styles.caseGrid}>{optionlessCases.map((entry, index) => <article className={styles.caseCard} key={entry.id}><span>{entry.domain}</span><h3>{entry.title}</h3><p>Первый прогноз → варианты → разбор → новый вопрос.</p><button className={styles.primary} type="button" onClick={() => start(index)}>Начать →</button></article>)}</div></section>}
    {current && item && phase !== 'choose' && <section className={styles.lesson} aria-labelledby="optionless-stage-title">
      <div className={styles.lessonTop}><button type="button" onClick={() => { setCaseIndex(null); setPhase('choose'); window.scrollTo({ top: 0 }); }}>← К навыкам</button><span>{current.domain} · {current.title}</span></div>
      <div className={styles.progress} aria-label={round === 'first' ? 'Первый вопрос' : 'Новый вопрос'}><span style={{ width: round === 'first' ? '50%' : '100%' }} /></div>
      <h2 id="optionless-stage-title" tabIndex={-1}>{phase === 'predict' ? round === 'first' ? '1. Сначала свой прогноз' : '4. Новый прогноз без вариантов' : phase === 'options' ? round === 'first' ? '2. Теперь выбери вариант' : '5. Выбери ответ на новый вопрос' : phase === 'review' ? '3. Сравни прогноз и ответ' : '6. Разбери новый пример'}</h2>
      {(phase === 'predict' || phase === 'options') && <div className={styles.taskGrid}><section className={styles.passage}><p className={styles.miniLabel}>АВТОРСКИЙ SAT-STYLE ПРИМЕР</p><p lang="en">{item.passage}</p><h3 lang="en">{item.question}</h3></section><section className={styles.response}>
        {phase === 'predict' && <><p className={styles.miniLabel}>ВАРИАНТЫ ПОКА СКРЫТЫ</p><label className={styles.fieldLabel} htmlFor="optionless-prediction">{item.predictionPrompt}</label>
          {current.predictionType === 'relation' ? <select id="optionless-prediction" className={styles.input} value={prediction} onChange={(event) => setPrediction(event.target.value)}><option value="">Выбери логическую связь</option>{current.relationChoices?.map((value) => <option key={value} value={value}>{value}</option>)}</select> : current.predictionType === 'punctuation' ? <input id="optionless-prediction" className={styles.input} value={prediction} onChange={(event) => setPrediction(event.target.value)} maxLength={8} placeholder="Например, запятая: ," autoComplete="off" /> : <textarea id="optionless-prediction" className={styles.textarea} value={prediction} onChange={(event) => setPrediction(event.target.value)} placeholder="Запиши собственную мысль" />}
          <p className={styles.note}>После открытия вариантов прогноз нельзя изменить. Свободный текст не оценивается машиной.</p>{error && <p className={styles.error} role="alert">{error}</p>}<button type="button" className={styles.primary} onClick={commitPrediction}>Зафиксировать прогноз →</button></>}
        {phase === 'options' && <><p className={styles.miniLabel}>ТВОЙ ПРОГНОЗ</p><blockquote>{prediction}</blockquote><fieldset className={styles.choices}><legend>Теперь выбери SAT-style вариант</legend>{item.choices.map((choice, index) => <label key={`${index}-${choice}`} className={choiceIndex === index ? styles.choiceSelected : styles.choice}><input type="radio" name="optionless-choice" checked={choiceIndex === index} onChange={() => setChoiceIndex(index)} /><span>{'ABCD'[index]}.</span>{choice}</label>)}</fieldset>{error && <p className={styles.error} role="alert">{error}</p>}<button type="button" className={styles.primary} onClick={commitChoice}>Проверить выбор →</button></>}
      </section></div>}
      {phase === 'review' && first && <div className={styles.review}><div className={styles.compare}><div><span>ТВОЯ ПЕРВАЯ МЫСЛЬ</span><strong>{first.prediction}</strong><p>{predictionStatus(first.prediction, current.first.modelPrediction)}</p></div><div><span>ТВОЙ ВЫБОР И РАЗБОР</span><strong>{'ABCD'[first.choiceIndex]} · {current.first.choices[first.choiceIndex]}</strong><p>{first.choiceIndex === current.first.correctIndex ? 'Вариант верен.' : `Верный вариант: ${'ABCD'[current.first.correctIndex]} · ${current.first.choices[current.first.correctIndex]}.`}</p><p>{current.first.explanation}</p></div></div><div className={styles.model}><span>ОРИЕНТИР ДЛЯ ПРОГНОЗА</span><p>{current.first.modelPrediction}</p></div><button type="button" className={styles.primary} onClick={nextRound}>Проверить навык на новом тексте →</button></div>}
      {phase === 'result' && first && transfer && <div className={styles.review}><div className={styles.resultGrid}><div><span>ПЕРВЫЙ ВОПРОС</span><strong>{first.choiceIndex === current.first.correctIndex ? 'Выбор верен' : 'Выбор нужно пересмотреть'}</strong><p>Первый прогноз: {first.prediction}</p></div><div><span>НОВЫЙ ВОПРОС</span><strong>{transfer.choiceIndex === current.transfer.correctIndex ? 'Выбор верен' : 'Выбор нужно пересмотреть'}</strong><p>Прогноз: {transfer.prediction}</p></div></div><div className={styles.model}><span>РАЗБОР НОВОГО ВОПРОСА</span><p>Верный вариант: <b>{'ABCD'[current.transfer.correctIndex]} · {current.transfer.choices[current.transfer.correctIndex]}</b></p><p>{current.transfer.explanation}</p><p>Ориентир до вариантов: {current.transfer.modelPrediction}. {predictionStatus(transfer.prediction, current.transfer.modelPrediction)}</p></div><p className={styles.note}>Это авторские учебные вопросы. Свободные прогнозы не оцениваются автоматически; два выбора не равны баллу или прогнозу результата SAT.</p><div className={styles.actions}><button type="button" className={styles.primary} onClick={() => start(((caseIndex ?? 0) + 1) % optionlessCases.length)}>Другой навык →</button><Link href="/trainers">К тренажёрам</Link></div></div>}
    </section>}
  </main>;
}
