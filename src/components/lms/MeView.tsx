'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { getAuth } from '@/lib/lms/auth';
import { ROUTE_ROLES, roleLinks } from '@/lib/lms/permissions';
import { MicroLabel } from '@/components/ui/CleanUi';
import ui from '@/components/ui/CleanUi.module.css';
import { Avatar, RoleBadge } from './Identity';
import RequireRole from './RequireRole';
import styles from './Lms.module.css';

/** Своё имя можно исправить (EDIT-MORE-001) — его видят учитель и одноклассники. */
function NameForm({ name }: { name: string }) {
  const [value, setValue] = useState(name);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);

  const save = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setBusy(true);
    setError('');
    setSaved(false);
    try {
      await getAuth().updateName(value);
      setSaved(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Имя не сохранено');
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className={`${styles.card} ${styles.section}`} aria-labelledby="name-title">
      <h2 id="name-title" className={styles.cardTitle}>Ваше имя</h2>
      <form className={styles.inlineForm} onSubmit={save}>
        <label className={styles.fieldLabel}>
          Как показывать вас учителю и в классе
          <input className={styles.field} value={value} onChange={(e) => setValue(e.target.value)} required maxLength={120} autoComplete="name" />
        </label>
        <button type="submit" className={ui.buttonBlack} disabled={busy || value.trim() === name}>Сохранить имя</button>
      </form>
      {error ? <p className={styles.error} role="alert">{error}</p> : null}
      {saved ? <p className={styles.notice} role="status">Имя сохранено.</p> : null}
    </section>
  );
}

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

          <NameForm key={user.id} name={user.name} />

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
