import Link from 'next/link';
import { courseLessons, freeLessons, lessonsWord, type CourseDetail, type FreeLesson } from '@/data/courses';
import CourseAccess from './CourseAccess';
import { ButtonLink, Footer, NavBar } from './ui/CleanUi';
import home from './HomeV3.module.css';
import styles from './CourseLessons.module.css';

/** Страница бесплатного урока: открыта всем, в конце — путь к основным урокам (COURSE-LESSONS-002). */
export default function CourseLessonV3({ course, lesson }: { course: CourseDetail; lesson: FreeLesson }) {
  const all = courseLessons(course);
  const index = all.findIndex((item) => item.slug === lesson.slug);
  const lessonModule = course.modules.find((item) => item.lessons.some((l) => l.slug === lesson.slug));
  const nextFree = freeLessons(course).find((item) => all.indexOf(item) > index);
  const lockedCount = all.filter((item) => !item.free).length;
  const lessonsHref = `/courses/${course.slug}/lessons`;

  return (
    <div className={home.page}>
      <NavBar />
      <main className={`${home.container} ${styles.main}`}>
        <nav className={styles.crumbs} aria-label="Хлебные крошки">
          <Link href="/courses">Курсы</Link>
          <span aria-hidden="true">/</span>
          <Link href={`/courses/${course.slug}`}>{course.exam}</Link>
          <span aria-hidden="true">/</span>
          <Link href={lessonsHref}>Уроки</Link>
          <span aria-hidden="true">/</span>
          <span aria-current="page">{lesson.title}</span>
        </nav>

        <article className={styles.article}>
          <p className={styles.lessonMeta}>
            Урок {index + 1} из {all.length}{lessonModule ? ` · ${lessonModule.title}` : ''} · {lesson.free.minutes} мин · бесплатно
          </p>
          <h1 className={styles.title}>{lesson.title}</h1>
          <p className={styles.lead}>{lesson.free.intro}</p>

          <h2 className={styles.subheading}>Главное</h2>
          <ul className={styles.points}>
            {lesson.free.points.map((point) => <li key={point}>{point}</li>)}
          </ul>

          <div className={styles.practice}>
            <h2>Попробуйте сами</h2>
            <p>{lesson.free.practice}</p>
          </div>
        </article>

        <div className={styles.lessonNav}>
          {nextFree ? <ButtonLink href={`${lessonsHref}/${nextFree.slug}`} tone="black">Следующий бесплатный урок</ButtonLink> : null}
          <ButtonLink href={lessonsHref} tone="outline">Все уроки курса</ButtonLink>
        </div>

        <section className={styles.next} aria-labelledby="lesson-next-title">
          <h2 id="lesson-next-title">Дальше — основные уроки</h2>
          <p>Ещё {lessonsWord(lockedCount)} с заданиями и разбором от тренера доступны ученикам ASHYQ.</p>
          <CourseAccess slug={course.slug} />
        </section>
      </main>
      <Footer />
    </div>
  );
}
