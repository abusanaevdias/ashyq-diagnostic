import Link from 'next/link';
import type { Assignment, Submission } from '@/lib/lms/types';
import { formatDate, isOverdue } from '@/lib/lms/format';
import ui from '@/components/ui/CleanUi.module.css';
import styles from './Lms.module.css';

export function Loading() {
  return <p className={`${styles.state} ${styles.muted}`} role="status">Загружаем…</p>;
}

export function Unavailable({ title, text, href, label }: { title: string; text: string; href: string; label: string }) {
  return (
    <section className={styles.state} aria-labelledby="unavailable-title">
      <h1 id="unavailable-title" className={styles.title}>{title}</h1>
      <p className={styles.lead}>{text}</p>
      <div className={styles.stateActions}>
        <Link href={href} className={ui.buttonBlack}>{label}</Link>
      </div>
    </section>
  );
}

/** «до 20 сен, 18:00»; если не сдано и срок прошёл — blush «просрочено». */
export function DeadlineChip({ dueAt, done = false }: { dueAt: string; done?: boolean }) {
  const overdue = !done && isOverdue(dueAt);
  return <span className={`${styles.chip} ${overdue ? styles.chipBlush : ''}`}>{overdue ? 'просрочено · ' : ''}до {formatDate(dueAt)}</span>;
}

export function SubmissionChip({ submission, assignment }: { submission: Submission | null | undefined; assignment: Assignment }) {
  if (!submission) return <span className={styles.chip}>не сдано</span>;
  if (submission.status === 'graded') return <span className={`${styles.chip} ${styles.chipInk}`}>оценка {submission.grade} / {assignment.maxPoints}</span>;
  const late = Date.parse(submission.submittedAt) > Date.parse(assignment.dueAt);
  return <span className={styles.chip}>{late ? 'сдано с опозданием' : 'на проверке'}</span>;
}
