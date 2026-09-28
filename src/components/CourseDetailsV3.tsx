import Image from 'next/image';
import Link from 'next/link';
import { courseLessons, freeLessons, lessonsWord, type CourseDetail } from '@/data/courses';
import { WHATSAPP_NUMBER } from '@/lib/config';
import { ArrowIcon, ButtonLink, Footer, IconChip, LineIcon, MicroLabel, NavBar } from './ui/CleanUi';
import ui from './ui/CleanUi.module.css';
import { Reveal } from './ui/Reveal';
import home from './HomeV3.module.css';
import styles from './CourseDetailsV3.module.css';
import { AiBadge } from './AiBadge';
import EnrollmentPlanner from './EnrollmentPlanner';
import ClubOffer from './ClubOffer';
import CohortResults from './CohortResults';

export default function CourseDetailsV3({ course }: { course: CourseDetail }) {
  const free = freeLessons(course);
  const locked = courseLessons(course).filter((lesson) => !lesson.free);
  const lessonsHref = `/courses/${course.slug}/lessons`;
  // неподтверждённые условия не показываем стеной «Уточняется» — клиент сразу спрашивает в WhatsApp (CLIENT-POLISH-001)
  const confirmed = course.facts.filter((fact) => !fact.provisional);
  const pending = course.facts.filter((fact) => fact.provisional);
  const whatsappHref = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(`Здравствуйте! Хочу узнать стоимость и расписание курса ${course.exam} в ASHYQ.`)}`;
  return (
    <div className={home.page}>
      <NavBar diagnosticHref={course.diagnosticHref} />

      <main>
        <section className={`${home.container} ${styles.hero}`}>
          <div className={styles.heroGrid}>
            <div className={styles.heroCopy}>
              <MicroLabel>{course.exam} · курс ASHYQ</MicroLabel>
              <h1 className={styles.title}>{course.title}</h1>
              <p className={styles.lead}>{course.lead}</p>
              <div className={styles.actions}>
                <ButtonLink href={course.diagnosticHref} ariaLabel={course.diagnosticAriaLabel}>
                  Начать диагностику
                </ButtonLink>
                <ButtonLink href="/courses" tone="outline">Все курсы</ButtonLink>
              </div>
            </div>

            <div className={styles.heroPhoto}>
              <Image
                src={course.photo}
                alt={course.alt}
                fill
                preload
                sizes="(max-width: 900px) 100vw, 42vw"
              />
              <AiBadge />
            </div>
          </div>
        </section>

        <Reveal>
          <section className={`${home.container} ${styles.factsSection}`} aria-labelledby="course-format-title">
            <div className={styles.provisionalPanel}>
              <div className={styles.panelIntro}>
                <MicroLabel>Условия набора</MicroLabel>
                <h2 id="course-format-title" className={styles.panelTitle}>Стоимость и расписание онлайн-курсов {course.exam}</h2>
                <p>
                  Условия набора: вечерние занятия и выбор группы ниже. Период оплаты, применимость акции, дату старта и преподавателя подтвердим до записи.
                </p>
              </div>
              <div className={styles.factsSide}>
                <dl className={styles.facts}>
                  {confirmed.map((fact) => (
                    <div className={styles.fact} key={fact.label}>
                      <dt>{fact.label}</dt>
                      <dd>{fact.value}</dd>
                    </div>
                  ))}
                </dl>
                {pending.length ? (
                  <div className={styles.askActions}>
                    <a className={ui.buttonRed} href={whatsappHref} target="_blank" rel="noopener noreferrer">Подтвердить условия в WhatsApp<ArrowIcon /></a>
                    <ButtonLink href="/contacts" tone="outline">Оставить заявку</ButtonLink>
                  </div>
                ) : null}
              </div>
            </div>
          </section>
        </Reveal>

        <section className={`${home.container} ${home.section}`}><ClubOffer enrolmentHref="#course-enrolment" /></section>
        <section id="course-enrolment" className={`${home.container} ${home.section}`}><EnrollmentPlanner fixedProgram={course.slug} /></section>
        {course.slug === 'ielts' ? <div className={`${home.container} ${home.section}`}><CohortResults /></div> : null}

        <Reveal>
          <section className={`${home.container} ${home.section}`} aria-labelledby="course-program-title">
            <div className={styles.sectionHead}>
              <div>
                <MicroLabel>Программа</MicroLabel>
                <h2 id="course-program-title" className={styles.heading}>Что будем разбирать</h2>
              </div>
              <p className={styles.sectionIntro}>Содержание собрано вокруг навыков экзамена. Точный акцент определим после входной диагностики.</p>
            </div>
            <div className={styles.curriculum}>
              {course.curriculum.map((item, index) => (
                <article className={styles.curriculumCard} key={item.title}>
                  <p className={styles.itemNumber}>{String(index + 1).padStart(2, '0')}</p>
                  <h3>{item.title}</h3>
                  <p>{item.description}</p>
                </article>
              ))}
            </div>
          </section>
        </Reveal>

        <Reveal>
          <section className={`${home.container} ${home.section}`} aria-labelledby="course-lessons-title">
            <div className={styles.sectionHead}>
              <div>
                <MicroLabel>Уроки</MicroLabel>
                <h2 id="course-lessons-title" className={styles.heading}>Попробуйте до записи</h2>
              </div>
              <p className={styles.sectionIntro}>{course.slug === 'ielts'
                ? 'Вступительные уроки и демо тренажёра Writing открыты всем. Основные уроки, задания и разборы — для учеников ASHYQ в их классе.'
                : 'Вступительные уроки открыты всем. Основные уроки, задания и разборы — для учеников ASHYQ в их классе.'}</p>
            </div>

            <div className={[styles.lessons, course.slug === 'ielts' ? styles.lessonsFour : ''].join(' ')}>
              {free.map((lesson) => (
                <Link href={`${lessonsHref}/${lesson.slug}`} className={`${styles.lessonCard} ${styles.lessonLink}`} key={lesson.slug}>
                  <span className={styles.lessonMeta}>Бесплатно · {lesson.free.minutes} мин</span>
                  <span className={styles.lessonTitle}>{lesson.title}</span>
                  <p>{lesson.summary}</p>
                </Link>
              ))}
              {course.slug === 'ielts' && (
                <Link href="/writing/trainer" className={[styles.lessonCard, styles.lessonLink].join(' ')} aria-label="Открыть демо тренажёра IELTS Writing Task 2">
                  <span className={styles.lessonMeta}>Бесплатно · 2 эссе</span>
                  <span className={styles.lessonTitle}>Writing Task 2: тренажёр</span>
                  <p>Попробуй на двух готовых эссе. Ученики IELTS-класса могут добавить свой текст для самостоятельной правки.</p>
                </Link>
              )}
              <div className={`${styles.lessonCard} ${styles.lessonLocked}`}>
                <span className={styles.lessonMeta}><LineIcon name="lock" size={14} />Для учеников ASHYQ</span>
                <span className={styles.lessonTitle}>Ещё {lessonsWord(locked.length)}</span>
                <p>{locked.slice(0, 3).map((lesson) => lesson.title).join(' · ')} и другие.</p>
              </div>
            </div>
            <div className={styles.lessonsAction}>
              <ButtonLink href={lessonsHref} tone="black">Вся программа уроков</ButtonLink>
            </div>
          </section>
        </Reveal>

        <Reveal>
          <section className={styles.stepsBand} aria-labelledby="course-steps-title">
            <div className={`${home.container} ${home.section}`}>
              <MicroLabel>Маршрут</MicroLabel>
              <h2 id="course-steps-title" className={styles.heading}>Как строится подготовка</h2>
              <div className={styles.steps}>
                {course.steps.map((step, index) => (
                  <article className={styles.step} key={step.title}>
                    <p className={styles.stepNumber}>{String(index + 1).padStart(2, '0')}</p>
                    <h3>{step.title}</h3>
                    <p>{step.description}</p>
                  </article>
                ))}
              </div>
            </div>
          </section>
        </Reveal>

        <Reveal>
          <section className={`${home.container} ${home.section}`} aria-labelledby="course-included-title">
            <div className={styles.includedGrid}>
              <div className={styles.includedCopy}>
                <MicroLabel>Внутри курса</MicroLabel>
                <h2 id="course-included-title" className={styles.heading}>Всё для системной работы</h2>
                <p>Не только занятия: практика, обратная связь и контроль прогресса в одном маршруте.</p>
              </div>
              <ul className={styles.checklist}>
                {course.included.map((item, index) => (
                  <li key={item}>
                    <IconChip name={index % 2 === 0 ? 'target' : 'book'} />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </section>
        </Reveal>

        <Reveal>
          <section className={`${home.container} ${styles.faqSection}`} aria-labelledby="course-faq-title">
            <div className={styles.faqHead}>
              <MicroLabel>Вопросы</MicroLabel>
              <h2 id="course-faq-title" className={styles.heading}>Перед стартом</h2>
            </div>
            <div className={styles.faqList}>
              {course.faq.map((item) => (
                <details className={styles.faqItem} key={item.question}>
                  <summary>{item.question}<span aria-hidden="true">+</span></summary>
                  <p>{item.answer}</p>
                </details>
              ))}
            </div>
          </section>
        </Reveal>

        <Reveal>
          <section className={`${home.container} ${styles.ctaSection}`}>
            <div className={styles.ctaBand}>
              <div>
                <MicroLabel>Точка старта</MicroLabel>
                <h2 className={styles.ctaTitle}>Сначала узнаем ваш текущий уровень</h2>
                <p>Диагностика даст предварительную оценку и поможет собрать подходящий план подготовки.</p>
              </div>
              <div className={styles.ctaAction}>
                <ButtonLink href={course.diagnosticHref} tone="black" ariaLabel={course.diagnosticAriaLabel}>
                  Начать диагностику
                </ButtonLink>
              </div>
            </div>
          </section>
        </Reveal>
      </main>

      <Footer />
    </div>
  );
}
