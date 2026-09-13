'use client';

import type { DiagnosticResult, ExamId } from '@/lib/types';
import { EXAMS } from '@/lib/config';
import { Meter } from '@/components/ui/Primitives';
import { Wordmark, RedStar } from '@/components/ui/Brand';

/**
 * ASHYQ PLAYER CARD — то, что студент скринит и отправляет другу.
 * v3: тёмная карточка без текстур, оригинальный wordmark cream, искра
 * из логотипа, один красный акцент. Фиксированная ширина, крупные цифры.
 */
export default function DiagnosticCard({
  exam,
  result,
  targetLabel,
  nextStep,
}: {
  exam: ExamId;
  result: DiagnosticResult;
  targetLabel: string;
  nextStep: string;
}) {
  const cfg = EXAMS[exam];

  return (
    <div
      data-card="ashyq-player-card"
      className="relative mx-auto w-full max-w-[440px] overflow-hidden rounded-lg bg-ink text-paper shadow-card"
    >
      <div className="relative p-5 sm:p-6">
        {/* header */}
        <div className="flex items-start justify-between gap-3">
          <Wordmark size="sm" tone="cream" />
          <span className="font-mono text-[0.58rem] tracking-[0.2em] text-paper/50">
            QUICK DIAGNOSTIC 001
          </span>
        </div>
        <div className="mt-3 h-px w-full bg-paper/25" />

        {/* exam */}
        <div className="mt-5 flex items-end justify-between gap-3">
          <p className="display text-[2.6rem] leading-none">{cfg.name}</p>
          <p className="pb-1 text-right font-mono text-[0.6rem] leading-tight tracking-[0.14em] text-paper/50">
            {result.totalCorrect}/{result.totalQuestions} верно
            <br />
            {Math.max(1, Math.round(result.elapsedMs / 60000))} мин
          </p>
        </div>

        {/* band */}
        <p className="label mt-6 flex items-center gap-2 text-red">
          <RedStar className="h-2.5 w-2.5" />
          Твоя точка А · предварительно
        </p>
        <p className="display mt-2 break-words text-[clamp(2.4rem,13vw,3.6rem)] leading-[0.92]">
          {result.band.rangeLabel}
        </p>
        <p className="mt-2 text-[0.85rem] text-paper/60">{result.band.levelTitleRu}</p>

        {/* sections */}
        <div className="mt-6 space-y-4">
          {result.sections.map((s) => (
            <div key={s.section}>
              <div className="flex items-baseline justify-between gap-2">
                <span className="font-mono text-[0.68rem] tracking-[0.14em]">
                  {s.label.toUpperCase()}
                </span>
                <span className="font-mono text-[0.62rem] tracking-[0.12em] text-paper/50">
                  {s.percent}% · {s.level}
                </span>
              </div>
              <Meter value={s.readiness} className="mt-1.5 border-paper/20 bg-paper/10" />
            </div>
          ))}
        </div>

        <div className="mt-6 h-px w-full bg-paper/25" />

        {/* target / gap / next */}
        <div className="mt-4 grid grid-cols-2 gap-4">
          <div>
            <p className="font-mono text-[0.58rem] tracking-[0.16em] text-paper/50">ЦЕЛЬ</p>
            <p className="display mt-1 break-words text-[1.35rem] leading-none">{targetLabel}</p>
          </div>
          <div>
            <p className="font-mono text-[0.58rem] tracking-[0.16em] text-paper/50">GAP</p>
            <p className="display mt-1 break-words text-[1.35rem] leading-none text-red">
              {result.gapLabel ?? '—'}
            </p>
            {result.targetReached ? (
              <p className="mt-1 text-[0.6rem] leading-tight text-paper/50">
                цель уже в диапазоне
              </p>
            ) : null}
          </div>
        </div>

        <div className="mt-3 rounded-md bg-paper px-3 py-2 text-ink">
          <p className="font-mono text-[0.55rem] tracking-[0.16em] text-ink/60">СЛЕДУЮЩИЙ ШАГ</p>
          <p className="display mt-1 break-words text-[0.95rem] leading-tight">{nextStep}</p>
        </div>

        <p className="mt-5 text-[0.62rem] leading-snug text-paper/40">
          Предварительная оценка по короткой диагностике Ashyq · не официальный
          результат {cfg.name}
        </p>
      </div>
    </div>
  );
}
