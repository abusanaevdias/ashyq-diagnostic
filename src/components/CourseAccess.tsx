'use client';

import { useLmsData, useSession } from '@/lib/lms/hooks';
import { isAshyqStudent } from '@/lib/lms/permissions';
import { getRepos } from '@/lib/lms/repos';
import type { User } from '@/lib/lms/types';
import { ButtonLink } from './ui/CleanUi';
import styles from './CourseDetailsV3.module.css';

/**
 * Доступ к основным урокам курса (COURSE-LESSONS-001). Регистрация открыта всем,
 * а учеником ASHYQ считается участник класса: код класса менеджер выдаёт после записи.
 * Сами уроки лежат в классе и защищены RLS — плашка только ведёт туда.
 */
export default function CourseAccess({ slug }: { slug: string }) {
  const { session, ready } = useSession();
  if (!ready) return <div className={styles.access} aria-hidden="true" />;
  if (!session) {
    return (
      <Panel text="Основные уроки откроются после записи на курс: менеджер выдаст код вашего класса.">
        <ButtonLink href="/contacts">Записаться на курс</ButtonLink>
        <ButtonLink href={`/login?next=/courses/${slug}`} tone="outline">Я ученик — войти</ButtonLink>
      </Panel>
    );
  }
  return <Member user={session.user} />;
}

function Member({ user }: { user: User }) {
  const { data } = useLmsData(() => getRepos().classes.listForUser(user), `course-access:${user.id}`);
  if (!data) return <div className={styles.access} aria-hidden="true" />;
  if (isAshyqStudent(user, data)) {
    const home = user.role === 'student' ? '/classes' : user.role === 'teacher' ? '/teacher' : '/me';
    return (
      <Panel text="Доступ открыт: основные уроки, задания и разборы ждут вас в классе.">
        <ButtonLink href={home} tone="black">Открыть мои классы</ButtonLink>
      </Panel>
    );
  }
  return (
    <Panel text="Вы вошли, но ещё не состоите в классе. После записи на курс менеджер выдаст код — введите его на странице классов.">
      <ButtonLink href="/classes" tone="black">Ввести код класса</ButtonLink>
      <ButtonLink href="/contacts" tone="outline">Записаться на курс</ButtonLink>
    </Panel>
  );
}

function Panel({ text, children }: { text: string; children: React.ReactNode }) {
  return (
    <div className={styles.access}>
      <p>{text}</p>
      <div className={styles.accessActions}>{children}</div>
    </div>
  );
}
