'use client';

import { useEffect, useMemo, useState } from 'react';
import { ROLE_LABELS, ROUTE_ROLES } from '@/lib/lms/permissions';
import { listStaffUsers, setUserRole, type StaffUser } from '@/lib/lms/staff-roles';
import type { Role } from '@/lib/lms/types';
import { MicroLabel } from '@/components/ui/CleanUi';
import RequireRole from './RequireRole';
import styles from './Lms.module.css';

/** Роли на сайте (STAFF-ROLES-001). Кнопки прячем по user.crm, а права всё равно проверяет БД. */
const EDITABLE: Role[] = ['student', 'teacher', 'author'];
const STAFF_LABELS: Record<string, string> = { admin: 'админ', manager: 'менеджер' };

export default function StaffRolesView() {
  return (
    <RequireRole roles={ROUTE_ROLES.me}>
      {(user) =>
        user.crm ? (
          <RolesList />
        ) : (
          <section className={styles.state} aria-labelledby="roles-title">
            <MicroLabel>Доступ</MicroLabel>
            <h1 id="roles-title" className={styles.title}>Недостаточно прав</h1>
            <p className={styles.lead}>Роли меняют админ и менеджер ASHYQ.</p>
          </section>
        )
      }
    </RequireRole>
  );
}

function RolesList() {
  const [users, setUsers] = useState<StaffUser[] | null>(null);
  const [query, setQuery] = useState('');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState<string | null>(null);

  useEffect(() => {
    listStaffUsers().then(setUsers, (err: Error) => setError(err.message));
  }, []);

  const shown = useMemo(() => {
    const q = query.trim().toLowerCase();
    return (users ?? []).filter((u) => !q || u.email.toLowerCase().includes(q) || u.display_name.toLowerCase().includes(q));
  }, [users, query]);

  const change = async (target: StaffUser, role: Role) => {
    setBusy(target.id);
    setError('');
    setNotice('');
    try {
      await setUserRole(target.id, role);
      setUsers((current) => current?.map((u) => (u.id === target.id ? { ...u, role } : u)) ?? null);
      setNotice(`${target.display_name}: теперь ${ROLE_LABELS[role]}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не удалось сохранить роль');
    } finally {
      setBusy(null);
    }
  };

  return (
    <>
      <MicroLabel>Личный кабинет</MicroLabel>
      <h1 className={styles.title}>Роли пользователей</h1>
      <p className={styles.lead}>
        Новый аккаунт — ученик. Здесь его можно сделать учителем или автором. Админа и менеджера назначают в Supabase.
      </p>

      <label className={styles.fieldLabel}>
        Поиск по имени или email
        <input className={styles.field} type="search" value={query} onChange={(e) => setQuery(e.target.value)} />
      </label>
      {error ? <p className={styles.error} role="alert">{error}</p> : null}
      {notice ? <p className={styles.notice} role="status">{notice}</p> : null}
      {users === null && !error ? <p className={styles.muted} role="status">Загружаем пользователей…</p> : null}
      {users && shown.length === 0 ? <p className={styles.muted}>Никого не нашли.</p> : null}

      <div className={styles.list}>
        {shown.map((u) => (
          <article key={u.id} className={`${styles.card} ${styles.rowCard}`}>
            <div className={styles.fieldRow}>
              <div>
                <h2 className={styles.cardTitle}>{u.display_name}</h2>
                <p className={styles.muted}>{u.email}</p>
              </div>
              {STAFF_LABELS[u.role] ? (
                <p className={styles.muted}>{STAFF_LABELS[u.role]}</p>
              ) : (
                <label className={styles.fieldLabel}>
                  Роль
                  <select
                    className={styles.field}
                    value={u.role}
                    disabled={busy === u.id}
                    onChange={(e) => void change(u, e.target.value as Role)}
                  >
                    {EDITABLE.map((role) => (
                      <option key={role} value={role}>{ROLE_LABELS[role]}</option>
                    ))}
                  </select>
                </label>
              )}
            </div>
          </article>
        ))}
      </div>
    </>
  );
}
