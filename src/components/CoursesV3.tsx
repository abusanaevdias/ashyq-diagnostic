'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
  ArrowIcon,
  ButtonLink,
  FilterChip,
  Footer,
  IconChip,
  MicroLabel,
  NavBar,
} from './ui/CleanUi';
import { COURSES, COURSE_DETAILS } from '@/data/courses';
import { PHOTOS } from '@/data/media';
import home from './HomeV3.module.css';
import styles from './CoursesV3.module.css';
import { AiBadge } from './AiBadge';
import EnrollmentPlanner from './EnrollmentPlanner';
import { CLUB_OFFER } from '@/data/club-offer';
import ClubOffer from './ClubOffer';
import CohortResults from './CohortResults';

type ExamFilter = 'all' | 'ielts' | 'sat';
const FILTERS: Array<{ id: ExamFilter; label: string }> = [
  { id: 'all', label: 'Все' },
  { id: 'ielts', label: 'IELTS' },
  { id: 'sat', label: 'SAT' },
];
const PROGRAMS = COURSES.filter(
  (course) =>
    course.href === '/courses/ielts' || course.href === '/courses/sat',
);
const PRACTICE = [
  {
    exam: 'IELTS',
    title: 'Бесплатная библиотека IELTS',
    text: 'Полные эссе, Writing Lab, Reading, Speaking и упражнения с объяснениями. Практикуйтесь прямо на сайте.',
    href: '/library',
    note: 'Авторские материалы · без регистрации',
  },
  {
    exam: 'IELTS',
    title: 'Как устроен IELTS',
    text: 'Знакомство с четырьмя секциями, форматом и шкалой баллов.',
    href: '/courses/ielts/lessons/how-ielts-works',
    note: 'Открытый вводный урок',
  },
  {
    exam: 'SAT',
    title: 'Как устроен Digital SAT',
    text: 'Модули, адаптивность и инструменты цифрового экзамена.',
    href: '/courses/sat/lessons/how-digital-sat-works',
    note: 'Открытый вводный урок',
  },
  {
    exam: 'IELTS',
    title: 'Writing: разбор ошибок',
    text: 'Найдите ошибки в учебном примере и сравните разбор с пояснениями.',
    href: '/writing/trainer',
    note: 'Демо на синтетических примерах',
  },
];

