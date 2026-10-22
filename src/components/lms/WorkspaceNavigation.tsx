'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSession } from '@/lib/lms/hooks';
import { roleLinks } from '@/lib/lms/permissions';
import styles from './Lms.module.css';

/** Navigation only; the existing page guards remain the access boundary. */
export default function WorkspaceNavigation() {
  const pathname = usePathname();
  const { session } = useSession();
  const links = [
    ...(session ? [{ href: '/me', label: 'Кабинет' }, ...roleLinks(session.user.role)] : []),
    { href: '/trainers', label: 'Тренажёры' },
    { href: '/library', label: 'Библиотека' },
  ];
  const active = links.filter(link => pathname === link.href || (link.href !== '/me' && pathname.startsWith(`${link.href}/`)))
    .sort((a, b) => b.href.length - a.href.length)[0]?.href;
  return <nav className={styles.workspaceNav} aria-label="Учебное пространство">
    {links.map(link => <Link key={link.href} href={link.href} aria-current={active === link.href ? 'page' : undefined}>{link.label}</Link>)}
  </nav>;
}
