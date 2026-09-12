'use client';

import { getMaterial } from '@/data/materials';
import type { Question } from '@/lib/types';
import MaterialView from './MaterialView';

/**
 * Один вопрос на экран — бумажная карточка в духе экзаменационного бланка:
 * тонкая рамка, номер-референс, печатные подсказки, красный только на выборе.
 * Правильные ответы и объяснения здесь не показываются — только после Finish.
 */
export default function QuestionCard({
  question,
  value,
  onChange,
  optionOrder,
  isFirstInGroup,
  locked,
}: {
  question: Question;
  value: string | null;
  onChange: (value: string) => void;
  optionOrder?: string[];
  isFirstInGroup: boolean;
  locked?: boolean;
}) {
  const material = getMaterial(question.materialId);
  const options = question.options
    ? (optionOrder ?? question.options.map((o) => o.id))
        .map((id) => question.options?.find((o) => o.id === id))
        .filter((o): o is NonNullable<typeof o> => Boolean(o))
    : [];

  const sectionLabel =
    question.section === 'rw'
      ? 'Reading & Writing'
      : question.section === 'math'
        ? 'Math'
        : question.section === 'reading'
          ? 'Reading'
          : 'Listening';

  return (
    <div key={question.id} className="animate-fade-up" data-question-id={question.id}>
      {material ? (
        <MaterialView material={material} compactByDefault={!isFirstInGroup && material.kind !== 'audio'} />
      ) : null}

      <div className="card shadow-paper overflow-hidden">
        {/* бланк: секция + референс */}
        <div className="flex items-baseline justify-between gap-3 border-b border-line px-4 py-2.5 sm:px-5">
          <span className="label flex items-center gap-2 text-red">
            <span aria-hidden="true" className="inline-block h-1.5 w-1.5 bg-red" />
            {sectionLabel}
          </span>
          <span className="font-mono text-[0.62rem] tracking-[0.16em] text-ink-faint">
            {question.kind === 'text-input' ? 'ВПИШИ ОТВЕТ · ' : ''}Q
            {question.id.replace(/\D/g, '').padStart(2, '0')}
          </span>
        </div>

        <div className="px-4 py-4 sm:px-5 sm:py-5">
          <h2 className="whitespace-pre-line text-[1.08rem] font-semibold leading-snug text-ink sm:text-[1.18rem]">
            {question.prompt}
          </h2>

          {question.kind === 'text-input' ? (
            <div className="mt-5">
              <label className="label sr-only" htmlFor={`answer-${question.id}`}>
                Твой ответ
              </label>
              <input
                id={`answer-${question.id}`}
                className="field font-mono"
                type="text"
                inputMode="text"
                autoComplete="off"
                autoCapitalize="off"
                spellCheck={false}
                disabled={locked}
                placeholder="Введи ответ"
                value={value ?? ''}
                onChange={(e) => onChange(e.target.value)}
              />
              <p className="mt-2 text-[0.78rem] text-ink-faint">
                Регистр и пунктуация не важны. Проверяется сам ответ.
              </p>
            </div>
          ) : (
            <div className="mt-5 grid gap-2.5" role="radiogroup" aria-label="Варианты ответа">
              {options.map((opt) => {
                const selected = value === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    role="radio"
                    aria-checked={selected}
                    data-selected={selected}
                    disabled={locked}
                    className="option"
                    onClick={() => onChange(opt.id)}
                  >
                    <span className="option-key" aria-hidden="true">
                      {opt.id}
                    </span>
                    <span className="pt-0.5">{opt.label}</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
