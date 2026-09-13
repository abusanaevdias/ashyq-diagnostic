'use client';

import { useState } from 'react';
import Link from 'next/link';
import { isValidPhone, sendLead } from '@/lib/lead';
import styles from '@/components/season/SeasonV3.module.css';

type Status = 'idle' | 'sending' | 'done' | 'error';

export default function SeasonForm() {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [grade, setGrade] = useState('');
  const [exam, setExam] = useState<'ielts' | 'sat'>('ielts');
  const [consent, setConsent] = useState(false);
  const [status, setStatus] = useState<Status>('idle');
  const [touched, setTouched] = useState(false);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setTouched(true);
    if (!name.trim() || !isValidPhone(phone) || !consent || status === 'sending') return;
    setStatus('sending');
    const ok = await sendLead({
      kind: 'season',
      runId: `season-${Date.now()}`,
      exam,
      name: name.trim(),
      phone: phone.trim(),
      grade: grade.trim() || undefined,
      plannedWhen: 'next-season',
    });
    setStatus(ok ? 'done' : 'error');
  }

  if (status === 'done') {
    return (
      <div className={styles.form} role="status">
        <p className={styles.micro}>Заявка принята</p>
        <h2 className={styles.heading}>Спасибо, {name.trim()}.</h2>
        <p className={styles.subhead}>Команда ASHYQ свяжется с вами и сообщит подтверждённые даты, формат и стоимость следующего сезона.</p>
      </div>
    );
  }

  return (
    <form className={styles.form} onSubmit={submit} noValidate>
      <div className={styles.formGrid}>
        <div>
          <label className={styles.fieldLabel} htmlFor="season-name">Имя *</label>
          <input id="season-name" className={styles.field} autoComplete="name" required value={name} onChange={(e) => setName(e.target.value)} />
          {touched && !name.trim() ? <p className={styles.error}>Укажите имя.</p> : null}
        </div>
        <div>
          <label className={styles.fieldLabel} htmlFor="season-phone">Телефон / WhatsApp *</label>
          <input id="season-phone" className={styles.field} type="tel" inputMode="tel" autoComplete="tel" required value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+7 706 708 01 81" />
          {touched && !isValidPhone(phone) ? <p className={styles.error}>Проверьте номер: нужно 10–15 цифр.</p> : null}
        </div>
        <div>
          <label className={styles.fieldLabel} htmlFor="season-grade">Класс</label>
          <input id="season-grade" className={styles.field} inputMode="numeric" value={grade} onChange={(e) => setGrade(e.target.value)} placeholder="Например, 10" />
        </div>
        <div>
          <label className={styles.fieldLabel} htmlFor="season-exam">Направление *</label>
          <select id="season-exam" className={styles.field} value={exam} onChange={(e) => setExam(e.target.value as 'ielts' | 'sat')}>
            <option value="ielts">IELTS</option>
            <option value="sat">SAT</option>
          </select>
        </div>
      </div>
      <label className={styles.consent}>
        <input type="checkbox" required checked={consent} onChange={(e) => setConsent(e.target.checked)} />
        <span>Я согласен(на) на сбор и обработку указанных данных для ответа на заявку и принимаю <Link className="link-underline text-ink" href="/privacy">политику конфиденциальности</Link>.</span>
      </label>
      {touched && !consent ? <p className={styles.error}>Для отправки заявки нужно согласие.</p> : null}
      <button className={styles.submit} type="submit" disabled={status === 'sending'}>
        {status === 'sending' ? 'Отправляем…' : 'Узнать о следующем сезоне'}
      </button>
      {status === 'error' ? <p className={styles.error}>Не получилось отправить. Проверьте связь и попробуйте ещё раз.</p> : null}
    </form>
  );
}
