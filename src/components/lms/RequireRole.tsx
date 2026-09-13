'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useSession } from '@/lib/lms/hooks';
import { ROLE_LABELS, roleAllowed } from '@/lib/lms/permissions';
import type { Role, User } from '@/lib/lms/types';
import { MicroLabel } from '@/components/ui/CleanUi';
import ui from '@/components/ui/CleanUi.module.css';
import styles from './Lms.module.css';

/**
 * Клиентский гвард маршрута. Без редиректов: нет сессии → экран входа,
 * чужая роль → «Недостаточно прав». Серверная проверка появится с Supabase.
 */
export default function RequireRole({ roles, children }: { roles: readonly Role[]; children: (user: User) => React.ReactNode }) {
  const { session, ready } = useSession();
  const pathname = usePathname();
  const router = useRouter();

  if (!ready) {
    return <p className={`${styles.state} ${styles.muted}`} role="status">Загружаем кабинет…</p>;
  }

  if (!session) {
    return (
      <section className={styles.state} aria-labelledby="guard-title">
        <MicroLabel>Учебный кабинет</MicroLabel>
        <h1 id="guard-title" className={styles.title}>Нужно войти</h1>
        <p className={styles.lead}>Этот раздел открывается после входа в аккаунт.</p>
        <div className={styles.stateActions}>
          <Link href={`/login?next=${encodeURIComponent(pathname)}`} className={ui.buttonRed}>Войти</Link>
        </div>
      </section>
    );
  }

  if (!roleAllowed(session.user.role, roles)) {
    return (
      <section className={styles.state} aria-labelledby="guard-title">
        <MicroLabel>Доступ</MicroLabel>
        <h1 id="guard-title" className={styles.title}>Недостаточно прав</h1>
        <p className={styles.lead}>
          Раздел доступен роли «{roles.map((role) => ROLE_LABELS[role]).join('», «')}». Вы вошли как {ROLE_LABELS[session.user.role]}.
        </p>
        <div className={styles.stateActions}>
          <button type="button" className={ui.buttonOutline} onClick={() => router.back()}>Назад</button>
          <Link href="/me" className={ui.buttonBlack}>В кабинет</Link>
        </div>
      </section>
    );
  }

  return <>{children(session.user)}</>;
}
