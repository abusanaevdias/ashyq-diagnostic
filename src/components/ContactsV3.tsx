import Image from 'next/image';
import { IS_WHATSAPP_CONFIGURED, WHATSAPP_NUMBER } from '@/lib/config';
import SeasonForm from './SeasonForm';
import { ButtonLink, Footer, IconChip, MicroLabel, NavBar } from './ui/CleanUi';
import home from './HomeV3.module.css';
import styles from './ContactsV3.module.css';

/**
 * /contacts по DESIGN_V3 §6.6.
 *
 * ДЕМО: подтверждённых контактов пока нет (решение пользователя 2026-09-13).
 * Выдуманных телефонов, адресов и почты не показываем. Когда контакты придут:
 * заполнить CONTACTS, поставить CONTACTS_IS_DEMO = false (плашка и noindex
 * снимутся сами), добавить '/contacts' в SITE_ROUTES, заменить карту-заглушку.
 */
export const CONTACTS_IS_DEMO = true;

const CONTACTS: { email: string | null; address: string | null } = {
  email: null,
  address: null,
};

export default function ContactsV3() {
  return (
    <div className={home.page}>
      <NavBar />
      {CONTACTS_IS_DEMO ? <p className={styles.demoBar} role="note">Демо-контент: контакты уточняются. Пока надёжнее всего написать в WhatsApp или оставить заявку.</p> : null}

      <main>
        <section className={`${home.container} ${styles.hero}`}>
          <MicroLabel>Мы всегда рядом</MicroLabel>
          <h1 className={styles.title}>Свяжитесь с нами</h1>
          <p className={home.lead}>Вопросы о диагностике, курсах или сезоне — напишите в WhatsApp или оставьте заявку, команда ASHYQ ответит.</p>

          <div className={styles.grid}>
            <div className={styles.rows}>
              <div className={styles.row}>
                <IconChip name="chat" solid />
                <div>
                  <p className={styles.rowTitle}>WhatsApp</p>
                  {IS_WHATSAPP_CONFIGURED ? <a className={styles.rowLink} href={`https://wa.me/${WHATSAPP_NUMBER}`} target="_blank" rel="noopener noreferrer">Написать в WhatsApp</a> : <p className={styles.rowText}>Номер уточняется</p>}
                </div>
              </div>
              <div className={styles.row}>
                <IconChip name="mail" solid />
                <div>
                  <p className={styles.rowTitle}>Почта</p>
                  {CONTACTS.email ? <a className={styles.rowLink} href={`mailto:${CONTACTS.email}`}>{CONTACTS.email}</a> : <p className={styles.rowText}>Уточняется</p>}
                </div>
              </div>
              <div className={styles.row}>
                <IconChip name="pin" solid />
                <div>
                  <p className={styles.rowTitle}>Где мы</p>
                  <p className={styles.rowText}>{CONTACTS.address ?? 'Астана и онлайн. Точный адрес уточняется.'}</p>
                </div>
              </div>
            </div>

            <div>
              <h2 className={home.heading}>Оставьте контакт — мы свяжемся</h2>
              <div className={styles.formWrap}><SeasonForm /></div>
              <p className={styles.formNote}>Ответим в WhatsApp или по телефону, который вы укажете.</p>
            </div>
          </div>
        </section>

        <section className={`${home.container} ${home.section}`}>
          <div className={styles.mapGrid}>
            <div className={styles.map}>
              <svg className={styles.mapArt} viewBox="0 0 600 360" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
                <path d="M0 250C120 220 180 280 300 240S480 170 600 200" />
                <path d="M150 0 210 360M420 0 380 360M0 110l600 30" />
              </svg>
              <span className={styles.pin} aria-hidden="true" />
              <div className={styles.mapCard}>
                <p className={styles.mapTitle}>Приходите в гости</p>
                <p className={styles.mapText}>Финал сезона проходит офлайн в Астане. Точный адрес сообщим участникам и добавим сюда.</p>
                <ButtonLink href="/season" tone="outline">Узнать о сезоне</ButtonLink>
              </div>
            </div>
            <div>
              <div className={styles.photo}><Image src="/brand/lesson-grid.jpg" alt="Онлайн-занятие ASHYQ" fill sizes="(max-width: 900px) 100vw, 40vw" /></div>
              <p className={styles.script}>let’s make it happen together</p>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
