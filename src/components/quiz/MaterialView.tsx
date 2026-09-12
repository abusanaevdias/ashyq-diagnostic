'use client';

import { useState } from 'react';
import type { Material } from '@/lib/types';
import AudioPlayer from './AudioPlayer';
import { RedStar } from '@/components/ui/Brand';

/**
 * Показ материала: passage / таблица / аудио.
 *
 * Материал всегда доступен на том же экране, что и вопрос — никаких
 * попапов, которые приходится открывать на каждом вопросе.
 * Длинный текст скроллится внутри карточки (max-height), чтобы вопрос
 * оставался на экране телефона.
 */
export default function MaterialView({
  material,
  compactByDefault = false,
}: {
  material: Material;
  /** для 2-го и следующих вопросов группы текст по умолчанию свёрнут */
  compactByDefault?: boolean;
}) {
  const [expanded, setExpanded] = useState(!compactByDefault);

  if (material.kind === 'audio' && material.audio) {
    return (
      <section aria-label={material.title} className="mb-4">
        <MaterialHeader material={material} />
        <AudioPlayer material={material} />
      </section>
    );
  }

  return (
    <section aria-label={material.title} className="mb-4">
      <MaterialHeader material={material} />

      <div className="card-ink overflow-hidden rounded-md">
        <div className="flex items-center justify-between gap-3 border-b border-line bg-paper-deep/50 px-3.5 py-2.5">
          <span className="text-[0.9rem] font-semibold text-ink">{material.title}</span>
          <button
            type="button"
            className="label link-underline shrink-0 text-ink-faint hover:text-ink"
            onClick={() => setExpanded((v) => !v)}
            aria-expanded={expanded}
          >
            {expanded ? 'Свернуть' : 'Показать'}
          </button>
        </div>

        {expanded ? (
          <div className="max-h-[38vh] overflow-y-auto px-3.5 py-3 sm:max-h-[46vh]">
            {material.table ? (
              <div className="mb-3 overflow-x-auto">
                <table className="w-full border-collapse text-[0.86rem]">
                  {material.table.caption ? (
                    <caption className="pb-2 text-left font-mono text-[0.7rem] uppercase tracking-[0.12em] text-ink-faint">
                      {material.table.caption}
                    </caption>
                  ) : null}
                  <thead>
                    <tr>
                      {material.table.headers.map((h) => (
                        <th
                          key={h}
                          scope="col"
                          className="border-b border-ink px-2 py-1.5 text-left font-mono text-[0.7rem] font-bold uppercase tracking-[0.08em]"
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {material.table.rows.map((row, i) => (
                      <tr key={i}>
                        {row.map((cell, j) => (
                          <td
                            key={j}
                            className={`border-b border-line px-2 py-1.5 ${
                              j === 0 ? 'font-semibold' : 'font-mono text-ink-soft'
                            }`}
                          >
                            {cell}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
                {material.table.note ? (
                  <p className="pt-2 text-[0.75rem] text-ink-faint">{material.table.note}</p>
                ) : null}
              </div>
            ) : null}

            {material.text ? <p className="passage">{material.text}</p> : null}
          </div>
        ) : (
          <p className="px-3.5 py-3 text-[0.85rem] text-ink-faint">
            Текст свёрнут. Нажми «Показать», чтобы вернуться к passage.
          </p>
        )}
      </div>
    </section>
  );
}

function MaterialHeader({ material }: { material: Material }) {
  if (!material.tag) return null;
  return (
    <p className="label mb-2 flex items-center gap-2 text-ink-faint">
      <RedStar className="h-2.5 w-2.5 text-red" />
      {material.tag}
    </p>
  );
}
