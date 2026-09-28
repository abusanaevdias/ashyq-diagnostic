import type { Metadata } from 'next';
import Link from 'next/link';
import { Footer, NavBar } from '@/components/ui/CleanUi';
import JsonLd from '@/components/JsonLd';
import LibraryCatalog from '@/components/library/LibraryCatalog';
import FreeStarters from '@/components/library/FreeStarters';
import { FREE_STARTERS } from '@/data/free-starters';
import { LIBRARY_CHAPTERS, LIBRARY_DOWNLOADS } from '@/data/free-library';
import { SITE_URL } from '@/lib/site';
import styles from '@/components/library/Library.module.css';

export const metadata: Metadata = {
  title: 'Бесплатные материалы IELTS и SAT — практика ASHYQ',
  description: 'Сразу откройте Writing Lab, Reading, Speaking, языковые упражнения или вводные уроки SAT. Авторская практика IELTS и разборы прямо на сайте, без регистрации.',
  alternates: { canonical: '/library' },
};

export default function LibraryPage() {
  return <div className={`v3 ${styles.page}`}><NavBar /><main className={styles.container}>
    <JsonLd data={{ '@context': 'https://schema.org', '@type': 'CollectionPage', name: 'Бесплатные материалы ASHYQ', url: `${SITE_URL}/library`, inLanguage: ['ru', 'en'], description: metadata.description, hasPart: [...LIBRARY_CHAPTERS.map((chapter) => ({ title: chapter.title, href: `/library/${chapter.slug}` })), ...FREE_STARTERS.filter((entry) => !entry.href.startsWith('/library/'))].map((entry) => ({ '@type': 'LearningResource', name: entry.title, url: `${SITE_URL}${entry.href}`, learningResourceType: 'Practice', isAccessibleForFree: true })) }} />
    <header className={styles.quickHeader}><p className={styles.kicker}>ASHYQ · бесплатно · без регистрации</p><h1>Бесплатная библиотека</h1><p>IELTS и Digital SAT. Выберите карточку — и сразу переходите к практике. Искать и скачивать PDF не обязательно.</p></header>
    <FreeStarters />
    <nav className={styles.quickLinks} aria-label="Другие бесплатные ресурсы"><Link href="#chapters">Все 42 раздела IELTS ↓</Link><Link href="/library/task1-enrolments">IELTS Task 1</Link><Link href="/library/study-route">План на 21 день</Link><Link href="/diagnostic">Проверить уровень</Link><Link href="#downloads">Три PDF для офлайн-работы ↓</Link></nav>
    <div className={styles.stats} aria-label="Состав авторского комплекта"><div><strong>24</strong><span>полных эссе Task 2</span></div><div><strong>6</strong><span>отчётов Task 1</span></div><div><strong>322</strong><span>задания по двум томам</span></div><div><strong>0 ₸</strong><span>доступ к библиотеке</span></div></div>
    <p className={styles.small}>Эти числа относятся к авторскому комплекту IELTS. SAT — отдельные открытые уроки. Повторы между PDF, тетрадью и веб-версией считаются один раз. Профили ≈5.5 / ≈7.0 / target 9 — учебные ориентиры, не официальные оценки: <Link href="/library/lab-method">что это означает</Link>.</p>
    <section className={styles.method} aria-labelledby="method-title"><div><p className={styles.kicker}>Не гонка за страницами</p><h2 id="method-title">Попытка → разбор → новая задача.</h2><p>Сохраните первую мысль. Найдите конкретное улучшение. Проверьте его на незнакомом вопросе.</p></div><ol><li><strong>Сначала ваш ответ</strong><span>Прочитайте задание, сформулируйте позицию или решение.</span></li><li><strong>Затем сравнение</strong><span>Изучите версии и объясните, что стало точнее и почему.</span></li><li><strong>Наконец перенос</strong><span>Возьмите новый вопрос без образца — это отдельная проверка навыка.</span></li></ol></section>
    <LibraryCatalog />
    <section className={styles.downloads} id="downloads" aria-labelledby="download-title"><div><p className={styles.kicker}>Если удобнее офлайн</p><h2 id="download-title">Те же материалы. С собой.</h2><p>Для печати и работы без интернета. Онлайн-разделы выше содержат сами материалы, не только ссылки на файлы.</p></div><div>{LIBRARY_DOWNLOADS.map((file) => <a href={file.href} download key={file.href}><strong>{file.label}</strong><span>{file.text}</span><span>Скачать PDF ↓</span></a>)}</div></section>
    <section className={styles.boundaries}><h2>Практика, которой можно доверять без лишних обещаний</h2><p>ASHYQ не является официальным подразделением IELTS. Эссе, тексты, скрипты и ситуации комплекта — авторские учебные примеры, а не реальные работы учеников или вопросы текущего экзамена. Упражнения не дают официальный band; открытые ответы допускают разные корректные решения.</p><div className={styles.actions}><Link href="/library/sources">Источники и авторство</Link><Link href="/library/study-route">Маршрут на 21 день</Link><Link href="/courses/ielts">Подготовка с преподавателем</Link></div></section>
  </main><Footer /></div>;
}
