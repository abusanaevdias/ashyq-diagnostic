'use client';

import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useState } from 'react';
import { formatDate } from '@/lib/lms/format';
import { useLmsData } from '@/lib/lms/hooks';
import { canManageClass, ROUTE_ROLES } from '@/lib/lms/permissions';
import { getRepos } from '@/lib/lms/repos';
import type { User } from '@/lib/lms/types';
import { MicroLabel } from '@/components/ui/CleanUi';
import ui from '@/components/ui/CleanUi.module.css';
import { Avatar } from './Identity';
import { LessonRatingSummary } from './LessonRating';
import RequireRole from './RequireRole';
import { DeadlineChip, Loading, SubmissionChip, Unavailable } from './States';
import styles from './Lms.module.css';

/* ---------- /teacher: классы учителя + создание класса ---------- */

export function TeacherHome() {
  return <RequireRole roles={ROUTE_ROLES.teacher}>{(user) => <Dashboard user={user} />}</RequireRole>;
}

function Dashboard({ user }: { user: User }) {
  const repos = getRepos();
  const router = useRouter();
  const { data, loading, error } = useLmsData(async () => {
    const classes = await repos.classes.listForUser(user);
    return Promise.all(
      classes.map(async (cls) => {
        const assignments = await repos.assignments.listByClass(cls.id);
        const subs = (await Promise.all(assignments.map((a) => repos.submissions.listByAssignment(a.id)))).flat();
        return { cls, pending: subs.filter((s) => s.status === 'submitted').length };
      }),
    );
  }, `teacher:${user.id}`);
  const [title, setTitle] = useState('');
  const [subject, setSubject] = useState('');
  const [formError, setFormError] = useState('');

  const create = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError('');
    try {
      const cls = await repos.classes.create({ title, subject, teacherId: user.id });
      router.push(`/teacher/classes/${cls.id}`);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Класс не создан');
    }
  };

  return (
    <>
      <MicroLabel>Учителю</MicroLabel>
      <h1 className={styles.title}>Классы</h1>
      <p className={styles.lead}>Уроки, задания и проверка сдач ваших учеников.</p>

      {loading ? <Loading /> : null}
      {error ? <p className={styles.error} role="alert">{error}</p> : null}
      {data && data.length === 0 ? <p className={`${styles.notice} ${styles.section}`}>Классов пока нет — создайте первый ниже.</p> : null}

      {data && data.length > 0 ? (
        <div className={styles.grid3}>
          {data.map(({ cls, pending }) => (
            <Link key={cls.id} href={`/teacher/classes/${cls.id}`} className={`${styles.card} ${styles.cardLink}`}>
              <span className={styles.chip}>{cls.subject}</span>
              <h2 className={`${styles.cardTitle} ${styles.spaced}`}>{cls.title}</h2>
              <p className={styles.muted}>Учеников: {cls.memberIds.length} · код {cls.inviteCode}</p>
              <div className={styles.chipsRow}>
                <span className={`${styles.chip} ${pending ? styles.chipInk : ''}`}>на проверке: {pending}</span>
              </div>
            </Link>
          ))}
        </div>
      ) : null}

      <section className={`${styles.card} ${styles.section}`} aria-labelledby="create-title">
        <h2 id="create-title" className={styles.cardTitle}>Новый класс</h2>
        <form className={styles.inlineForm} onSubmit={create}>
          <label className={styles.fieldLabel}>
            Название
            <input className={styles.field} value={title} onChange={(e) => setTitle(e.target.value)} required maxLength={80} />
          </label>
          <label className={styles.fieldLabel}>
            Предмет
            <input className={styles.field} value={subject} onChange={(e) => setSubject(e.target.value)} required maxLength={30} placeholder="IELTS" />
          </label>
          <button type="submit" className={ui.buttonBlack}>Создать класс</button>
        </form>
        {formError ? <p className={styles.error} role="alert">{formError}</p> : null}
      </section>
    </>
  );
}

/* ---------- /teacher/classes/[id]: задания со сдачами по ученикам, уроки ---------- */

export function TeacherClass() {
  const { id } = useParams<{ id: string }>();
  return <RequireRole roles={ROUTE_ROLES.teacher}>{(user) => <ClassManage id={id} user={user} />}</RequireRole>;
}

