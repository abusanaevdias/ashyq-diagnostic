'use client';

import { useState } from 'react';
import { EXAMS, IS_WHATSAPP_CONFIGURED } from '@/lib/config';
import { track } from '@/lib/analytics';
import { buildWhatsAppLink } from '@/lib/whatsapp';
import type { DiagnosticResult, RunState, UtmParams } from '@/lib/types';
import DiagnosticCard from './DiagnosticCard';
import ShareButtons from './ShareButtons';
import BookingForm from './BookingForm';
import { Meter } from '@/components/ui/Primitives';
import {
  RedStar,
  Wordmark,
  EditorialLabel,
  HandNote,
} from '@/components/ui/Brand';
import type { CardData } from '@/lib/card-image';

export default function ResultScreen({
  run,
  result,
  utm,
  onReview,
  onRestart,
  onHome,
  onSaveLead,
  onWhatsAppClick,
}: {
  run: RunState;
  result: DiagnosticResult;
  utm: UtmParams;
  onReview: () => void;
  onRestart: () => void;
  onHome: () => void;
  onSaveLead: (lead: { name?: string; grade?: string; phone: string }) => Promise<boolean>;
  onWhatsAppClick: () => void;
}) {
  const exam = result.exam;
  const cfg = EXAMS[exam];
  const isSat = exam === 'sat';
  const [resetOpen, setResetOpen] = useState(false);

  const targetLabel =
    !run.target || run.target === 'unknown'
      ? 'не выбрана'
      : isSat
        ? `${run.target}+`
        : run.target;

  const nextStep = result.weakest[0]
    ? isSat
      ? result.weakest[0].domain
      : `${result.weakest[0].section === 'listening' ? 'Listening' : 'Reading'} — ${result.weakest[0].domain}`
    : isSat
      ? 'Mock test'
      : 'Writing + Speaking';

  const cardData: CardData = {
    exam: cfg.name,
    headline: isSat ? 'SAT readiness' : 'IELTS readiness',
    bandLabel: result.band.rangeLabel,
    level: `${result.band.levelTitleRu} · ${result.totalCorrect} из ${result.totalQuestions} верно`,
    sections: result.sections.map((s) => ({
      label: s.label,
      percent: s.percent,
      level: s.level,
    })),
    target: targetLabel,
    gapLabel: result.gapLabel ?? '—',
    nextStep,
    strongest: result.strongest[0]?.domain ?? '—',
  };

  const contact = {
    name: run.lead?.name,
    grade: run.lead?.grade,
    phone: run.lead?.phone,
  };
  const waResult = buildWhatsAppLink({ exam, result, target: run.target, utm, intent: 'result', ...contact });
  const waPrep = buildWhatsAppLink({ exam, result, target: run.target, utm, intent: 'prep', ...contact });

  const handleWhatsApp = (intent: 'result' | 'prep') => {
    track(intent === 'result' ? 'whatsapp_cta_clicked' : 'prep_cta_clicked', {
      exam,
      intent,
      band: result.band.rangeLabel,
      utm,
    });
    onWhatsAppClick();
  };

  return (
    <div className="v3 min-h-dvh pb-16">
      <header className="shell-wide flex items-center justify-between py-5">
        <Wordmark size="md" />
        <span className="label text-ink-faint">Результат</span>
      </header>

      <main className="shell pt-4">
        <EditorialLabel>Your Ashyq Diagnostic</EditorialLabel>
        <h1 className="serif mt-4 max-w-[10.8em] text-h1 text-red">Твоя точка А</h1>

        {/* ---------- карточка для скриншота ---------- */}
        <div className="mt-7">
          <DiagnosticCard data={cardData} />
        </div>

        <div className="mt-5">
          <ShareButtons result={result} cardData={cardData} />
        </div>

        {/* ---------- цифры ---------- */}
        <section className="mt-10 grid gap-px overflow-hidden rounded-md border border-line bg-line sm:grid-cols-3">
          <Stat
            label="Твоя точка А"
            value={result.band.rangeLabel}
            note={isSat ? 'предварительный диапазон' : 'предварительный readiness'}
            accent
          />
          <Stat label="Цель" value={targetLabel} note={isSat ? 'SAT score' : 'IELTS Band'} />
          <Stat
            label="Gap"
            value={result.gapLabel ?? '—'}
            note={
              result.targetReached
                ? 'цель уже в диапазоне'
                : result.gapLabel
                  ? 'до цели'
                  : 'выбери цель на разборе'
            }
          />
        </section>

        {/* ---------- секции ---------- */}
        <section className="mt-12">
          <EditorialLabel>Где ты сейчас</EditorialLabel>
          <div className="mt-6 space-y-5">
            {result.sections.map((s) => (
              <div key={s.section}>
                <div className="flex items-baseline justify-between gap-3">
                  <span className="text-[0.95rem] font-semibold">{s.label}</span>
                  <span className="font-mono text-[0.75rem] text-ink-faint">
                    {s.correct}/{s.total} верно · {s.percent}%
                  </span>
                </div>
                <Meter value={s.readiness} className="mt-2" />
                <p className="label mt-1.5 text-ink-soft">{s.level}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ---------- сильные / слабые ---------- */}
        <section className="mt-12 grid gap-8 sm:grid-cols-2">
          <div>
            <h2 className="label flex items-center gap-2 text-ink-faint">
              <span aria-hidden="true" className="inline-block h-1.5 w-1.5 bg-ink" />
              Сильнее всего
            </h2>
            <ul className="mt-3 space-y-2">
              {result.strongest.length === 0 ? (
                <li className="text-[0.95rem] text-ink-soft">
                  Пока не на что опереться — но это чинится первым же разбором.
                </li>
              ) : (
                result.strongest.map((d) => (
                  <li
                    key={`${d.section}-${d.domain}`}
                    className="flex items-center justify-between gap-3 border-l-2 border-ink pl-3"
                  >
                    <span className="text-[0.98rem] font-semibold">
                      {isSat ? d.domain : `${d.section === 'listening' ? 'Listening' : 'Reading'} — ${d.domain}`}
                    </span>
                    <span className="font-mono text-[0.75rem] text-ink-faint">
                      {d.correct}/{d.total}
                    </span>
                  </li>
                ))
              )}
            </ul>
          </div>
          <div>
            <h2 className="label flex items-center gap-2 text-red">
              <RedStar className="h-2.5 w-2.5" />
              Стоит подтянуть
            </h2>
            <ul className="mt-3 space-y-2">
              {result.weakest.length === 0 ? (
                <li className="text-[0.95rem] text-ink-soft">
                  Ошибок нет — дальше имеет смысл брать полный mock.
                </li>
              ) : (
                result.weakest.map((d) => (
                  <li
                    key={`${d.section}-${d.domain}`}
                    className="flex items-center justify-between gap-3 border-l-2 border-red pl-3"
                  >
                    <span className="text-[0.98rem] font-semibold">
                      {isSat ? d.domain : `${d.section === 'listening' ? 'Listening' : 'Reading'} — ${d.domain}`}
                    </span>
                    <span className="font-mono text-[0.75rem] text-ink-faint">
                      {d.correct}/{d.total}
                    </span>
                  </li>
                ))
              )}
            </ul>
          </div>
        </section>

        {/* ---------- insights ---------- */}
        {result.insights.length > 0 ? (
          <section className="mt-12">
            <EditorialLabel>Что это значит</EditorialLabel>
            <ul className="mt-5 space-y-3">
              {result.insights.map((line, i) => (
                <li key={i} className="flex gap-3">
                  <RedStar className="mt-1.5 h-2.5 w-2.5 shrink-0 text-red" />
                  <p className="text-[1rem] leading-relaxed text-ink-soft">{line}</p>
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        {!isSat ? (
          <p className="mt-8 border-l-2 border-line pl-3 text-[0.9rem] leading-relaxed text-ink-faint">
            {cfg.scopeNote}
          </p>
        ) : null}

        {/* ---------- главный CTA ---------- */}
        <section className="band-dark relative mt-14 overflow-hidden">
          <div className="relative px-5 py-9 sm:px-7">
            <p className="label text-paper/70">Следующий шаг</p>
            <h2 className="display mt-3 max-w-[16.2em] text-h2 text-paper">
              {isSat
                ? 'До цели уже видно маршрут.'
                : 'Дальше — проверить Writing и Speaking.'}
            </h2>

            <div className="relative mt-6 max-w-md">
              <a
                href={waResult}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-cream"
                onClick={() => handleWhatsApp('result')}
              >
                {isSat ? 'Разобрать мой результат' : 'Получить полный разбор'}
                <svg viewBox="0 0 20 12" aria-hidden="true" className="h-3 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <path d="M1 6h17M13 1.5 18 6l-5 4.5" />
                </svg>
              </a>
              <HandNote arrow="down-right" className="absolute -right-2 -top-9 hidden text-paper sm:inline-flex">
                бесплатно
              </HandNote>
            </div>

            <p className="mt-4 max-w-md text-[0.92rem] leading-snug text-paper/85">
              Бесплатно разберём диагностику и подскажем, на чём сфокусироваться
              в подготовке.
            </p>

            {!IS_WHATSAPP_CONFIGURED ? (
              <p className="mt-4 max-w-md rounded-md border border-dashed border-paper/60 p-2.5 text-[0.75rem] leading-snug text-paper">
                Тестовый режим: WhatsApp-номер Ashyq не задан. Пропиши его в
                <span className="font-mono"> src/lib/config.ts </span>
                или в переменной
                <span className="font-mono"> NEXT_PUBLIC_ASHYQ_WHATSAPP</span>.
              </p>
            ) : null}

            <p className="mt-6 max-w-md text-[0.72rem] leading-snug text-paper/60">
              {isSat
                ? '*Предварительный диапазон рассчитан по короткой диагностике Ashyq и не является официальным прогнозом College Board.'
                : '*Это предварительная оценка на основе быстрой диагностики. Она не является официальным IELTS Band Score. Writing и Speaking требуют отдельной оценки.'}
            </p>
          </div>
        </section>

        {/* ---------- secondary ---------- */}
        <section className="mt-10 grid gap-2.5 sm:grid-cols-2">
          <a
            href={waPrep}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-ink"
            onClick={() => handleWhatsApp('prep')}
          >
            Узнать о подготовке
          </a>
          <button type="button" className="btn btn-quiet" onClick={onReview}>
            Посмотреть разбор вопросов
          </button>
        </section>

        <section id="booking-anchor" className="mt-10">
          <BookingForm
            defaultLead={run.lead}
            onSubmit={onSaveLead}
            whatsappHref={waResult}
            onWhatsAppClick={() => handleWhatsApp('result')}
          />
        </section>

        <section className="mt-10 flex flex-wrap items-center gap-x-6 gap-y-3 border-t border-line pt-6">
          <button
            type="button"
            className="label link-underline text-ink-soft hover:text-ink"
            onClick={() => setResetOpen(true)}
          >
            Пройти ещё раз
          </button>
          <button
            type="button"
            className="label link-underline text-ink-soft hover:text-ink"
            onClick={onHome}
          >
            На главную
          </button>
          <span className="label text-ink-faint">
            {cfg.name} · {result.totalCorrect}/{result.totalQuestions} ·{' '}
            {Math.max(1, Math.round(result.elapsedMs / 60000))} мин
          </span>
        </section>
      </main>

      {resetOpen ? (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-ink/60 sm:items-center sm:p-6"
          role="dialog"
          aria-modal="true"
          aria-label="Пройти диагностику заново"
        >
          <button
            type="button"
            aria-label="Закрыть"
            className="absolute inset-0 h-full w-full cursor-default"
            onClick={() => setResetOpen(false)}
            tabIndex={-1}
          />
          <div className="animate-pop relative w-full max-w-md rounded-lg border border-line bg-paper-card p-5 shadow-card">
            <p className="label text-red">Reset</p>
            <h2 className="display mt-2 text-h3">Пройти заново?</h2>
            <p className="mt-3 text-[0.95rem] text-ink-soft">
              Текущий результат и ответы будут удалены. Вопросы соберутся заново
              из банка — набор может отличаться.
            </p>
            <div className="mt-6 flex flex-col gap-2.5 sm:flex-row-reverse">
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => {
                  setResetOpen(false);
                  onRestart();
                }}
              >
                Да, начать заново
              </button>
              <button type="button" className="btn btn-quiet" onClick={() => setResetOpen(false)}>
                Оставить результат
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function Stat({
  label,
  value,
  note,
  accent = false,
}: {
  label: string;
  value: string;
  note?: string;
  accent?: boolean;
}) {
  return (
    <div className="bg-paper-card p-4">
      <p className="label text-ink-faint">{label}</p>
      <p className={`display mt-2 text-[1.7rem] leading-none ${accent ? 'text-red' : ''}`}>
        {value}
      </p>
      {note ? <p className="mt-2 text-[0.78rem] text-ink-faint">{note}</p> : null}
    </div>
  );
}
