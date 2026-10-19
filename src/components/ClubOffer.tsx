import Link from 'next/link';
import { ALL_INCLUSIVE_SERVICES, CLUB_OFFER, formatTenge } from '@/data/club-offer';
import { ButtonLink, MicroLabel } from './ui/CleanUi';
import styles from './ClubOffer.module.css';

export default function ClubOffer({ enrolmentHref = '#enrolment' }: { enrolmentHref?: string }) {
  return <section className={styles.panel} aria-label="Предложения ASHYQ">
    <div className={styles.header} data-motion-reveal><MicroLabel>Новый поток ASHYQ</MicroLabel><h2>Ваш следующий шаг — по новой цене.</h2><p>{CLUB_OFFER.students} ученика уже учатся в новом потоке · {CLUB_OFFER.teachers} преподавателя в команде.</p></div>
    <div className={styles.grid}>
      <article className={styles.card} data-motion-reveal data-motion-card><MicroLabel>Подготовка к экзаменам</MicroLabel><h3>Учиться в группе</h3><p className={styles.old}>Ранее <s>{formatTenge(CLUB_OFFER.course.previous)}</s></p><p className={styles.price}><strong data-motion-accent="price" data-motion-ambient="accent">{formatTenge(CLUB_OFFER.course.current)}</strong></p><p className={styles.saving}>На {formatTenge(CLUB_OFFER.course.previous - CLUB_OFFER.course.current)} меньше прежней цены</p><p className={styles.description}>Практика, разборы и понятный ритм подготовки. Вечерние двухчасовые занятия: выберите удобный вариант группы.</p><ButtonLink href={enrolmentHref}>Выбрать группу</ButtonLink><p className={styles.note}>Период оплаты, применимость цены к выбранному направлению и состав курса подтвердим до записи.</p></article>
      <article className={styles.card} data-motion-reveal data-motion-card><MicroLabel>Менторство по поступлению</MicroLabel><h3 data-motion-piece="heading" data-motion-ambient="piece">Поступление за рубеж</h3><p className={styles.description}>{CLUB_OFFER.mentoring.description} Подбор вузов, документы и сопровождение подачи.</p><p className={styles.saving}>{CLUB_OFFER.mentoring.pricing}</p><ButtonLink href="/mentoring" tone="outline">Обсудить поступление</ButtonLink><p className={styles.note}>Менторство не гарантирует зачисление, грант или визу.</p></article>
      <article id="all-inclusive" className={`${styles.card} ${styles.bundle}`} data-motion-reveal data-motion-card>
        <div>
          <MicroLabel>Комплексная подготовка и поступление</MicroLabel>
          <h3>Всё включено</h3>
          <p className={styles.bundleSubtitle}>IELTS + SAT + менторство</p>
          <p className={styles.description}>От подготовки к экзаменам до начала учёбы в университете. Преподаватели и ментор помогают двигаться по одному плану.</p>
          <p className={styles.old}>Было <s>{formatTenge(CLUB_OFFER.allInclusive.previous)}</s></p>
          <p className={styles.price}><strong data-motion-accent="price">{formatTenge(CLUB_OFFER.allInclusive.current)}</strong></p>
          <p className={styles.saving}>Экономия {formatTenge(CLUB_OFFER.allInclusive.previous - CLUB_OFFER.allInclusive.current)}</p>
          <div className={styles.bundleActions}><ButtonLink href="/all-inclusive">Что входит в пакет</ButtonLink></div>
        </div>
        <div>
          <ul className={styles.benefits}>{ALL_INCLUSIVE_SERVICES.map((service) => <li key={service.title}>{service.title}</li>)}</ul>
          <p className={styles.note}>До оплаты согласуем длительность подготовки, объём занятий и сопровождения. Экзаменационные, университетские и визовые сборы, переводы, дорога, проживание и обучение в вузе оплачиваются отдельно.</p>
        </div>
      </article>
    </div>
    <p className={styles.source}>Цены и данные потока предоставлены командой ASHYQ. Полные условия подготовки в группе подтверждаем перед записью, условия менторства — на встрече. <Link href="/contacts" className="link-underline">Связаться с нами</Link>.</p>
  </section>;
}
