'use client';

import Script from 'next/script';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { motionPaused, MOTION_PREFERENCE_EVENT } from '@/lib/motion-preference';
import MotionToggle from '../ui/MotionToggle';
import styles from './LibraryEntry.module.css';

type Tween = { kill(): void };
type Clock = { to(target: Element, vars: Record<string, unknown>): Clock; play(): void; pause(): void; kill(): void };
type FolioGsap = { fromTo(target: Element, from: Record<string, unknown>, to: Record<string, unknown>): Tween; set(target: Element, vars: Record<string, unknown>): void; timeline(vars: Record<string, unknown>): Clock };
type FolioWindow = Window & { gsap?: FolioGsap };
const stages = [
  { id: 'example', name: 'Пример', title: 'Сначала прочитай эссе', text: 'Посмотри, как автор отвечает на вопрос о таланте и практике. Сравни разные версии одной работы.' },
  { id: 'review', name: 'Разбор', title: 'Пойми, что делает аргумент точнее', text: 'В разборе важно не просто увидеть удачную фразу, а понять связь между мыслью, объяснением и примером.' },
  { id: 'practice', name: 'Своя практика', title: 'Попробуй на новом вопросе', text: 'В материале будут задания для твоей попытки. Пиши ответы на английском, затем сравни с объяснениями.' },
] as const;

/** A format preview only: no chapter answers, progress or storage live here. */
export default function LibraryFolio() {
  const [active, setActive] = useState(1);
  const [ready, setReady] = useState(false);
  const root = useRef<HTMLElement>(null);
  useEffect(() => {
    if ((window as FolioWindow).gsap) { setReady(true); return; }
    const script = document.querySelector('script[src="/design/gsap.min.js"]');
    const loaded = () => setReady(true);
    script?.addEventListener('load', loaded, { once: true });
    return () => script?.removeEventListener('load', loaded);
  }, []);
  useEffect(() => {
    const node = root.current, gs = (window as FolioWindow).gsap;
    const panel = node?.querySelector<HTMLElement>('[data-folio-active="true"]');
    const line = node?.querySelector<HTMLElement>('[data-folio-line]');
    if (!ready || !node || !gs || !panel || !line) return;
    let visible = false, entered = false;
    let entrance: Tween | undefined;
    const reduced = matchMedia('(prefers-reduced-motion: reduce)');
    const loop = gs.timeline({ paused: true, repeat: -1, yoyo: true }).to(line, { scaleX: .6, transformOrigin: 'left center', duration: 2.4, ease: 'sine.inOut' });
    const sync = () => {
      if (visible && !document.hidden && !motionPaused()) {
        loop.play();
        if (!entered) { entered = true; entrance = gs.fromTo(panel, { y: 10, opacity: .65, clipPath: 'inset(10% 0 0 0)' }, { y: 0, opacity: 1, clipPath: 'inset(0% 0 0 0)', duration: .45, ease: 'power3.out' }); }
      } else { loop.pause(); entrance?.kill(); gs.set(panel, { clearProps: 'transform,opacity,clipPath' }); }
      if (motionPaused()) gs.set(line, { clearProps: 'transform' });
    };
    const observer = 'IntersectionObserver' in window ? new IntersectionObserver(entries => { visible = entries[0].isIntersecting; sync(); }, { threshold: .1 }) : null;
    observer?.observe(node);
    reduced.addEventListener('change', sync);
    document.addEventListener('visibilitychange', sync);
    window.addEventListener(MOTION_PREFERENCE_EVENT, sync);
    return () => { entrance?.kill(); loop.kill(); observer?.disconnect(); gs.set(panel, { clearProps: 'transform,opacity,clipPath' }); gs.set(line, { clearProps: 'transform' }); reduced.removeEventListener('change', sync); document.removeEventListener('visibilitychange', sync); window.removeEventListener(MOTION_PREFERENCE_EVENT, sync); };
  }, [active, ready]);
  return <>
    <Script id="approved-gsap" src="/design/gsap.min.js" strategy="afterInteractive" onReady={() => setReady(true)} />
    <section ref={root} className={styles.folio} aria-labelledby="folio-title">
      <div className={styles.folioCopy}><p className={styles.meta}>IELTS WRITING LAB / U02</p><h2 id="folio-title">Талант<br />или практика?</h2><p className={styles.summary}>Три версии эссе. Разбор изменений. Твоя попытка.</p></div>
      <div className={styles.folioBody}>
        <p className={styles.previewLabel}>Предпросмотр формата · ответы здесь не проверяются</p>
        <div className={styles.stages} role="group" aria-label="Предпросмотр этапов материала">{stages.map((stage, index) => <button type="button" id={`folio-choice-${stage.id}`} key={stage.id} aria-pressed={active === index} aria-controls={`folio-${stage.id}`} onClick={() => setActive(index)}><span aria-hidden="true">0{index + 1}</span>{stage.name}</button>)}</div>
        <div className={styles.previewStack}>{stages.map((stage, index) => <section key={stage.id} id={`folio-${stage.id}`} aria-labelledby={`folio-choice-${stage.id}`} aria-hidden={active !== index} inert={active !== index} className={styles.previewPanel} data-folio-active={active === index}>
          <p className={styles.meta}>{stage.title}</p>
          {stage.id === 'review' && <><p className={styles.snippet} lang="en">Practice builds lasting skills.</p><p className={styles.illustration}>Иллюстрация объяснения: покажи, как практика приводит к результату.</p></>}
          {stage.id !== 'review' && <p>{stage.text}</p>}
        </section>)}</div>
        <div className={styles.folioLine} aria-hidden="true"><span data-folio-line /></div>
        <Link className={styles.open} href="/library/u02-talent-practice">Открыть материал<span aria-hidden="true">→</span></Link>
        <p className={styles.free}>Бесплатно · без регистрации</p>
      </div>
    </section>
    <div className={styles.folioFoot}><Link href="/library/start">Как работать с библиотекой ↗</Link><Link href="/library/lab-method">Учебные ориентиры ↗</Link><MotionToggle /></div>
  </>;
}