function ClassManage({ id, user }: { id: string; user: User }) {
  const repos = getRepos();
  const { data, loading, error } = useLmsData(async () => {
    const cls = await repos.classes.get(id);
    if (!cls) return null;
    const [lessons, assignments, students] = await Promise.all([
      repos.lessons.listByClass(id),
      repos.assignments.listByClass(id),
      repos.users.listByIds(cls.memberIds),
    ]);
    const [subs, ratings] = await Promise.all([
      Promise.all(assignments.map((a) => repos.submissions.listByAssignment(a.id))).then((all) => all.flat()),
      repos.lessonRatings.listByLessons(lessons.map((l) => l.id)),
    ]);
    return { cls, lessons, assignments, students, subs, ratings };
  }, `teacher-class:${id}`);

  if (loading) return <Loading />;
  // ошибку загрузки не выдаём за «класс не найден» (CLASS-LOAD-FIX-001)
  if (error) return <Unavailable title="Не удалось загрузить класс" text={error} href="/teacher" label="К классам" />;
  if (!data || !canManageClass(user, data.cls)) {
    return <Unavailable title="Класс недоступен" text="Класс не найден или его ведёт другой учитель." href="/teacher" label="К классам" />;
  }
  const { cls, lessons, assignments, students, subs, ratings } = data;

  return (
    <>
      <Link href="/teacher" className={styles.backLink}>← Классы</Link>
      <div className={styles.chipsRow}><span className={styles.chip}>{cls.subject}</span></div>
      <h1 className={styles.title}>{cls.title}</h1>
      <p className={styles.lead}>Код приглашения: <strong>{cls.inviteCode}</strong> · учеников: {students.length}</p>
      <div className={styles.actions}>
        <Link href={`/teacher/assignments/new?class=${cls.id}`} className={ui.buttonBlack}>Новое задание</Link>
        <Link href={`/teacher/lessons/new?class=${cls.id}`} className={ui.buttonOutline}>Новый урок</Link>
      </div>

      <div className={styles.feedGrid}>
        <section aria-labelledby="t-assignments-title">
          <h2 id="t-assignments-title" className={styles.sectionTitle}>Задания и сдачи</h2>
          {assignments.length === 0 ? <p className={styles.muted}>Заданий пока нет.</p> : null}
          <div className={styles.list}>
            {assignments.map((a) => {
              const forAssignment = subs.filter((s) => s.assignmentId === a.id);
              return (
                <article key={a.id} className={styles.card}>
                  <h3 className={styles.cardTitle}>{a.title}</h3>
                  <div className={styles.chipsRow}>
                    <DeadlineChip dueAt={a.dueAt} />
                    <span className={styles.chip}>сдали {forAssignment.length} из {students.length}</span>
                  </div>
                  <Link href={`/teacher/assignments/${a.id}`} className={styles.textButton} aria-label={`Изменить задание «${a.title}»`}>Изменить</Link>
                  <ul className={styles.reviewList} aria-label={`Сдачи: ${a.title}`}>
                    {students.map((student) => {
                      const sub = forAssignment.find((s) => s.studentId === student.id);
                      const verb = sub?.status === 'graded' ? 'Открыть' : 'Проверить';
                      return (
                        <li key={student.id} className={styles.reviewRow}>
                          <span className={styles.reviewWho}><Avatar user={student} />{student.name}</span>
                          <SubmissionChip submission={sub} assignment={a} />
                          {sub ? (
                            <Link href={`/submissions/${sub.id}`} className={styles.reviewLink} aria-label={`${verb} работу — ${student.name}`}>{verb}</Link>
                          ) : null}
                        </li>
                      );
                    })}
                  </ul>
                </article>
              );
            })}
          </div>
        </section>

        <section aria-labelledby="t-lessons-title">
          <h2 id="t-lessons-title" className={styles.sectionTitle}>Уроки</h2>
          {lessons.length === 0 ? <p className={styles.muted}>Уроков пока нет.</p> : null}
          <div className={styles.list}>
            {lessons.map((lesson) => (
              <article key={lesson.id} className={`${styles.card} ${styles.rowCard}`}>
                <p className={styles.hint}>{formatDate(lesson.publishedAt)}</p>
                <h3 className={`${styles.cardTitle} ${styles.spaced}`}>{lesson.title}</h3>
                <p className={styles.muted}>Материалов: {lesson.materials.length}</p>
                <Link href={`/teacher/lessons/${lesson.id}`} className={styles.textButton} aria-label={`Открыть и изменить урок «${lesson.title}»`}>Открыть и изменить</Link>
                <LessonRatingSummary
                  ratings={ratings.filter((r) => r.lessonId === lesson.id && cls.memberIds.includes(r.studentId))}
                  students={students.length}
                />
              </article>
            ))}
          </div>
        </section>
      </div>
    </>
  );
}
