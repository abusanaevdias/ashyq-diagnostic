'use client';
import Link from 'next/link';
import { useEffect, useMemo, useState, useSyncExternalStore, type CSSProperties } from 'react';
import type { DiagnosticResult, RunState } from '@/lib/types';
import { diagnosticFinale } from '@/lib/diagnostic-profile/finale';
import ResultStoryShare from './ResultStoryShare';
import styles from './ResultFinale.module.css';
import { motionPaused, MOTION_PREFERENCE_EVENT } from '@/lib/motion-preference';

const subscribeMotion = (fn: () => void) => { const query = window.matchMedia('(prefers-reduced-motion: reduce)'); query.addEventListener('change', fn); return () => query.removeEventListener('change', fn); };
const subscribeVisibility = (fn: () => void) => { document.addEventListener('visibilitychange', fn); return () => document.removeEventListener('visibilitychange', fn); };
const subscribeGlobalMotion = (fn: () => void) => { window.addEventListener(MOTION_PREFERENCE_EVENT, fn); return () => window.removeEventListener(MOTION_PREFERENCE_EVENT, fn); };
const labels = ['Результат', 'Быстрый совет', 'Следующий шаг'];

export default function ResultFinale({ run, result, onReview }: { run: RunState; result: DiagnosticResult; onReview: () => void }) {
  const finale = useMemo(() => diagnosticFinale(run, result), [run, result]);
  const [step, setStep] = useState(0);
  const [playing, setPlaying] = useState(true);
  const [staticMode, setStaticMode] = useState(false);
  const reduced = useSyncExternalStore(subscribeMotion, () => window.matchMedia('(prefers-reduced-motion: reduce)').matches, () => true);
  const visible = useSyncExternalStore(subscribeVisibility, () => !document.hidden, () => true);
  const globallyPaused = useSyncExternalStore(subscribeGlobalMotion, motionPaused, () => true);
  const motion = !reduced && !staticMode && !globallyPaused;
  const autoplay = playing && motion && visible && step < 2;
  useEffect(() => {
    if (!autoplay) return;
    const timer = window.setTimeout(() => setStep(v => Math.min(v + 1, 2)), 7000);
    return () => clearTimeout(timer);
  }, [autoplay, step]);
  const choose = (index: number) => { setPlaying(false); setStep(index); };
  const rec = finale.recommendation;
  return <>
    <section className={styles.finale} aria-labelledby="finale-title">
      <div className={styles.intro}><p className={styles.eyebrow}>Твой персональный финал · {result.exam.toUpperCase()}</p><h1 id="finale-title" tabIndex={-1}>Твоя точка А.<br /><span>И следующий шаг.</span></h1><p>За 20 секунд — результат и один совет по твоим ответам.</p></div>
      <div className={styles.player} data-motion={motion ? 'full' : 'reduced'} data-paused={!playing} onFocusCapture={event => { if (!(event.target as HTMLElement).closest('[data-autoplay-control]')) setPlaying(false); }}>
        <div className={styles.playerTop}><span className={styles.eyebrow}>ASHYQ / {result.exam.toUpperCase()}</span><button type="button" className={styles.textButton} data-autoplay-control disabled={!motion} onClick={() => { if (step === 2) { setStep(0); setPlaying(true); } else setPlaying(v => !v); }}>{!motion ? 'Без автопоказа' : autoplay ? 'Пауза' : step === 2 ? 'Ещё раз' : 'Продолжить'}</button><button type="button" className={styles.textButton} onClick={onReview}>К разбору ↗</button></div>
        <nav className={styles.steps} aria-label="Шаги презентации результата">{labels.map((label, index) => <button type="button" key={label} aria-pressed={step === index} aria-label={`${label}, шаг ${index + 1} из 3`} onClick={() => choose(index)}><span className={styles.stepTrack}>{step === index && autoplay && <span className={styles.stepFill} key={`${step}-${playing}`} />}</span><span>{label}</span></button>)}</nav>
        <div className={styles.scene} key={step}>
          {step === 0 && <div className={styles.resultScene}>
            <div className={styles.scoreArt} aria-hidden="true"><svg viewBox="0 0 400 400"><circle cx="200" cy="200" r="174" className={styles.track} /><circle cx="200" cy="200" r="174" pathLength="100" className={styles.scoreArc} style={{ '--score': result.overallPercent } as CSSProperties} /></svg></div>
            <div className={styles.scoreCopy}><p className={styles.eyebrow}>{finale.noRange ? 'Пока без диапазона' : 'Предварительный диапазон'}</p><p className={styles.score}>{finale.noRange ? `${result.answeredQuestions} / ${result.totalQuestions}` : finale.band}</p><span className={styles.scoreUnderline} aria-hidden="true" /><p className={styles.caution}>{finale.caution}</p></div>
            <div className={styles.resultFacts}><span><strong>{result.totalCorrect}<small> / {result.totalQuestions}</small></strong>верных ответов</span><span><strong>{result.answeredQuestions}<small> / {result.totalQuestions}</small></strong>заданий отвечено</span></div>
            <p className={styles.scope}>{result.exam === 'ielts' ? 'Reading + Listening. Writing и Speaking здесь не оценены.' : 'Reading & Writing + Math. Это короткая диагностика.'}</p>
          </div>}
          {step === 1 && <div className={styles.tipScene}>
            <p className={styles.eyebrow}>{rec ? `Твой фокус · ${rec.label}` : 'Твой следующий ориентир'}</p><h2>{finale.title}</h2><p className={styles.tip}>{finale.tip}</p>
            <div className={styles.thoughtPath} aria-label="Как попробовать совет">{finale.tokens.map((token, index) => <span key={token}><b>{index + 1}</b>{token}</span>)}</div>
            <div className={styles.evidence}>{rec ? <><strong>Почему этот совет?</strong><p>Ошибки: {rec.wrong}. Пропуски: {rec.skipped}. Заданий по теме: {rec.total}.</p><p className={styles.note}>{rec.wrong === 0 ? 'Пропуск не доказывает слабый навык. Проверь тему в упражнении.' : 'Наблюдение по этой попытке, а не диагноз причины ошибки.'}{rec.limited ? ' Вопросов мало — проверь себя ещё раз.' : ''}</p></> : <p>Для этой попытки нет точного совпадения ошибки и тренажёра. Выбери навык сам; мы не будем придумывать слабую сторону.</p>}</div>
          </div>}
          {step === 2 && <div className={styles.nextScene}>
            <div className={styles.nextMark} aria-hidden="true">↗</div><p className={styles.eyebrow}>Один шаг. Уже сейчас.</p><h2>{finale.signal}</h2><p>{rec ? `Мы подобрали «${rec.item.title}». Сначала своя попытка, затем понятный разбор и новый пример.` : 'Каталог поможет выбрать короткое упражнение под твой экзамен.'}</p>
            <Link className={styles.primary} href={finale.href}>{finale.action} <span aria-hidden="true">→</span></Link>
            <a className={styles.textButton} href="#save-my-diagnostic">Сохранить результат в профиле →</a><p className={styles.note}>Практика бесплатна. Регистрация нужна для переноса результата в профиль; сохранение подтверждается отдельно.</p>
          </div>}
        </div>
        <div className={styles.controls}><div><button type="button" className={styles.control} disabled={step === 0} aria-label="Предыдущий шаг" onClick={() => choose(step - 1)}>←</button><button type="button" className={styles.control} aria-label={step === 2 ? 'Повторить презентацию' : 'Следующий шаг'} onClick={() => choose(step === 2 ? 0 : step + 1)}>{step === 2 ? '↺' : '→'}</button></div>
          <button type="button" className={styles.textButton} disabled={reduced} aria-pressed={staticMode || reduced} onClick={() => { setStaticMode(v => !v); setPlaying(false); }}>{reduced || staticMode ? 'Без движения' : 'Убрать движение'}</button>
        </div><p className={styles.srOnly} role="status">Шаг {step + 1} из 3: {labels[step]}</p>
      </div>
      <ResultStoryShare result={result} finale={finale} onOpen={() => setPlaying(false)} />
    </section>
  </>;
}
