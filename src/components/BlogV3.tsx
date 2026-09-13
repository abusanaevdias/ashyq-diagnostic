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

/**
 * /blog по DESIGN_V3 §6.5. Статьи — опубликованные посты из BlogRepo (LMS-001);
 * на сервере и до загрузки — стартовые темы, чтобы разметка не была пустой.
 * Подписка без бэкенда — ведём в заявку сезона.
 */

type Filter = 'all' | BlogCategory;

const FILTERS: Array<{ id: Filter; label: string }> = [
  { id: 'all', label: 'Все' },
  ...(Object.keys(BLOG_CATEGORIES) as BlogCategory[]).map((id) => ({ id, label: BLOG_CATEGORIES[id] })),
];

const categoryLabel = (category: string) => BLOG_CATEGORIES[category as BlogCategory] ?? category;

export default function BlogV3() {
  const [filter, setFilter] = useState<Filter>('all');
  const [query, setQuery] = useState('');
  const { data } = useLmsData(() => getRepos().blog.listPublished(), 'blog:published');
  const q = query.trim().toLowerCase();
  const posts = (data ?? defaultPosts()).filter((post) => (filter === 'all' || post.category === filter) && (!q || `${post.title} ${post.excerpt}`.toLowerCase().includes(q)));
  const [featured, ...rest] = posts;
  // дата в часовом поясе устройства — только после загрузки, иначе расхождение SSR/клиента
  const day = (iso?: string) => (data && iso ? formatDay(iso) : '');

  return (
    <div className={home.page}>
      <NavBar />
      {BLOG_IS_DEMO ? <p className={styles.demoBar} role="note">Демо-контент: статьи ещё готовятся. Ниже — примеры тем, а не опубликованные материалы.</p> : null}

      <main>
        <section className={`${home.container} ${styles.hero}`}>
          <div className={styles.heroGrid}>
            <div className={styles.heroCopy}>
              <MicroLabel>Блог ASHYQ</MicroLabel>
              <h1 className={styles.title}>Разборы, стратегии и жизнь сезона</h1>
              <p className={home.lead}>Короткие материалы о подготовке к IELTS и SAT, типичных ошибках и о том, как устроены Match Days.</p>
            </div>
            <div className={styles.thumb}><Image src="/brand/hero-students.jpg" alt="Студенты ASHYQ на занятии" fill priority sizes="(max-width: 900px) 100vw, 40vw" /></div>
          </div>
        </section>

        <section className={`${home.container} ${home.section}`} aria-label="Статьи">
          <div className={styles.controls}>
            <div className={styles.chips} role="group" aria-label="Категории">
              {FILTERS.map((item) => <FilterChip key={item.id} active={filter === item.id} onClick={() => setFilter(item.id)}>{item.label}</FilterChip>)}
            </div>
            <input type="search" className={styles.search} placeholder="Поиск по статьям" aria-label="Поиск по статьям" value={query} onChange={(event) => setQuery(event.target.value)} />
          </div>

          {featured ? (
            <div className={styles.grid}>
              <article className={styles.featured}>
                <Link href={`/blog/${featured.slug}`} className={styles.postLink}>
                  <div className={styles.featuredPhoto}>
                    <Image src={postCover(featured.coverUrl)} alt="" fill sizes="(max-width: 900px) 100vw, 58vw" />
                    <span className={styles.badge}>{categoryLabel(featured.category)}</span>
                  </div>
                  <div className={styles.featuredBody}>
                    <h2 className={styles.featuredTitle}>{featured.title}</h2>
                    <p className={styles.excerpt}>{featured.excerpt}</p>
                    <div className={styles.metaRow}><span>{day(featured.publishedAt)}</span><span className={styles.soon}>Читать →</span></div>
                  </div>
                </Link>
              </article>
              {rest.length ? (
                <div className={styles.side}>
                  {rest.map((post) => (
                    <article key={post.id}>
                      <Link href={`/blog/${post.slug}`} className={styles.sideItem}>
                        <div className={styles.sideThumb}><Image src={postCover(post.coverUrl)} alt="" fill sizes="72px" /></div>
                        <div>
                          <h3 className={styles.sideTitle}>{post.title}</h3>
                          <p className={styles.sideMeta}>{categoryLabel(post.category)}{day(post.publishedAt) ? ` · ${day(post.publishedAt)}` : ''}</p>
                        </div>
                      </Link>
                    </article>
                  ))}
                </div>
              ) : null}
            </div>
          ) : (
            <p className={styles.empty}>Ничего не нашлось. Попробуйте другой запрос или категорию.</p>
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
