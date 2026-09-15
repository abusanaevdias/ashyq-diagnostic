'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { formatDate } from '@/lib/lms/format';
import { useLmsData } from '@/lib/lms/hooks';
import { canViewClass, ROUTE_ROLES } from '@/lib/lms/permissions';
import { getRepos } from '@/lib/lms/repos';
import type { User } from '@/lib/lms/types';
import { LessonRatingPicker } from './LessonRating';
import Markdown from './Markdown';
import MaterialList from './MaterialList';
import RequireRole from './RequireRole';
import { DeadlineChip, Loading, SubmissionChip, Unavailable } from './States';
import styles from './Lms.module.css';

export default function ClassView() {
  const { id } = useParams<{ id: string }>();
  return <RequireRole roles={ROUTE_ROLES.classes}>{(user) => <ClassFeed id={id} user={user} />}</RequireRole>;
}

function ClassFeed({ id, user }: { id: string; user: User }) {
  const repos = getRepos();
  const { data, loading, error } = useLmsData(async () => {
    const cls = await repos.classes.get(id);
    if (!cls) return null;
    const [lessons, assignments, mine, teacher] = await Promise.all([
      repos.lessons.listByClass(id),
      repos.assignments.listByClass(id),
      repos.submissions.listByStudent(user.id),
      repos.users.get(cls.teacherId),
    ]);
    const ratings = (await repos.lessonRatings.listByLessons(lessons.map((l) => l.id))).filter((r) => r.studentId === user.id);
    return { cls, lessons, assignments, mine, teacher, ratings };
  }, `class:${id}:${user.id}`);

  if (loading) return <Loading />;
  // ошибку загрузки не выдаём за «класс не найден» (CLASS-LOAD-FIX-001)
  if (error) return <Unavailable title="Не удалось загрузить класс" text={error} href="/classes" label="К моим классам" />;
  if (!data || !canViewClass(user, data.cls)) {
    return <Unavailable title="Класс недоступен" text="Класс не найден или вы в нём не состоите." href="/classes" label="К моим классам" />;
  }
  const { cls, lessons, assignments, mine, teacher, ratings } = data;

  return (
    <>
      <Link href="/classes" className={styles.backLink}>← Мои классы</Link>
      <div className={styles.chipsRow}><span className={styles.chip}>{cls.subject}</span></div>
      <h1 className={styles.title}>{cls.title}</h1>
      <p className={styles.lead}>Учитель: {teacher?.name ?? '—'} · учеников: {cls.memberIds.length}</p>

      <div className={styles.feedGrid}>
        <section className={styles.aside} aria-labelledby="assignments-title">
          <h2 id="assignments-title" className={styles.sectionTitle}>Задания</h2>
          {assignments.length === 0 ? <p className={styles.muted}>Заданий пока нет.</p> : null}
          <ul className={styles.list}>
            {assignments.map((a) => {
              const submission = mine.find((s) => s.assignmentId === a.id);
              return (
                <li key={a.id}>
                  <Link href={`/assignments/${a.id}`} className={`${styles.card} ${styles.cardLink} ${styles.rowCard}`}>
                    <h3 className={styles.cardTitle}>{a.title}</h3>
                    <div className={styles.chipsRow}>
                      <DeadlineChip dueAt={a.dueAt} done={Boolean(submission)} />
                      <SubmissionChip submission={submission} assignment={a} />
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        </section>

        <section aria-labelledby="lessons-title">
          <h2 id="lessons-title" className={styles.sectionTitle}>Уроки</h2>
          {lessons.length === 0 ? <p className={styles.muted}>Уроков пока нет.</p> : null}
          <div className={styles.list}>
            {lessons.map((lesson) => (
              <article key={lesson.id} className={styles.card}>
                <p className={styles.hint}>{formatDate(lesson.publishedAt)}</p>
                <h3 className={`${styles.cardTitle} ${styles.spaced}`}>{lesson.title}</h3>
                <Markdown text={lesson.body} />
                <MaterialList items={lesson.materials} />
                {user.role === 'student' ? (
                  <LessonRatingPicker lessonId={lesson.id} studentId={user.id} rating={ratings.find((r) => r.lessonId === lesson.id)} />
                ) : null}
              </article>
            ))}
          </div>
        </section>
      </div>
    </>
  );
}
