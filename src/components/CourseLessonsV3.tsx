import Link from 'next/link';
import { courseLessons, freeLessons, lessonsWord, type CourseDetail } from '@/data/courses';
import CourseAccess from './CourseAccess';
import { Footer, LineIcon, MicroLabel, NavBar } from './ui/CleanUi';
import home from './HomeV3.module.css';
import styles from './CourseLessons.module.css';

/**
 * Программа уроков курса (COURSE-LESSONS-002), как у Udemy/Stepik: модули → уроки.
 * Бесплатные уроки — ссылки на свои страницы, остальные с замком и без содержимого.
 */
export default function CourseLessonsV3({ course }: { course: CourseDetail }) {
  const total = courseLessons(course).length;
  const free = freeLessons(course);
  // сквозная нумерация уроков через все модули
  const offsets = course.modules.map((_, index) => course.modules.slice(0, index).reduce((sum, module) => sum + module.lessons.length, 0));
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
          <span aria-current="page">Уроки</span>
        </nav>
        <MicroLabel>{course.exam} · программа уроков</MicroLabel>
        <h1 className={styles.title}>Уроки курса «{course.title}»</h1>
        <p className={styles.lead}>
          {lessonsWord(total)} в {course.modules.length} модулях. Начните с бесплатных — они открыты всем, остальные уроки, задания и разборы
          доступны ученикам ASHYQ в их классе.
        </p>

        <div className={styles.layout}>
          <div className={styles.modules}>
            {course.modules.map((module, moduleIndex) => (
              <section className={styles.module} key={module.title} aria-labelledby={`module-${moduleIndex}`}>
                <header className={styles.moduleHead}>
                  <h2 id={`module-${moduleIndex}`}>{module.title}</h2>
                  <span>{lessonsWord(module.lessons.length)}</span>
                </header>
                <ol className={styles.rows}>
                  {module.lessons.map((lesson, lessonIndex) => {
                    const number = offsets[moduleIndex] + lessonIndex + 1;
                    const text = (
                      <>
                        <span className={styles.num}>{number}</span>
                        <span className={styles.rowText}>
                          <span className={styles.rowTitle}>{lesson.title}</span>
                          <span className={styles.rowSummary}>{lesson.summary}</span>
                        </span>
                      </>
                    );
                    return (
                      <li key={lesson.slug}>
                        {lesson.free ? (
                          <Link href={`${lessonsHref}/${lesson.slug}`} className={`${styles.row} ${styles.rowOpen}`}>
                            {text}
                            <span className={styles.badgeFree}>Бесплатно · {lesson.free.minutes} мин</span>
                          </Link>
                        ) : (
                          <div className={`${styles.row} ${styles.rowLocked}`}>
                            {text}
                            <span className={styles.badgeLocked}><LineIcon name="lock" size={14} />Для учеников</span>
                          </div>
                        )}
                      </li>
                    );
                  })}
                </ol>
              </section>
            ))}
          </div>

          <aside className={styles.aside} aria-labelledby="lessons-access-title">
            <div className={styles.asideCard}>
              <h2 id="lessons-access-title">Как открыть все уроки</h2>
              <ol className={styles.howTo}>
                <li>Запишитесь на курс.</li>
                <li>Менеджер ASHYQ выдаст код вашего класса.</li>
                <li>Введите код — уроки, задания и разборы откроются в классе.</li>
              </ol>
              <p className={styles.asideNote}>Бесплатно: {free.map((lesson) => lesson.title).join(' и ')}.</p>
              <CourseAccess slug={course.slug} />
            </div>
          </aside>
        </div>
      </main>
      <Footer />
    </div>
  );
}
