'use client';

import Script from 'next/script';
import { useEffect, useRef, useState } from 'react';
import { motionPaused, MOTION_PREFERENCE_EVENT } from '@/lib/motion-preference';
import MotionToggle from '../ui/MotionToggle';
import styles from './WritingTrainerLanding.module.css';

type Tween = { to(target: Element, vars: Record<string, unknown>, position?: string): Tween; play(): void; pause(): void; kill(): void };
type Gsap = { timeline(vars: Record<string, unknown>): Tween; set(target: Element | Element[], vars: Record<string, unknown>): void };
type ProofWindow = Window & { gsap?: Gsap };

export default function WritingRevisionProof() {
  const root = useRef<HTMLDivElement>(null);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    if ((window as ProofWindow).gsap) { setReady(true); return; }
    const script = document.querySelector('script[src="/design/gsap.min.js"]');
    const loaded = () => setReady(true);
    script?.addEventListener('load', loaded, { once: true });
    return () => script?.removeEventListener('load', loaded);
  }, []);
  useEffect(() => {
    const gs = (window as ProofWindow).gsap, node = root.current;
    if (!ready || !gs || !node) return;
    const old = node.querySelector('[data-proof-old]'), corrected = node.querySelector('[data-proof-corrected]'), line = node.querySelector('[data-proof-line]');
    if (!old || !corrected || !line) return;
    const reduced = matchMedia('(prefers-reduced-motion: reduce)');
    let visible = false, started = false, intro: Tween | undefined;
    const loop = gs.timeline({ paused: true, repeat: -1, yoyo: true }).to(line, { opacity: .4, duration: 1.6, ease: 'sine.inOut' });
    const staticFrame = () => { intro?.kill(); gs.set([old, corrected, line], { clearProps: 'transform,opacity' }); };
    const sync = () => {
      if (motionPaused()) { started = true; loop.pause(); staticFrame(); return; }
      if (!visible || document.hidden) { intro?.pause(); loop.pause(); return; }
      if (!started) {
        started = true;
        gs.set(old, { opacity: 1 }); gs.set(corrected, { opacity: 0 }); gs.set(line, { scaleX: 0, transformOrigin: 'left' });
        intro = gs.timeline({ onComplete: () => { if (visible && !document.hidden && !motionPaused()) loop.play(); } })
          .to(old, { opacity: 0, y: -8, duration: .35, ease: 'power2.in' })
          .to(corrected, { opacity: 1, y: 0, duration: .4, ease: 'power2.out' }, '-=.1')
          .to(line, { scaleX: 1, duration: .4, ease: 'power2.out' }, '-=.25');
      } else { intro?.play(); loop.play(); }
    };
    const observer = 'IntersectionObserver' in window ? new IntersectionObserver(entries => { visible = entries[0].isIntersecting; sync(); }, { threshold: .15 }) : null;
    observer?.observe(node);
    window.addEventListener(MOTION_PREFERENCE_EVENT, sync); document.addEventListener('visibilitychange', sync); reduced.addEventListener('change', sync);
    return () => { observer?.disconnect(); intro?.kill(); loop.kill(); staticFrame(); window.removeEventListener(MOTION_PREFERENCE_EVENT, sync); document.removeEventListener('visibilitychange', sync); reduced.removeEventListener('change', sync); };
  }, [ready]);
  return <div className={styles.proofColumn} ref={root}>
    <Script id="approved-gsap" src="/design/gsap.min.js" strategy="afterInteractive" onReady={() => setReady(true)} />
    <figure className={styles.proof} aria-labelledby="proof-title">
      <figcaption id="proof-title" className={styles.proofLabel}>Как работает правка</figcaption>
      <p className={styles.sentence} lang="en">Daily practice<br /><span className={styles.word}><span data-proof-corrected>helps</span><span className={styles.oldWord} data-proof-old aria-hidden="true">help</span></span> students<br />improve.</p>
      <p className={styles.revision}><strong>Исправлено:</strong> <span lang="en">help → helps</span><span className={styles.editLine} data-proof-line aria-hidden="true" /></p>
      <div className={styles.rule}><p className={styles.eyebrow}>ПОЧЕМУ ТАК</p><p><span lang="en">Practice</span> — единственное число. Поэтому <span lang="en">helps</span>.</p></div>
    </figure>
    <p className={styles.proofNote}>Схема для знакомства, не ответ к учебному эссе.</p>
    <div className={styles.motion}><MotionToggle /></div>
  </div>;
}
