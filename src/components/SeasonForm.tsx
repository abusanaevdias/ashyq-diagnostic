'use client';

import { useState } from 'react';
import Link from 'next/link';
import { isValidPhone, sendLead } from '@/lib/lead';
import { newRunId } from '@/lib/storage';
import styles from '@/components/season/SeasonV3.module.css';

type Status = 'idle' | 'sending' | 'done' | 'error';

interface SeasonFormProps {
  context?: 'season' | 'contact';
}

export default function SeasonForm({ context = 'season' }: SeasonFormProps) {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [grade, setGrade] = useState('');
  const [exam, setExam] = useState<'ielts' | 'sat'>('ielts');
  const [consent, setConsent] = useState(false);
  const [website, setWebsite] = useState(''); // honeypot: человек не видит и не заполняет
  const [status, setStatus] = useState<Status>('idle');
  const [touched, setTouched] = useState(false);
  const isContact = context === 'contact';

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setTouched(true);
    if (!name.trim() || !isValidPhone(phone) || !consent || status === 'sending') return;
    setStatus('sending');
    const ok = await sendLead({
      kind: context,
      runId: `${context}-${newRunId()}`,
      exam,
      name: name.trim(),
      phone: phone.trim(),
      grade: grade.trim() || undefined,
      plannedWhen: isContact ? undefined : 'next-season',
      website,
    });
    setStatus(ok ? 'done' : 'error');
  }

  if (status === 'done') {
    return (
      <div className={styles.form} role="status">
        <p className={styles.micro}>{isContact ? 'Обращение принято' : 'Заявка принята'}</p>
        <h2 className={styles.heading}>Спасибо, {name.trim()}.</h2>
        <p className={styles.subhead}>
          {isContact
            ? 'Команда ASHYQ свяжется с вами и ответит на вопрос.'
            : 'Команда ASHYQ свяжется с вами и сообщит подтверждённые даты, формат и стоимость следующего сезона.'}
        </p>
      </div>
    );
  }

  return (
    <form className={styles.form} onSubmit={submit} noValidate>
      {/* honeypot: скрыт от людей (off-screen, не в табе), боты заполняют — сервер отбрасывает */}
      <input
        type="text"
        name="website"
        tabIndex={-1}
        autoComplete="off"
        aria-hidden="true"
        value={website}
        onChange={(e) => setWebsite(e.target.value)}
        style={{ position: 'absolute', left: '-9999px', width: 0, height: 0, padding: 0, border: 0, opacity: 0 }}
      />

      <div className={styles.formGrid}>
        <div>
          <label className={styles.fieldLabel} htmlFor={`${context}-name`}>Имя *</label>
          <input id={`${context}-name`} className={styles.field} autoComplete="name" required value={name} onChange={(e) => setName(e.target.value)} />
          {touched && !name.trim() ? <p className={styles.error}>Укажите имя.</p> : null}
        </div>
        <div>
          <label className={styles.fieldLabel} htmlFor={`${context}-phone`}>Телефон / WhatsApp *</label>
          <input id={`${context}-phone`} className={styles.field} type="tel" inputMode="tel" autoComplete="tel" required value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+7 7XX XXX XX XX" />
          {touched && !isValidPhone(phone) ? <p className={styles.error}>Проверьте номер: нужно 10–15 цифр.</p> : null}
        </div>
        <div>
          <label className={styles.fieldLabel} htmlFor={`${context}-grade`}>Класс</label>
          <input id={`${context}-grade`} className={styles.field} inputMode="numeric" value={grade} onChange={(e) => setGrade(e.target.value)} placeholder="Например, 10" />
        </div>
        <div>
          <label className={styles.fieldLabel} htmlFor={`${context}-exam`}>Направление *</label>
          <select id={`${context}-exam`} className={styles.field} value={exam} onChange={(e) => setExam(e.target.value as 'ielts' | 'sat')}>
            <option value="ielts">IELTS</option>
            <option value="sat">SAT</option>
          </select>
        </div>
      </div>
      <label className={styles.consent}>
        <input type="checkbox" required checked={consent} onChange={(e) => setConsent(e.target.checked)} />
        <span>Я согласен(на) на сбор и обработку указанных данных для ответа на {isContact ? 'обращение' : 'заявку'} и принимаю <Link className="link-underline text-ink" href="/privacy">политику конфиденциальности</Link>.</span>
      </label>
      {touched && !consent ? (
        <p className={styles.error}>Для отправки {isContact ? 'обращения' : 'заявки'} нужно согласие.</p>
      ) : null}
      <button className={styles.submit} type="submit" disabled={status === 'sending'}>
        {status === 'sending' ? 'Отправляем…' : isContact ? 'Отправить обращение' : 'Узнать о следующем сезоне'}
      </button>
      {status === 'error' ? <p className={styles.error}>Не получилось отправить. Проверьте связь и попробуйте ещё раз.</p> : null}
    </form>
  );
}
