'use client';

import { usePathname } from 'next/navigation';
import type { ReactNode } from 'react';
import styles from './PublicPresentation.module.css';
import secondary from './SecondaryPresentation.module.css';

const pages = new Set(['/', '/courses', '/mentoring', '/all-inclusive', '/about', '/contacts', '/faq', '/community', '/program', '/press', '/season', '/progress', '/search', '/diagnostic', '/career', '/library', '/trainers', '/writing']);
const trees = ['/courses/', '/career/', '/library/', '/trainers/', '/writing/'];
const workspacePages = new Set(['/login', '/me', '/classes', '/teacher', '/write']);
const workspaceTrees = ['/me/', '/classes/', '/teacher/', '/write/', '/assignments/', '/submissions/', '/season/'];
const secondaryPages = new Set(['/about', '/contacts', '/faq', '/community', '/program', '/press', '/season', '/progress', '/search', '/privacy', '/terms', '/maintenance']);

/** Presentation only. Blog, career internals and CRM retain independently owned composition. */
export default function PublicPresentation({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const active = pages.has(pathname) || trees.some(prefix => pathname.startsWith(prefix)) || workspacePages.has(pathname) || workspaceTrees.some(prefix => pathname.startsWith(prefix)) || secondaryPages.has(pathname);
  return <div className={active ? `${styles.root} ${secondaryPages.has(pathname) ? secondary.page : ''}` : undefined} data-public-design={active ? '051' : undefined}>
    {active && <>
      <link rel="preload" href="/design/onest-400.ttf" as="font" type="font/ttf" crossOrigin="anonymous" />
      <link rel="preload" href="/design/onest-700.ttf" as="font" type="font/ttf" crossOrigin="anonymous" />
    </>}
    {children}
  </div>;
}
