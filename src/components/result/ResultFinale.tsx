'use client';
import Link from 'next/link';
import { useEffect, useMemo, useRef, useState, useSyncExternalStore, type CSSProperties } from 'react';
import type { DiagnosticResult, RunState } from '@/lib/types';
import { diagnosticFinale } from '@/lib/diagnostic-profile/finale';
import ResultStoryShare from './ResultStoryShare';
import FinaleArtwork from './FinaleArtwork';
import { useFinaleMotion } from './useFinaleMotion';
import styles from './ResultFinale.module.css';
import { motionPaused, MOTION_PREFERENCE_EVENT } from '@/lib/motion-preference';

const subscribeMotion = (fn: () => void) => { const query = window.matchMedia('(prefers-reduced-motion: reduce)'); query.addEventListener('change', fn); return () => query.removeEventListener('change', fn); };
const subscribeVisibility = (fn: () => void) => { document.addEventListener('visibilitychange', fn); return () => document.removeEventListener('visibilitychange', fn); };
const subscribeGlobalMotion = (fn: () => void) => { window.addEventListener(MOTION_PREFERENCE_EVENT, fn); return () => window.removeEventListener(MOTION_PREFERENCE_EVENT, fn); };
const labels = ['Результат', 'Сильные стороны', 'Точки роста', 'Твой маршрут'];

