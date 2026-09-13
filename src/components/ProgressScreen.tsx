'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { readHistory } from '@/lib/storage';
import { track } from '@/lib/analytics';
import type { ExamId, ProgressSnapshot } from '@/lib/types';
import { EditorialLabel, RedStar, HandNote } from './ui/Brand';
import { Footer, NavBar } from './ui/CleanUi';

/**
 * /progress — личный прогресс ученика (мини-версия Student Progress Report
 * из brand-постеров). Данные — история завершённых диагностик из localStorage,
 * без PII и без бэкенда. Пусто — честно зовём в диагностику.
 */

const mid = (s: ProgressSnapshot) => (s.bandLow + s.bandHigh) / 2;

function fmtDate(ts: number): string {
  return new Date(ts).toLocaleDateString('ru-RU', { day: '2-digit', month: 'short' });
}

export default function ProgressScreen() {
  const [histories, setHistories] = useState<Record<ExamId, ProgressSnapshot[]>>({
    sat: [],
    ielts: [],
  });
  const [tab, setTab] = useState<ExamId | null>(null);

  useEffect(() => {
    const sat = readHistory('sat');
    const ielts = readHistory('ielts');
    setHistories({ sat, ielts });
    setTab(sat.length > 0 ? 'sat' : ielts.length > 0 ? 'ielts' : null);
    track('progress_page_view', { satPoints: sat.length, ieltsPoints: ielts.length });
  }, []);

  const hasAny = histories.sat.length > 0 || histories.ielts.length > 0;
  const list = tab ? histories[tab] : [];
  const first = list[0];
  const last = list[list.length - 1];

  const deltaLabel = useMemo(() => {
    if (!first || !last || list.length < 2) return null;
    const d = mid(last) - mid(first);
    if (Math.abs(d) < 0.001) return 'та же точка, что и в первый раз';
    const sign = d > 0 ? '+' : '−';
    const value = tab === 'sat' ? `${Math.round(Math.abs(d))} пунктов` : `${Math.abs(d).toFixed(1)} band`;
    return `${sign}${value} с первой точки`;
  }, [first, last, list.length, tab]);

  return (
    <div className="v3 min-h-dvh">
      <NavBar />

      <main className="shell pb-16 pt-8">
        <EditorialLabel>Student progress · локально на устройстве</EditorialLabel>

        {!hasAny || !tab ? (
          /* ---------- пустое состояние ---------- */
          <section className="py-10">
            <h1 className="serif max-w-[14ch] text-h1 text-red">Пока пусто</h1>
            <p className="mt-5 max-w-md text-[1rem] leading-relaxed text-ink-soft">
              Заверши диагностику — и здесь появится твоя динамика точки А:
              график, skill scores «было → стало» и история замеров.
            </p>
            <div className="mt-8 grid max-w-md gap-3 sm:grid-cols-2">
              <Link href="/?start=ielts" className="btn btn-primary" aria-label="Начать диагностику IELTS">
                IELTS
              </Link>
              <Link href="/?start=sat" className="btn btn-ink" aria-label="Начать диагностику SAT">
                SAT
              </Link>
            </div>
            <p className="label mt-7 text-ink-faint">
              ≈20 минут · бесплатно · без регистрации
            </p>
          </section>
        ) : (
          <>
            {/* ---------- табы экзаменов ---------- */}
            <div className="mt-6 flex flex-wrap gap-2" role="tablist" aria-label="Экзамен">
              {(['sat', 'ielts'] as ExamId[]).map((exam) => {
                const count = histories[exam].length;
                return (
                  <button
                    key={exam}
                    type="button"
                    role="tab"
                    aria-selected={tab === exam}
                    disabled={count === 0}
                    onClick={() => setTab(exam)}
                    className={`btn btn-small w-auto ${tab === exam ? 'btn-ink' : 'btn-quiet'}`}
                  >
                    {exam === 'sat' ? 'SAT' : 'IELTS'}
                    <span className="font-mono text-[0.66rem] opacity-70">· {count}</span>
                  </button>
                );
              })}
            </div>

            {/* ---------- сводка ---------- */}
            <section className="mt-8">
              <h1 className="serif max-w-[16ch] text-h1 text-red">Твоя динамика</h1>
              <div className="mt-6 flex flex-wrap items-end gap-x-6 gap-y-3">
                <div>
                  <p className="label text-ink-faint">Точка А сейчас</p>
                  <p className="display mt-1 text-[clamp(2.4rem,10vw,3.6rem)] leading-none">
                    {last.bandLabel}
                  </p>
                </div>
                {deltaLabel ? (
                  <p className="label mb-2 flex items-center gap-2 rounded-full border border-red px-3 py-1.5 text-red">
                    <RedStar className="h-2.5 w-2.5" />
                    {deltaLabel}
                  </p>
                ) : (
                  <p className="label mb-2 text-ink-faint">
                    первый замер · для динамики нужна ещё одна диагностика
                  </p>
                )}
              </div>
              <p className="label mt-3 text-ink-faint">
                {tab === 'sat' ? 'SAT · предварительный диапазон' : 'IELTS · предварительный readiness'} ·{' '}
                {list.length} замер{list.length === 1 ? '' : list.length < 5 ? 'а' : 'ов'}
              </p>
            </section>

            {/* ---------- график точки А ---------- */}
            <section className="mt-8 rounded-md border border-line bg-paper-card p-4 shadow-paper sm:p-5">
              <div className="flex items-baseline justify-between gap-3">
                <p className="label text-ink-faint">Точка А по замерам</p>
                <p className="font-mono text-[0.66rem] tracking-[0.12em] text-ink-faint">
                  {fmtDate(first.ts)} — {fmtDate(last.ts)}
                </p>
              </div>
              <BandChart list={list} exam={tab} />
              <p className="mt-2 text-[0.75rem] leading-snug text-ink-faint">
                Предварительные диапазоны короткой диагностики, не официальный
                результат {tab === 'sat' ? 'SAT' : 'IELTS'}.
              </p>
            </section>

            {/* ---------- skill scores: было → стало ---------- */}
            <section className="mt-8">
              <EditorialLabel>Skill scores · было → стало</EditorialLabel>
              <div className="mt-5 space-y-4">
                {(last.sections ?? []).map((s) => {
                  const was = first.sections.find((f) => f.section === s.section);
                  const d = was ? s.percent - was.percent : null;
                  return (
                    <div key={s.section} className="grid grid-cols-[6.4rem_1fr_3rem] items-center gap-3 sm:grid-cols-[8rem_1fr_3.4rem]">
                      <span className="font-mono text-[0.72rem] font-bold tracking-[0.08em]">
                        {s.label.toUpperCase()}
                      </span>
                      <span className="space-y-1.5">
                        {was ? (
                          <span className="flex items-center gap-2">
                            <span className="meter h-[7px] flex-1" aria-hidden="true">
                              <span className="meter-fill meter-fill-ink opacity-40" style={{ width: `${was.percent}%` }} />
                            </span>
                            <span className="w-8 text-right font-mono text-[0.68rem] text-ink-faint">
                              {was.percent}
                            </span>
                          </span>
                        ) : null}
                        <span className="flex items-center gap-2">
                          <span className="meter h-[7px] flex-1" aria-hidden="true">
                            <span className="meter-fill" style={{ width: `${s.percent}%` }} />
                          </span>
                          <span className="w-8 text-right font-mono text-[0.68rem] font-bold">
                            {s.percent}
                          </span>
                        </span>
                      </span>
                      <span className={`text-right font-mono text-[0.72rem] font-bold ${d === null ? 'text-ink-faint' : d >= 0 ? 'text-red' : 'text-ink-soft'}`}>
                        {d === null ? '—' : `${d >= 0 ? '↑+' : '↓−'}${Math.abs(d)}`}
                      </span>
                    </div>
                  );
                })}
              </div>
              <p className="label mt-3 text-ink-faint">
                серый — первый замер · красный — последний
              </p>
            </section>

            {/* ---------- история замеров ---------- */}
            <section className="mt-10">
              <EditorialLabel>История замеров</EditorialLabel>
              <ul className="mt-4 divide-y divide-line border-y border-line">
                {[...list].reverse().map((s) => (
                  <li key={s.runId} className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 py-3">
                    <span className="font-mono text-[0.75rem] font-bold tracking-[0.08em]">
                      {fmtDate(s.ts)}
                    </span>
                    <span className="display text-[1.15rem]">{s.bandLabel}</span>
                    <span className="font-mono text-[0.7rem] text-ink-faint">
                      {s.totalCorrect}/{s.totalQuestions} верно ·{' '}
                      {Math.max(1, Math.round(s.elapsedMs / 60000))} мин
                    </span>
                  </li>
                ))}
              </ul>
            </section>

            <HandNote className="mt-8">рост важнее стартовой точки ↗</HandNote>

            {/* ---------- CTA ---------- */}
            <section className="mt-8 grid gap-2.5 sm:grid-cols-2">
              <Link href={`/?start=${tab}`} className="btn btn-primary">
                Пройти ещё раз
              </Link>
              <Link href="/" className="btn btn-quiet">
                На главную
              </Link>
            </section>
          </>
        )}
      </main>
      <Footer />
    </div>
  );
}

