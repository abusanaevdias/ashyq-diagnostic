'use client';

import { useState } from 'react';
import Link from 'next/link';
import { LIBRARY_CATEGORIES, LIBRARY_CHAPTERS, type LibraryCategory } from '@/data/free-library';
import { FREE_STARTERS } from '@/data/free-starters';
import FreeStarters from './FreeStarters';
import LibraryFolio from './LibraryFolio';
import styles from './Library.module.css';
import entry from './LibraryEntry.module.css';

export default function LibraryCatalog() {
  const [category, setCategory] = useState<LibraryCategory>('Все');
  const [query, setQuery] = useState('');
  const needle = query.trim().toLocaleLowerCase('ru');
  const filtering = category !== 'Все' || Boolean(needle);
  const visible = LIBRARY_CHAPTERS.filter((chapter) => (category === 'Все' || chapter.category === category) && `${chapter.title} ${chapter.description} ${chapter.code} ${chapter.category}`.toLocaleLowerCase('ru').includes(needle));
  const starterMatches = needle ? FREE_STARTERS.filter(item => `${item.title} ${item.text}`.toLocaleLowerCase('ru').includes(needle) && !visible.some(chapter => `/library/${chapter.slug}` === item.href)) : [];
  return <div className={entry.directory}>
    <div className={entry.finder}>
      <label className={entry.search}>Поиск по темам<input type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Найти материал: тема, навык или код" aria-controls="chapters" /></label>
      <div className={`${styles.filters} ${entry.filters}`} role="group" aria-label="Навык">{LIBRARY_CATEGORIES.map((item) => <button key={item} type="button" aria-pressed={category === item} aria-controls="chapters" onClick={() => setCategory(item)}>{item}</button>)}</div>
      {filtering && <button className={entry.reset} type="button" onClick={() => { setQuery(''); setCategory('Все'); }}>Сбросить поиск и фильтр</button>}
    </div>
    {!filtering && <>
      <LibraryFolio />
      <section className={entry.quickEntries} aria-labelledby="quick-entry-title"><h2 id="quick-entry-title">Открытая практика IELTS и SAT</h2><p>Уже знаешь, что нужно? Открой материал или вводный урок сразу.</p><FreeStarters /></section>
    </>}
    <section id="chapters" className={`${styles.catalog} ${entry.results}`} aria-labelledby="chapters-heading">
      <div className={styles.sectionHead}><div><p className={styles.kicker}>Авторский комплект IELTS</p><h2 id="chapters-heading">{filtering ? 'Найденные разделы' : 'Все разделы IELTS'}</h2></div></div>
      <p className={styles.count} role="status" aria-live="polite">Разделов: {visible.length}{starterMatches.length > 0 && ` · других материалов: ${starterMatches.length}`}</p>
      <div className={styles.grid}>{visible.map((chapter) => <Link className={styles.card} href={`/library/${chapter.slug}`} key={chapter.slug}>
        <div className={styles.cardMeta}><span>{chapter.category}</span><span>{chapter.code}</span></div><h3>{chapter.title}</h3><p>{chapter.description}</p><div className={styles.cardEnd}><span>{chapter.source === 'lab' ? 'Writing Lab · V3' : 'Основной том · V2'}</span><span aria-hidden="true">↗</span></div>
      </Link>)}</div>
      {starterMatches.length > 0 && <section className={entry.otherResults} aria-labelledby="other-results-title"><h3 id="other-results-title">Другие открытые материалы по запросу</h3><p>Вводные уроки SAT и дополнительные входы в практику. Фильтр навыков выше относится к разделам IELTS.</p><div className={styles.grid}>{starterMatches.map(item => <Link key={item.id} href={item.href} className={styles.card}><h3>{item.title}</h3><p>{item.text}</p><span>Открыть бесплатно ↗</span></Link>)}</div></section>}
      {!visible.length && !starterMatches.length && <div className={styles.empty}><h3>Такую тему пока не нашли</h3><p>Попробуйте название навыка или код задания.</p><button type="button" onClick={() => { setQuery(''); setCategory('Все'); }}>Показать все разделы</button></div>}
    </section>
  </div>;
}
