'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useState } from 'react';
import { track } from '@/lib/analytics';
import { formatDate, isOverdue } from '@/lib/lms/format';
import { useLmsData } from '@/lib/lms/hooks';
import { canSubmit, ROUTE_ROLES } from '@/lib/lms/permissions';
import { getRepos } from '@/lib/lms/repos';
import type { MaterialRef, User } from '@/lib/lms/types';
import ui from '@/components/ui/CleanUi.module.css';
import CommentThread from './CommentThread';
import FilePicker from './FilePicker';
import Markdown from './Markdown';
import MaterialList from './MaterialList';
import RequireRole from './RequireRole';
import { DeadlineChip, Loading, SubmissionChip, Unavailable } from './States';
import styles from './Lms.module.css';

export default function AssignmentView() {
  const { id } = useParams<{ id: string }>();
  return <RequireRole roles={ROUTE_ROLES.classes}>{(user) => <AssignmentPage id={id} user={user} />}</RequireRole>;
}

function AssignmentPage({ id, user }: { id: string; user: User }) {
  const repos = getRepos();
  const { data, loading } = useLmsData(async () => {
    const assignment = await repos.assignments.get(id);
    if (!assignment) return null;
    const cls = await repos.classes.get(assignment.classId);
    if (!cls) return null;
    return { assignment, cls, submission: await repos.submissions.getForStudent(id, user.id) };
  }, `assignment:${id}:${user.id}`);

  const [content, setContent] = useState<string | null>(null);
  const [files, setFiles] = useState<MaterialRef[] | null>(null);
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [announce, setAnnounce] = useState('');
  const [seenStatus, setSeenStatus] = useState<string | null>(null);

  // Оценка поставлена, пока страница открыта (в т. ч. в другой вкладке) → объявить
  const status = data ? data.submission?.status ?? 'none' : null;
  if (status !== null && status !== seenStatus) {
    if (seenStatus === 'submitted' && status === 'graded' && data?.submission) {
      setAnnounce(`Работа оценена: ${data.submission.grade} из ${data.assignment.maxPoints}`);
    }
    setSeenStatus(status);
  }

  if (loading) return <Loading />;
  if (!data || !canSubmit(user, data.cls)) {
    return <Unavailable title="Задание недоступно" text="Задание не найдено или вы не состоите в этом классе." href="/classes" label="К моим классам" />;
  }
  const { assignment, cls, submission } = data;
  const showForm = !submission || (editing && submission.status === 'submitted');
  const draftContent = content ?? submission?.content ?? '';
  const draftFiles = files ?? submission?.attachments ?? [];

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setBusy(true);
    setError('');
    try {
      await repos.submissions.submit({ assignmentId: assignment.id, studentId: user.id, content: draftContent, attachments: draftFiles });
      track('lms_submission_created', { late: isOverdue(assignment.dueAt), attachments: draftFiles.length });
      setEditing(false);
      setContent(null);
      setFiles(null);
      setAnnounce('Работа отправлена учителю');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Работа не отправлена');
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <Link href={`/classes/${cls.id}`} className={styles.backLink}>← {cls.title}</Link>
      <h1 className={styles.title}>{assignment.title}</h1>
      <div className={styles.chipsRow}>
        <DeadlineChip dueAt={assignment.dueAt} done={Boolean(submission)} />
        <span className={styles.chip}>до {assignment.maxPoints} баллов</span>
      </div>
      <p className={styles.srOnly} aria-live="polite" role="status">{announce}</p>

      <section className={`${styles.card} ${styles.section}`} aria-labelledby="brief-title">
        <h2 id="brief-title" className={styles.sectionTitle}>Задание</h2>
        <Markdown text={assignment.brief} />
      </section>

      {showForm ? (
        <section className={`${styles.card} ${styles.section}`} aria-labelledby="answer-title">
          <h2 id="answer-title" className={styles.sectionTitle}>{submission ? 'Изменить ответ' : 'Ваш ответ'}</h2>
          {isOverdue(assignment.dueAt) && !submission ? (
            <p className={`${styles.notice} ${styles.spaced}`}>Дедлайн прошёл — сдать всё ещё можно, работа будет помечена «сдано с опозданием».</p>
          ) : null}
          <form className={styles.form} onSubmit={submit} aria-busy={busy}>
            <label className={styles.fieldLabel}>
              Ответ
              <textarea className={styles.field} value={draftContent} onChange={(e) => setContent(e.target.value)} maxLength={20000} />
            </label>
            <FilePicker files={draftFiles} onChange={setFiles} disabled={busy} />
            {error ? <p className={styles.error} role="alert">{error}</p> : null}
            <div className={styles.actions}>
              <button type="submit" className={ui.buttonBlack} disabled={busy}>{submission ? 'Сохранить ответ' : 'Сдать работу'}</button>
              {editing ? <button type="button" className={ui.buttonOutline} onClick={() => setEditing(false)}>Отмена</button> : null}
            </div>
          </form>
        </section>
      ) : submission ? (
        <section className={`${styles.card} ${styles.section}`} aria-labelledby="submission-title">
          <h2 id="submission-title" className={styles.sectionTitle}>Ваша сдача</h2>
          <div className={styles.chipsRow}><SubmissionChip submission={submission} assignment={assignment} /></div>
          {submission.status === 'graded' ? (
            <p className={styles.grade}>Оценка: <strong>{submission.grade} / {assignment.maxPoints}</strong></p>
          ) : null}
          <p className={styles.hint}>Отправлено {formatDate(submission.submittedAt)}</p>
          {submission.content ? <p className={styles.subContent}>{submission.content}</p> : null}
          <MaterialList items={submission.attachments} />
          {submission.status === 'submitted' ? (
            <div className={styles.actions}>
              <button type="button" className={styles.textButton} onClick={() => setEditing(true)}>Изменить ответ</button>
            </div>
          ) : null}
        </section>
      ) : null}

      {submission ? <CommentThread submission={submission} cls={cls} user={user} /> : null}
    </>
  );
}
