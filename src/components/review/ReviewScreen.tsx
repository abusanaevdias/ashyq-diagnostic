'use client';

import { useMemo, useState } from 'react';
import { getMaterial } from '@/data/materials';
import { EXAMS } from '@/lib/config';
import { track } from '@/lib/analytics';
import { buildWhatsAppLink } from '@/lib/whatsapp';
import type { DiagnosticResult, Question, RunState, UtmParams } from '@/lib/types';
import { Wordmark } from '@/components/ui/Brand';
import MaterialView from '@/components/quiz/MaterialView';

/**
 * Разбор вопросов после Finish: мой ответ, правильный ответ, объяснение.
 * До завершения теста этот экран недоступен.
 */
export default function ReviewScreen({
  run,
  questions,
  result,
  utm,
  onBack,
}: {
  run: RunState;
  questions: Question[];
  result: DiagnosticResult;
  utm: UtmParams;
  onBack: () => void;
}) {
  const cfg = EXAMS[run.exam];
  const [openSection, setOpenSection] = useState<string | null>(
    cfg.sections[0] ?? null,
  );

  const grouped = useMemo(() => {
    const map = new Map<string, Question[]>();
    questions.forEach((q) => {
      const arr = map.get(q.section) ?? [];
      arr.push(q);
      map.set(q.section, arr);
    });
    return map;
  }, [questions]);

  const perQuestion = new Map(result.perQuestion.map((p) => [p.questionId, p]));
  const waLink = buildWhatsAppLink({
    exam: run.exam,
    result,
    target: run.target,
    utm,
    intent: 'result',
  });

  return (
    <div className="min-h-dvh pb-16">
      <header className="sticky top-0 z-30 border-b border-line bg-paper/95 backdrop-blur-sm">
        <div className="shell-wide flex items-center justify-between gap-3 py-3">
          <Wordmark size="sm" />
          <button
            type="button"
            className="btn btn-quiet btn-small"
            onClick={onBack}
          >
            К результату
          </button>
        </div>
      </header>

      <main className="shell pt-7">
        <p className="label flex items-center gap-2 text-red"><span aria-hidden="true" className="inline-block h-1.5 w-1.5 bg-red" />Разбор</p>
        <h1 className="display mt-3 text-h1">
          {result.totalCorrect} из {result.totalQuestions}
        </h1>
        <p className="mt-3 max-w-md text-[0.98rem] text-ink-soft">
          Здесь видно, где ответ совпал, а где нет. Короткое объяснение — чтобы
          понять логику, а не запомнить ответ.
        </p>

        <div className="mt-7 flex flex-wrap gap-2">
          {cfg.sections.map((section) => (
            <button
              key={section}
              type="button"
              className={`btn btn-small ${openSection === section ? 'btn-ink' : 'btn-quiet'}`}
              onClick={() => setOpenSection(section)}
              aria-pressed={openSection === section}
            >
              {cfg.sectionLabels[section]}
            </button>
          ))}
        </div>

        <div className="mt-7 space-y-4">
          {(grouped.get(openSection ?? '') ?? []).map((q, i) => {
            const record = perQuestion.get(q.id);
            const material = getMaterial(q.materialId);
            const options = q.options ?? [];
            const right =
              q.kind === 'text-input'
                ? q.correctAnswer
                : options.find((o) => o.id === q.correctAnswer)?.label;
            const state = !record?.answered ? 'skipped' : record.correct ? 'correct' : 'wrong';

            return (
              <article key={q.id} className="card-ink overflow-hidden rounded-md">
                <div className="flex items-center justify-between gap-3 border-b border-line px-4 py-2.5">
                  <span className="label text-ink-faint">
                    Вопрос {i + 1} · {q.difficulty}
                  </span>
                  <span
                    className={`label ${
                      state === 'correct'
                        ? 'text-ink'
                        : state === 'wrong'
                          ? 'text-red'
                          : 'text-ink-faint'
                    }`}
                  >
                    {state === 'correct'
                      ? 'Верно'
                      : state === 'wrong'
                        ? 'Неверно'
                        : 'Пропущен'}
                  </span>
                </div>

                <div className="p-4">
                  <p className="label mb-2 text-ink-faint">
                    {q.domain} · {q.skill}
                  </p>

                  {material ? (
                    <div className="mb-4">
                      <MaterialView material={material} compactByDefault={material.kind !== 'audio'} />
                    </div>
                  ) : null}

                  <h2 className="whitespace-pre-line text-[1.02rem] font-semibold leading-snug">
                    {q.prompt}
                  </h2>

                  {q.kind === 'single-choice' ? (
                    <ul className="mt-4 space-y-2">
                      {options.map((opt) => {
                        const isRight = opt.id === q.correctAnswer;
                        const isMine = opt.id === record?.myAnswer;
                        return (
                          <li
                            key={opt.id}
                            className={`flex items-start gap-3 border p-3 text-[0.95rem] leading-snug ${
                              isRight
                                ? 'border-ink bg-[#e8efe2]'
                                : isMine
                                  ? 'border-red bg-red-wash'
                                  : 'border-line bg-paper'
                            }`}
                          >
                            <span className="option-key" aria-hidden="true">
                              {opt.id}
                            </span>
                            <span className="pt-1">{opt.label}</span>
                            <span className="label ml-auto shrink-0 self-center text-ink-faint">
                              {isRight ? 'Ответ' : isMine ? 'Твой' : ''}
                            </span>
                          </li>
                        );
                      })}
                    </ul>
                  ) : (
                    <dl className="mt-4 grid gap-2 text-[0.95rem]">
                      <div className="flex gap-2">
                        <dt className="label w-24 shrink-0 pt-1 text-ink-faint">Твой ответ</dt>
                        <dd className="flex-1 font-mono">
                          {record?.myAnswer ? record.myAnswer : '—'}
                        </dd>
                      </div>
                      <div className="flex gap-2">
                        <dt className="label w-24 shrink-0 pt-1 text-ink-faint">Верно</dt>
                        <dd className="flex-1 font-mono font-bold">{q.correctAnswer}</dd>
                      </div>
                    </dl>
                  )}

                  <div className="mt-4 border-t border-line pt-3">
                    <p className="label text-ink-faint">Почему так</p>
                    <p className="mt-1.5 text-[0.95rem] leading-relaxed text-ink-soft">
                      {q.explanation}
                    </p>
                    {right ? <p className="sr-only">Правильный ответ: {right}</p> : null}
                  </div>
                </div>
              </article>
            );
          })}
        </div>

        <section className="mt-12 border-t border-line-strong pt-7">
          <h2 className="display text-h2">
            Разбор — это только половина.
          </h2>
          <p className="mt-3 max-w-md text-[0.98rem] text-ink-soft">
            Дальше важно понять, что делать с ошибками в ближайшие недели. Это
            разбираем в WhatsApp или на диагностике с тренером.
          </p>
          <a
            href={waLink}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-primary mt-5"
            onClick={() => track('whatsapp_cta_clicked', { exam: run.exam, intent: 'review', utm })}
          >
            Обсудить результат с тренером
          </a>
          <button type="button" className="btn btn-quiet mt-2.5" onClick={onBack}>
            Вернуться к результату
          </button>
        </section>
      </main>
    </div>
  );
}
