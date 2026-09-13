'use client';

import { useState } from 'react';
import Image from 'next/image';
import { BLOG_CATEGORIES, BLOG_IS_DEMO, BLOG_POSTS, type BlogCategory } from '@/data/blog';
import { ButtonLink, FilterChip, Footer, MicroLabel, NavBar } from './ui/CleanUi';
import home from './HomeV3.module.css';
import styles from './BlogV3.module.css';

/**
 * /blog по DESIGN_V3 §6.5. Статей-страниц пока нет, поэтому карточки
 * не ссылки, а «Скоро». Подписка без бэкенда — ведём в заявку сезона.
 */

type Filter = 'all' | BlogCategory;

const FILTERS: Array<{ id: Filter; label: string }> = [
  { id: 'all', label: 'Все' },
  ...(Object.keys(BLOG_CATEGORIES) as BlogCategory[]).map((id) => ({ id, label: BLOG_CATEGORIES[id] })),
];

export default function BlogV3() {
  const [filter, setFilter] = useState<Filter>('all');
  const [query, setQuery] = useState('');
  const q = query.trim().toLowerCase();
  const posts = BLOG_POSTS.filter((post) => (filter === 'all' || post.category === filter) && (!q || `${post.title} ${post.excerpt}`.toLowerCase().includes(q)));
  const [featured, ...rest] = posts;

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
                <div className={styles.featuredPhoto}>
                  <Image src={featured.photo} alt="" fill sizes="(max-width: 900px) 100vw, 58vw" />
                  <span className={styles.badge}>{BLOG_CATEGORIES[featured.category]}</span>
                </div>
                <div className={styles.featuredBody}>
                  <h2 className={styles.featuredTitle}>{featured.title}</h2>
                  <p className={styles.excerpt}>{featured.excerpt}</p>
                  <div className={styles.metaRow}><span>Статья готовится</span><span className={styles.soon}>Скоро</span></div>
                </div>
              </article>
              {rest.length ? (
                <div className={styles.side}>
                  {rest.slice(0, 3).map((post) => (
                    <article className={styles.sideItem} key={post.slug}>
                      <div className={styles.sideThumb}><Image src={post.photo} alt="" fill sizes="72px" /></div>
                      <div><h3 className={styles.sideTitle}>{post.title}</h3><p className={styles.sideMeta}>{BLOG_CATEGORIES[post.category]} · скоро</p></div>
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
