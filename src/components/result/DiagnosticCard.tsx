'use client';

import type { CardData } from '@/lib/card-image';
import { Meter } from '@/components/ui/Primitives';
import { Wordmark } from '@/components/ui/Brand';

/**
 * Экранная карточка результата — та, что студент скринит и отправляет другу.
 * Раскладка и данные (CardData) те же, что у сохраняемого PNG в
 * src/lib/card-image.ts: меняя одну карточку, меняйте и другую.
 */
export default function DiagnosticCard({ data }: { data: CardData }) {
  return (
    <div
      data-card="ashyq-player-card"
      className="relative mx-auto w-full max-w-[440px] overflow-hidden rounded-lg border border-line bg-paper-card p-5 shadow-card sm:p-6"
    >
      {/* header */}
      <div className="flex items-center justify-between gap-3">
        <Wordmark size="sm" />
        <span className="label text-ink-soft">Quick diagnostic</span>
      </div>
      <div className="mt-4 h-px w-full bg-line" />

      {/* exam */}
      <div className="mt-5 flex flex-wrap items-center gap-x-3 gap-y-2">
        <span className="rounded-full bg-red-wash px-3.5 py-1.5 text-[0.85rem] font-semibold text-red-deep">
          {data.exam}
        </span>
        <span className="label text-ink-soft">{data.headline}</span>
      </div>

      {/* band */}
      <p className="label mt-6 text-red">Твоя точка А</p>
      <p className="display mt-2 break-words text-[clamp(2.4rem,13vw,3.4rem)] leading-none">
        {data.bandLabel}
      </p>
      <p className="mt-2 text-[0.9rem] text-ink-soft">{data.level}</p>

      <p className="mt-5 rounded-md bg-[var(--blush-soft)] px-3.5 py-2.5 text-[0.85rem] font-semibold">
        Сильная сторона · {data.strongest}
      </p>

      {/* sections */}
      <div className="mt-5 space-y-4">
        {data.sections.map((s) => (
          <div key={s.label}>
            <div className="flex items-baseline justify-between gap-3">
              <span className="text-[0.9rem] font-semibold">{s.label}</span>
              <span className="text-[0.8rem] text-ink-soft">
                {s.percent}% · {s.level}
              </span>
            </div>
            <Meter value={s.percent / 100} className="mt-1.5" />
          </div>
        ))}
      </div>

      {/* target / gap / next step */}
      <div className="mt-6 grid grid-cols-2 gap-2.5">
        <div className="min-w-0 rounded-md bg-[var(--blush-soft)] p-3.5">
          <p className="label text-ink-soft">Цель</p>
          <p className="display mt-1.5 break-words text-[1.3rem] leading-tight">{data.target}</p>
        </div>
        <div className="min-w-0 rounded-md bg-[var(--blush-soft)] p-3.5">
          <p className="label text-ink-soft">Gap</p>
          <p className="display mt-1.5 break-words text-[1.3rem] leading-tight text-red">{data.gapLabel}</p>
        </div>
        <div className="col-span-2 rounded-lg bg-[var(--dark-warm)] p-3.5 text-[var(--on-dark)]">
          <p className="label text-paper/70">Следующий шаг</p>
          <p className="display mt-1.5 break-words text-[1.1rem] leading-tight">{data.nextStep}</p>
        </div>
      </div>

      <p className="mt-5 text-[0.75rem] leading-snug text-ink-soft">
        Предварительная оценка по короткой диагностике ASHYQ · не официальный результат IELTS / SAT
      </p>
    </div>
  );
}
