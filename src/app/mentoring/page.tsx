import type { Metadata } from 'next';
import Link from 'next/link';
import EnrollmentPlanner from '@/components/EnrollmentPlanner';
import { ButtonLink, Footer, MicroLabel, NavBar } from '@/components/ui/CleanUi';
import { CLUB_OFFER, formatTenge } from '@/data/club-offer';
import home from '@/components/HomeV3.module.css';
import styles from '@/components/Mentoring.module.css';

export const metadata: Metadata = {
  title: 'Менторство по поступлению — ASHYQ, Казахстан',
  description: 'Стратегия поступления, документы и дедлайны с ментором ASHYQ. Онлайн по Казахстану. Формат работы и условия согласуются до начала.',
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
      <h1 className={styles.title}>Не просто список вузов.<br />Понятный маршрут поступления.</h1>
      <p className={styles.lead}>Для абитуриентов Казахстана, которым нужна поддержка в стратегии, документах и дедлайнах. Работаем онлайн: вы сохраняете контроль над решениями, ментор помогает организовать процесс.</p>
      <div className={styles.priceCard}>
        <div><p className={styles.eyebrow}>Текущее предложение команды ASHYQ</p><p className={styles.price}><span>{formatTenge(CLUB_OFFER.mentoring.current)}</span><span className={styles.period}>/ месяц</span></p><p className={styles.previous}>Ранее: <s>{formatTenge(CLUB_OFFER.mentoring.previous)}</s> / месяц · разница {formatTenge(CLUB_OFFER.mentoring.previous - CLUB_OFFER.mentoring.current)}</p></div>
        <ButtonLink href="#mentoring-enrolment">Обсудить менторство</ButtonLink>
        <p className={styles.note}>Цена предоставлена владельцем 28 сентября 2026. Дата окончания предложения не объявлена; актуальность цены, состав сопровождения и условия подтверждаются до записи. Это не обещание оффера, гранта или визы.</p>
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
