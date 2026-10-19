'use client';

import { useEffect, useRef, type ReactNode } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import styles from './CleanUi.module.css';

/** Native details stays usable before hydration; navigation is not a modal. */
export function MobileNavMenu({ children }: { children: ReactNode }) {
  const menuRef = useRef<HTMLDetailsElement>(null);
  const closeRef = useRef<(immediate?: boolean) => void>(() => {});
  const linkCloseTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const toggleRef = useRef<(() => void) | null>(null);
  const pathname = usePathname();
  useEffect(() => {
    const menu = menuRef.current;
    const panel = menu?.querySelector<HTMLElement>('[data-menu-panel]');
    if (!menu || !panel) return;
    const reduced = matchMedia('(prefers-reduced-motion: reduce)');
    const state = { value: menu.open ? 1 : 0, velocity: 0, target: menu.open ? 1 : 0, frame: 0, last: 0 };
    let focusFrame = 0;
    const paint = () => {
      panel.style.opacity = String(Math.max(0, Math.min(1, state.value)));
      panel.style.transform = `translateY(${(1 - state.value) * -12}px) scale(${.985 + .015 * state.value})`;
    };
    const settle = () => {
      cancelAnimationFrame(state.frame); state.frame = 0; state.last = 0;
      state.value = state.target; state.velocity = 0;
      menu.open = state.target === 1;
      panel.inert = !menu.open;
      panel.style.removeProperty('opacity'); panel.style.removeProperty('transform'); panel.style.removeProperty('will-change');
    };
    const tick = (time: number) => {
      const dt = state.last ? Math.min((time - state.last) / 1000, .032) : 1 / 60;
      state.last = time;
      const stiffness = 380, damping = 2 * Math.sqrt(stiffness);
      state.velocity += (stiffness * (state.target - state.value) - damping * state.velocity) * dt;
      state.value += state.velocity * dt; paint();
      if (Math.abs(state.target - state.value) + Math.abs(state.velocity) < .006) settle();
      else state.frame = requestAnimationFrame(tick);
    };
    const setTarget = (target: number, immediate = false) => {
      if (target === 1 && linkCloseTimer.current !== null) {
        clearTimeout(linkCloseTimer.current); linkCloseTimer.current = null;
      }
      state.target = target;
      panel.inert = target === 0;
      if (immediate || reduced.matches || document.hidden) { settle(); return; }
      if (target === 1) menu.open = true;
      if (!menu.open) { settle(); return; }
      panel.style.willChange = 'opacity, transform';
      paint();
      if (!state.frame) state.frame = requestAnimationFrame(tick);
    };
    closeRef.current = (immediate = false) => setTarget(0, immediate);
    toggleRef.current = () => setTarget(state.target === 1 ? 0 : 1);
    const escape = (event: KeyboardEvent) => {
      if (event.key === 'Tab' && menu.open) {
        cancelAnimationFrame(focusFrame);
        focusFrame = requestAnimationFrame(() => {
          focusFrame = 0;
          if (!menu.contains(document.activeElement)) setTarget(0);
        });
        return;
      }
      if (event.key !== 'Escape' || !menu.open) return;
      setTarget(0); menu.querySelector('summary')?.focus();
    };
    const outside = (event: PointerEvent) => {
      if (menu.open && event.target instanceof Node && !menu.contains(event.target)) setTarget(0);
    };
    const preference = () => { if (reduced.matches) settle(); };
    const visibility = () => { if (document.hidden) setTarget(0, true); };
    document.addEventListener('keydown', escape);
    document.addEventListener('pointerdown', outside);
    document.addEventListener('visibilitychange', visibility);
    reduced.addEventListener('change', preference);
    return () => {
      cancelAnimationFrame(focusFrame);
      if (linkCloseTimer.current !== null) clearTimeout(linkCloseTimer.current);
      cancelAnimationFrame(state.frame);
      panel.style.removeProperty('opacity'); panel.style.removeProperty('transform'); panel.style.removeProperty('will-change'); panel.inert = false;
      toggleRef.current = null; closeRef.current = () => { menu.open = false; };
      document.removeEventListener('keydown', escape);
      document.removeEventListener('pointerdown', outside);
      document.removeEventListener('visibilitychange', visibility);
      reduced.removeEventListener('change', preference);
    };
  }, []);
  useEffect(() => { closeRef.current(true); }, [pathname]);
  return (
    <details
      ref={menuRef}
      className={styles.mobileMenu}
      onClick={(event) => {
        if (event.target instanceof Element && event.target.closest('a')) {
          // Keep the clicked link active through the browser's default action.
          // Safari may cancel activation when its ancestor becomes inert during dispatch.
          if (linkCloseTimer.current !== null) clearTimeout(linkCloseTimer.current);
          linkCloseTimer.current = setTimeout(() => {
            linkCloseTimer.current = null;
            closeRef.current();
          }, 0);
        }
      }}
    >
      <summary className={styles.mobileMenuTrigger} aria-label="Открыть меню" onClick={event => { if (toggleRef.current) { event.preventDefault(); toggleRef.current(); } }}>
        <span>Меню</span>
        <svg
          width="22"
          height="22"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
          aria-hidden="true"
        >
          <path d="M4 7h16M4 12h16M4 17h16" />
        </svg>
      </summary>
      <div className={styles.mobilePanel} data-menu-panel>
        <div className={styles.menuHeading}>
          <div><p className={styles.menuCaption}>Все разделы ASHYQ</p><p className={styles.menuTitle}>Куда перейдём?</p></div>
          <button type="button" className={styles.menuClose} aria-label="Закрыть меню" onClick={() => {
            if (menuRef.current) { closeRef.current(); menuRef.current.querySelector('summary')?.focus(); }
          }}>✕</button>
        </div>
        <Link className={styles.menuSearch} href="/search"><span>Поиск по сайту</span><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" aria-hidden="true"><circle cx="10.5" cy="10.5" r="6.5" /><path d="m16 16 4 4" /></svg></Link>
        {children}
      </div>
    </details>
  );
}
