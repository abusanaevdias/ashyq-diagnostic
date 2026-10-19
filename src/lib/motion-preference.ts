export const MOTION_PREFERENCE_KEY = 'ashyq:motion-paused:v1';
export const MOTION_PREFERENCE_EVENT = 'ashyq:motion-preference';

export function motionPaused() {
  return document.documentElement.dataset.motionPaused === 'true' || matchMedia('(prefers-reduced-motion: reduce)').matches;
}

export function setMotionPaused(paused: boolean) {
  document.documentElement.dataset.motionPaused = String(paused);
  try { localStorage.setItem(MOTION_PREFERENCE_KEY, paused ? '1' : '0'); } catch { /* Session-only preference still works. */ }
  window.dispatchEvent(new Event(MOTION_PREFERENCE_EVENT));
}