/** Тонкий линейный график середины диапазона по замерам. */
function BandChart({ list, exam }: { list: ProgressSnapshot[]; exam: ExamId }) {
  const W = 320;
  const H = 120;
  const PAD = 18;

  if (list.length === 0) return null;

  const values = list.map(mid);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min || (exam === 'sat' ? 100 : 0.5);
  const lo = min - span * 0.25;
  const hi = max + span * 0.25;

  const x = (i: number) =>
    list.length === 1 ? W / 2 : PAD + (i * (W - PAD * 2)) / (list.length - 1);
  const y = (v: number) => H - PAD - ((v - lo) / (hi - lo)) * (H - PAD * 2);

  const points = values.map((v, i) => `${x(i)},${y(v)}`).join(' ');
  const fmt = (v: number) => (exam === 'sat' ? String(Math.round(v)) : v.toFixed(1));

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      className="mt-3 h-32 w-full"
      role="img"
      aria-label={`График точки А: ${list.map((s) => s.bandLabel).join(', ')}`}
      data-chart="band"
    >
      {[0.25, 0.5, 0.75].map((t) => (
        <line key={t} x1={PAD} x2={W - PAD} y1={H * t} y2={H * t} stroke="var(--line)" strokeWidth="1" />
      ))}
      {list.length > 1 ? (
        <polyline points={points} fill="none" stroke="var(--red)" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />
      ) : null}
      {values.map((v, i) => (
        <g key={i}>
          <circle cx={x(i)} cy={y(v)} r="4.5" fill="var(--red)" />
          <circle cx={x(i)} cy={y(v)} r="1.8" fill="var(--paper-card)" />
          <text x={x(i)} y={y(v) - 10} textAnchor="middle" fontSize="10" fontFamily="var(--font-mono)" fill="var(--ink-soft)">
            {fmt(v)}
          </text>
          <text x={x(i)} y={H - 4} textAnchor="middle" fontSize="9" fontFamily="var(--font-mono)" fill="var(--ink-faint)">
            {fmtDate(list[i].ts)}
          </text>
        </g>
      ))}
    </svg>
  );
}
