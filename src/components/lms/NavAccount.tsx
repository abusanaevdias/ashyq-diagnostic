'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { getAuth } from '@/lib/lms/auth';
import { useSession } from '@/lib/lms/hooks';
import { can, roleLinks } from '@/lib/lms/permissions';
import ui from '@/components/ui/CleanUi.module.css';
import { Avatar, RoleBadge } from './Identity';
import styles from './Lms.module.css';

/**
 * Аккаунт в навбаре. bar — десктоп (кнопка «Войти» или аватар с меню),
 * panel — пункты внутри мобильного бургер-меню, где в строке нет места.
 */
export default function NavAccount({ variant }: { variant: 'bar' | 'panel' }) {
  const { session, ready } = useSession();
  const router = useRouter();

  if (!ready) return variant === 'bar' ? <span className={`${styles.navSlot} ${styles.barOnly}`} aria-hidden="true" /> : null;

  const signOut = async () => {
    await getAuth().signOut();
    router.push('/login');
  };

  if (!session) {
    return variant === 'bar'
      ? <Link href="/login" className={`${styles.signIn} ${styles.barOnly}`}>Войти</Link>
      : <Link href="/login" className={ui.navLink}>Войти</Link>;
  }

  const { user } = session;
  const links = [{ href: '/me', label: 'Кабинет' }, ...roleLinks(user.role),
    ...(can(user.role, 'content.create') ? [
      { href: '/writing/trainer/own', label: 'Работа со своим эссе' },
      { href: '/trainers/material-review', label: 'Проверка материалов' },
      { href: '/writing/calibration', label: 'Ориентиры Writing' },
    ] : []),
    ...(user.crm ? [
      { href: '/crm', label: 'CRM: заявки' },
      { href: '/me/roles', label: 'Управление ролями' },
    ] : []),
  ];

  if (variant === 'panel') {
    return (
      <>
        {links.map((link) => <Link key={link.href} href={link.href} className={ui.navLink}>{link.label}</Link>)}
        <button type="button" className={`${ui.navLink} ${styles.plainButton}`} onClick={signOut}>Выйти</button>
      </>
    );
  }

  return (
    <details className={`${styles.menu} ${styles.barOnly}`}>
      <summary className={styles.menuTrigger} aria-label={`Аккаунт: ${user.name}`}>
        <Avatar user={user} />
      </summary>
      <div className={styles.menuPanel}>
        <div className={styles.menuHead}>
          <span className={styles.menuName}>{user.name}</span>
          <RoleBadge role={user.role} />
        </div>
        {links.map((link) => <Link key={link.href} href={link.href} className={styles.menuItem}>{link.label}</Link>)}
        <button type="button" className={styles.menuItem} onClick={signOut}>Выйти</button>
      </div>
    </details>
  );
}
