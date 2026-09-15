'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { getAuth } from '@/lib/lms/auth';
import { ROUTE_ROLES, roleLinks } from '@/lib/lms/permissions';
import { MicroLabel } from '@/components/ui/CleanUi';
import ui from '@/components/ui/CleanUi.module.css';
import { Avatar, RoleBadge } from './Identity';
import RequireRole from './RequireRole';
import styles from './Lms.module.css';

export default function MeView() {
  const router = useRouter();

  return (
    <RequireRole roles={ROUTE_ROLES.me}>
      {(user) => (
        <>
          <MicroLabel>Личный кабинет</MicroLabel>
          <div className={styles.actions}>
            <Avatar user={user} />
            <RoleBadge role={user.role} />
          </div>
          <h1 className={styles.title}>Привет, {user.name}</h1>
          <p className={styles.lead}>{user.email}</p>

          <div className={styles.grid3}>
            {roleLinks(user.role).map((link) => (
              <Link key={link.href} href={link.href} className={`${styles.card} ${styles.cardLink}`}>
                <h2 className={styles.cardTitle}>{link.label}</h2>
                <p className={styles.muted}>{link.text}</p>
              </Link>
            ))}
            <Link href="/blog" className={`${styles.card} ${styles.cardLink}`}>
              <h2 className={styles.cardTitle}>Блог</h2>
              <p className={styles.muted}>Опубликованные статьи ASHYQ.</p>
            </Link>
            {user.crm ? (
              <Link href="/crm" className={`${styles.card} ${styles.cardLink}`}>
                <h2 className={styles.cardTitle}>CRM</h2>
                <p className={styles.muted}>Заявки, этапы и заметки. Вход — «Войти аккаунтом ASHYQ».</p>
              </Link>
            ) : null}
            {user.crm ? (
              <Link href="/me/roles" className={`${styles.card} ${styles.cardLink}`}>
                <h2 className={styles.cardTitle}>Роли</h2>
                <p className={styles.muted}>Сделать ученика учителем или автором.</p>
              </Link>
            ) : null}
          </div>

          <div className={styles.actions}>
            <button
              type="button"
              className={ui.buttonOutline}
              onClick={async () => {
                await getAuth().signOut();
                router.push('/login');
              }}
            >
              Выйти
            </button>
          </div>
        </>
      )}
    </RequireRole>
  );
}
