'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import styles from './SearchV3.module.css';

export type SearchEntry = {
  section: 'Страницы' | 'Курсы' | 'FAQ' | 'Статьи';
  title: string;
  text: string;
  href: string;
  demo?: boolean;
};

const SECTION_ORDER: SearchEntry['section'][] = ['Страницы', 'Курсы', 'FAQ', 'Статьи'];

/**
 * Клиентский поиск по статическому индексу (без бэкенда): совпадение
 * подстроки в заголовке и тексте. Результаты — обычные ссылки, доступны
 * с клавиатуры; демо-статьи честно помечены.
 */
export default function SearchV3({ entries }: { entries: SearchEntry[] }) {
  const [query, setQuery] = useState('');

  const trimmed = query.trim();
  const groups = useMemo(() => {
    if (!trimmed) return [];
    const q = trimmed.toLowerCase();
    const hits = entries.filter(
      (entry) => entry.title.toLowerCase().includes(q) || entry.text.toLowerCase().includes(q),
    );
    return SECTION_ORDER.map((section) => ({
      section,
      items: hits.filter((entry) => entry.section === section),
    })).filter((group) => group.items.length > 0);
  }, [entries, trimmed]);

  const total = groups.reduce((sum, group) => sum + group.items.length, 0);

  return (
    <div>
      <div className={styles.inputWrap}>
        <input
          className={styles.input}
          type="text"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Например: IELTS, сезон, телефон"
          aria-label="Поиск по сайту ASHYQ"
          data-testid="site-search-input"
        />
        {query && (
          <button type="button" className={styles.clear} onClick={() => setQuery('')} aria-label="Очистить поиск">
            ×
          </button>
        )}
      </div>

      {trimmed === '' ? (
        <p className={styles.hint}>
          Поиск ищет по страницам, курсам, вопросам FAQ и материалам блога.
          Результаты — ссылки, выбирать можно клавишей Tab и Enter.
        </p>
      ) : total === 0 ? (
        <p className={styles.empty}>
          Ничего не нашлось. Попробуйте другое слово — например, «IELTS»,
          «сезон» или «телефон».
        </p>
      ) : (
        <div className={styles.groups} aria-live="polite">
          <p className="sr-only">
            Найдено результатов: {total}
          </p>
          {groups.map((group) => (
            <section key={group.section}>
              <h2 className={styles.groupTitle}>{group.section}</h2>
              <div className={styles.list}>
                {group.items.map((entry) => (
                  <Link key={`${entry.section}-${entry.href}-${entry.title}`} className={styles.result} href={entry.href}>
                    <span className={styles.resultTitle}>
                      {entry.title}
                      {entry.demo && <span className={styles.demoBadge}>демо</span>}
                    </span>
                    <span className={styles.resultText}>{entry.text}</span>
                  </Link>
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
