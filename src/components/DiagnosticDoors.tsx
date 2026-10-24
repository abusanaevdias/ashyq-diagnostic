'use client';

import { useEffect, useRef, useState } from 'react';
import { EXAMS } from '@/lib/config';
import { continueLabel } from '@/lib/landing-continuation';
import { motionPaused, MOTION_PREFERENCE_EVENT } from '@/lib/motion-preference';
import type { ExamId, RunState } from '@/lib/types';
import { ArrowIcon } from './ui/CleanUi';
import MotionToggle from './ui/MotionToggle';
import styles from './DiagnosticDoors.module.css';

interface Timeline {
  to(target: object, vars: Record<string, unknown>): Timeline;
  play(): Timeline;
  pause(): Timeline;
  kill(): void;
}
interface EntryGsap { timeline(vars: Record<string, unknown>): Timeline; }
type EntryWindow = Window & { gsap?: EntryGsap };

const WAVE_HEIGHTS = [5, 10, 18, 28, 19, 13, 32, 43, 35, 22, 14, 9, 5, 9, 16, 29, 39, 30, 19, 12, 21, 33, 25, 17, 10, 6, 4];

function ReadingListeningArtwork() {
  return <div className={styles.ieltsArt} data-entry-art="ielts">
    <div className={styles.skill}>
      <span>Reading</span>
      <svg viewBox="0 0 440 68" preserveAspectRatio="none" aria-hidden="true" focusable="false">
        <g stroke="currentColor" strokeWidth="2" opacity=".8">
          <path d="M2 10H380M2 34H305M2 58H420" />
        </g>
        <rect data-entry-selection x="80" y="24" width="120" height="20" fill="currentColor" opacity=".35" />
        <path data-entry-caret d="M200 19V49" stroke="currentColor" strokeWidth="2" />
      </svg>
    </div>
    <div className={styles.skill}>
      <span>Listening</span>
      <svg viewBox="0 0 440 102" preserveAspectRatio="none" aria-hidden="true" focusable="false">
        <g stroke="currentColor" strokeWidth="3" strokeLinecap="round">
          {WAVE_HEIGHTS.map((height, index) => <line key={index} data-entry-wave x1={10 + index * 16} x2={10 + index * 16} y1={51 - height} y2={51 + height} />)}
        </g>
      </svg>
    </div>
  </div>;
}

function SatArtwork() {
  return <div className={styles.satArt} data-entry-art="sat" aria-hidden="true">
    <svg viewBox="0 0 480 230" focusable="false">
      <g stroke="currentColor" strokeWidth="1.5" fill="none" opacity=".75">
        <path d="M36 170H442M72 211V18" />
        <path d="m435 165 7 5-7 5M67 25l5-7 5 7" />
      </g>
      {/* The line stays complete. Only the separate marker moves along it. */}
      <path d="M36 185.07 416 26" stroke="var(--red)" strokeWidth="3" fill="none" />
      <g fill="currentColor"><circle cx="72" cy="170" r="4" /><circle cx="186.667" cy="122" r="4" /><circle cx="301.333" cy="74" r="4" /></g>
      <g data-entry-graph-marker transform="translate(133.92 144.08)">
        <circle r="12" fill="var(--red)" opacity=".2" />
        <circle r="6" fill="var(--red)" stroke="currentColor" strokeWidth="2" />
      </g>
      <text x="329" y="24" fill="currentColor" fontSize="19">y = 2x</text>
    </svg>
  </div>;
}

