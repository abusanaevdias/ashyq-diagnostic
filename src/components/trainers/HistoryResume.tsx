'use client';

import Script from 'next/script';
import { useEffect, useRef, useState } from 'react';
import type { Snapshot } from '@/lib/trainers/checkpoints';
import type { trainerCatalog } from '@/lib/trainers/catalog';
import { checkpointStage } from '@/lib/trainers/journey';
import { motionPaused, MOTION_PREFERENCE_EVENT } from '@/lib/motion-preference';
import TrainerPracticeLink from './TrainerPracticeLink';
import MotionToggle from '../ui/MotionToggle';
import styles from './TrainerHistory.module.css';

type Step = { label: string; phases: string[] };
const rails: Partial<Record<typeof trainerCatalog[number]['id'], Step[]>> = {
  'reading-evidence': [{ label: 'Попытка', phases: ['first'] }, { label: 'Разбор', phases: ['review'] }, { label: 'Правка', phases: ['repair'] }, { label: 'Новый текст', phases: ['transfer'] }],
  'writing-task2': [{ label: 'Грамматика', phases: ['grammar'] }, { label: 'Аргументы', phases: ['task'] }, { label: 'Связность', phases: ['coherence'] }, { label: 'Лексика', phases: ['lexical'] }],
  'sat-translation': [{ label: 'Модель', phases: ['model'] }, { label: 'Расчёт', phases: ['calculate'] }, { label: 'Разбор', phases: ['review'] }],
  'math-method-switch': [{ label: 'Решение', phases: ['solve'] }, { label: 'Сравнение', phases: ['review'] }],
  'speaking-second-take': [{ label: 'Подготовка', phases: ['prepare'] }, { label: 'Запись', phases: ['capture'] }, { label: 'Самопроверка', phases: ['review'] }, { label: 'Сравнение', phases: ['compare'] }],
};

export function savedStage(data: Snapshot): string {
  if (typeof data.mode === 'string') return ({ combine: 'Объединение предложений', grammar: 'Грамматика', argument: 'Развитие аргумента' } as Record<string, string>)[data.mode] ?? checkpointStage(data);
  const round = data.round === 1 || data.round === 'transfer' ? 'Новый пример · ' : '';
  const take = typeof data.takeIndex === 'number' ? `Ответ ${data.takeIndex + 1} · ` : '';
  return `${round}${take}${checkpointStage(data)}`;
}

type Timeline = { to(target: Element, vars: Record<string, unknown>): Timeline; play(): void; pause(): void; kill(): void };
type HistoryGsap = { timeline(vars: Record<string, unknown>): Timeline; set(target: Element, vars: Record<string, unknown>): void };
type HistoryWindow = Window & { gsap?: HistoryGsap };

export default function HistoryResume({ item, data }: { item: typeof trainerCatalog[number]; data: Snapshot }) {
  const [ready, setReady] = useState(false);
  const root = useRef<HTMLElement>(null);
  const phase = (data.session as Snapshot | undefined)?.stage ?? data.phase;
  const steps = rails[item.id];
  const current = steps?.findIndex(step => step.phases.includes(String(phase))) ?? -1;
  const first = item.id === 'reading-evidence' ? data.first as Snapshot | null : null;
  const answer = first && ['TRUE', 'FALSE', 'NOT GIVEN'].includes(String(first.answer)) ? String(first.answer) : null;
  useEffect(() => {
    if ((window as HistoryWindow).gsap) { setReady(true); return; }
    const script = document.querySelector('script[src="/design/gsap.min.js"]');
    const loaded = () => setReady(true);
    script?.addEventListener('load', loaded, { once: true });
    return () => script?.removeEventListener('load', loaded);
  }, []);
  useEffect(() => {
    const gs = (window as HistoryWindow).gsap, node = root.current;
    const marker = node?.querySelector('[data-history-marker]');
    if (!ready || !gs || !node || !marker) return;
    const reduced = matchMedia('(prefers-reduced-motion: reduce)');
    let visible = false;
    const loop = gs.timeline({ paused: true, repeat: -1, yoyo: true }).to(marker, { scale: 1.18, duration: 1.7, ease: 'sine.inOut', transformOrigin: 'center' });
    const sync = () => { if (visible && !document.hidden && !motionPaused()) loop.play(); else loop.pause(); if (motionPaused()) gs.set(marker, { clearProps: 'transform' }); };
    const observer = 'IntersectionObserver' in window ? new IntersectionObserver(entries => { visible = entries[0].isIntersecting; sync(); }, { threshold: .1 }) : null;
    observer?.observe(node);
    window.addEventListener(MOTION_PREFERENCE_EVENT, sync); document.addEventListener('visibilitychange', sync); reduced.addEventListener('change', sync);
    return () => { observer?.disconnect(); loop.kill(); gs.set(marker, { clearProps: 'transform' }); window.removeEventListener(MOTION_PREFERENCE_EVENT, sync); document.removeEventListener('visibilitychange', sync); reduced.removeEventListener('change', sync); };
  }, [ready, item.id, current]);
  return <>
    <Script id="approved-gsap" src="/design/gsap.min.js" strategy="afterInteractive" onReady={() => setReady(true)} />
    <section className={styles.resume} ref={root} aria-labelledby="history-resume-title">
      <p className={styles.meta}>Незавершённое занятие · {item.exam} / {item.skill}</p>
      <p className={styles.resumeIntro}>Продолжим с этого места</p>
      <h2 id="history-resume-title">{item.title}</h2>
      <p className={styles.stageCaption}>Сохранённый этап: {savedStage(data)}</p>
      {steps && current >= 0 ? <ol className={styles.rail} aria-label="Этапы сохранённого занятия">{steps.map((step, index) => <li key={step.label} aria-current={index === current ? 'step' : undefined}><span className={styles.stepDot} data-history-marker={index === current ? '' : undefined} aria-hidden="true" />{step.label}</li>)}</ol> : <p className={styles.bookmark}><span data-history-marker aria-hidden="true" />Работа сохранена на указанном этапе</p>}
      {answer && <div className={styles.answerPreview}><p>Твой ответ в первой попытке</p><strong>{answer}</strong><p>Проверку ответа и опору в тексте можно посмотреть в разборе занятия.</p></div>}
      <TrainerPracticeLink className={styles.primary} href={`${item.href}#saved-work`}>Открыть сохранённое<span aria-hidden="true">→</span></TrainerPracticeLink>
      <p className={styles.restoreHint}>В тренажёре нажми «Продолжить сохранённую». Текущая работа заменится после твоего подтверждения.</p>
    </section>
    <div className={styles.motion}><MotionToggle /></div>
  </>;
}
