'use client';

import { useState } from 'react';
import { EXAMS } from '@/lib/config';
import type { ExamId, RunState } from '@/lib/types';
import { Wordmark, EditorialLabel } from './ui/Brand';
import { ConfirmDialog } from './ui/Primitives';

/**
 * Onboarding: ровно 2 экрана, без имени/телефона/email.
 * Цель → срок сдачи → старт теста.
 */
export default function Onboarding({
  exam,
  run,
  onTarget,
  onPlannedWhen,
  onStart,
  onBack,
}: {
  exam: ExamId;
  run: RunState;
  onTarget: (value: string) => void;
  onPlannedWhen: (value: string) => void;
  onStart: () => void;
  onBack: () => void;
}) {
  const cfg = EXAMS[exam];
  const [step, setStep] = useState<number>(run.target ? 2 : 1);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const answered = step === 1 ? Boolean(run.target) : Boolean(run.plannedWhen);

  const chooseTarget = (value: string) => {
    onTarget(value);
    window.setTimeout(() => setStep(2), 140);
  };

  const chooseWhen = (value: string) => {
    onPlannedWhen(value);
    window.setTimeout(() => setConfirmOpen(true), 140);
  };

  return (
    <div className="v3 flex min-h-dvh flex-col">
      <header className="shell-wide flex items-center justify-between py-5">
        <Wordmark size="md" />
        <span className="label text-ink-faint">
          {cfg.name} · шаг {step} из 2
        </span>
      </header>

      <main className="shell flex flex-1 flex-col justify-center py-10">
        {step === 1 ? (
          <div className="animate-fade-up">
            <EditorialLabel num="01">Перед стартом</EditorialLabel>
            <h1 className="display mt-4 max-w-[22ch] text-h2">{cfg.targetQuestion}</h1>
            <div className="mt-8 grid gap-2.5 sm:grid-cols-2">
              {cfg.targets.map((t) => {
                const selected = run.target === t.value;
                return (
                  <button
                    key={t.value}
                    type="button"
                    onClick={() => chooseTarget(t.value)}
                    className="option"
                    data-selected={selected}
                    aria-pressed={selected}
                  >
                    <span className="option-key">{selected ? '✓' : ''}</span>
                    <span className="display self-center text-[1.3rem]">{t.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="animate-fade-up">
            <EditorialLabel num="02">И последнее</EditorialLabel>
            <h1 className="display mt-4 max-w-[22ch] text-h2">{cfg.whenQuestion}</h1>
            <div className="mt-8 grid gap-2.5">
              {cfg.whenOptions.map((opt) => {
                const selected = run.plannedWhen === opt.value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => chooseWhen(opt.value)}
                    className="option"
                    data-selected={selected}
                    aria-pressed={selected}
                  >
                    <span className="option-key">{selected ? '✓' : ''}</span>
                    <span className="self-center text-[1rem]">{opt.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        <div className="mt-9 flex items-center gap-5">
          <button
            type="button"
            className="label link-underline text-ink-faint hover:text-ink"
            onClick={() => (step === 1 ? onBack() : setStep(1))}
          >
            {step === 1 ? 'Назад к выбору экзамена' : 'Назад'}
          </button>
          {answered && step === 2 ? (
            <button
              type="button"
              className="label link-underline text-ink-soft hover:text-ink"
              onClick={() => setConfirmOpen(true)}
            >
              Начать диагностику
            </button>
          ) : null}
        </div>
      </main>

      <ConfirmDialog
        open={confirmOpen}
        title="Начинаем?"
        body={`${cfg.durationHint}. Таймер не обрывает тест: если время выйдет, ты спокойно закончишь вопросы в своём темпе.`}
        confirmLabel="Начать"
        cancelLabel="Ещё секунду"
        onCancel={() => setConfirmOpen(false)}
        onConfirm={() => {
          setConfirmOpen(false);
          onStart();
        }}
      />
    </div>
  );
}
