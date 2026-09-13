'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useState } from 'react';
import { track } from '@/lib/analytics';
import { formatDate } from '@/lib/lms/format';
import { useLmsData } from '@/lib/lms/hooks';
import { canReviewSubmission, ROUTE_ROLES } from '@/lib/lms/permissions';
import { getRepos } from '@/lib/lms/repos';
import type { User } from '@/lib/lms/types';
import ui from '@/components/ui/CleanUi.module.css';
import CommentThread from './CommentThread';
import { Avatar } from './Identity';
import MaterialList from './MaterialList';
import RequireRole from './RequireRole';
import { Loading, SubmissionChip, Unavailable } from './States';
import styles from './Lms.module.css';

export default function SubmissionReview() {
  const { id } = useParams<{ id: string }>();
  return <RequireRole roles={ROUTE_ROLES.teacher}>{(user) => <Review id={id} user={user} />}</RequireRole>;
}

function Review({ id, user }: { id: string; user: User }) {
  const repos = getRepos();
  const { data, loading } = useLmsData(async () => {
    const submission = await repos.submissions.get(id);
    if (!submission) return null;
    const assignment = await repos.assignments.get(submission.assignmentId);
    const cls = assignment ? await repos.classes.get(assignment.classId) : null;
    if (!assignment || !cls) return null;
    return { submission, assignment, cls, student: await repos.users.get(submission.studentId) };
  }, `review:${id}`);
  const [grade, setGrade] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [announce, setAnnounce] = useState('');

  if (loading) return <Loading />;
  if (!data || !canReviewSubmission(user, data.cls)) {
    return <Unavailable title="Сдача недоступна" text="Сдача не найдена или относится к чужому классу." href="/teacher" label="К классам" />;
  }
  const { submission, assignment, cls, student } = data;
  const value = grade ?? submission.grade?.toString() ?? '';
  const late = Date.parse(submission.submittedAt) > Date.parse(assignment.dueAt);

  const save = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setBusy(true);
    setError('');
    try {
      // пустое поле → NaN, репозиторий отклонит (Number('') было бы 0)
      const graded = await repos.submissions.grade(submission.id, value.trim() ? Number(value) : Number.NaN, assignment.maxPoints);
      track('lms_grade_set', { grade: graded.grade ?? 0, maxPoints: assignment.maxPoints });
      setGrade(null);
      setAnnounce(`Оценка сохранена: ${graded.grade} из ${assignment.maxPoints}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Оценка не сохранена');
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <Link href={`/teacher/classes/${cls.id}`} className={styles.backLink}>← {cls.title}</Link>
      <h1 className={styles.title}>{assignment.title}</h1>
      <div className={styles.whoRow}>
        <Avatar user={student ?? { name: '?', avatarColor: 'ink' }} />
        <span className={styles.commentName}>{student?.name ?? 'Ученик'}</span>
        <SubmissionChip submission={submission} assignment={assignment} />
      </div>
      <p className={styles.srOnly} aria-live="polite" role="status">{announce}</p>

      <section className={`${styles.card} ${styles.section}`} aria-labelledby="work-title">
        <h2 id="work-title" className={styles.sectionTitle}>Работа ученика</h2>
        <p className={styles.hint}>Отправлено {formatDate(submission.submittedAt)}{late ? ' · после дедлайна' : ''}</p>
        {submission.content ? <p className={styles.subContent}>{submission.content}</p> : null}
        <MaterialList items={submission.attachments} />
      </section>

      <section className={`${styles.card} ${styles.section}`} aria-labelledby="grade-title">
        <h2 id="grade-title" className={styles.sectionTitle}>Оценка</h2>
        {submission.status === 'graded' ? <p className={styles.grade}>Сейчас: <strong>{submission.grade} / {assignment.maxPoints}</strong></p> : null}
        <form className={styles.inlineForm} onSubmit={save} aria-busy={busy}>
          <label className={styles.fieldLabel}>
            Баллы (0–{assignment.maxPoints})
            <input className={styles.field} type="number" inputMode="numeric" min={0} max={assignment.maxPoints} step={1} value={value} onChange={(e) => setGrade(e.target.value)} required />
          </label>
          <button type="submit" className={ui.buttonBlack} disabled={busy}>{submission.status === 'graded' ? 'Изменить оценку' : 'Поставить оценку'}</button>
        </form>
        {error ? <p className={styles.error} role="alert">{error}</p> : null}
      </section>

      <CommentThread submission={submission} cls={cls} user={user} />
    </>
  );
}
