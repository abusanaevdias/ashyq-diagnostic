import Image from 'next/image';
import { WHATSAPP_NUMBER } from '@/lib/config';
import { formatPhoneForDisplay } from '@/lib/lead';
import { SOCIAL_LINKS, TELEGRAM_CONTACT } from '@/lib/site';
import SeasonForm from './SeasonForm';
import { Footer, IconChip, MicroLabel, NavBar } from './ui/CleanUi';
import home from './HomeV3.module.css';
import styles from './ContactsV3.module.css';

/**
 * /contacts по DESIGN_V3 §6.6. Контакты подтверждены пользователем 2026-09-13
 * (src/lib/site.ts). Почты и офиса у ASHYQ пока нет — поэтому нет строки
 * e-mail и карты; появятся — добавить сюда.
 */
export default function ContactsV3() {
  return (
    <div className={home.page}>
      <NavBar />

      <main>
        <section className={`${home.container} ${styles.hero}`}>
          <MicroLabel>Мы всегда рядом</MicroLabel>
          <h1 className={styles.title}>Свяжитесь с нами</h1>
          <p className={home.lead}>Вопросы о диагностике, курсах или сезоне — напишите в WhatsApp или Telegram либо оставьте заявку, команда ASHYQ ответит.</p>

          <div className={styles.grid}>
            <div className={styles.rows}>
              <div className={styles.row}>
                <IconChip name="chat" solid />
                <div>
                  <p className={styles.rowTitle}>WhatsApp</p>
                  <a className={styles.rowLink} href={`https://wa.me/${WHATSAPP_NUMBER}`} target="_blank" rel="noopener noreferrer">{formatPhoneForDisplay(WHATSAPP_NUMBER)}</a>
                </div>
              </div>
              <div className={styles.row}>
                <IconChip name="send" solid />
                <div>
                  <p className={styles.rowTitle}>Telegram</p>
                  <a className={styles.rowLink} href={`https://t.me/${TELEGRAM_CONTACT}`} target="_blank" rel="noopener noreferrer">@{TELEGRAM_CONTACT}</a>
                </div>
              </div>
              <div className={styles.row}>
                <IconChip name="pin" solid />
                <div>
                  <p className={styles.rowTitle}>Формат</p>
                  <p className={styles.rowText}>Занятия онлайн. Финал сезона — офлайн в Астане.</p>
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
          <div className={styles.socialGrid}>
            <div className={styles.socialCard}>
              <MicroLabel>Соцсети</MicroLabel>
              <h2 className={home.heading}>ASHYQ в соцсетях</h2>
              <ul className={styles.socialList}>
                {SOCIAL_LINKS.map((social) => (
                  <li key={social.href}>
                    <a className={styles.socialLink} href={social.href} target="_blank" rel="noopener noreferrer">
                      <span>{social.label}</span>
                      <span className={styles.handle}>{social.handle}</span>
                    </a>
                  </li>
                ))}
              </ul>
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
