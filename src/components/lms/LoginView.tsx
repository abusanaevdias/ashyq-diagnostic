'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { track } from '@/lib/analytics';
import { getAuth } from '@/lib/lms/auth';
import { applyDemoSeed, DEMO_EMAILS, DEMO_PASSWORD } from '@/lib/lms/seed';
import type { Role } from '@/lib/lms/types';
import { MicroLabel } from '@/components/ui/CleanUi';
import ui from '@/components/ui/CleanUi.module.css';
import { Avatar } from './Identity';
import PasswordField from './PasswordField';
import styles from './Lms.module.css';

/** Вход через Supabase: настоящие аккаунты, регистрация вместо демо-кнопок. */
const SUPABASE = process.env.NEXT_PUBLIC_AUTH_PROVIDER === 'supabase';
const MIN_PASSWORD = 8; // = minimum_password_length в supabase/config.toml

const DEMO_ROLES: Array<{ role: Role; name: string; label: string; hint: string; color: 'red' | 'dark-warm' | 'red-deep' }> = [
  { role: 'student', name: 'Dias', label: 'ученик', hint: 'классы, уроки, сдача домашки', color: 'red' },
  { role: 'teacher', name: 'Айгерим К.', label: 'учитель', hint: 'задания, проверка, оценки', color: 'dark-warm' },
  { role: 'author', name: 'Санжар', label: 'автор', hint: 'черновики и публикации блога', color: 'red-deep' },
];

/** Только внутренние пути: иначе ?next= стал бы открытым редиректом. */
function safeNext(value: string | null): string {
  return value && value.startsWith('/') && !value.startsWith('//') ? value : '/me';
}

export default function LoginView({ nextPath }: { nextPath?: string }) {
  const router = useRouter();
  const next = safeNext(nextPath ?? null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(false);
  const [signup, setSignup] = useState({ name: '', email: '', password: '', minor: false, consent: false });
  const [signupError, setSignupError] = useState('');

  const finish = (role: Role, method: 'password' | 'demo') => {
    track('lms_signed_in', { role, method });
    router.push(next);
  };

  const run = async (action: () => Promise<void>, onError: (message: string) => void = setError) => {
    setBusy(true);
    setError('');
    setSignupError('');
    try {
      await action();
    } catch (err) {
      onError(err instanceof Error ? err.message : 'Не удалось войти');
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

  const signUp = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    void run(async () => {
      const session = await getAuth().signUp(signup.name, signup.email, signup.password, undefined, {
        minor: signup.minor,
        guardianConsent: signup.consent,
      });
      finish(session.user.role, 'password');
    }, setSignupError);
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

  const update = (patch: Partial<typeof signup>) => setSignup((current) => ({ ...current, ...patch }));

  return (
    <>
      <MicroLabel>Учебный кабинет</MicroLabel>
      <h1 className={styles.title}>Вход в ASHYQ</h1>
      <p className={styles.lead}>
        Классы, уроки, домашние задания и блог.{SUPABASE ? '' : ' Сейчас это демо: всё хранится только в этом браузере.'}
      </p>

      <div className={styles.grid2}>
        <section className={styles.card} aria-labelledby="login-title">
          <h2 id="login-title" className={styles.cardTitle}>Email и пароль</h2>
          <form className={styles.form} onSubmit={signIn} aria-busy={busy}>
            <label className={styles.fieldLabel}>
              Email
              <input className={styles.field} type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
            </label>
            <PasswordField label="Пароль" autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)} />
            {error ? <p className={styles.error} role="alert">{error}</p> : null}
            <button type="submit" className={ui.buttonBlack} disabled={busy}>Войти</button>
          </form>
          {SUPABASE ? null : <p className={styles.muted}>Демо-пароль всех тестовых аккаунтов: {DEMO_PASSWORD}. Не вводите сюда настоящие пароли.</p>}
        </section>

        {SUPABASE ? (
          <section className={styles.card} aria-labelledby="signup-title">
            <h2 id="signup-title" className={styles.cardTitle}>Регистрация</h2>
            <form className={styles.form} onSubmit={signUp} aria-busy={busy}>
              <label className={styles.fieldLabel}>
                Имя
                <input className={styles.field} autoComplete="name" required value={signup.name} onChange={(e) => update({ name: e.target.value })} />
              </label>
              <label className={styles.fieldLabel}>
                Email
                <input className={styles.field} type="email" autoComplete="email" required value={signup.email} onChange={(e) => update({ email: e.target.value })} />
              </label>
              <PasswordField
                label={`Пароль, минимум ${MIN_PASSWORD} символов`}
                autoComplete="new-password"
                minLength={MIN_PASSWORD}
                required
                value={signup.password}
                onChange={(e) => update({ password: e.target.value })}
              />
              <label className={styles.checkRow}>
                <input type="checkbox" checked={signup.minor} onChange={(e) => update({ minor: e.target.checked, consent: false })} />
                Мне меньше 18 лет
              </label>
              {signup.minor ? (
                <label className={styles.checkRow}>
                  <input type="checkbox" required checked={signup.consent} onChange={(e) => update({ consent: e.target.checked })} />
                  <span>
                    Родитель или законный представитель согласен на мою регистрацию и обработку данных по{' '}
                    <Link href="/privacy">политике конфиденциальности</Link>
                  </span>
                </label>
              ) : null}
              {signupError ? <p className={styles.error} role="alert">{signupError}</p> : null}
              <button type="submit" className={ui.buttonRed} disabled={busy}>Создать аккаунт</button>
            </form>
            <p className={styles.muted}>Новый аккаунт — ученический. Роли учителя и автора выдаёт администратор ASHYQ.</p>
          </section>
        ) : (
          <section className={styles.card} aria-labelledby="demo-title">
            <h2 id="demo-title" className={styles.cardTitle}>Демо-вход одной кнопкой</h2>
            <div className={styles.stack}>
              {DEMO_ROLES.map((item) => (
                <button
                  key={item.role}
                  type="button"
                  className={styles.roleButton}
                  disabled={busy}
                  onClick={() => demoSignIn(item.role)}
                  aria-label={`Войти как ${item.label}. ${item.name} · ${item.label} ${item.hint}`}
                >
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
        )}
      </div>
    </>
  );
}
