'use client';

import { usePathname } from 'next/navigation';
import type { ReactNode } from 'react';
import styles from './PublicPresentation.module.css';

const pages = new Set(['/', '/courses', '/mentoring', '/all-inclusive', '/about', '/contacts', '/faq', '/community', '/program', '/press', '/season', '/progress', '/search', '/diagnostic', '/career', '/library', '/trainers', '/writing']);
const trees = ['/courses/', '/career/', '/library/', '/trainers/', '/writing/'];

/** Presentation only. Blog and private routes retain their independently owned composition. */
export default function PublicPresentation({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const active = pages.has(pathname) || trees.some(prefix => pathname.startsWith(prefix));
  return <div className={active ? styles.root : undefined} data-public-design={active ? '051' : undefined}>
    {children}
  </div>;
}
