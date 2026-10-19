'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { SITE_NAVIGATION } from '@/data/site-navigation';
import { BLOG_IS_DEMO } from '@/data/blog';
import styles from './CleanUi.module.css';

export default function SiteMenuLinks() {
  const pathname = usePathname();
  return <div className={styles.menuGroups}>
    {SITE_NAVIGATION.map(group => <section className={styles.menuGroup} key={group.title} aria-label={group.title}>
      <h2>{group.title}</h2>
      {group.links.filter(link => !(BLOG_IS_DEMO && link.href === '/blog')).map(link => <Link
        key={link.href} href={link.href} prefetch={false} className={styles.menuLink}
        aria-current={pathname === link.href ? 'page' : undefined}
      >{link.label}<span aria-hidden="true">→</span></Link>)}
    </section>)}
  </div>;
}
