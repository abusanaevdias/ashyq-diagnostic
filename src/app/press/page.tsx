import type { Metadata } from 'next';
import Link from 'next/link';
import { Footer, NavBar } from '@/components/ui/CleanUi';
import { LIBRARY_CHAPTERS, LIBRARY_DOWNLOADS } from '@/data/free-library';
import { BLUESCREEN_COVERAGE } from '@/data/press-coverage';
import { chapterSections } from '@/lib/free-library';
import { buildLibraryPractice } from '@/lib/library-practice';
import { CONTACT_EMAIL, SITE_DESCRIPTION, SITE_URL } from '@/lib/site';
import styles from './press.module.css';

export const metadata: Metadata = {
  title: 'ASHYQ для СМИ — факты, практика и публикации',
  description: 'ASHYQ для СМИ: интервью в Bluescreen, открытая библиотека IELTS и практика Digital SAT. Проверяемые факты, ограничения диагностики и контакт команды.',
  alternates: { canonical: '/press' },
  robots: { index: true, follow: true },
  openGraph: {
    title: 'ASHYQ для СМИ — факты, практика и публикации',
    description: 'Интервью в Bluescreen и материалы для самостоятельной проверки продукта: упражнения, исходные PDF и ограничения проверки.',
    url: '/press',
    type: 'website',
  },
};

export default function PressPage() {
  const questions = LIBRARY_CHAPTERS.flatMap((chapter) => buildLibraryPractice(chapterSections(chapter.slug)))
    .flatMap((set) => set.questions);
  const automatic = questions.filter((question) => question.mode === 'auto').length;
  const comparison = questions.length - automatic;

  return <div className={`v3 ${styles.page}`}>
    <NavBar />
    <main className={styles.container}>
      <header className={styles.hero}>
        <p className={styles.kicker}>ASHYQ · материалы для редакций</p>
        <h1>ASHYQ для СМИ: факты, практика и публикации.</h1>
        <p className={styles.lead}>{SITE_DESCRIPTION}</p>
        <p>Ниже — открытые материалы и границы их применения. Эта страница подготовлена командой ASHYQ, а не независимой редакцией.</p>
        <div className={styles.actions}>
          <Link href="/library">Открыть бесплатную библиотеку</Link>
          <Link href="/library/reading-equipment#r01-b">Попробовать интерактивный Reading</Link>
          <Link href="/diagnostic">Открыть предварительную диагностику</Link>
        </div>
      </header>

      <section className={styles.section} aria-labelledby="coverage-title">
        <h2 id="coverage-title">Публикации об ASHYQ</h2>
        <p><time dateTime={BLUESCREEN_COVERAGE.publishedAt}>5 октября 2026 года</time> Bluescreen опубликовал интервью с основателем ASHYQ о бесплатной библиотеке IELTS и границах проверки учебных ответов. Автор материала — {BLUESCREEN_COVERAGE.author}.</p>
        <p><a className={styles.inlineLink} href={BLUESCREEN_COVERAGE.url}>{BLUESCREEN_COVERAGE.title}</a></p>
        <p>В интервью разбираются сверка с ключом и сравнение с образцом. Публикация не является рейтингом школы, подтверждением роста экзаменационных баллов или одобрением со стороны IELTS.</p>
        <Link className={styles.inlineLink} href={BLUESCREEN_COVERAGE.postPath}>Наш разбор интервью и маршрут по открытым упражнениям</Link>
      </section>

      <section className={styles.section} aria-labelledby="facts-title">
        <h2 id="facts-title">Что уже можно проверить</h2>
        <dl className={styles.facts}>
          <div><dt>Направления</dt><dd>Онлайн-подготовка к IELTS и Digital SAT по Казахстану. Постоянный офис на сайте не указан.</dd></div>
          <div><dt>Бесплатная библиотека IELTS</dt><dd>{LIBRARY_CHAPTERS.length} раздела, {questions.length} уникальных упражнений: {automatic} с автоматической проверкой по ключам и {comparison} со сравнением с образцом или критериями. Повторы в веб-версии и PDF не считаются новыми заданиями.</dd></div>
          <div><dt>Открытый Digital SAT</dt><dd>Отдельные вводные уроки: <Link href="/courses/sat/lessons/how-digital-sat-works">формат и модули</Link>, <Link href="/courses/sat/lessons/math-time">работа со временем в Math</Link>. Они не входят в число упражнений комплекта IELTS.</dd></div>
          <div><dt>Происхождение материалов</dt><dd>Авторские учебные эссе, тексты, скрипты и ситуации; не реальные работы учеников и не вопросы текущего экзамена. <Link href="/library/sources">Источники и авторство</Link>.</dd></div>
        </dl>
      </section>

      <section className={styles.section} aria-labelledby="limits-title">
        <h2 id="limits-title">Что проверка не умеет</h2>
        <ul className={styles.list}>
          <li>Автоматическая проверка сверяет выбор или короткий ответ с указанным ключом. Это не AI-оценивание смысла эссе.</li>
          <li>Открытые ответы сравниваются с учебным образцом или критериями. Разные формулировки могут быть корректными; вывод требует самостоятельного разбора или преподавателя.</li>
          <li>Диагностика даёт предварительный ориентир, а не официальный IELTS/SAT score. Учебные band-ориентиры материалов не являются оценкой ответа посетителя.</li>
          <li>ASHYQ не является официальным подразделением IELTS. Библиотека не подтверждает рост балла, результаты всей группы или независимую оценку качества школы.</li>
        </ul>
        <Link className={styles.inlineLink} href="/library/lab-method">Как устроены учебные ориентиры</Link>
      </section>

      <section className={styles.section} aria-labelledby="materials-title">
        <h2 id="materials-title">Материалы для редакционной проверки</h2>
        <p>Сначала откройте упражнение, отправьте ответ и изучите пояснение. Затем сравните его с исходным PDF: онлайн-версия не заменяет источник. Бесплатная библиотека доступна без регистрации.</p>
        <div className={styles.downloads}>
          {LIBRARY_DOWNLOADS.map((file) => <a href={file.href} key={file.href} download><strong>{file.label}</strong><span>{file.text}</span><span>Скачать исходный PDF ↓</span></a>)}
        </div>
        <div className={styles.actions}>
          <Link href="/library/u01-work-experience">Writing Lab: три учебные версии</Link>
          <Link href="/library/grammar-block-1">Упражнения по грамматике</Link>
          <Link href="/writing/trainer">Демо Writing-тренажёра</Link>
          <a href="/brand/wordmark-red.png" download>Логотип ASHYQ (PNG)</a>
        </div>
        <p className={styles.note}>Демо Writing-тренажёра использует подготовленные учебные случаи, а не автоматическую оценку любого эссе. Для иллюстрации интерфейса можно сделать собственный скриншот открытой практики; не включайте в публикацию личные ответы и контакты учеников. Логотип идентифицирует бренд и не означает партнёрство или одобрение редакционного материала.</p>
      </section>

      <section className={styles.contact} aria-labelledby="contact-title">
        <h2 id="contact-title">Контакт команды</h2>
        <p>Вопросы об авторстве, продукте и редакционных материалах:</p>
        <div className={styles.actions}><a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a><a href={SITE_URL}>Сайт ASHYQ</a><Link href="/contacts">Другие контакты</Link></div>
        <p className={styles.note}>Публикация и выводы остаются решением редакции. Материалы на этой странице не подтверждают партнёрство с редакциями, индексацию или гарантированную рекомендацию в поиске и AI-сервисах.</p>
      </section>
    </main>
    <Footer />
  </div>;
}
