import Link from 'next/link';
import { CLUB_OFFER, formatTenge } from '@/data/club-offer';
import { ButtonLink, MicroLabel } from './ui/CleanUi';
import styles from './ClubOffer.module.css';

export default function ClubOffer({ enrolmentHref = '#enrolment' }: { enrolmentHref?: string }) {
  return <section className={styles.panel} aria-label="Предложения ASHYQ">
    <div className={styles.header}><MicroLabel>Новый поток ASHYQ</MicroLabel><h2>Ваш следующий шаг — по новой цене.</h2><p>{CLUB_OFFER.students} ученика уже учатся в новом потоке · {CLUB_OFFER.teachers} преподавателя в команде.</p></div>
    <div className={styles.grid}>
      <article className={styles.card}><MicroLabel>Подготовка к экзаменам</MicroLabel><h3>Учиться в группе</h3><p className={styles.old}>Ранее <s>{formatTenge(CLUB_OFFER.course.previous)}</s></p><p className={styles.price}>{formatTenge(CLUB_OFFER.course.current)}</p><p className={styles.saving}>На {formatTenge(CLUB_OFFER.course.previous - CLUB_OFFER.course.current)} меньше прежней цены</p><p className={styles.description}>Практика, разборы и понятный ритм подготовки. Вечерние двухчасовые занятия: выберите удобный вариант группы.</p><ButtonLink href={enrolmentHref}>Выбрать группу</ButtonLink><p className={styles.note}>Период оплаты, применимость цены к выбранному направлению и состав курса подтвердим до записи.</p></article>
      <article className={styles.card}><MicroLabel>Менторство по поступлению</MicroLabel><h3>Поступление за рубеж</h3><p className={styles.description}>{CLUB_OFFER.mentoring.description} Подбор вузов, документы и сопровождение подачи.</p><p className={styles.saving}>{CLUB_OFFER.mentoring.pricing}</p><ButtonLink href="/mentoring" tone="outline">Обсудить поступление</ButtonLink><p className={styles.note}>Менторство не гарантирует зачисление, грант или визу.</p></article>
    </div>
    <p className={styles.source}>Цены и данные потока предоставлены командой ASHYQ. Полные условия подготовки в группе подтверждаем перед записью, условия менторства — на встрече. <Link href="/contacts" className="link-underline">Связаться с нами</Link>.</p>
  </section>;
}
