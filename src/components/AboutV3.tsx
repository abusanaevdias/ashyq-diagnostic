import Image from 'next/image';
import { PHOTOS } from '@/data/media';
import home from './HomeV3.module.css';
import styles from './AboutV3.module.css';
import { ButtonLink, Footer, IconChip, MicroLabel, NavBar, StatsRow } from './ui/CleanUi';
import { Reveal } from './ui/Reveal';
import { AiBadge } from './AiBadge';

const STATS = [
  { value: '12 000+', label: 'учебных попыток' },
  { value: '4.8', label: 'средняя оценка опыта' },
  { value: '90%', label: 'видят следующий шаг' },
  { value: '2024', label: 'год основания' },
];

const VALUES = [
  { icon: 'spark', title: 'Команда', text: 'Задачи решаются вместе: вклад каждого виден в общем результате.' },
  { icon: 'target', title: 'Голос', text: 'Speaking Battles и презентации помогают ясно формулировать и защищать идеи.' },
  { icon: 'compass', title: 'Мышление', text: 'Missions и финальные задачи развивают стратегию и критическое мышление.' },
  { icon: 'book', title: 'Поддержка', text: 'Сообщество соединяет подготовку, командную работу и взаимную поддержку.' },
] as const;

export default function AboutV3() {
  return (
    <div className={home.page}>
      <NavBar />
      <main>
        <section className={`${home.container} ${styles.hero}`}>
          <div className={styles.heroGrid}>
            <div className={styles.heroCopy}>
              <MicroLabel>Наша миссия</MicroLabel>
              <h1 className={styles.title}>Открывать возможности через знания и людей.</h1>
              <p className={styles.lead}>ASHYQ помогает студентам готовиться к IELTS и SAT, видеть свой прогресс и учиться работать в команде. Онлайн и в Астане.</p>
              <p className={styles.script}>растём вместе</p>
            </div>
            <div className={styles.heroPhoto}>
              <Image src={PHOTOS.aboutHero.src} alt={PHOTOS.aboutHero.alt} fill priority sizes="(max-width: 900px) 100vw, 42vw" /><AiBadge />
            </div>
          </div>
        </section>

        <Reveal>
          <section className={`${home.container} ${styles.statsSection}`} aria-label="ASHYQ в цифрах">
            <div className={styles.statsFrame}><StatsRow items={STATS} /></div>
          </section>
        </Reveal>

        <Reveal>
          <section className={`${home.container} ${home.section}`}>
            <div className={styles.sectionHead}>
              <div><MicroLabel>Что нас объединяет</MicroLabel><h2 className={styles.heading}>Наши ценности</h2></div>
              <p className={styles.sectionIntro}>Подготовка становится сильнее, когда рядом есть команда, пространство для голоса и понятный способ увидеть рост.</p>
            </div>
            <div className={styles.values}>
              {VALUES.map((value) => (
                <article className={styles.value} key={value.title}>
                  <IconChip name={value.icon} />
                  <div><h3>{value.title}</h3><p>{value.text}</p></div>
                </article>
              ))}
            </div>
          </section>
        </Reveal>

        <Reveal>
          <section className={`${home.container} ${styles.closingSection}`}>
            <div className={styles.quoteCard}>
              <figure className={styles.quoteCopy}>
                <MicroLabel>Среда ASHYQ</MicroLabel>
                <blockquote>«Мы создаём больше, чем курсы. Среду, где знания превращаются в прогресс, а люди помогают двигаться дальше.»</blockquote>
                <figcaption>Миссия ASHYQ</figcaption>
                <div className={styles.quoteAction}><ButtonLink href="/program">Смотреть программу</ButtonLink></div>
              </figure>
              <div className={styles.quotePhoto}>
                <Image src={PHOTOS.aboutQuote.src} alt={PHOTOS.aboutQuote.alt} fill sizes="(max-width: 900px) 100vw, 38vw" /><AiBadge />
              </div>
            </div>
          </section>
        </Reveal>
      </main>
      <Footer />
    </div>
  );
}
