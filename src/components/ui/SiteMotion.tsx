'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import './SiteMotion.css';

const PUBLIC_PRESENTATION_PAGES = new Set([
  '/', '/courses', '/courses/ielts', '/courses/sat', '/mentoring', '/about',
  '/program', '/community', '/season', '/faq', '/contacts', '/press',
  '/diagnostic', '/career', '/progress', '/library', '/trainers',
]);

/** Additive, opt-in presentation only. No content is hidden while waiting for JS or a viewport event. */
export default function SiteMotion() {
  const pathname = usePathname();
  useEffect(() => {
    if (!PUBLIC_PRESENTATION_PAGES.has(pathname)) return;
    const reduced = matchMedia('(prefers-reduced-motion: reduce)');
    if (!('IntersectionObserver' in window) || !Element.prototype.animate) return;
    const seen = new WeakSet<Element>();
    const registered = new WeakSet<Element>();
    const running = new Map<HTMLElement, Animation>();
    const finish = (node: HTMLElement) => {
      const animation = running.get(node);
      if (animation) { animation.cancel(); running.delete(node); }
    };
    const observer = new IntersectionObserver(entries => {
      let order = 0;
      for (const entry of entries) {
        if (!entry.isIntersecting || !(entry.target instanceof HTMLElement)) continue;
        const node = entry.target;
        observer.unobserve(node);
        if (seen.has(node)) continue;
        seen.add(node);
        if (reduced.matches || node.contains(document.activeElement) || node.getBoundingClientRect().top < 80) continue;
        const animation = node.animate([
          { opacity: .4, transform: 'translateY(14px)' },
          { opacity: 1, transform: 'translateY(0)' },
        ], { duration: 520, delay: Math.min(order++ * 55, 165), easing: 'cubic-bezier(.2,.75,.25,1)', fill: 'backwards' });
        running.set(node, animation);
        animation.onfinish = () => running.delete(node);
      }
    }, { threshold: 0, rootMargin: '0px 0px -20px 0px' });
    const register = () => document.querySelectorAll<HTMLElement>('[data-motion-reveal]').forEach(node => {
      if (registered.has(node)) return;
      registered.add(node);
      // First-screen content and restored scroll positions remain visually stable.
      const bounds = node.getBoundingClientRect();
      if (bounds.top < innerHeight && bounds.bottom > 0) { seen.add(node); return; }
      observer.observe(node);
    });
    register();
    const mutations = new MutationObserver(register);
    mutations.observe(document.body, { childList: true, subtree: true });
    const stop = () => { for (const node of running.keys()) finish(node); };
    const focus = (event: FocusEvent) => {
      if (!(event.target instanceof Element)) return;
      const node = event.target.closest<HTMLElement>('[data-motion-reveal]');
      if (node) { seen.add(node); observer.unobserve(node); finish(node); }
    };
    const preference = () => { if (reduced.matches) stop(); };
    const visibility = () => { if (document.hidden) stop(); };
    reduced.addEventListener('change', preference);
    document.addEventListener('focusin', focus);
    document.addEventListener('visibilitychange', visibility);
    window.addEventListener('beforeprint', stop);
    return () => {
      observer.disconnect(); mutations.disconnect(); stop();
      reduced.removeEventListener('change', preference);
      document.removeEventListener('focusin', focus);
      document.removeEventListener('visibilitychange', visibility);
      window.removeEventListener('beforeprint', stop);
    };
  }, [pathname]);
  return null;
}
