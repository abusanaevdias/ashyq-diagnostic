'use client';
import { gsap } from 'gsap';
import { useEffect, useLayoutEffect, useRef, type RefObject } from 'react';

type SceneMotion = { context: gsap.Context; tweens: gsap.core.Tween[] };

/** Retained scene poses, one GSAP clock, interruptible crossfades and independent idle motion. */
export function useFinaleMotion(root: RefObject<HTMLDivElement | null>, scene: number, enabled: boolean, active: boolean) {
  const groups = useRef(new Map<number, SceneMotion>());
  const selected = useRef({ scene, active });
  const transition = useRef<gsap.core.Timeline | null>(null);
  const previous = useRef<number | null>(null);
  const prepared = useRef(false);

  useEffect(() => {
    selected.current = { scene, active };
    groups.current.forEach((group, index) => group.tweens.forEach(tween => active && index === scene ? tween.resume() : tween.pause()));
    // A stopped presentation must leave one fully readable scene, never overlapping text.
    if (!active) transition.current?.progress(1).pause();
  }, [scene, active]);

  useEffect(() => {
    const node = root.current;
    if (!node || !enabled) return;
    const created = new Map<number, SceneMotion>();
    node.querySelectorAll<HTMLElement>('[data-film-scene]').forEach(layer => {
      const index = Number(layer.dataset.filmScene);
      const ctx = gsap.context(() => {
        if (layer.querySelector('[data-paper]')) gsap.to('[data-paper]', { y: i => i % 2 ? 8 : -8, rotation: i => i % 2 ? 3 : -3, duration: 2.8, stagger: .12, repeat: -1, yoyo: true, ease: 'sine.inOut' });
        if (layer.querySelector('[data-thread]')) gsap.to('[data-thread]', { x: 18, y: -8, rotation: 3, duration: 3.6, repeat: -1, yoyo: true, ease: 'sine.inOut' });
        if (layer.querySelector('[data-thread-light]')) gsap.to('[data-thread-light]', { strokeDashoffset: -600, duration: 9, repeat: -1, ease: 'none' });
        if (layer.querySelector('[data-proof-light]')) gsap.fromTo('[data-proof-light]', { xPercent: -100 }, { xPercent: 320, duration: 3, repeat: -1, ease: 'none' });
        gsap.to('[data-live-dot]', { scale: 1.55, opacity: .45, duration: 1.2, repeat: -1, yoyo: true, ease: 'sine.inOut' });
      }, layer);
      const tweens = ctx.getTweens() as gsap.core.Tween[];
      if (!selected.current.active || selected.current.scene !== index) tweens.forEach(tween => tween.pause());
      created.set(index, { context: ctx, tweens });
    });
    groups.current = created;
    return () => { created.forEach(group => group.context.revert()); groups.current = new Map(); };
  }, [root, enabled]);

  useLayoutEffect(() => {
    const node = root.current;
    if (!node) return;
    const layers = Array.from(node.querySelectorAll<HTMLElement>('[data-film-scene]'));
    const next = layers.find(layer => Number(layer.dataset.filmScene) === scene);
    transition.current?.kill();
    if (!next) return;
    if (!enabled) {
      gsap.set(layers, { clearProps: 'opacity,transform,visibility' });
      prepared.current = false;
      previous.current = scene;
      return;
    }
    if (!prepared.current || previous.current === null) {
      layers.forEach(layer => gsap.set(layer, { opacity: layer === next ? 1 : 0, y: 0, visibility: layer === next ? 'visible' : 'hidden' }));
      prepared.current = true;
      previous.current = scene;
      return;
    }
    const timeline = gsap.timeline();
    layers.filter(layer => layer !== next).forEach(layer => {
      timeline.to(layer, { opacity: 0, y: -14, duration: .32, ease: 'power2.inOut', onComplete: () => { gsap.set(layer, { visibility: 'hidden' }); } }, 0);
    });
    // Resume from the current rendered opacity/position when a click interrupts a transition.
    if (getComputedStyle(next).visibility === 'hidden') gsap.set(next, { opacity: 0, y: 18 });
    gsap.set(next, { visibility: 'visible' });
    timeline.to(next, { opacity: 1, y: 0, duration: .6, ease: 'power3.out' }, .32);
    transition.current = timeline;
    previous.current = scene;
    if (!selected.current.active) timeline.progress(1).pause();
    return () => { timeline.kill(); };
  }, [root, scene, enabled]);
}
