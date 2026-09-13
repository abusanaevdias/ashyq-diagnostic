'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useLmsData } from '@/lib/lms/hooks';
import { ROUTE_ROLES } from '@/lib/lms/permissions';
import { getRepos } from '@/lib/lms/repos';
import type { User } from '@/lib/lms/types';
import { MicroLabel } from '@/components/ui/CleanUi';
import ui from '@/components/ui/CleanUi.module.css';
import RequireRole from './RequireRole';
import { Loading } from './States';
import styles from './Lms.module.css';

export default function ClassesView() {
  return <RequireRole roles={ROUTE_ROLES.classes}>{(user) => <ClassesList user={user} />}</RequireRole>;
}

function ClassesList({ user }: { user: User }) {
  const repos = getRepos();
  const { data, loading, error } = useLmsData(async () => {
    const classes = await repos.classes.listForUser(user);
    const teachers = await repos.users.listByIds(classes.map((c) => c.teacherId));
    return { classes, teachers };
  }, `classes:${user.id}`);
  const [code, setCode] = useState('');
  const [joinError, setJoinError] = useState('');
  const [joined, setJoined] = useState('');

  const join = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setJoinError('');
    setJoined('');
    try {
      const cls = await repos.classes.join(code, user.id);
      setJoined(`Готово: вы в классе «${cls.title}».`);
      setCode('');
    } catch (err) {
      setJoinError(err instanceof Error ? err.message : 'Не удалось вступить в класс');
    }
  };

  return (
    <>
      <MicroLabel>Мой класс</MicroLabel>
      <h1 className={styles.title}>Мои классы</h1>
      <p className={styles.lead}>Уроки, материалы и задания от учителей ASHYQ.</p>

      {loading ? <Loading /> : null}
      {error ? <p className={styles.error} role="alert">{error}</p> : null}
      {data && data.classes.length === 0 ? <p className={`${styles.notice} ${styles.section}`}>Вы пока не состоите в классе. Введите код приглашения от учителя.</p> : null}

      {data && data.classes.length > 0 ? (
        <div className={styles.grid3}>
          {data.classes.map((cls) => (
            <Link key={cls.id} href={`/classes/${cls.id}`} className={`${styles.card} ${styles.cardLink}`}>
              <span className={styles.chip}>{cls.subject}</span>
              <h2 className={`${styles.cardTitle} ${styles.spaced}`}>{cls.title}</h2>
              <p className={styles.muted}>Учитель: {data.teachers.find((t) => t.id === cls.teacherId)?.name ?? '—'}</p>
            </Link>
          ))}
        </div>
      ) : null}

      <section className={`${styles.card} ${styles.section}`} aria-labelledby="join-title">
        <h2 id="join-title" className={styles.cardTitle}>Вступить по коду</h2>
        <form className={styles.inlineForm} onSubmit={join}>
          <label className={styles.fieldLabel}>
            Код приглашения
            <input className={styles.field} value={code} onChange={(e) => setCode(e.target.value)} required autoComplete="off" maxLength={12} />
          </label>
          <button type="submit" className={ui.buttonBlack}>Вступить</button>
        </form>
        {joinError ? <p className={styles.error} role="alert">{joinError}</p> : null}
        {joined ? <p className={styles.notice} role="status">{joined}</p> : null}
      </section>
    </>
  );
}
