'use client';

import { useState } from 'react';
import { formatPhoneForDisplay, isValidPhone } from '@/lib/lead';
import { RedStar } from '@/components/ui/Brand';

type Status = 'idle' | 'sending' | 'done' | 'error';

/**
 * Главное действие экрана результата — запись на разбор.
 *
 * Телефон собирается на нашей стороне намеренно: клик по WhatsApp не
 * гарантирует отправку сообщения, и без номера такой ученик потерян.
 */
export default function BookingForm({
  defaultLead,
  onSubmit,
  whatsappHref,
  onWhatsAppClick,
}: {
  defaultLead?: { name?: string; grade?: string; phone?: string };
  onSubmit: (lead: { name?: string; grade?: string; phone: string }) => Promise<boolean>;
  whatsappHref: string;
  onWhatsAppClick: () => void;
}) {
  const [name, setName] = useState(defaultLead?.name ?? '');
  const [phone, setPhone] = useState(defaultLead?.phone ?? '');
  const [grade, setGrade] = useState(defaultLead?.grade ?? '');
  const [status, setStatus] = useState<Status>('idle');
  const [touched, setTouched] = useState(false);

  const phoneOk = isValidPhone(phone);
  const showPhoneError = touched && phone.length > 0 && !phoneOk;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setTouched(true);
    if (!phoneOk || status === 'sending') return;

    setStatus('sending');
    const ok = await onSubmit({
      name: name.trim() || undefined,
      grade: grade.trim() || undefined,
      phone: phone.trim(),
    });
    setStatus(ok ? 'done' : 'error');
  }

  if (status === 'done') {
    return (
      <section className="no-print mt-6 rounded-md border border-line bg-paper-card p-5 shadow-card">
        <p className="label flex items-center gap-2 text-red">
          <RedStar className="h-2.5 w-2.5" />
          Заявка принята
        </p>
        <h3 className="display mt-3 text-[1.5rem] leading-tight">
          Готово{name.trim() ? `, ${name.trim()}` : ''}. Тренер свяжется с тобой.
        </h3>
        <p className="mt-3 text-[0.95rem] leading-relaxed text-ink-soft">
          Напишем на {formatPhoneForDisplay(phone)} в течение дня и разберём твой
          результат — где ты теряешь баллы и что делать первым.
        </p>
        <a
          href={whatsappHref}
          target="_blank"
          rel="noopener noreferrer"
          className="btn btn-ink mt-5"
          onClick={onWhatsAppClick}
        >
          Не ждать — написать сейчас
        </a>
      </section>
    );
  }

  return (
    <section className="no-print mt-6 rounded-md border border-line bg-paper-card p-5 shadow-card">
      <form onSubmit={handleSubmit} noValidate>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className="label text-ink-faint" htmlFor="booking-phone">
              Телефон / WhatsApp *
            </label>
            <input
              id="booking-phone"
              className="field mt-1.5"
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              required
              aria-invalid={showPhoneError}
              aria-describedby={showPhoneError ? 'booking-phone-error' : undefined}
              value={phone}
              onBlur={() => setTouched(true)}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+7 706 708 01 81"
            />
            {showPhoneError ? (
              <p id="booking-phone-error" className="mt-1.5 text-[0.8rem] text-red">
                Проверь номер — нужно 10–15 цифр.
              </p>
            ) : null}
          </div>

          <div>
            <label className="label text-ink-faint" htmlFor="booking-name">
              Имя
            </label>
            <input
              id="booking-name"
              className="field mt-1.5"
              type="text"
              autoComplete="given-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Как к тебе обращаться"
            />
          </div>

          <div>
            <label className="label text-ink-faint" htmlFor="booking-grade">
              Класс
            </label>
            <input
              id="booking-grade"
              className="field mt-1.5"
              type="text"
              inputMode="numeric"
              autoComplete="off"
              value={grade}
              onChange={(e) => setGrade(e.target.value)}
              placeholder="Например, 10"
            />
          </div>
        </div>

        <button
          type="submit"
          className="btn btn-primary mt-5 w-full"
          disabled={status === 'sending'}
        >
          {status === 'sending' ? 'Отправляем…' : 'Записаться на разбор'}
        </button>

        {status === 'error' ? (
          <p className="mt-3 border border-red/50 bg-red/5 p-2.5 text-[0.85rem] leading-snug text-red">
            Не получилось отправить — похоже, пропала связь. Попробуй ещё раз или
            напиши напрямую в WhatsApp кнопкой ниже.
          </p>
        ) : null}

        <p className="mt-3 text-[0.78rem] leading-snug text-ink-faint">
          Бесплатно и ни к чему не обязывает. Номер нужен только чтобы связаться
          по этой диагностике — рассылок не будет.
        </p>
      </form>

      <div className="mt-5 flex items-center gap-3 border-t border-line pt-4">
        <span className="label shrink-0 text-ink-faint">или</span>
        <a
          href={whatsappHref}
          target="_blank"
          rel="noopener noreferrer"
          className="btn btn-ink flex-1"
          onClick={onWhatsAppClick}
        >
          Написать в WhatsApp
        </a>
      </div>
    </section>
  );
}
