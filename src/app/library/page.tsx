import type { Metadata } from 'next';
import Link from 'next/link';
import { ButtonLink, Footer, NavBar } from '@/components/ui/CleanUi';
import JsonLd from '@/components/JsonLd';
import LibraryCatalog from '@/components/library/LibraryCatalog';
import { LIBRARY_CHAPTERS, LIBRARY_DOWNLOADS } from '@/data/free-library';
import { SITE_URL } from '@/lib/site';
import styles from '@/components/library/Library.module.css';

export const metadata: Metadata = {
  title: 'Бесплатная библиотека IELTS и Writing Lab — ASHYQ',
  description: 'Авторская практика IELTS Academic: полные эссе Task 2, отчёты Task 1, Reading, Speaking, языковые упражнения и разборы. Читайте и занимайтесь прямо на сайте.',
  alternates: { canonical: '/library' },
};

export default function LibraryPage() {
  return <div className={`v3 ${styles.page}`}><NavBar /><main className={styles.container}>
    <JsonLd data={{ '@context': 'https://schema.org', '@type': 'CollectionPage', name: 'ASHYQ IELTS Free Library V3', url: `${SITE_URL}/library`, inLanguage: ['ru', 'en'], description: metadata.description, hasPart: LIBRARY_CHAPTERS.map((chapter) => ({ '@type': 'LearningResource', name: chapter.title, url: `${SITE_URL}/library/${chapter.slug}`, learningResourceType: 'Practice', isAccessibleForFree: true })) }} />
    <section className={styles.hero}><div><p className={styles.kicker}>ASHYQ Open Practice · бесплатно · без регистрации</p><h1>Не просто прочитать.<br /><span>Научиться делать.</span></h1><p className={styles.lead}>Ваша библиотека IELTS Academic: полные примеры, понятные разборы и самостоятельная практика. Всё читается прямо здесь — с телефона или компьютера.</p><div className={styles.actions}><ButtonLink href="/library/u01-work-experience">Начать Writing Lab</ButtonLink><ButtonLink href="#chapters" tone="outline">Выбрать навык</ButtonLink></div><p className={styles.small}>Объяснения на русском · практика на английском · два авторских тома</p></div>
    <aside className={styles.heroCard} aria-label="Как устроен Writing Lab"><p className={styles.kicker}>Writing Upgrade Lab / V3</p><h2>Одна тема.<br />{' '}Три версии.<br />{' '}Понятная разница.</h2><div className={styles.levels}><span>≈5.5</span><span aria-hidden="true">→</span><span>≈7.0</span><span aria-hidden="true">→</span><span>Target 9</span></div><p>Сравнивайте мысль, структуру и язык, а не запоминайте «красивые слова».</p><p className={styles.small}>Авторские учебные профили, не официальные оценки IELTS и не гарантия результата.</p><Link href="/library/lab-method" className={styles.inlineLink}>Что означают эти ориентиры ↗</Link></aside></section>
    <div className={styles.stats} aria-label="Состав авторского комплекта"><div><strong>24</strong><span>полных эссе Task 2</span></div><div><strong>6</strong><span>отчётов Task 1</span></div><div><strong>322</strong><span>задания по двум томам</span></div><div><strong>0 ₸</strong><span>доступ к библиотеке</span></div></div>
    <p className={styles.small}>Состав указан в предоставленном комплекте. Один и тот же материал в PDF, тетради и веб-версии считается один раз.</p>
    <section className={styles.method} aria-labelledby="method-title"><div><p className={styles.kicker}>Не гонка за страницами</p><h2 id="method-title">Попытка → разбор → новая задача.</h2><p>Сохраните первую мысль. Найдите конкретное улучшение. Проверьте его на незнакомом вопросе.</p></div><ol><li><strong>Сначала ваш ответ</strong><span>Прочитайте задание, сформулируйте позицию или решение.</span></li><li><strong>Затем сравнение</strong><span>Изучите версии и объясните, что стало точнее и почему.</span></li><li><strong>Наконец перенос</strong><span>Возьмите новый вопрос без образца — это отдельная проверка навыка.</span></li></ol></section>
    <LibraryCatalog />
    <section className={styles.downloads} id="downloads" aria-labelledby="download-title"><div><p className={styles.kicker}>Если удобнее офлайн</p><h2 id="download-title">Те же материалы. С собой.</h2><p>Для печати и работы без интернета. Онлайн-разделы выше содержат сами материалы, не только ссылки на файлы.</p></div><div>{LIBRARY_DOWNLOADS.map((file) => <a href={file.href} download key={file.href}><strong>{file.label}</strong><span>{file.text}</span><span>Скачать PDF ↓</span></a>)}</div></section>
    <section className={styles.boundaries}><h2>Практика, которой можно доверять без лишних обещаний</h2><p>ASHYQ не является официальным подразделением IELTS. Эссе, тексты, скрипты и ситуации комплекта — авторские учебные примеры, а не реальные работы учеников или вопросы текущего экзамена. Упражнения не дают официальный band; открытые ответы допускают разные корректные решения.</p><div className={styles.actions}><Link href="/library/sources">Источники и авторство</Link><Link href="/library/study-route">Маршрут на 21 день</Link><Link href="/courses/ielts">Подготовка с преподавателем</Link></div></section>
  </main><Footer /></div>;
}
