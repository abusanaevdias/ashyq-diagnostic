'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { track } from '@/lib/analytics';
import { getAuth } from '@/lib/lms/auth';
import { applyDemoSeed, DEMO_EMAILS, DEMO_PASSWORD } from '@/lib/lms/seed';
import type { Role } from '@/lib/lms/types';
import { MicroLabel } from '@/components/ui/CleanUi';
import ui from '@/components/ui/CleanUi.module.css';
import { Avatar } from './Identity';
import styles from './Lms.module.css';

const DEMO_ROLES: Array<{ role: Role; name: string; label: string; hint: string; color: 'red' | 'dark-warm' | 'red-deep' }> = [
  { role: 'student', name: 'Dias', label: 'ученик', hint: 'классы, уроки, сдача домашки', color: 'red' },
  { role: 'teacher', name: 'Айгерим К.', label: 'учитель', hint: 'задания, проверка, оценки', color: 'dark-warm' },
  { role: 'author', name: 'Санжар', label: 'автор', hint: 'черновики и публикации блога', color: 'red-deep' },
];

/** Только внутренние пути: иначе ?next= стал бы открытым редиректом. */
function safeNext(value: string | null): string {
  return value && value.startsWith('/') && !value.startsWith('//') ? value : '/me';
}

export default function LoginView() {
  const router = useRouter();
  const next = safeNext(useSearchParams().get('next'));
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(false);

  const finish = (role: Role, method: 'password' | 'demo') => {
    track('lms_signed_in', { role, method });
    router.push(next);
  };

  const run = async (action: () => Promise<void>) => {
    setBusy(true);
    setError('');
    try {
      await action();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не удалось войти');
    } finally {
      setBusy(false);
    }
  };

  const signIn = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    void run(async () => {
      const session = await getAuth().signIn(email, password);
      finish(session.user.role, 'password');
    });
  };

  const demoSignIn = (role: Role) =>
    run(async () => {
      const auth = getAuth();
      const session = await auth.signIn(DEMO_EMAILS[role], DEMO_PASSWORD).catch(async () => {
        applyDemoSeed(); // демо-аккаунтов на этом устройстве ещё нет
        return auth.signIn(DEMO_EMAILS[role], DEMO_PASSWORD);
      });
      finish(session.user.role, 'demo');
    });

  const seed = () =>
    run(async () => {
      applyDemoSeed();
      setNotice('Демо-данные записаны на этом устройстве: класс, уроки, задания, сдачи и посты. Войдите любой ролью.');
    });

  return (
    <>
      <MicroLabel>Учебный кабинет</MicroLabel>
      <h1 className={styles.title}>Вход в ASHYQ</h1>
      <p className={styles.lead}>Классы, уроки, домашние задания и блог. Сейчас это демо: всё хранится только в этом браузере.</p>

      <div className={styles.grid2}>
        <section className={styles.card} aria-labelledby="login-title">
          <h2 id="login-title" className={styles.cardTitle}>Email и пароль</h2>
          <form className={styles.form} onSubmit={signIn} aria-busy={busy}>
            <label className={styles.fieldLabel}>
              Email
              <input className={styles.field} type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
            </label>
            <label className={styles.fieldLabel}>
              Пароль
              <input className={styles.field} type="password" autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)} />
            </label>
            {error ? <p className={styles.error} role="alert">{error}</p> : null}
            <button type="submit" className={ui.buttonBlack} disabled={busy}>Войти</button>
          </form>
          <p className={styles.muted}>Демо-пароль всех тестовых аккаунтов: {DEMO_PASSWORD}. Не вводите сюда настоящие пароли.</p>
        </section>

        <section className={styles.card} aria-labelledby="demo-title">
          <h2 id="demo-title" className={styles.cardTitle}>Демо-вход одной кнопкой</h2>
          <div className={styles.stack}>
            {DEMO_ROLES.map((item) => (
              <button key={item.role} type="button" className={styles.roleButton} disabled={busy} onClick={() => demoSignIn(item.role)}>
                <Avatar user={{ name: item.name, avatarColor: item.color }} />
                <span>
                  <span className={styles.roleName}>{item.name} · {item.label}</span>
                  <br />
                  <span className={styles.roleHint}>{item.hint}</span>
                </span>
              </button>
            ))}
          </div>
          <div className={styles.actions}>
            <button type="button" className={styles.textButton} disabled={busy} onClick={seed}>Заполнить демо-данными</button>
          </div>
          <p className={styles.muted}>Перезапишет демо-классы, задания и посты на этом устройстве.</p>
          {notice ? <p className={styles.notice} role="status">{notice}</p> : null}
        </section>
      </div>
    </>
  );
}
