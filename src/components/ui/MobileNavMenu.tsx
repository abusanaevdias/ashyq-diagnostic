'use client';

import { useEffect, useRef, type ReactNode } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import styles from './CleanUi.module.css';

/** Native details stays usable before hydration; navigation is not a modal. */
export function MobileNavMenu({ children }: { children: ReactNode }) {
  const menuRef = useRef<HTMLDetailsElement>(null);
  const pathname = usePathname();
  useEffect(() => { if (menuRef.current) menuRef.current.open = false; }, [pathname]);
  useEffect(() => {
    const closeOnEscape = (event: KeyboardEvent) => {
      const menu = menuRef.current;
      if (event.key !== 'Escape' || !menu?.open) return;
      menu.open = false;
      menu.querySelector('summary')?.focus();
    };
    const closeOutside = (event: PointerEvent) => {
      const menu = menuRef.current;
      if (
        menu?.open &&
        event.target instanceof Node &&
        !menu.contains(event.target)
      )
        menu.open = false;
    };
    document.addEventListener('keydown', closeOnEscape);
    document.addEventListener('pointerdown', closeOutside);
    return () => {
      document.removeEventListener('keydown', closeOnEscape);
      document.removeEventListener('pointerdown', closeOutside);
    };
  }, []);
  return (
    <details
      ref={menuRef}
      className={styles.mobileMenu}
      onClick={(event) => {
        if (event.target instanceof Element && event.target.closest('a'))
          event.currentTarget.open = false;
      }}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget))
          event.currentTarget.open = false;
      }}
    >
      <summary className={styles.mobileMenuTrigger} aria-label="Открыть меню">
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
      <div className={styles.mobilePanel}>
        <div className={styles.menuHeading}>
          <div><p className={styles.menuCaption}>Все разделы ASHYQ</p><p className={styles.menuTitle}>Куда перейдём?</p></div>
          <button type="button" className={styles.menuClose} aria-label="Закрыть меню" onClick={() => {
            if (menuRef.current) { menuRef.current.open = false; menuRef.current.querySelector('summary')?.focus(); }
          }}>✕</button>
        </div>
        <Link className={styles.menuSearch} href="/search"><span>Поиск по сайту</span><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" aria-hidden="true"><circle cx="10.5" cy="10.5" r="6.5" /><path d="m16 16 4 4" /></svg></Link>
        {children}
      </div>
    </details>
  );
}
