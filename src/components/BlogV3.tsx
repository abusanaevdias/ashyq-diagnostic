'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { BLOG_CATEGORIES, BLOG_IS_DEMO, type BlogCategory } from '@/data/blog';
import { formatDay, postCover } from '@/lib/lms/format';
import { useLmsData } from '@/lib/lms/hooks';
import { defaultPosts } from '@/lib/lms/local-repos';
import { getRepos } from '@/lib/lms/repos';
import { ButtonLink, FilterChip, Footer, MicroLabel, NavBar } from './ui/CleanUi';
import home from './HomeV3.module.css';
import styles from './BlogV3.module.css';

type Filter = 'all' | BlogCategory;

const FILTERS: Array<{ id: Filter; label: string }> = [
  { id: 'all', label: 'Все' },
  ...(Object.keys(BLOG_CATEGORIES) as BlogCategory[]).map((id) => ({ id, label: BLOG_CATEGORIES[id] })),
];

const categoryLabel = (category: string) => BLOG_CATEGORIES[category as BlogCategory] ?? category;
const isPhoto = (url: string) => /\.(?:jpe?g|png|webp|avif)(?:[?#]|$)/i.test(url);

/** Public blog index. The first published match is featured; filters and search keep repository order. */
export default function BlogV3() {
  const [filter, setFilter] = useState<Filter>('all');
  const [query, setQuery] = useState('');
  const { data } = useLmsData(() => getRepos().blog.listPublished(), 'blog:published');
  const q = query.trim().toLowerCase();
  const posts = (data ?? defaultPosts()).filter((post) =>
    (filter === 'all' || post.category === filter) &&
    (!q || `${post.title} ${post.excerpt}`.toLowerCase().includes(q)),
  );
  const [featured, ...rest] = posts;
  // Keep the existing SSR/client date contract: device-local dates only after data loads.
  const day = (iso?: string) => (data && iso ? formatDay(iso) : '');

  return (
    <div className={`${home.page} ${styles.page}`}>
      <NavBar />
      {BLOG_IS_DEMO ? <p className={styles.demoBar} role="note">Демо-контент: статьи ещё готовятся. Ниже — примеры тем, а не опубликованные материалы.</p> : null}

      <main>
        <header className={`${home.container} ${styles.masthead}`}>
          <p className={styles.eyebrow}>Журнал ASHYQ / IELTS · SAT · Поступление</p>
          <h1 className={styles.title}>БЛОГ<span aria-hidden="true">.</span></h1>
          <div className={styles.mastheadBottom}>
            <p>Понятные разборы экзаменов и практические решения для следующего шага.</p>
            <span>Материалы для подготовки и поступления</span>
          </div>
        </header>

        <section className={`${home.container} ${styles.library}`} aria-label="Статьи">
          <div className={styles.controls}>
            <div className={styles.chips} role="group" aria-label="Категории">
              {FILTERS.map((item) => <FilterChip key={item.id} active={filter === item.id} onClick={() => setFilter(item.id)}>{item.label}</FilterChip>)}
            </div>
            <input type="search" className={styles.search} placeholder="Поиск по статьям" aria-label="Поиск по статьям" value={query} onChange={(event) => setQuery(event.target.value)} />
          </div>

          {featured ? (
            <>
              <div className={styles.sectionHeading}>
                <h2>{filter === 'all' && !q ? 'Новый материал' : 'Материалы по запросу'}</h2>
                <span role="status" aria-live="polite">{filter === 'all' && !q ? 'Сначала новые' : `Найдено: ${posts.length}`}</span>
              </div>
              <article className={styles.featured}>
                <Link href={`/blog/${featured.slug}`} className={styles.featuredLink}>
                  <div className={styles.featuredPhoto}>
                    <Image src={postCover(featured.coverUrl)} alt="" fill priority sizes="(max-width: 900px) 100vw, 53vw" className={isPhoto(postCover(featured.coverUrl)) ? styles.photo : styles.illustration} />
                  </div>
                  <div className={styles.featuredBody}>
                    <span className={styles.category}>{categoryLabel(featured.category)}</span>
                    <h3 className={styles.featuredTitle}>{featured.title}</h3>
                    <p className={styles.excerpt}>{featured.excerpt}</p>
                    <time className={styles.date} dateTime={featured.publishedAt}>{day(featured.publishedAt)}</time>
                    <span className={styles.readMore}>Читать материал <span aria-hidden="true">↗</span></span>
                  </div>
                </Link>
              </article>

              {rest.length > 0 ? (
                <div className={styles.moreSection}>
                  <div className={styles.sectionHeading}>
                    <h2>{filter === 'all' && !q ? 'Последние статьи' : 'Другие материалы'}</h2>
                    <span>Сначала новые</span>
                  </div>
                  <div className={styles.grid}>
                    {rest.map((post) => (
                      <article className={styles.card} key={post.id}>
                        <Link href={`/blog/${post.slug}`} className={styles.cardLink}>
                          <div className={styles.cardPhoto}>
                            <Image src={postCover(post.coverUrl)} alt="" fill sizes="(max-width: 360px) 100vw, (max-width: 600px) 50vw, (max-width: 900px) 33vw, 25vw" className={isPhoto(postCover(post.coverUrl)) ? styles.photo : styles.illustration} />
                          </div>
                          <span className={styles.category}>{categoryLabel(post.category)}</span>
                          <h3 className={styles.cardTitle}>{post.title}</h3>
                          <time className={styles.date} dateTime={post.publishedAt}>{day(post.publishedAt)}</time>
                        </Link>
                      </article>
                    ))}
                  </div>
                </div>
              ) : null}
            </>
          ) : (
            <div className={styles.empty} role="status">
              <p>Ничего не нашлось. Попробуйте другой запрос или категорию.</p>
              <button type="button" onClick={() => { setQuery(''); setFilter('all'); }}>Сбросить поиск и фильтры</button>
            </div>
          )}
        </section>

        <section className={`${home.container} ${styles.bandSection}`}>
          <div className={styles.band}>
            <div>
              <MicroLabel>Новые материалы</MicroLabel>
              <h2 className={home.heading}>Хотите узнавать о новых статьях?</h2>
              <p className={styles.bandText}>Рассылки пока нет. Оставьте заявку на сезон — команда расскажет о новых материалах и ближайшем наборе.</p>
            </div>
            <div className={styles.bandAction}><ButtonLink href="/season" tone="black">Оставить заявку</ButtonLink></div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
