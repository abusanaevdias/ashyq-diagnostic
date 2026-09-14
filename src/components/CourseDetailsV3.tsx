import Image from 'next/image';
import type { CourseDetail } from '@/data/courses';
import { ButtonLink, Footer, IconChip, MicroLabel, NavBar } from './ui/CleanUi';
import { Reveal } from './ui/Reveal';
import home from './HomeV3.module.css';
import styles from './CourseDetailsV3.module.css';

export default function CourseDetailsV3({ course }: { course: CourseDetail }) {
  return (
    <div className={home.page}>
      <NavBar />

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
            </div>
          </div>
        </section>

        <Reveal>
          <section className={`${home.container} ${styles.factsSection}`} aria-labelledby="course-format-title">
            <div className={styles.provisionalPanel}>
              <div className={styles.panelIntro}>
                <MicroLabel>Условия набора</MicroLabel>
                <h2 id="course-format-title" className={styles.panelTitle}>Формат курса</h2>
                <p className={styles.provisionalLabel}>Предварительная информация</p>
                <p>{course.provisionalNote}</p>
              </div>
              <dl className={styles.facts}>
                {course.facts.map((fact) => (
                  <div className={styles.fact} key={fact.label}>
                    <dt>{fact.label}</dt>
                    <dd>
                      {fact.value}
                      {fact.provisional ? <span>Предварительно</span> : null}
                    </dd>
                  </div>
                ))}
              </dl>
            </div>
          </section>
        </Reveal>

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
