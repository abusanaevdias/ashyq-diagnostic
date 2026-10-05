import Image from 'next/image';
import Link from 'next/link';
import { PHOTOS } from '@/data/media';
import { CLUB_FACTS, CLUB_MANAGER, CONTACT_EMAIL, SITE_DESCRIPTION } from '@/lib/site';
import { CLUB_OFFER } from '@/data/club-offer';
import { BLUESCREEN_COVERAGE } from '@/data/press-coverage';
import home from './HomeV3.module.css';
import styles from './AboutV3.module.css';
import { ButtonLink, Footer, IconChip, MicroLabel, NavBar, StatsRow } from './ui/CleanUi';
import { Reveal } from './ui/Reveal';
import { AiBadge } from './AiBadge';

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
              <p className={styles.lead}>{SITE_DESCRIPTION} Занятия проходят онлайн; ASHYQ — образовательный клуб, а не официальный оператор экзаменов.</p>
              <p className={styles.script}>растём вместе</p>
            </div>
            <div className={styles.heroPhoto}>
              <Image src={PHOTOS.aboutHero.src} alt={PHOTOS.aboutHero.alt} fill priority sizes="(max-width: 900px) 100vw, 42vw" /><AiBadge />
            </div>
          </div>
        </section>

        <Reveal>
          <section className={`${home.container} ${styles.statsSection}`} aria-label="Формат ASHYQ">
            <div className={styles.statsFrame}><StatsRow items={CLUB_FACTS} /></div>
          </section>
        </Reveal>

        <section className={`${home.container} ${home.section}`} aria-labelledby="club-facts-heading">
          <MicroLabel>О клубе</MicroLabel>
          <h2 id="club-facts-heading" className={styles.heading}>ASHYQ: формат и следующий шаг</h2>
          <p className={styles.lead}>По данным команды на 28 сентября 2026: {CLUB_OFFER.students} ученика в новом потоке и {CLUB_OFFER.teachers} преподавателя. Это сведения самого клуба, не независимый рейтинг или гарантия результата.</p>
          <div className={styles.values}>
            <article className={styles.value}>
              <IconChip name="book" />
              <div><h3>Два направления подготовки</h3><p><Link className="link-underline" href="/courses/ielts">IELTS</Link> и <Link className="link-underline" href="/courses/sat">Digital SAT</Link> для школьников и абитуриентов Казахстана. Программа и бесплатные вводные уроки доступны на страницах курсов.</p></div>
            </article>
            <article className={styles.value}>
              <IconChip name="target" />
              <div><h3>Диагностика — не официальный балл</h3><p>IELTS: 12 вопросов Reading и Listening, без оценки Writing и Speaking. SAT: 16 вопросов Reading &amp; Writing и Math, не полный адаптивный экзамен. <Link className="link-underline" href="/diagnostic">Короткий тест</Link> помогает выбрать стартовый фокус, но не гарантирует результат на экзамене.</p></div>
            </article>
            <article className={styles.value}>
              <IconChip name="compass" />
              <div><h3>Условия перед записью</h3><p>Занятия проходят онлайн. Команда работает Пн–Сб, 19:00–23:00 по Астане. Точное расписание группы и условия уточняются до записи. <Link className="link-underline" href="/courses#enrolment">Выбрать удобное время</Link> или <Link className="link-underline" href="/mentoring">обсудить менторство по поступлению</Link>.</p></div>
            </article>
            <article className={styles.value}>
              <IconChip name="chat" />
              <div><h3>Контактное лицо клуба</h3><p>{CLUB_MANAGER}, CEO ASHYQ. Почта для вопросов о клубе и сотрудничестве: <a className="link-underline" href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>. Официальные социальные каналы указаны на <Link className="link-underline" href="/contacts">странице контактов</Link>.</p></div>
            </article>
          </div>
        </section>

        <section className={`${home.container} ${home.section}`} aria-labelledby="press-coverage-heading">
          <MicroLabel>О нас в СМИ</MicroLabel>
          <h2 id="press-coverage-heading" className={styles.heading}>Bluescreen об ASHYQ</h2>
          <p className={styles.lead}>5 октября 2026 года Bluescreen опубликовал интервью с основателем ASHYQ о бесплатной библиотеке IELTS и границах проверки ответов. Это материал о продукте, а не рейтинг школы или подтверждение экзаменационных результатов.</p>
          <p><a className="link-underline" href={BLUESCREEN_COVERAGE.url}>Читать интервью в Bluescreen</a> · <Link className="link-underline" href={BLUESCREEN_COVERAGE.postPath}>Наш разбор и открытые упражнения</Link></p>
          <h3>Ищете ASHYQ EDU?</h3>
          <p>ASHYQ — название нашего образовательного проекта; @ashyqedu — официальный аккаунт в социальных сетях. Все ссылки и способы связи доступны на <Link className="link-underline" href="/contacts">странице контактов</Link>.</p>
        </section>

        <Reveal>
          <section className={`${home.container} ${home.section}`}>
            <div className={styles.sectionHead}>
              <div><MicroLabel>Что нас объединяет</MicroLabel><h2 className={styles.heading}>Наши ценности</h2></div>
              <p className={styles.sectionIntro}>Подготовка становится сильнее, когда рядом есть команда, пространство для голоса и понятный способ увидеть рост.</p>
            </div>
            <div className={styles.values} data-club-values>
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
