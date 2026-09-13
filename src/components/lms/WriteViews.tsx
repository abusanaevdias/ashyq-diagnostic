'use client';

import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useState } from 'react';
import { track } from '@/lib/analytics';
import { BLOG_CATEGORIES, type BlogCategory } from '@/data/blog';
import { formatDay } from '@/lib/lms/format';
import { useLmsData } from '@/lib/lms/hooks';
import { canEditPost, ROUTE_ROLES } from '@/lib/lms/permissions';
import { getRepos } from '@/lib/lms/repos';
import type { BlogPost, User } from '@/lib/lms/types';
import { MicroLabel } from '@/components/ui/CleanUi';
import ui from '@/components/ui/CleanUi.module.css';
import Markdown from './Markdown';
import RequireRole from './RequireRole';
import { Loading, Unavailable } from './States';
import styles from './Lms.module.css';

const categoryLabel = (category: string) => BLOG_CATEGORIES[category as BlogCategory] ?? category;

/* ---------- /write: посты автора ---------- */

export function WriteHome() {
  return <RequireRole roles={ROUTE_ROLES.write}>{(user) => <PostList user={user} />}</RequireRole>;
}

function PostList({ user }: { user: User }) {
  const repos = getRepos();
  const router = useRouter();
  const { data, loading, error } = useLmsData(() => repos.blog.listByAuthor(user.id), `posts:${user.id}`);
  const [createError, setCreateError] = useState('');

  const create = async () => {
    setCreateError('');
    try {
      const draft = await repos.blog.createDraft(user.id);
      router.push(`/write/${draft.id}`);
    } catch (err) {
      setCreateError(err instanceof Error ? err.message : 'Черновик не создан');
    }
  };

  // черновики сверху, затем опубликованные — новые первыми
  const posts = data ? [...data].sort((a, b) => (a.status === b.status ? (b.publishedAt ?? '').localeCompare(a.publishedAt ?? '') : a.status === 'draft' ? -1 : 1)) : [];

  return (
    <>
      <MicroLabel>Редактору</MicroLabel>
      <h1 className={styles.title}>Мои посты</h1>
      <p className={styles.lead}>Черновики видите только вы. Опубликованные посты сразу появляются в блоге.</p>
      <div className={styles.actions}>
        <button type="button" className={ui.buttonBlack} onClick={create}>Новый пост</button>
      </div>
      {createError ? <p className={styles.error} role="alert">{createError}</p> : null}
      {loading ? <Loading /> : null}
      {error ? <p className={styles.error} role="alert">{error}</p> : null}
      {data && data.length === 0 ? <p className={`${styles.notice} ${styles.section}`}>Постов пока нет — начните с черновика.</p> : null}
      <ul className={`${styles.list} ${styles.section}`}>
        {posts.map((p) => (
          <li key={p.id}>
            <Link href={`/write/${p.id}`} className={`${styles.card} ${styles.cardLink} ${styles.rowCard}`}>
              <h2 className={styles.cardTitle}>{p.title}</h2>
              <div className={styles.chipsRow}>
                <span className={`${styles.chip} ${p.status === 'published' ? styles.chipInk : ''}`}>
                  {p.status === 'published' ? `опубликован${p.publishedAt ? ` · ${formatDay(p.publishedAt)}` : ''}` : 'черновик'}
                </span>
                <span className={styles.chip}>{categoryLabel(p.category)}</span>
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </>
  );
}

/* ---------- /write/[id]: markdown-lite редактор с превью ---------- */

export function WriteEditor() {
  const { id } = useParams<{ id: string }>();
  return <RequireRole roles={ROUTE_ROLES.write}>{(user) => <Editor id={id} user={user} />}</RequireRole>;
}

function Editor({ id, user }: { id: string; user: User }) {
  const repos = getRepos();
  const { data: post, loading } = useLmsData(() => repos.blog.get(id), `post-edit:${id}`);
  const [draft, setDraft] = useState<BlogPost | null>(null);
  const [pane, setPane] = useState<'edit' | 'preview'>('edit');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [status, setStatus] = useState('');

  if (loading) return <Loading />;
  if (!post || !canEditPost(user, post)) {
    return <Unavailable title="Пост недоступен" text="Пост не найден или принадлежит другому автору." href="/write" label="К постам" />;
  }
  const current = draft ?? post;
  const published = current.status === 'published';
  const edit = (patch: Partial<BlogPost>) => {
    setDraft({ ...current, ...patch });
    setStatus('');
  };

  // Публикация и снятие сначала сохраняют правки: репозиторий публикует сохранённый текст
  const run = async (action: 'save' | 'publish' | 'unpublish') => {
    setBusy(true);
    setError('');
    try {
      let result = await repos.blog.save(current);
      if (action === 'publish') {
        result = await repos.blog.publish(result.id);
        track('blog_post_published', { category: result.category });
        setStatus('Пост опубликован');
      } else if (action === 'unpublish') {
        result = await repos.blog.unpublish(result.id);
        setStatus('Пост снят с публикации');
      } else {
        setStatus(published ? 'Изменения сохранены' : 'Черновик сохранён');
      }
      setDraft(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не сохранено');
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <Link href="/write" className={styles.backLink}>← Мои посты</Link>
      <div className={styles.chipsRow}>
        <span className={`${styles.chip} ${published ? styles.chipInk : ''}`}>{published ? 'опубликован' : 'черновик'}</span>
      </div>
      <h1 className={styles.title}>{current.title.trim() || 'Без названия'}</h1>
      <p className={styles.srOnly} aria-live="polite" role="status">{status}</p>

      {/* вкладки только на узком экране; на десктопе текст и превью рядом */}
      <div className={styles.tabs} role="tablist" aria-label="Режим редактора">
        <button type="button" role="tab" id="tab-edit" aria-selected={pane === 'edit'} aria-controls="pane-edit" className={styles.tab} onClick={() => setPane('edit')}>Текст</button>
        <button type="button" role="tab" id="tab-preview" aria-selected={pane === 'preview'} aria-controls="pane-preview" className={styles.tab} onClick={() => setPane('preview')}>Превью</button>
      </div>

      <div className={styles.editorGrid}>
        <section id="pane-edit" role="tabpanel" aria-labelledby="tab-edit" className={`${styles.card} ${pane === 'edit' ? '' : styles.paneHidden}`}>
          <form className={styles.form} onSubmit={(event) => { event.preventDefault(); void run('save'); }} aria-busy={busy}>
            <label className={styles.fieldLabel}>
              Заголовок
              <input className={styles.field} value={current.title} onChange={(e) => edit({ title: e.target.value })} required maxLength={140} />
            </label>
            <div className={styles.fieldRow}>
              <label className={styles.fieldLabel}>
                Категория
                <select className={styles.field} value={current.category} onChange={(e) => edit({ category: e.target.value })}>
                  {(Object.keys(BLOG_CATEGORIES) as BlogCategory[]).map((c) => <option key={c} value={c}>{BLOG_CATEGORIES[c]}</option>)}
                </select>
              </label>
              <label className={styles.fieldLabel}>
                Анонс
                <input className={styles.field} value={current.excerpt} onChange={(e) => edit({ excerpt: e.target.value })} maxLength={240} />
              </label>
            </div>
            <label className={styles.fieldLabel}>
              Текст поста
              <textarea className={`${styles.field} ${styles.editorArea}`} value={current.body} onChange={(e) => edit({ body: e.target.value })} maxLength={50000} aria-describedby="post-md-hint" />
            </label>
            <p id="post-md-hint" className={styles.hint}>Разметка: «# » и «## » — заголовки, «- » — пункт списка, пустая строка — новый абзац.</p>
            {error ? <p className={styles.error} role="alert">{error}</p> : null}
            <div className={styles.actions}>
              <button type="submit" className={ui.buttonOutline} disabled={busy}>{published ? 'Сохранить изменения' : 'Сохранить черновик'}</button>
              {published ? (
                <button type="button" className={ui.buttonOutline} onClick={() => run('unpublish')} disabled={busy}>Снять с публикации</button>
              ) : (
                <button type="button" className={ui.buttonRed} onClick={() => run('publish')} disabled={busy}>Опубликовать</button>
              )}
              {published ? <Link href={`/blog/${current.slug}`} className={styles.reviewLink}>Открыть в блоге</Link> : null}
            </div>
          </form>
        </section>

        <section id="pane-preview" role="tabpanel" aria-labelledby="tab-preview" className={`${styles.card} ${styles.preview} ${pane === 'preview' ? '' : styles.paneHidden}`}>
          <p className={styles.hint}>Превью · {categoryLabel(current.category)}</p>
          <h2 className={`${styles.cardTitle} ${styles.spaced}`}>{current.title.trim() || 'Без названия'}</h2>
          {current.excerpt ? <p className={styles.muted}>{current.excerpt}</p> : null}
          {current.body.trim() ? <Markdown text={current.body} /> : <p className={styles.muted}>Текст поста появится здесь.</p>}
        </section>
      </div>
    </>
  );
}
