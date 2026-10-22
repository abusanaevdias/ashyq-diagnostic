'use client';

import Script from 'next/script';
import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { motionPaused, MOTION_PREFERENCE_EVENT } from '@/lib/motion-preference';
import { landPaths, projectPoint } from './globe-geometry';

type Target = object | string | Element | Element[] | NodeListOf<Element>;
type Vars = Record<string, unknown>;
interface Timeline { to(target: Target, vars: Vars, position?: number | string): Timeline; set(target: Target, vars: Vars, position?: number | string): Timeline; pause(): Timeline; play(): Timeline; kill(): void; }
interface Gsap { timeline(vars?: Vars): Timeline; to(target: Target, vars: Vars): Timeline; set(target: Target, vars: Vars): void; context(fn: () => void, scope?: Element): { revert(): void }; registerPlugin(plugin: unknown): void; }
interface Trigger { start: number; end: number; kill(reset?: boolean): void; }
interface ScrollPlugin { create(vars: Vars): Trigger; refresh(): void; }
type MotionWindow = Window & { gsap?: Gsap; ScrollTrigger?: ScrollPlugin };

/** One GSAP clock for the approved artwork. Native navigation and exercise state are untouched. */
export default function ApprovedMotion() {
  const pathname = usePathname();
  const [coreReady, setCoreReady] = useState(false), [scrollReady, setScrollReady] = useState(false);
  const used = pathname === '/' || pathname === '/diagnostic' || pathname === '/program' || pathname.startsWith('/courses') || pathname === '/mentoring' || pathname === '/all-inclusive';
  useEffect(() => {
    if (!used || !coreReady || !scrollReady) return;
    const root = document.querySelector<HTMLElement>('[data-public-design="051"]');
    const gs = (window as MotionWindow).gsap, plugin = (window as MotionWindow).ScrollTrigger;
    if (!root || !gs || !plugin || !('IntersectionObserver' in window)) return;
    gs.registerPlugin(plugin);
    const reduced = matchMedia('(prefers-reduced-motion: reduce)');
    const wide = matchMedia('(min-width: 1100px) and (min-height: 850px)');
    const loops = new Map<Element, { timeline: Timeline; visible: boolean; settle?: () => void }>();
    let scrollTween: Timeline | undefined, trigger: Trigger | undefined;
    const rail = root.querySelector<HTMLElement>('[data-service-rail]');
    const track = rail?.querySelector<HTMLElement>('[data-service-track]');
    const allowed = () => !motionPaused() && !document.hidden;
    const observer = new IntersectionObserver(entries => {
      for (const entry of entries) { const item = loops.get(entry.target); if (item) { item.visible = entry.isIntersecting; if (allowed() && item.visible) item.timeline.play(); else item.timeline.pause(); } }
    }, { threshold: .05 });
    const watch = (node: Element, timeline: Timeline, settle?: () => void) => { loops.set(node, { timeline, visible: false, settle }); observer.observe(node); };
    const ctx = gs.context(() => {
      root.querySelectorAll<HTMLElement>('[data-approved-art="ielts"]').forEach(node => {
        const front = node.querySelector('[data-paper="front"]'), back = node.querySelector('[data-paper="back"]');
        if (!front || !back) return;
        watch(node, gs.timeline({ paused: true, repeat: -1, yoyo: true }).to(front, { y: -17, rotate: 3, duration: 2.6, ease: 'sine.inOut' }, 0).to(back, { y: -9, rotate: -2, duration: 2.6, ease: 'sine.inOut' }, 0), () => gs.set([front, back], { clearProps: 'transform' }));
      });
      root.querySelectorAll<HTMLElement>('[data-approved-art="sat"]').forEach(node => {
        const marker = node.querySelector('[data-graph-marker]'); if (!marker) return;
        const cursor = { progress: .13 };
        const paint = () => { const t = cursor.progress; marker.setAttribute('transform', `translate(${30 + 480 * t + 60 * t * t} ${235 - 710 * t + 710 * t * t})`); };
        paint();
        watch(node, gs.timeline({ paused: true, repeat: -1, yoyo: true }).to(cursor, { progress: .95, duration: 3.2, ease: 'sine.inOut', onUpdate: paint }), () => { cursor.progress = .3; paint(); });
      });
      root.querySelectorAll<HTMLElement>('[data-approved-art="mentoring"]').forEach(node => {
        const layers = [...node.querySelectorAll<SVGPathElement>('[data-land-layer]')];
        const cities = [...node.querySelectorAll<SVGCircleElement>('[data-city-point]')];
        const cityPoints = [[-.2,.7,.68],[.4,.45,.79],[.7,.1,.7]], spin = { angle: -.45 }; let last = 0;
        const paint = (force = false) => {
          const now = performance.now(); if (!force && now - last < 33) return; last = now;
          const render = (dot: SVGCircleElement, point: number[]) => { const p = projectPoint(point, spin.angle); dot.setAttribute('cx', p.cx.toFixed(2)); dot.setAttribute('cy', p.cy.toFixed(2)); dot.setAttribute('opacity', p.opacity.toFixed(2)); };
          const paths = landPaths(spin.angle);
          layers.forEach((layer, i) => layer.setAttribute('d', paths[i])); cities.forEach((dot, i) => render(dot, cityPoints[i]));
        };
        watch(node, gs.timeline({ paused: true, repeat: -1 }).to(spin, { angle: -.45 + Math.PI * 2, duration: 26, ease: 'none', onUpdate: () => paint() }), () => { spin.angle = -.45; paint(true); });
      });
      root.querySelectorAll<HTMLElement>('[data-approved-scene]').forEach(node => {
        const front = node.querySelector('[data-hero-paper="front"]'), back = node.querySelector('[data-hero-paper="back"]');
        const rule = node.querySelector('[data-hero-rule]'), success = node.querySelector('[data-hero-success]');
        const wrong = node.querySelector('[data-scene-wrong]'), right = node.querySelector('[data-scene-right]');
        if (!front || !back || !rule || !success || !wrong || !right) return;
        const timeline = gs.timeline({ paused: true, repeat: -1, repeatDelay: 1.2 });
        timeline.to(front, { y: -14, rotate: 1.5, duration: 2, ease: 'sine.inOut' }, 0).to(back, { y: 12, rotate: -2, duration: 2, ease: 'sine.inOut' }, 0)
          .to(rule, { y: 8, rotate: -2, duration: 2, ease: 'sine.inOut' }, 0)
          .to(wrong, { opacity: 0, duration: .3 }, 1.2).to(right, { opacity: 1, duration: .3 }, 1.2)
          .to(success, { opacity: 1, y: -10, duration: 1, ease: 'sine.inOut' }, 1.4)
          .to(front, { y: 0, rotate: 0, duration: 2, ease: 'sine.inOut' }, 3.4).to(back, { y: 0, rotate: 0, duration: 2, ease: 'sine.inOut' }, 3.4)
          .to(rule, { y: 0, rotate: 0, duration: 2, ease: 'sine.inOut' }, 3.4).to(success, { y: 0, duration: 1.5, ease: 'sine.inOut' }, 3.4)
          .to(success, { opacity: 0, duration: .2 }, 5.4).to(right, { opacity: 0, duration: .2 }, 5.6).to(wrong, { opacity: 1, duration: .2 }, 5.6);
        watch(node, timeline, () => { gs.set([front, back, rule, success], { clearProps: 'transform' }); gs.set(success, { opacity: 1 }); gs.set(wrong, { opacity: 0 }); gs.set(right, { opacity: 1 }); });
      });
    }, root);
    const stopRail = () => { trigger?.kill(true); trigger = undefined; scrollTween?.kill(); scrollTween = undefined; if (rail) delete rail.dataset.scrollActive; if (track) gs.set(track, { clearProps: 'transform' }); };
    const updateRail = () => {
      stopRail();
      if (!rail || !track || !wide.matches || !allowed()) return;
      rail.dataset.scrollActive = 'true';
      if (rail.getBoundingClientRect().height + 110 > innerHeight) { delete rail.dataset.scrollActive; return; }
      const travel = () => Math.max(0, track.scrollWidth - rail.clientWidth);
      if (travel() < 20) { delete rail.dataset.scrollActive; return; }
      scrollTween = gs.to(track, { x: () => -travel(), ease: 'none', paused: true });
      trigger = plugin.create({ trigger: rail, start: 'top top', end: () => '+=' + Math.max(650, travel()), pin: true, scrub: .45, invalidateOnRefresh: true, animation: scrollTween });
    };
    const sync = () => {
      for (const item of loops.values()) { if (allowed() && item.visible) item.timeline.play(); else item.timeline.pause(); if (reduced.matches) item.settle?.(); }
      updateRail();
    };
    const focus = (e: FocusEvent) => {
      if (!trigger || !track || !(e.target instanceof HTMLElement)) return;
      const card = e.target.closest<HTMLElement>('[data-service-card]'); if (!card || !track.contains(card)) return;
      const ratio = Math.min(1, card.offsetLeft / Math.max(1, track.scrollWidth - (rail?.clientWidth || 0)));
      window.scrollTo({ top: trigger.start + ratio * (trigger.end - trigger.start), behavior: 'instant' });
    };
    const resize = () => updateRail();
    sync();
    window.addEventListener(MOTION_PREFERENCE_EVENT, sync); window.addEventListener('resize', resize);
    reduced.addEventListener('change', sync); wide.addEventListener('change', sync); document.addEventListener('visibilitychange', sync); root.addEventListener('focusin', focus);
    return () => { observer.disconnect(); stopRail(); for (const item of loops.values()) item.timeline.kill(); ctx.revert(); window.removeEventListener(MOTION_PREFERENCE_EVENT, sync); window.removeEventListener('resize', resize); reduced.removeEventListener('change', sync); wide.removeEventListener('change', sync); document.removeEventListener('visibilitychange', sync); root.removeEventListener('focusin', focus); };
  }, [pathname, used, coreReady, scrollReady]);
  if (!used) return null;
  return <><Script id="approved-gsap" src="/design/gsap.min.js" strategy="afterInteractive" onReady={() => setCoreReady(true)} /><Script id="approved-scroll" src="/design/ScrollTrigger.min.js" strategy="afterInteractive" onReady={() => setScrollReady(true)} /></>;
}
