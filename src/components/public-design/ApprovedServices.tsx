import Link from 'next/link';
import { ALL_INCLUSIVE_SERVICES, CLUB_OFFER, formatTenge } from '@/data/club-offer';
import ServiceArtwork from './ServiceArtwork';
import styles from './ApprovedServices.module.css';

const services = [
  { id: 'ielts', title: 'Подготовка к IELTS', text: 'Разбирай ошибки в грамматике, развивай аргументы и тренируй четыре экзаменационных навыка.', tags: ['Reading', 'Listening', 'Writing', 'Speaking'], href: '/courses/ielts' },
  { id: 'sat', title: 'Подготовка к Digital SAT', text: 'Учись видеть смысл условия, выбирать стратегию решения и объяснять, почему ответ подходит.', tags: ['Reading & Writing', 'Math', 'Стратегия'], href: '/courses/sat' },
  { id: 'mentoring', title: 'Поступление за рубеж', text: 'Подбор университетов, работа над документами и сопровождение подачи под твою цель.', tags: ['Выбор вузов', 'Документы', 'Подача'], href: '/mentoring' },
] as const;

export default function ApprovedServices({ compact = false }: { compact?: boolean }) {
  return <section id="directions" className={styles.section} aria-labelledby="approved-services-title">
    <div id="programs" className={styles.heading}><div><p className={styles.eyebrow}>ТВОЙ СЛЕДУЮЩИЙ ЭТАП</p><h2 id="approved-services-title">Большой выбор.<br />Личная цель.</h2></div><p>Нужен один экзамен — выбирай курс. Нужны IELTS, SAT и поступление — смотри «Всё включено».</p></div>
    <div className={styles.rail} data-service-rail={compact ? undefined : ''}>
      <div className={styles.track} data-service-track>
        {services.map(service => <article className={styles.card} data-service-card key={service.id}>
          <ServiceArtwork kind={service.id} />
          <div className={styles.body}><h3>{service.title}</h3><p>{service.text}</p><ul className={styles.tags}>{service.tags.map(tag => <li key={tag}>{tag}</li>)}</ul>
            <div className={styles.price}>{service.id === 'mentoring' ? <><small>Стоимость и условия</small><strong>Обсуждаем на встрече</strong></> : <><small>Групповая подготовка</small><div><s>{formatTenge(CLUB_OFFER.course.previous)}</s><strong>{formatTenge(CLUB_OFFER.course.current)}</strong></div></>}</div>
            <Link className={styles.button} href={service.href}>{service.id === 'mentoring' ? 'О менторстве' : 'О программе'}<span aria-hidden="true">→</span></Link>
          </div>
        </article>)}
      </div>
    </div>
    <p className={styles.conditions}>Стоимость и состав подготовки подтверждаем перед записью. Период оплаты и расписание согласуем с командой.</p>
    <article className={styles.bundle}>
      <div><p className={styles.eyebrow}>ОДНА ЦЕЛЬ · ВСЯ КОМАНДА</p><h2>Всё включено.</h2><p>IELTS + SAT + менторство</p><p className={styles.bundleIntro}>Два экзамена и поступление по одному плану. Подготовка, приоритетная помощь тренеров и сопровождение до начала учёбы.</p>
        <div className={styles.bundlePrice}><s>{formatTenge(CLUB_OFFER.allInclusive.previous)}</s><strong>{formatTenge(CLUB_OFFER.allInclusive.current)}</strong></div>
        <Link className={styles.bundleButton} href="/all-inclusive">Что входит в пакет <span aria-hidden="true">→</span></Link>
      </div><div><ul className={styles.benefits}>{ALL_INCLUSIVE_SERVICES.map(service => <li key={service.title}><span aria-hidden="true">✓</span>{service.title}</li>)}</ul><p className={styles.bundleNote}>Длительность и объём помощи закрепляем до оплаты. Внешние экзаменационные, университетские и визовые сборы оплачиваются отдельно. Поступление и виза не гарантируются.</p></div>
    </article>
  </section>;
}
