import Image from 'next/image';
import { PHOTOS } from '@/data/media';
import { WHATSAPP_NUMBER } from '@/lib/config';
import { formatPhoneForDisplay } from '@/lib/lead';
import { CONTACT_EMAIL, SOCIAL_LINKS, TELEGRAM_CONTACT } from '@/lib/site';
import SeasonForm from './SeasonForm';
import { Footer, IconChip, MicroLabel, NavBar } from './ui/CleanUi';
import home from './HomeV3.module.css';
import styles from './ContactsV3.module.css';
import { AiBadge } from './AiBadge';

/**
 * /contacts по DESIGN_V3 §6.6. Контакты подтверждены пользователем 2026-09-13
 * (src/lib/site.ts). Почта предоставлена владельцем в этом чате;
 * постоянный офис не указан, поэтому карты и выдуманного адреса нет.
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
                  <p className={styles.rowTitle}>Telegram — связь с командой</p>
                  <a className={styles.rowLink} href={`https://t.me/${TELEGRAM_CONTACT}`} target="_blank" rel="noopener noreferrer">@{TELEGRAM_CONTACT}</a>
                </div>
              </div>
              <div className={styles.row}>
                <IconChip name="mail" solid />
                <div>
                  <p className={styles.rowTitle}>Электронная почта</p>
                  <a className={styles.rowLink} href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>
                </div>
              </div>
              <div className={styles.row}>
                <IconChip name="pin" solid />
                <div>
                  <p className={styles.rowTitle}>Формат</p>
                  <p className={styles.rowText}>Занятия онлайн по Казахстану. Команда работает Пн–Сб, 19:00–23:00 по Астане (UTC+5). Это часы работы, не расписание каждой группы. Офлайн-финал сезона планируется; дату и место уточняйте у команды.</p>
                </div>
              </div>
            </div>

            <div>
              <h2 className={home.heading}>Оставьте заявку на консультацию</h2>
              <div className={styles.formWrap}><SeasonForm context="contact" /></div>
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
              <div className={styles.photo}><Image src={PHOTOS.contacts.src} alt={PHOTOS.contacts.alt} fill sizes="(max-width: 900px) 100vw, 40vw" /><AiBadge /></div>
              <p className={styles.script}>let’s make it happen together</p>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
