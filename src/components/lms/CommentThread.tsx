'use client';

import { useState } from 'react';
import { track } from '@/lib/analytics';
import { relativeTime } from '@/lib/lms/format';
import { useLmsData } from '@/lib/lms/hooks';
import { canUseThread } from '@/lib/lms/permissions';
import { getRepos } from '@/lib/lms/repos';
import type { ClassRoom, Submission, User } from '@/lib/lms/types';
import ui from '@/components/ui/CleanUi.module.css';
import { Avatar, RoleBadge } from './Identity';
import styles from './Lms.module.css';

/**
 * Тред сдачи: только автор сдачи и учитель класса (canUseThread).
 * Хронологически, новые снизу; новые чужие комментарии объявляет aria-live.
 */
export default function CommentThread({ submission, cls, user }: { submission: Submission; cls: ClassRoom; user: User }) {
  const repos = getRepos();
  const { data } = useLmsData(async () => {
    const comments = await repos.comments.listBySubmission(submission.id);
    const people = await repos.users.listByIds([...new Set(comments.map((c) => c.authorId))]);
    return { comments, people };
  }, `thread:${submission.id}`);
  const [body, setBody] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [announce, setAnnounce] = useState('');
  const [seenCount, setSeenCount] = useState<number | null>(null);

  // Производное состояние в рендере (не в эффекте): пришёл чужой комментарий → объявить
  const count = data?.comments.length ?? null;
  if (count !== null && count !== seenCount) {
    const last = data!.comments[count - 1];
    if (seenCount !== null && count > seenCount && last && last.authorId !== user.id) {
      const author = data!.people.find((p) => p.id === last.authorId)?.name ?? 'участник';
      setAnnounce(`Новый комментарий от ${author}: ${last.body}`);
    }
    setSeenCount(count);
  }

  if (!canUseThread(user, submission, cls)) return null;

  const send = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setBusy(true);
    setError('');
    try {
      await repos.comments.create({ submissionId: submission.id, authorId: user.id, authorRole: user.role, body });
      track('lms_comment_created', { role: user.role });
      setBody('');
      setAnnounce('Комментарий отправлен');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Комментарий не отправлен');
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className={`${styles.card} ${styles.section}`} aria-labelledby={`thread-${submission.id}`}>
      <h2 id={`thread-${submission.id}`} className={styles.sectionTitle}>Комментарии</h2>
      <p className={styles.srOnly} aria-live="polite" role="status">{announce}</p>
      {data && data.comments.length === 0 ? <p className={styles.muted}>Комментариев пока нет.</p> : null}
      <ol className={styles.thread}>
        {data?.comments.map((comment) => {
          const author = data.people.find((p) => p.id === comment.authorId);
          return (
            <li key={comment.id} className={styles.comment}>
              <Avatar user={author ?? { name: '?', avatarColor: 'ink' }} />
              <div>
                <p className={styles.commentHead}>
                  <span className={styles.commentName}>{author?.name ?? 'Участник'}</span>
                  <RoleBadge role={comment.authorRole} />
                  <time className={styles.commentTime} dateTime={comment.createdAt}>{relativeTime(comment.createdAt)}</time>
                </p>
                <p className={styles.commentBody}>{comment.body}</p>
              </div>
            </li>
          );
        })}
      </ol>
      <form className={styles.form} onSubmit={send} aria-busy={busy}>
        <label className={styles.fieldLabel}>
          Ваш комментарий
          <textarea className={styles.field} value={body} onChange={(e) => setBody(e.target.value)} required maxLength={2000} />
        </label>
        {error ? <p className={styles.error} role="alert">{error}</p> : null}
        <div>
          <button type="submit" className={ui.buttonBlack} disabled={busy || !body.trim()}>Отправить</button>
        </div>
      </form>
    </section>
  );
}
