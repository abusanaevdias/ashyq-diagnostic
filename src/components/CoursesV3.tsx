'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowIcon, ButtonLink, FilterChip, Footer, MicroLabel, NavBar } from './ui/CleanUi';
import { Reveal } from './ui/Reveal';
import ui from './ui/CleanUi.module.css';
import { COURSES, type CourseFilter as Filter } from '@/data/courses';
import { PHOTOS } from '@/data/media';
import home from './HomeV3.module.css';
import styles from './CoursesV3.module.css';
import { AiBadge } from './AiBadge';

/**
 * /courses — каталог v3 (DESIGN_V3 §6.2). Только реальные продукты ASHYQ,
 * без цен и рейтингов: их пока нет в подтверждённых данных.
 */


const FILTERS: Array<{ id: Filter; label: string }> = [
  { id: 'all', label: 'Все' },
  { id: 'ielts', label: 'IELTS' },
  { id: 'sat', label: 'SAT' },
  { id: 'team', label: 'Командный формат' },
];


export default function CoursesV3() {
  const [filter, setFilter] = useState<Filter>('all');
  const visible = COURSES.filter((course) => filter === 'all' || course.tags.includes(filter));

  return (
    <div className={home.page}>
      <NavBar />

      <main>
        <section className={`${home.container} ${styles.hero}`}>
          <div className={styles.heroGrid}>
            <div className={styles.heroCopy}>
              <MicroLabel>Курсы ASHYQ</MicroLabel>
              <h1 className={styles.title}>Онлайн-курсы IELTS и Digital SAT в Казахстане</h1>
              <p className={home.lead}>Ищете онлайн-курсы IELTS и Digital SAT в Казахстане? В ASHYQ подготовка к обоим экзаменам проходит дистанционно: выберите направление и начните с предварительной диагностики.</p>
              <p className={styles.script}>выберите свой маршрут</p>
            </div>
            <div className={styles.collage}>
              <div className={styles.collageMain}><Image src={PHOTOS.coursesCollageMain.src} alt={PHOTOS.coursesCollageMain.alt} fill priority sizes="(max-width: 900px) 84vw, 38vw" /><AiBadge /></div>
              <div className={styles.collageSide}><Image src={PHOTOS.coursesCollageSide.src} alt={PHOTOS.coursesCollageSide.alt} fill sizes="(max-width: 900px) 58vw, 26vw" /><AiBadge /></div>
            </div>
          </div>
        </section>

        <section className={`${home.container} ${home.section}`}>
          <div className={home.sectionHead}>
            <div><MicroLabel>Направления</MicroLabel><h2 className={home.heading}>Выберите онлайн-курс: IELTS или Digital SAT</h2></div>
            <p className={home.sectionIntro}>Курс IELTS охватывает Reading, Listening, Writing и Speaking, а Digital SAT — Reading &amp; Writing и Math. Предварительная диагностика помогает определить учебный фокус.</p>
          </div>
          <div className={styles.filters} role="group" aria-label="Фильтр курсов">
            {FILTERS.map((item) => <FilterChip key={item.id} active={filter === item.id} onClick={() => setFilter(item.id)}>{item.label}</FilterChip>)}
          </div>
          <div className={styles.grid}>
            {visible.map((course) => (
              <Link href={course.href} className={styles.card} key={course.title}>
                <div className={styles.photo}>
                  <Image src={course.photo} alt={course.alt} fill sizes="(max-width: 900px) 100vw, 50vw" />
                  <AiBadge />
                  {course.badge ? <span className={styles.badge}>{course.badge}</span> : null}
                </div>
                <div className={styles.cardBody}>
                  <h3 className={styles.cardTitle}>{course.title}</h3>
                  <p className={styles.cardText}>{course.text}</p>
                  <div className={styles.cardFooter}><p className={styles.meta}>{course.meta}</p><span className={ui.circleArrow}><ArrowIcon /></span></div>
                </div>
              </Link>
            ))}
          </div>
        </section>

        <Reveal>
          <section className={`${home.container} ${styles.bandSection}`}>
            <div className={styles.blushBand}>
              <div>
                <MicroLabel>Первый шаг</MicroLabel>
                <h2 className={home.heading}>Не знаете, с чего начать?</h2>
                <p className={styles.bandText}>Пройдите бесплатную диагностику: 12–20 минут, без регистрации. Вы получите предварительную оценку и поймёте, какой курс подходит.</p>
                <div className={styles.bandActions}><ButtonLink href="/?start=ielts" tone="black">Пройти диагностику</ButtonLink></div>
              </div>
              <p className={styles.bandNote}>начните здесь</p>
            </div>
          </section>
        </Reveal>
      </main>

      <Footer />
    </div>
  );
}
