'use client';

import { useSyncExternalStore } from 'react';
import { MOTION_PREFERENCE_EVENT, motionPaused, setMotionPaused } from '@/lib/motion-preference';

function subscribe(update: () => void) {
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  window.addEventListener(MOTION_PREFERENCE_EVENT, update);
  reduced.addEventListener('change', update);
  return () => { window.removeEventListener(MOTION_PREFERENCE_EVENT, update); reduced.removeEventListener('change', update); };
}

export default function MotionToggle() {
  const paused = useSyncExternalStore(subscribe, motionPaused, () => false);
  return <button type="button" data-motion-toggle aria-pressed={paused} onClick={() => setMotionPaused(!paused)}>
    <span aria-hidden="true">{paused ? '▶' : 'Ⅱ'}</span> {paused ? 'Анимация на паузе' : 'Пауза анимации'}
  </button>;
}
