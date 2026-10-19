import type { Metadata } from 'next';
import EnrollmentPlanner from '@/components/EnrollmentPlanner';
import { ButtonLink, Footer, MicroLabel, NavBar } from '@/components/ui/CleanUi';
import { ALL_INCLUSIVE_SERVICES, CLUB_OFFER, formatTenge } from '@/data/club-offer';
import home from '@/components/HomeV3.module.css';
import styles from '@/components/Mentoring.module.css';

export const metadata: Metadata = {
  title: 'Всё включено: IELTS + SAT + менторство — ASHYQ',
  description: 'Комплексная подготовка к IELTS и Digital SAT, приоритетная помощь тренеров и сопровождение поступления. Пакет ASHYQ: 250 000 ₸ вместо 370 000 ₸.',
  alternates: { canonical: '/all-inclusive' },
};

export default function AllInclusivePage() {
  const offer = CLUB_OFFER.allInclusive;
  return <div className={`v3 ${home.page} ${home.applePage}`}><NavBar /><main>
    <section className={`${home.container} ${styles.hero}`}>
      <MicroLabel>ASHYQ · комплексная подготовка и поступление</MicroLabel>
      <h1 className={styles.title}>Всё включено.<br />От экзаменов до университета.</h1>
      <ul className={styles.destinations} aria-label="Состав пакета"><li>IELTS</li><li>Digital SAT</li><li>Менторство</li></ul>
      <p className={styles.lead}>Два экзамена и поступление по одному плану. Готовимся к IELTS и SAT, разбираем ошибки с преподавателями и вместе с ментором проходим путь от выбора вузов до начала учёбы.</p>
      <div className={styles.priceCard} data-motion-reveal>
        <div><p className={styles.eyebrow}>Стоимость комплексного пакета</p><p className={styles.previous}>Было <s>{formatTenge(offer.previous)}</s></p><p className={styles.price}><strong data-motion-accent="price">{formatTenge(offer.current)}</strong></p><p className={styles.previous}>Экономия {formatTenge(offer.previous - offer.current)}</p></div>
        <ButtonLink href="#package-enrolment">Обсудить пакет</ButtonLink>
        <p className={styles.note}>До оплаты зафиксируем длительность подготовки, количество занятий и менторских встреч, число заявок в университеты, срок сопровождения до начала учёбы и объём визовой помощи.</p>
      </div>
    </section>
    <section className={`${home.container} ${home.section}`} aria-labelledby="package-services">
      <MicroLabel>Что входит в стоимость</MicroLabel><h2 id="package-services" className={home.heading}>Одна цель. Вся команда рядом.</h2>
      <div className={styles.grid}>{ALL_INCLUSIVE_SERVICES.map(({ title, text }) => <article className={styles.card} key={title} data-motion-reveal data-motion-card><h3>{title}</h3><p>{text}</p></article>)}</div>
    </section>
    <section className={`${home.container} ${home.section}`} aria-labelledby="package-fit">
      <MicroLabel>Кому подойдёт</MicroLabel><h2 id="package-fit" className={home.heading}>Когда нужны и экзамены, и помощь с поступлением</h2>
      <p className={styles.lead}>Для старшеклассников и абитуриентов, которые планируют зарубежный университет и хотят связать подготовку к экзаменам со сроками подачи. Приоритетную помощь тренеров получаете в рамках пакета; канал связи и порядок ответов согласуем перед стартом.</p>
      <p className={styles.note}>Экзаменационные, университетские и визовые сборы, переводы и заверение документов, билеты, проживание и обучение в университете оплачиваются отдельно. Решения о зачислении, гранте и визе принимают университеты и уполномоченные органы; конкретный балл и положительное решение не гарантируются.</p>
    </section>
    <section id="package-enrolment" className={`${home.container} ${home.section}`}><EnrollmentPlanner fixedProgram="all-inclusive" /></section>
  </main><Footer /></div>;
}
