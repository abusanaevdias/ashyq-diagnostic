'use client';

import { useState } from 'react';
import Link from 'next/link';
import { LIBRARY_CATEGORIES, LIBRARY_CHAPTERS, type LibraryCategory } from '@/data/free-library';
import styles from './Library.module.css';

export default function LibraryCatalog() {
  const [category, setCategory] = useState<LibraryCategory>('Все');
  const [query, setQuery] = useState('');
  const needle = query.trim().toLocaleLowerCase('ru');
  const visible = LIBRARY_CHAPTERS.filter((chapter) => (category === 'Все' || chapter.category === category) && `${chapter.title} ${chapter.description} ${chapter.code} ${chapter.category}`.toLocaleLowerCase('ru').includes(needle));
  return <section id="chapters" className={styles.catalog} aria-labelledby="chapters-heading">
    <div className={styles.sectionHead}><div><p className={styles.kicker}>Откройте нужный навык</p><h2 id="chapters-heading">Ваша следующая практика</h2></div><label className={styles.search}>Поиск по темам<input type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Например, U01 или Reading" /></label></div>
    <div className={styles.filters} role="group" aria-label="Навык">{LIBRARY_CATEGORIES.map((item) => <button key={item} type="button" aria-pressed={category === item} onClick={() => setCategory(item)}>{item}</button>)}</div>
    <p className={styles.count} role="status" aria-live="polite">Разделов: {visible.length}</p>
    <div className={styles.grid}>{visible.map((chapter) => <Link className={styles.card} href={`/library/${chapter.slug}`} key={chapter.slug}>
      <div className={styles.cardMeta}><span>{chapter.category}</span><span>{chapter.code}</span></div><h3>{chapter.title}</h3><p>{chapter.description}</p><div className={styles.cardEnd}><span>{chapter.source === 'lab' ? 'Writing Lab · V3' : 'Основной том · V2'}</span><span aria-hidden="true">↗</span></div>
    </Link>)}</div>
    {!visible.length && <div className={styles.empty}><h3>Такую тему пока не нашли</h3><p>Попробуйте название навыка или код задания.</p><button type="button" onClick={() => { setQuery(''); setCategory('Все'); }}>Показать все разделы</button></div>}
  </section>;
}
