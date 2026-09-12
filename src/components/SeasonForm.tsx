'use client';

import { useState } from 'react';
import Link from 'next/link';
import { isValidPhone, sendLead } from '@/lib/lead';

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
      <div className="card border-red p-5" role="status">
        <p className="label text-red">Заявка принята</p>
        <h2 className="display mt-3 text-h3">Спасибо, {name.trim()}.</h2>
        <p className="mt-3 text-ink-soft">Команда ASHYQ свяжется с вами и сообщит подтверждённые даты, формат и стоимость следующего сезона.</p>
      </div>
    );
  }

  return (
    <form className="card p-5 sm:p-6" onSubmit={submit} noValidate>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="label text-ink-faint" htmlFor="season-name">Имя *</label>
          <input id="season-name" className="field mt-1.5" autoComplete="name" required value={name} onChange={(e) => setName(e.target.value)} />
          {touched && !name.trim() ? <p className="mt-1.5 text-[0.8rem] text-red">Укажите имя.</p> : null}
        </div>
        <div>
          <label className="label text-ink-faint" htmlFor="season-phone">Телефон / WhatsApp *</label>
          <input id="season-phone" className="field mt-1.5" type="tel" inputMode="tel" autoComplete="tel" required value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+7 706 708 01 81" />
          {touched && !isValidPhone(phone) ? <p className="mt-1.5 text-[0.8rem] text-red">Проверьте номер: нужно 10–15 цифр.</p> : null}
        </div>
        <div>
          <label className="label text-ink-faint" htmlFor="season-grade">Класс</label>
          <input id="season-grade" className="field mt-1.5" inputMode="numeric" value={grade} onChange={(e) => setGrade(e.target.value)} placeholder="Например, 10" />
        </div>
        <div>
          <label className="label text-ink-faint" htmlFor="season-exam">Направление *</label>
          <select id="season-exam" className="field mt-1.5" value={exam} onChange={(e) => setExam(e.target.value as 'ielts' | 'sat')}>
            <option value="ielts">IELTS</option>
            <option value="sat">SAT</option>
          </select>
        </div>
      </div>
      <label className="mt-5 flex cursor-pointer items-start gap-3 text-[0.82rem] leading-snug text-ink-soft">
        <input className="mt-1 h-4 w-4 shrink-0 accent-red" type="checkbox" required checked={consent} onChange={(e) => setConsent(e.target.checked)} />
        <span>Я согласен(на) на сбор и обработку указанных данных для ответа на заявку и принимаю <Link className="link-underline text-ink" href="/privacy">политику конфиденциальности</Link>.</span>
      </label>
      {touched && !consent ? <p className="mt-1.5 text-[0.8rem] text-red">Для отправки заявки нужно согласие.</p> : null}
      <button className="btn btn-primary mt-5" type="submit" disabled={status === 'sending'}>
        {status === 'sending' ? 'Отправляем…' : 'Узнать о следующем сезоне'}
      </button>
      {status === 'error' ? <p className="mt-3 text-[0.85rem] text-red">Не получилось отправить. Проверьте связь и попробуйте ещё раз.</p> : null}
    </form>
  );
}
