import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Footer, NavBar } from '@/components/ui/CleanUi';
import JsonLd from '@/components/JsonLd';
import LibraryContent from '@/components/library/LibraryContent';
import StudyPad from '@/components/library/StudyPad';
import ListeningAudio from '@/components/library/ListeningAudio';
import { LIBRARY_CHAPTERS, LIBRARY_DOWNLOADS } from '@/data/free-library';
import { chapterSections, libraryChapter } from '@/lib/free-library';
import { SITE_URL } from '@/lib/site';
import styles from '@/components/library/Library.module.css';

type Props = { params: Promise<{ slug: string }> };
export const dynamicParams = false;
export function generateStaticParams() { return LIBRARY_CHAPTERS.map(({ slug }) => ({ slug })); }
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params; const chapter = libraryChapter(slug);
  return chapter ? { title: `${chapter.title} — бесплатная практика IELTS | ASHYQ`, description: chapter.description, alternates: { canonical: `/library/${slug}` } } : {};
}

export default async function LibraryChapterPage({ params }: Props) {
  const { slug } = await params;
  const chapter = libraryChapter(slug); if (!chapter) notFound();
  const sections = chapterSections(slug);
  const blockLabel = sections.length % 10 === 1 && sections.length % 100 !== 11 ? 'блок' : sections.length % 10 >= 2 && sections.length % 10 <= 4 && !(sections.length % 100 >= 12 && sections.length % 100 <= 14) ? 'блока' : 'блоков';
  const index = LIBRARY_CHAPTERS.findIndex((entry) => entry.slug === slug);
  const next = LIBRARY_CHAPTERS[index + 1];
  const related = LIBRARY_CHAPTERS.filter((entry) => entry.category === chapter.category && entry.slug !== slug).slice(0, 4);
  const answerSection = chapter.category === 'Listening' ? sections.find((section) => section.answer) : undefined;
  const audio = answerSection?.blocks.filter((block) => block.kind === 'paragraph' && block.text && !/[А-Яа-яЁё]/.test(block.text) && !/^L0\d-\d/.test(block.text)).map((block) => block.text).join('\n\n');
  return <div className={`v3 ${styles.page}`}><NavBar /><main className={styles.container}>
    <JsonLd data={{ '@context': 'https://schema.org', '@type': 'LearningResource', name: chapter.title, description: chapter.description, url: `${SITE_URL}/library/${slug}`, inLanguage: ['ru', 'en'], learningResourceType: 'Practice', isAccessibleForFree: true, provider: { '@type': 'EducationalOrganization', name: 'ASHYQ' } }} />
    <nav className={styles.breadcrumb} aria-label="Хлебные крошки"><Link href="/library">← Библиотека</Link><span>{chapter.category} / {chapter.code}</span></nav>
    <header className={styles.chapterHero}><p className={styles.kicker}>ASHYQ · {chapter.source === 'lab' ? 'Writing Upgrade Lab V3' : 'Free Library V2'} · бесплатно</p><h1>{chapter.title}</h1><p className={styles.lead}>{chapter.description}</p><p className={styles.small}>Учебные образцы: приблизительные профили, не официальные баллы. Сначала своя попытка, затем разбор. Заметки в полях исчезнут при переходе — копируйте перед выходом.</p></header>
    {slug === 'start' && <p className={styles.small}>Примечание веб-редакции: упомянутый в исходном PDF предыдущий Starter Kit / раздел «База» не входит в эти три файла и здесь не опубликован. Все доступные материалы находятся в оглавлении библиотеки.</p>}
    {['sources', 'lab-sources', 'listening-official'].includes(slug) && <p className={styles.small}>Примечание веб-редакции: ниже сохранены примечания авторского PDF на момент его подготовки. Они не подтверждают актуальную доступность внешних плееров или официальную проверку учебных оценок. Источники открываются отдельно на сайтах правообладателей.</p>}
    {audio && <ListeningAudio script={audio} />}
    <div className={styles.reader}><aside className={styles.contents}><details><summary>Оглавление · {sections.length} {blockLabel}</summary><nav aria-label="Внутри раздела"><p className={styles.kicker}>Внутри раздела</p>{sections.map((section) => <a href={`#${section.code.toLowerCase()}`} key={section.code}><span>{section.code}</span>{section.title}{section.answer ? ' · ответы' : ''}</a>)}</nav></details><a className={styles.inlineLink} href={LIBRARY_DOWNLOADS[chapter.source === 'lab' ? 1 : 0].href} download>Этот том в PDF ↓</a></aside>
    <article className={styles.article}>{sections.map((section) => <section id={section.code.toLowerCase()} className={section.answer ? styles.answerSection : styles.lessonSection} key={section.code}>
      {section.answer ? <details className={styles.answers}><summary><span className={styles.kicker}>{section.code} · откройте после попытки</span><h2>{section.title}</h2><span className={styles.answerAction}>Открыть / закрыть объяснения +</span></summary><div className={styles.answerBody}><p className={styles.small}>{section.subtitle}</p><LibraryContent blocks={section.blocks} title={section.title} /><p className={styles.small}>Для открытых вопросов сравнивайте смысл и критерии, не требуйте дословного совпадения с образцом.</p></div></details> : <><div className={styles.lessonHead}><p className={styles.kicker}>{section.code}</p><h2>{section.title}</h2>{section.subtitle && <p className={styles.small}>{section.subtitle}</p>}</div><LibraryContent blocks={section.blocks} title={section.title} />{section.exercise && <StudyPad code={section.code} />}</>}
      <p className={styles.provenance}>Источник: {section.source === 'lab' ? 'Writing Upgrade Lab V3' : 'Free Library V3, часть V2'}, страница файла {section.page}. Код сохранён из PDF.</p>
    </section>)}</article></div>
    <section className={styles.related}><h2>Продолжить практику</h2><div className={styles.actions}>{next && <Link href={`/library/${next.slug}`}>Следующий раздел: {next.title} →</Link>}{related.map((entry) => <Link key={entry.slug} href={`/library/${entry.slug}`}>{entry.code} · {entry.title}</Link>)}<Link href="/library#chapters">Все разделы</Link></div></section>
  </main><Footer /></div>;
}
