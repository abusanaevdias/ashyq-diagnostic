'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import styles from './CleanUi.module.css';

const links = [
  ['/courses', 'Курсы'],
  ['/mentoring', 'Поступление'],
  ['/trainers', 'Тренажёры'],
  ['/library', 'Библиотека'],
] as const;

/** Native links keep navigation usable while the rest of the page hydrates. */
export default function PrimaryNavigation() {
  const path = usePathname();
  return <div className={styles.navLinks}>{links.map(([href, label]) => {
    const active = path === href || path.startsWith(`${href}/`) ||
      (href === '/trainers' && path.startsWith('/writing/'));
    return <Link key={href} className={styles.navLink} href={href}
      aria-current={active ? 'page' : undefined}>{label}</Link>;
  })}</div>;
}
