'use client';
import { gsap } from 'gsap';
import { useEffect, useRef, type RefObject } from 'react';

/** One scoped clock; pause retains material positions, static mode restores readable DOM. */
export function useFinaleMotion(root: RefObject<HTMLDivElement | null>, scene: number, enabled: boolean, active: boolean) {
  const tweensRef = useRef<gsap.core.Tween[]>([]);
  const activeRef = useRef(active);
  useEffect(() => {
    activeRef.current = active;
    tweensRef.current.forEach(tween => active ? tween.resume() : tween.pause());
  }, [active]);
  useEffect(() => {
    const node = root.current;
    if (!node || !enabled) return;
    const ctx = gsap.context(() => {
      // Main text stays fully readable when paused; entrance travels without hiding evidence.
      gsap.from('[data-film-enter]', { y: 24, duration: .85, stagger: .07, ease: 'power3.out', clearProps: 'transform' });
      if (node.querySelector('[data-paper]')) gsap.to('[data-paper]', { y: i => i % 2 ? 8 : -8, rotation: i => i % 2 ? 3 : -3, duration: 2.8, stagger: .12, repeat: -1, yoyo: true, ease: 'sine.inOut' });
      if (node.querySelector('[data-thread]')) gsap.to('[data-thread]', { x: 18, y: -8, rotation: 3, duration: 3.6, repeat: -1, yoyo: true, ease: 'sine.inOut' });
      if (node.querySelector('[data-thread-light]')) gsap.to('[data-thread-light]', { strokeDashoffset: -600, duration: 9, repeat: -1, ease: 'none' });
      if (node.querySelector('[data-proof-light]')) gsap.fromTo('[data-proof-light]', { xPercent: -100 }, { xPercent: 320, duration: 3, repeat: -1, ease: 'none' });
      if (node.querySelector('[data-live-dot]')) gsap.to('[data-live-dot]', { scale: 1.55, opacity: .45, duration: 1.2, repeat: -1, yoyo: true, ease: 'sine.inOut' });
    }, node);
    tweensRef.current = ctx.getTweens() as gsap.core.Tween[];
    if (!activeRef.current) tweensRef.current.forEach(tween => tween.pause());
    return () => { tweensRef.current = []; ctx.revert(); };
  }, [root, scene, enabled]);
}