/** Exam programs are separate from club activities and free tools. */
export default function CoursesV3() {
  const [filter, setFilter] = useState<ExamFilter>('all');
  const visible = PROGRAMS.filter(
    (course) => filter === 'all' || course.tags.includes(filter),
  );
  const diagnosticHref =
    filter === 'all' ? '/diagnostic' : COURSE_DETAILS[filter].diagnosticHref;
  return (
    <div className={home.page}>
      <NavBar diagnosticHref={diagnosticHref} />
      <main>
        <section className={`${home.container} ${styles.hero}`}>
          <div className={styles.heroGrid}>
            <div className={styles.heroCopy}>
              <MicroLabel>ASHYQ · образовательный клуб</MicroLabel>
              <h1 className={styles.title}>
                Онлайн-курсы IELTS и Digital SAT в Казахстане
              </h1>
              <p className={styles.lead}>
                От первого теста до регулярной практики. Выберите экзамен,
                познакомьтесь с программой и определите свой следующий шаг.
              </p>
              <div className={styles.heroActions}>
                <ButtonLink href="/courses/ielts">Выбрать IELTS</ButtonLink>
                <ButtonLink href="/courses/sat" tone="outline">
                  Выбрать SAT
                </ButtonLink>
              </div>
              <Link className={styles.textLink} href="#free-practice">
                Сначала попробовать бесплатно <ArrowIcon />
              </Link>
              <ul className={styles.heroFacts} aria-label="Формат подготовки">
                <li>Онлайн по Казахстану</li>
                <li>Два экзамена</li>
                <li>Практика и разборы</li>
              </ul>
            </div>
            <div className={styles.heroVisual}>
              <div className={styles.heroPhoto}>
                <Image
                  src={PHOTOS.courseCardDiagnostic.src}
                  alt={PHOTOS.courseCardDiagnostic.alt}
                  fill
                  sizes="(max-width: 900px) 1px, 40vw"
                />
                <AiBadge />
              </div>
              <div className={styles.visualNote}>
                <IconChip name="compass" />
                <div>
                  <p className={styles.noteTitle}>Начните с точки А</p>
                  <p>Диагностика → план → практика</p>
                </div>
              </div>
              <p className={styles.script}>ваш маршрут начинается здесь</p>
            </div>
          </div>
        </section>
        <section
          id="programs"
          className={`${home.container} ${styles.programSection}`}
          aria-labelledby="programs-title"
        >
          <div className={home.sectionHead}>
            <div>
              <MicroLabel>Два направления</MicroLabel>
              <h2 id="programs-title" className={home.heading}>
                Выберите онлайн-курс: IELTS или Digital SAT
              </h2>
            </div>
            <p className={home.sectionIntro}>
              Здесь — программы подготовки. Диагностика, бесплатные материалы и
              клубные события доступны отдельно.
            </p>
          </div>
          <div
            className={styles.filters}
            role="group"
            aria-label="Фильтр курсов"
          >
            {FILTERS.map((item) => (
              <FilterChip
                key={item.id}
                active={filter === item.id}
                onClick={() => setFilter(item.id)}
              >
                {item.label}
              </FilterChip>
            ))}
          </div>
          <p className={styles.resultCount} role="status" aria-live="polite">
            {visible.length === 2
              ? 'Два направления подготовки'
              : `Направление: ${filter === 'ielts' ? 'IELTS' : 'Digital SAT'}`}
          </p>
          <div className={styles.grid}>
            {visible.map((course) => {
              const slug = course.href === '/courses/ielts' ? 'ielts' : 'sat';
              return (
                <article className={styles.card} key={course.href}>
                  <Link
                    href={course.href}
                    className={styles.courseLink}
                  >
                    <div className={styles.photo}>
                      <Image
                        src={COURSE_DETAILS[slug].photo}
                        alt={COURSE_DETAILS[slug].alt}
                        fill
                        sizes="(max-width: 600px) 100vw, 50vw"
                      />
                      <AiBadge />
                      <span className={styles.badge}>
                        {slug === 'ielts' ? 'IELTS' : 'Digital SAT'}
                      </span>
                    </div>
                    <div className={styles.cardBody}>
                      <h3
                        id={`course-title-${slug}`}
                        className={styles.cardTitle}
                      >
                        {course.title}
                      </h3>
                      <p className={styles.cardText}>{course.text}</p>
                      <div className={styles.cardFooter}>
                        <span>Программа курса</span>
                        <span className={styles.circleArrow}>
                          <ArrowIcon />
                        </span>
                      </div>
                    </div>
                  </Link>
                  <div className={styles.courseTools}>
                    <p className={styles.meta}>{course.meta}</p>
                    <Link
                      className={styles.textLink}
                      href={COURSE_DETAILS[slug].diagnosticHref}
                    >
                      Диагностика {COURSE_DETAILS[slug].exam} <ArrowIcon />
                    </Link>
                  </div>
                </article>
              );
            })}
          </div>
          <p className={styles.conditions}>Работаем Пн–Сб, {CLUB_OFFER.workingHours} по Астане. Выберите вариант группы ниже — команда подтвердит уровень и полные условия.</p>
          <p className={styles.conditions}>Нужна стратегия поступления и помощь с документами? <Link href="/mentoring">Менторство ASHYQ →</Link></p>
        </section>
        <section className={`${home.container} ${home.section}`}><ClubOffer /></section>
        <section id="enrolment" className={`${home.container} ${home.section}`}>
          <EnrollmentPlanner fixedProgram={filter === 'all' ? undefined : filter} />
        </section>
        <div className={`${home.container} ${home.section}`}><CohortResults /></div>
        <section
          id="free-practice"
          className={`${home.container} ${styles.resourceSection}`}
          aria-labelledby="practice-title"
        >
          <div className={home.sectionHead}>
            <div>
              <MicroLabel>Без оплаты и регистрации</MicroLabel>
              <h2 id="practice-title" className={home.heading}>
                Попробуйте перед выбором курса
              </h2>
            </div>
            <p className={home.sectionIntro}>
              Открытые уроки и учебный тренажёр. Можно начать сейчас; они не
              заменяют полный курс или официальный экзамен.
            </p>
          </div>
          <div className={styles.resourceGrid}>
            {PRACTICE.map((item) => (
              <Link
                className={styles.resourceCard}
                href={item.href}
                key={item.href}
              >
                <MicroLabel>{item.exam} · бесплатно</MicroLabel>
                <h3 className={styles.cardTitle}>{item.title}</h3>
                <p className={styles.cardText}>{item.text}</p>
                <div className={styles.resourceFooter}>
                  <span>{item.note}</span>
                  <ArrowIcon />
                </div>
              </Link>
            ))}
          </div>
        </section>
        <section
          className={`${home.container} ${styles.clubSection}`}
          aria-labelledby="club-title"
        >
          <div className={styles.clubPanel}>
            <IconChip name="chat" />
            <div>
              <MicroLabel>Клубный формат</MicroLabel>
              <h2 id="club-title" className={styles.cardTitle}>
                Практика с другими учениками
              </h2>
              <p className={styles.cardText}>
                Сообщество, командные задания и Match Days — отдельная часть
                ASHYQ. Условия участия и статус сезона смотрите на странице
                чемпионата.
              </p>
            </div>
            <ButtonLink href="/season" tone="outline">
              Сезон и Match Days
            </ButtonLink>
          </div>
        </section>
        <section className={`${home.container} ${styles.bandSection}`}>
          <div className={styles.blushBand}>
            <div>
              <MicroLabel>Первый шаг</MicroLabel>
              <h2 className={home.heading}>Не знаете, с чего начать?</h2>
              <p className={styles.bandText}>
                Бесплатная диагностика IELTS или SAT: 12–20 минут, без
                регистрации. Результат — предварительный ориентир, не
                официальный балл. IELTS проверяет Reading и Listening; SAT —
                Reading &amp; Writing и Math.
              </p>
              <div className={styles.bandActions}>
                <ButtonLink href={diagnosticHref} tone="black">
                  Пройти диагностику
                  {filter === 'all' ? '' : ` ${COURSE_DETAILS[filter].exam}`}
                </ButtonLink>
                <ButtonLink href="/contacts" tone="outline">
                  Обсудить цель
                </ButtonLink>
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