/** Entry-only artwork. All loops use the site's locally served GSAP clock. */
export default function DiagnosticDoors({ runs, onSelect }: {
  runs: Record<ExamId, RunState | null>;
  onSelect: (exam: ExamId) => void;
}) {
  const root = useRef<HTMLDivElement>(null);
  const [ready, setReady] = useState(false);

  // ApprovedMotion mounts before the doors and owns the one core script.
  // Also handle a core already loaded on another public page.
  useEffect(() => {
    if ((window as EntryWindow).gsap) { setReady(true); return; }
    const script = document.querySelector<HTMLScriptElement>('script[src="/design/gsap.min.js"]');
    const loaded = () => setReady(true);
    script?.addEventListener('load', loaded, { once: true });
    return () => script?.removeEventListener('load', loaded);
  }, []);

  useEffect(() => {
    const gsap = (window as EntryWindow).gsap;
    const element = root.current;
    if (!ready || !element || !gsap || !('IntersectionObserver' in window)) return;
    const reduced = matchMedia('(prefers-reduced-motion: reduce)');
    const loops = new Map<Element, { timeline: Timeline; visible: boolean }>();
    const allowed = () => !motionPaused() && !document.hidden;
    const sync = () => {
      for (const { timeline, visible } of loops.values()) {
        if (visible && allowed()) timeline.play(); else timeline.pause();
      }
    };
    const observer = new IntersectionObserver(entries => {
      for (const entry of entries) {
        const loop = loops.get(entry.target);
        if (loop) loop.visible = entry.isIntersecting;
      }
      sync();
    }, { threshold: .05 });

    element.querySelectorAll<HTMLElement>('[data-entry-art]').forEach(art => {
      let timeline: Timeline;
      if (art.dataset.entryArt === 'ielts') {
        const selection = art.querySelector('[data-entry-selection]');
        const caret = art.querySelector('[data-entry-caret]');
        const bars = [...art.querySelectorAll('[data-entry-wave]')];
        const clock = { phase: 0 };
        const paint = () => {
          const x = 80 + 105 * (1 - Math.cos(clock.phase)) / 2;
          selection?.setAttribute('x', x.toFixed(2));
          caret?.setAttribute('transform', `translate(${(x - 80).toFixed(2)} 0)`);
          bars.forEach((bar, index) => {
            const amplitude = WAVE_HEIGHTS[index] * (.7 + .3 * Math.sin(clock.phase * 2 + index * .65));
            bar.setAttribute('y1', (51 - amplitude).toFixed(2));
            bar.setAttribute('y2', (51 + amplitude).toFixed(2));
          });
        };
        timeline = gsap.timeline({ paused: true, repeat: -1 }).to(clock, { phase: Math.PI * 2, duration: 6.4, ease: 'none', onUpdate: paint });
      } else {
        const marker = art.querySelector('[data-entry-graph-marker]');
        const cursor = { progress: .18 };
        timeline = gsap.timeline({ paused: true, repeat: -1, yoyo: true }).to(cursor, {
          progress: .9, duration: 3.8, ease: 'sine.inOut',
          onUpdate: () => marker?.setAttribute('transform', `translate(${72 + 344 * cursor.progress} ${170 - 144 * cursor.progress})`),
        });
      }
      loops.set(art, { timeline, visible: false });
      observer.observe(art);
    });
    window.addEventListener(MOTION_PREFERENCE_EVENT, sync);
    document.addEventListener('visibilitychange', sync);
    reduced.addEventListener('change', sync);
    return () => {
      observer.disconnect();
      for (const { timeline } of loops.values()) timeline.kill();
      window.removeEventListener(MOTION_PREFERENCE_EVENT, sync);
      document.removeEventListener('visibilitychange', sync);
      reduced.removeEventListener('change', sync);
    };
  }, [ready]);

  return <div className={styles.doors} ref={root}>
    <div className={styles.conditions}>
      <p>Около 20 минут <span aria-hidden="true">·</span> Бесплатно <span aria-hidden="true">·</span> Без регистрации</p>
    </div>
    <div className={styles.panels} aria-label="Выберите диагностику">
      {(['ielts', 'sat'] as const).map(exam => {
        const saved = runs[exam];
        const continuation = saved ? continueLabel(saved) : null;
        const finished = Boolean(saved?.finished);
        const count = Object.values(EXAMS[exam].blueprint.perSection).reduce((sum, amount) => sum + (amount ?? 0), 0);
        const label = finished ? 'Посмотреть результат' : continuation ? 'Продолжить' : 'Начать';
        return <article key={exam} className={`${styles.panel} ${exam === 'ielts' ? styles.ielts : styles.sat}`}>
          <div className={styles.panelHead}>
            <p className={styles.eyebrow}>{exam === 'ielts' ? 'Английский' : 'Чтение и математика'}</p>
            <h2 className={styles.examTitle}>{EXAMS[exam].name}</h2>
            <p className={styles.scope}>{EXAMS[exam].sections.map(section => EXAMS[exam].sectionLabels[section]).join(' + ')}</p>
          </div>
          {exam === 'ielts' ? <ReadingListeningArtwork /> : <SatArtwork />}
          <div className={styles.panelFooter}>
            <p className={styles.count}>{count} вопросов</p>
            <button type="button" className={styles.start} onClick={() => onSelect(exam)} aria-label={`${finished ? 'Посмотреть результат' : continuation ? 'Продолжить диагностику' : 'Начать диагностику'} ${EXAMS[exam].name}`}>
              {label}{finished ? '' : ` ${EXAMS[exam].name}`}<ArrowIcon />
            </button>
          </div>
          {continuation ? <p className={styles.continuation}>{continuation} · на этом устройстве</p> : null}
        </article>;
      })}
    </div>
    <div className={styles.closing}>
      <p className={styles.disclaimer}>Результат — предварительная оценка по выбранным заданиям, не официальный балл IELTS или SAT и не прогноз экзаменационного результата. Writing и Speaking в IELTS здесь не оцениваются.</p>
      <div className={styles.motionControl}><MotionToggle /></div>
    </div>
  </div>;
}
