'use client';

import Image from 'next/image';
import Link from 'next/link';
import { BLOG_CATEGORIES, BLOG_IS_DEMO, type BlogCategory } from '@/data/blog';
import { formatDay, postCover } from '@/lib/lms/format';
import { useLmsData } from '@/lib/lms/hooks';
import { getRepos } from '@/lib/lms/repos';
import type { BlogPost, User } from '@/lib/lms/types';
import { Footer, NavBar } from '@/components/ui/CleanUi';
import home from '@/components/HomeV3.module.css';
import blog from '@/components/BlogV3.module.css';
import Markdown from './Markdown';
import { Loading, Unavailable } from './States';
import styles from './Lms.module.css';

const categoryLabel = (category: string) => BLOG_CATEGORIES[category as BlogCategory] ?? category;

export interface BlogPostPageData {
  post: BlogPost;
  author: User | null;
  more: BlogPost[];
}

/** /blog/[slug]: только опубликованные посты; черновик по прямой ссылке — «не найдена». */
export default function BlogPostView({ slug, language = 'ru', initialData }: { slug: string; language?: 'en' | 'ru'; initialData?: BlogPostPageData }) {
  const repos = getRepos();
  const { data, loading } = useLmsData(async () => {
    const post = await repos.blog.getPublishedBySlug(slug);
    if (!post) return null;
    const [author, all] = await Promise.all([repos.users.get(post.authorId), repos.blog.listPublished()]);
    return { post, author, more: all.filter((p) => p.id !== post.id).slice(0, 3) };
  }, `post:${slug}`, initialData);

  return (
    <div className={home.page}>
      <NavBar />
      {BLOG_IS_DEMO ? <p className={blog.demoBar} role="note">Демо-контент: статьи ещё готовятся.</p> : null}
      <main className={styles.main}>
        {loading ? (
          <Loading />
        ) : !data ? (
          <Unavailable title="Статья не найдена" text="Возможно, её сняли с публикации или адрес изменился." href="/blog" label="Все статьи" />
        ) : (
          <>
            <article className={styles.article} lang={language}>
              <Link href="/blog" className={styles.backLink}>{language === 'en' ? '← Blog' : '← Блог'}</Link>
              <div className={styles.chipsRow}><span className={styles.chip}>{categoryLabel(data.post.category)}</span></div>
              <h1 className={styles.title}>{data.post.title}</h1>
              <p className={styles.lead}>
                {data.author?.name ?? (language === 'en' ? 'ASHYQ Team' : 'Команда ASHYQ')}
                {data.post.publishedAt ? ` · ${language === 'en' ? 'Published' : 'Опубликовано'} ${formatArticleDay(data.post.publishedAt, language)}` : ''}
                {data.post.updatedAt ? ` · ${language === 'en' ? 'Updated' : 'Обновлено'} ${formatArticleDay(data.post.updatedAt, language)}` : ''}
              </p>
              <div className={styles.articleCover}>
                <Image src={postCover(data.post.coverUrl)} alt={data.post.coverAlt ?? ''} fill priority sizes="(max-width: 900px) 100vw, 760px" />
              </div>
              <Markdown text={data.post.body} />
            </article>

            {data.more.length ? (
              <section className={styles.moreSection} aria-labelledby="more-title">
                <h2 id="more-title" className={styles.sectionTitle}>{language === 'en' ? 'More articles' : 'Другие статьи'}</h2>
                <div className={styles.grid3}>
                  {data.more.map((p) => (
                    <Link key={p.id} href={`/blog/${p.slug}`} className={`${styles.card} ${styles.cardLink}`}>
                      <span className={styles.chip}>{categoryLabel(p.category)}</span>
                      <h3 className={`${styles.cardTitle} ${styles.spaced}`}>{p.title}</h3>
                      <p className={styles.muted}>{p.excerpt}</p>
                    </Link>
                  ))}
                </div>
              </section>
            ) : null}
          </>
        )}
      </main>
      <Footer />
    </div>
  );
}

function formatArticleDay(iso: string, language: 'en' | 'ru'): string {
  return language === 'en'
    ? new Intl.DateTimeFormat('en', { day: 'numeric', month: 'short' }).format(new Date(iso))
    : formatDay(iso);
}