export default function ResultFinale({ run, result, onReview }: { run: RunState; result: DiagnosticResult; onReview: () => void }) {
  const finale = useMemo(() => diagnosticFinale(run, result), [run, result]);
  const [step, setStep] = useState(0);
  const [playing, setPlaying] = useState(true);
  const [staticMode, setStaticMode] = useState(false);
  const [motionStopped, setMotionStopped] = useState(false);
  const [inView, setInView] = useState(true);
  const playerRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const heading = playerRef.current?.closest('main')?.querySelector<HTMLElement>('#finale-title');
    heading?.focus({ preventScroll: true });
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [run.runId]);
  useEffect(() => {
    const node = playerRef.current;
    if (!node) return;
    const observer = new IntersectionObserver(([entry]) => setInView(entry.isIntersecting), { threshold: .05 });
    observer.observe(node);
    return () => observer.disconnect();
  }, []);
  const reduced = useSyncExternalStore(subscribeMotion, () => window.matchMedia('(prefers-reduced-motion: reduce)').matches, () => true);
  const visible = useSyncExternalStore(subscribeVisibility, () => !document.hidden, () => true);
  const globallyPaused = useSyncExternalStore(subscribeGlobalMotion, motionPaused, () => true);
  const motionAllowed = !reduced && !staticMode && !globallyPaused;
  const motion = motionAllowed && !motionStopped;
  const autoplay = playing && motion && visible && inView && step < 3;
  useFinaleMotion(playerRef, step, motionAllowed, visible && inView && !motionStopped);
  useEffect(() => {
    if (!autoplay) return;
    const timer = window.setTimeout(() => setStep(v => Math.min(v + 1, 3)), 6000);
    return () => clearTimeout(timer);
  }, [autoplay, step]);
  const choose = (index: number) => { setPlaying(false); setStep(index); };
  const rec = finale.recommendation;
  return <>
    <section className={styles.finale} aria-labelledby="finale-title">
      <div className={styles.srOnly}><p className={styles.eyebrow}>Твой персональный финал · {result.exam.toUpperCase()}</p><h1 id="finale-title" tabIndex={-1}>Твоя точка А. <span>И следующий шаг.</span></h1><p>Твои ответы складываются в маршрут.</p></div>
      <div ref={playerRef} className={styles.player} data-exam={result.exam} data-scene={step} data-motion={motion ? 'full' : 'reduced'} data-paused={!playing} onFocusCapture={event => { if (!(event.target as HTMLElement).closest('[data-autoplay-control]')) setPlaying(false); }}>
        <div className={styles.playerTop}><span className={styles.eyebrow}>ASHYQ / {result.exam.toUpperCase()}</span><button type="button" className={styles.textButton} data-autoplay-control disabled={reduced || globallyPaused || staticMode} aria-pressed={motionStopped} onClick={() => { setMotionStopped(v => !v); setPlaying(motionStopped); }}>{reduced || globallyPaused || staticMode ? 'Без движения' : motionStopped ? 'Включить движение' : 'Пауза'}</button><button type="button" className={styles.textButton} onClick={onReview}>К разбору ↗</button></div>
        <nav className={styles.steps} aria-label="Шаги презентации результата">{labels.map((label, index) => <button type="button" key={label} aria-pressed={step === index} aria-label={`${label}, шаг ${index + 1} из 4`} onClick={() => choose(index)}><span className={styles.stepTrack}>{step === index && autoplay && <span className={styles.stepFill} key={`${step}-${playing}`} />}</span><span>{['Результат', 'Опора', 'Фокус', 'Маршрут'][index]}</span></button>)}</nav>
        <div className={styles.scene} key={step}><div className={styles.chapterMeta}><span><i data-live-dot aria-hidden="true" />{['ТВОЯ ТОЧКА А', 'ТВОЯ ОПОРА', 'ТВОЙ ФОКУС', 'ТВОЙ МАРШРУТ'][step]}</span><span>0{step + 1} / 04</span></div>
          {step === 0 && <div className={styles.resultScene}>
            <div className={styles.scoreCopy} data-film-enter><p className={styles.eyebrow}>{finale.noRange ? 'Пока без диапазона' : 'Предварительный диапазон'}</p><p className={styles.score}>{finale.noRange ? `${result.answeredQuestions} / ${result.totalQuestions}` : finale.band}</p><span className={styles.examTag}>{result.exam.toUpperCase()} · КОРОТКАЯ ДИАГНОСТИКА</span><p className={styles.caution}>{finale.caution}</p><button type="button" className={styles.scoreAction} onClick={() => choose(2)}><span>Твой следующий фокус</span><b>{finale.focus} ↗</b></button></div>
            <FinaleArtwork result={result} />
            <div className={styles.resultFacts} data-film-enter><span><strong>{result.totalCorrect}<small> / {result.totalQuestions}</small></strong>верных ответов</span><span><strong>{result.answeredQuestions}<small> / {result.totalQuestions}</small></strong>заданий отвечено</span></div>
            <p className={styles.scope}>{result.exam === 'ielts' ? 'Reading + Listening. Writing и Speaking здесь не оценены.' : 'Reading & Writing + Math. Это короткая диагностика.'}</p>
          </div>}
          {step === 1 && <div className={styles.strengthScene}>
            <p data-film-enter className={styles.eyebrow}>{finale.strengths.length ? 'Уже получается' : 'Пока без поспешных выводов'}</p><h2 data-film-enter>{finale.strengths.length ? 'Вот на что можно опереться.' : 'Пока мало данных о сильных сторонах.'}</h2>
            <div className={styles.skillCards}>{finale.strengths.map((skill, index) => <article data-film-enter className={styles.skillCard} key={skill.label} style={{ '--delay': `${index * .18}s` } as CSSProperties}><span data-paper className={styles.skillIcon} aria-hidden="true">↗</span><h3>{skill.label}</h3><p><strong>{skill.correct} / {skill.answered}</strong> верно среди отвеченных</p><div className={styles.skillRail} aria-hidden="true"><span style={{ '--fill': `${skill.correct / skill.answered * 100}%` } as CSSProperties}><i data-proof-light /></span></div><small>{skill.total} задания в этой теме · наблюдение по этой попытке</small></article>)}</div>
            {!finale.strengths.length && <p className={styles.tip}>Нужно больше верных ответов по одной теме. Короткая попытка не показывает всех твоих возможностей.</p>}
            <p className={styles.note}>Это опора для практики, а не подтверждение устойчивого владения навыком.</p>
          </div>}
          {step === 2 && <div className={styles.tipScene}>
            <div className={styles.focusArt}><FinaleArtwork result={result} compact focusIds={rec?.evidence.filter(id => result.perQuestion.some(q => q.questionId === id && q.answered && !q.correct)) ?? result.perQuestion.filter(q => q.answered && !q.correct).map(q => q.questionId)} /></div>
            <div className={styles.growthChips}>{finale.growth.map(skill => <span key={skill.label}><b>Ошибок: {skill.wrong}</b> · {skill.label}<small>Отвечено {skill.answered} из {skill.total}</small></span>)}</div><p className={styles.eyebrow}>{rec ? `Твой фокус · ${rec.label}` : 'Твой следующий ориентир'}</p><h2 data-film-enter>{finale.title}</h2><p data-film-enter className={styles.tip}>{finale.tip}</p>
            <details className={styles.evidence} onToggle={event => { if (event.currentTarget.open) setPlaying(false); }}><summary>Почему этот совет?</summary>{rec ? <><p>Ошибки: {rec.wrong}. Пропуски: {rec.skipped}. Заданий по теме: {rec.total}.</p><p className={styles.note}>{rec.wrong === 0 ? 'Пропуск не доказывает слабый навык. Проверь тему в упражнении.' : 'Наблюдение по этой попытке, а не диагноз причины ошибки.'}{rec.limited ? ' Вопросов мало — проверь себя ещё раз.' : ''}</p></> : <p>Для этой попытки нет точного совпадения ошибки и тренажёра. Выбери навык сам; мы не будем придумывать слабую сторону.</p>}</details>
          </div>}
          {step === 3 && <div className={styles.nextScene}>
            <FinaleArtwork result={result} compact route /><p className={styles.eyebrow}>Один шаг. Уже сейчас.</p><h2 data-film-enter>{finale.signal}</h2><p>{rec ? `Мы подобрали «${rec.item.title}». Сначала своя попытка, затем понятный разбор и новый пример.` : 'Каталог поможет выбрать короткое упражнение под твой экзамен.'}</p>
            <Link className={styles.primary} href={finale.href}>{finale.action} <span aria-hidden="true">→</span></Link>
            <a className={styles.textButton} href="#save-my-diagnostic">Сохранить результат в профиле →</a><p className={styles.note}>Практика бесплатна. Регистрация нужна для переноса результата в профиль; сохранение подтверждается отдельно.</p>
          </div>}
        </div>
        <div className={styles.controls}><div><button type="button" className={styles.control} disabled={step === 0} aria-label="Предыдущий шаг" onClick={() => choose(step - 1)}>←</button><button type="button" className={styles.control} aria-label={step === 3 ? 'Повторить презентацию' : 'Следующий шаг'} onClick={() => { if (step === 3) { setStep(0); setPlaying(true); } else choose(step + 1); }}>{step === 3 ? '↺' : '→'}</button><span className={styles.controlHint}>{step === 3 ? 'Пересмотреть' : 'Следующий кадр'}</span></div>
          <button type="button" className={styles.textButton} disabled={reduced} aria-pressed={staticMode || reduced} onClick={() => { setStaticMode(v => !v); setPlaying(false); }}>{reduced || staticMode ? 'Без движения' : 'Убрать движение'}</button>
        </div><p className={styles.srOnly} role="status">Шаг {step + 1} из 4: {labels[step]}</p>
      </div>
      <ResultStoryShare result={result} finale={finale} onOpen={() => setPlaying(false)} />
    </section>
  </>;
}
