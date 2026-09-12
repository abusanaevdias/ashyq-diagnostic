'use client';

import { useEffect, useMemo, useState } from 'react';
import { EXAMS } from '@/lib/config';
import type { Question, RunState } from '@/lib/types';
import { Wordmark } from '@/components/ui/Brand';
import { ConfirmDialog, Meter } from '@/components/ui/Primitives';
import QuestionCard from './QuestionCard';

/**
 * Экран диагностики: прогресс, таймер, навигация, карта вопросов,
 * подтверждение завершения. Ответы не подсвечиваются как верные/неверные.
 *
 * Визуально — «спокойный продуктовый режим» бренда: cream-фон, бумажная
 * карточка вопроса, тонкие линии, один красный акцент на выбранном.
 */
export default function QuizRunner({
  run,
  questions,
  elapsedMs,
  timeUp,
  onAnswer,
  onNext,
  onPrev,
  onGoTo,
  onFinish,
  onDismissTimeWarning,
  onExit,
}: {
  run: RunState;
  questions: Question[];
  elapsedMs: number;
  timeUp: boolean;
  onAnswer: (questionId: string, value: string) => void;
  onNext: () => void;
  onPrev: () => void;
  onGoTo: (index: number) => void;
  onFinish: () => void;
  onDismissTimeWarning: () => void;
  onExit: () => void;
}) {
  const cfg = EXAMS[run.exam];
  const [mapOpen, setMapOpen] = useState(false);
  const [finishOpen, setFinishOpen] = useState(false);
  const [exitOpen, setExitOpen] = useState(false);

  const index = run.currentIndex;
  const question = questions[index];
  const total = questions.length;
  const answeredCount = useMemo(
    () => questions.filter((q) => Boolean(run.answers[q.id])).length,
    [questions, run.answers],
  );
  const unanswered = total - answeredCount;
  const isLast = index === total - 1;

  const showTimeWarning = timeUp && !run.timeWarningShown;

  /* keyboard navigation */
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const typing =
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.isContentEditable);

      if (e.key === 'ArrowRight' && !typing) {
        e.preventDefault();
        onNext();
      }
      if (e.key === 'ArrowLeft' && !typing) {
        e.preventDefault();
        onPrev();
      }
      if (typing) return;

      if (question?.kind === 'single-choice' && question.options) {
        const key = e.key.toUpperCase();
        const direct = question.options.find((o) => o.id === key);
        const byNumber = question.options[Number(e.key) - 1];
        const picked = direct ?? byNumber;
        if (picked) {
          e.preventDefault();
          onAnswer(question.id, picked.id);
        }
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onNext, onPrev, onAnswer, question]);

  if (!question) {
    return (
      <div className="shell py-20 text-center">
        <p className="text-ink-soft">Вопросы не загрузились.</p>
        <button type="button" className="btn btn-quiet mt-6 w-auto" onClick={onExit}>
          Вернуться на главную
        </button>
      </div>
    );
  }

  const groupKey = question.groupKey ?? question.id;
  const groupStart = questions.findIndex((q) => (q.groupKey ?? q.id) === groupKey);
  const isFirstInGroup = groupStart === index;

  return (
    <div className="flex min-h-dvh flex-col">
      {/* ---------- header ---------- */}
      <header className="sticky top-0 z-30 border-b border-line bg-paper/95 backdrop-blur-sm">
        <div className="shell-wide py-3">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <Wordmark size="sm" />
              <span className="hidden font-mono text-[0.62rem] font-bold uppercase tracking-[0.18em] text-ink-faint sm:inline">
                Diagnostic
              </span>
            </div>
            <div className="flex items-center gap-3">
              <span className="chip">{cfg.name}</span>
              <Timer ms={elapsedMs} warn={timeUp} />
            </div>
          </div>

          <div className="mt-2.5 flex items-center gap-3">
            <span className="label w-[5.5rem] shrink-0 text-ink-soft">
              {String(index + 1).padStart(2, '0')} / {String(total).padStart(2, '0')}
            </span>
            <Meter value={total ? (index + (run.answers[question.id] ? 1 : 0)) / total : 0} className="flex-1" />
            <button
              type="button"
              className="label link-underline shrink-0 text-ink-faint hover:text-ink"
              onClick={() => setMapOpen(true)}
              aria-label="Открыть список вопросов"
            >
              Вопросы
            </button>
          </div>
        </div>
      </header>

      {/* ---------- time warning ---------- */}
      {showTimeWarning ? (
        <div className="border-b border-red/30 bg-red-wash">
          <div className="shell-wide flex items-start gap-3 py-3">
            <span className="mt-1 inline-block h-2 w-2 shrink-0 bg-red" aria-hidden="true" />
            <p className="flex-1 text-[0.9rem] leading-snug text-ink">
              {Math.round(cfg.blueprint.targetDurationSec / 60)} минут прошло —
              заканчивай текущие вопросы в своём темпе. Тест не оборвётся сам.
            </p>
            <button
              type="button"
              className="label shrink-0 link-underline text-red"
              onClick={onDismissTimeWarning}
            >
              Понятно
            </button>
          </div>
        </div>
      ) : null}

      {/* ---------- question ---------- */}
      <main className="shell flex-1 py-6 pb-36">
        <p className="label mb-4 text-ink-faint">
          Вопрос {index + 1} из {total}
        </p>
        <QuestionCard
          question={question}
          value={run.answers[question.id] ?? null}
          onChange={(value) => onAnswer(question.id, value)}
          optionOrder={run.optionOrder[question.id]}
          isFirstInGroup={isFirstInGroup}
        />
      </main>

      {/* ---------- footer nav ---------- */}
      <footer className="safe-bottom fixed inset-x-0 bottom-0 z-30 border-t border-line bg-paper/95 backdrop-blur-sm">
        <div className="shell-wide flex items-center gap-2.5 py-3">
          <button
            type="button"
            className="btn btn-quiet flex-1"
            onClick={onPrev}
            disabled={index === 0}
          >
            Назад
          </button>
          {isLast ? (
            <button
              type="button"
              className="btn btn-primary flex-[1.4]"
              onClick={() => setFinishOpen(true)}
            >
              Завершить
            </button>
          ) : (
            <button type="button" className="btn btn-ink flex-[1.4]" onClick={onNext}>
              Далее
            </button>
          )}
          <button
            type="button"
            className="btn btn-quiet btn-small"
            onClick={() => setFinishOpen(true)}
            aria-label="Завершить диагностику"
          >
            Финиш
          </button>
        </div>
      </footer>

      {/* ---------- question map ---------- */}
      {mapOpen ? (
        <div
          className="fixed inset-0 z-40 flex items-end justify-center bg-ink/60 sm:items-center sm:p-6"
          role="dialog"
          aria-modal="true"
          aria-label="Список вопросов"
        >
          <button
            type="button"
            aria-label="Закрыть список вопросов"
            className="absolute inset-0 h-full w-full cursor-default"
            onClick={() => setMapOpen(false)}
            tabIndex={-1}
          />
          <div className="animate-pop relative max-h-[85vh] w-full max-w-md overflow-y-auto rounded-lg border border-line bg-paper-card p-5 shadow-card">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="label text-red">Навигация</p>
                <h2 className="display mt-1.5 text-h3">
                  {answeredCount} / {total} отвечено
                </h2>
              </div>
              <button
                type="button"
                className="btn btn-quiet btn-small"
                onClick={() => setMapOpen(false)}
              >
                Закрыть
              </button>
            </div>

            <div className="mt-5 grid grid-cols-6 gap-2 sm:grid-cols-8">
              {questions.map((q, i) => {
                const answered = Boolean(run.answers[q.id]);
                const current = i === index;
                return (
                  <button
                    key={q.id}
                    type="button"
                    onClick={() => {
                      onGoTo(i);
                      setMapOpen(false);
                    }}
                    aria-label={`Вопрос ${i + 1}${answered ? ', отвечен' : ', без ответа'}`}
                    aria-current={current}
                    className={`flex h-11 items-center justify-center rounded-md border font-mono text-[0.85rem] font-bold transition-colors ${
                      current
                        ? 'border-ink bg-ink text-paper'
                        : answered
                          ? 'border-red bg-red-wash text-red'
                          : 'border-line bg-paper text-ink-faint'
                    }`}
                  >
                    {i + 1}
                  </button>
                );
              })}
            </div>

            <p className="mt-4 text-[0.8rem] text-ink-faint">
              Можно возвращаться к любому вопросу и менять ответ до завершения.
            </p>

            <div className="mt-5 grid gap-2.5">
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => {
                  setMapOpen(false);
                  setFinishOpen(true);
                }}
              >
                Завершить диагностику
              </button>
              <button
                type="button"
                className="btn btn-quiet"
                onClick={() => {
                  setMapOpen(false);
                  setExitOpen(true);
                }}
              >
                Выйти на главную
              </button>
            </div>
          </div>
        </div>
      ) : null}

      <ConfirmDialog
        open={finishOpen}
        title="Завершить диагностику?"
        body={
          unanswered > 0
            ? `Отвечено ${answeredCount} из ${total}. Без ответа осталось ${unanswered} — они не добавят баллов. После завершения изменить ответы нельзя.`
            : 'Все вопросы отвечены. После завершения изменить ответы нельзя — сразу увидишь результат.'
        }
        confirmLabel="Завершить и увидеть результат"
        cancelLabel="Продолжить тест"
        onCancel={() => setFinishOpen(false)}
        onConfirm={() => {
          setFinishOpen(false);
          onFinish();
        }}
      />

      <ConfirmDialog
        open={exitOpen}
        title="Выйти на главную?"
        body="Прогресс сохранится: вернёшься к тому же вопросу. Результат появится только после завершения."
        confirmLabel="Выйти"
        cancelLabel="Остаться"
        onCancel={() => setExitOpen(false)}
        onConfirm={() => {
          setExitOpen(false);
          onExit();
        }}
      />
    </div>
  );
}

function Timer({ ms, warn }: { ms: number; warn: boolean }) {
  const totalSec = Math.max(0, Math.floor(ms / 1000));
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return (
    <span
      className={`font-mono text-[0.92rem] font-bold tabular-nums ${
        warn ? 'text-red' : 'text-ink'
      }`}
      aria-label={`Прошло времени: ${m} минут ${s} секунд`}
      role="timer"
    >
      {String(m).padStart(2, '0')}:{String(s).padStart(2, '0')}
    </span>
  );
}
