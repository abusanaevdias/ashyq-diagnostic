import type { Metadata } from 'next';
import Link from 'next/link';
import EnrollmentPlanner from '@/components/EnrollmentPlanner';
import { ButtonLink, Footer, MicroLabel, NavBar } from '@/components/ui/CleanUi';
import { CLUB_OFFER } from '@/data/club-offer';
import home from '@/components/HomeV3.module.css';
import styles from '@/components/Mentoring.module.css';

export const metadata: Metadata = {
  title: 'Менторство по поступлению — ASHYQ, Казахстан',
  description: 'Помогаем поступать в Европу, США, ОАЭ и другие страны. Подбор вузов, документы и сопровождение подачи с ASHYQ. Стоимость и условия согласовываем на встрече.',
  alternates: { canonical: '/mentoring' },
};

const SUPPORT = [
  ['Стратегия поступления', 'Обсудим вашу цель, академический профиль, сроки и ограничения. Составим последовательность следующих шагов.'],
  ['Документы и тексты', 'Работа над CV, Personal Statement и пакетом документов с обратной связью. Авторство и достоверность сведений остаются за абитуриентом.'],
  ['Дедлайны и план', 'Поможем организовать подготовку и подачу: какие материалы нужны, что проверить и когда действовать.'],
  ['Регулярная обратная связь', 'Разбираем вопросы и следующий этап. Число встреч, список университетов и объём сопровождения согласуем до начала.'],
];

export default function MentoringPage() {
  return <div className={`v3 ${home.page}`}><NavBar /><main>
    <section className={`${home.container} ${styles.hero}`}>
      <MicroLabel>ASHYQ · менторство по поступлению</MicroLabel>
      <h1 className={styles.title}>Помогаем поступать<br />за рубеж.</h1>
      <p className={styles.lead}>{CLUB_OFFER.mentoring.description} Подбираем университеты, помогаем с документами и сопровождаем подачу.</p>
      <div className={styles.priceCard}>
        <div><p className={styles.eyebrow}>Индивидуальное сопровождение</p><p className={styles.price}>Ваш план поступления</p><p className={styles.previous}>{CLUB_OFFER.mentoring.pricing}</p></div>
        <ButtonLink href="#mentoring-enrolment">Обсудить менторство</ButtonLink>
        <p className={styles.note}>На встрече обсудим страны, университеты, сроки и объём помощи. Менторство — это не обещание оффера, гранта или визы.</p>
      </div>
    </section>
    <section className={`${home.container} ${home.section}`} aria-labelledby="mentoring-scope">
      <MicroLabel>Направления работы</MicroLabel><h2 id="mentoring-scope" className={home.heading}>С чем помогает ментор</h2>
      <div className={styles.grid}>{SUPPORT.map(([title, text]) => <article className={styles.card} key={title}><h3>{title}</h3><p>{text}</p></article>)}</div>
      <p className={styles.note}>Решение о зачислении принимает университет. Экзамены, сборы вузов, переводы, виза и другие внешние расходы не следует считать включёнными без письменного подтверждения условий.</p>
      <p className={styles.note}>Нужна именно подготовка к экзаменам? <Link className="link-underline" href="/courses">Посмотреть IELTS и SAT</Link>.</p>
    </section>
    <section id="mentoring-enrolment" className={`${home.container} ${home.section}`}><EnrollmentPlanner fixedProgram="mentoring" /></section>
  </main><Footer /></div>;
}
