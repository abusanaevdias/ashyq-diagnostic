'use client';

import { EXAMS, BRAND } from '@/lib/config';
import type { ExamId, RunState } from '@/lib/types';
import {
  RedStar,
  Wordmark,
  EditorialLabel,
  HandNote,
  Tape,
  TornEdge,
  PaperCard,
} from './ui/Brand';

function continueLabel(run: RunState): string | null {
  if (run.stage === 'quiz' && !run.finished) {
    const idx = Math.min(run.currentIndex + 1, run.questionIds.length);
    return `Продолжить · вопрос ${idx} из ${run.questionIds.length}`;
  }
  if (run.finished) return 'Посмотреть результат';
  if (run.stage === 'onboarding' && (run.target || run.plannedWhen)) {
    return 'Продолжить настройку';
  }
  return null;
}

const LEARN_ITEMS = [
  {
    n: '01',
    title: 'Точка А',
    text: 'Примерный диапазон балла, если бы экзамен был сегодня. Честно и без магии.',
  },
  {
    n: '02',
    title: 'Сильные стороны',
    text: 'Секции и темы, которые уже тянут твой результат вверх.',
  },
  {
    n: '03',
    title: 'Фокус',
    text: 'Что тянет вниз прямо сейчас — и сколько балла там лежит.',
  },
  {
    n: '04',
    title: 'Следующий шаг',
    text: 'Один понятный шаг вместо «надо готовиться». Дальше — разбор с тренером.',
  },
] as const;

const STEPS = [
  {
    n: '01',
    title: 'Выбираешь экзамен',
    text: 'IELTS или SAT и нужный балл. Без имени, телефона и почты.',
  },
  {
    n: '02',
    title: 'Проходишь мини-версию',
    text: '16 вопросов SAT или 12 IELTS: формат как на настоящем экзамене.',
  },
  {
    n: '03',
    title: 'Получаешь карточку',
    text: 'Точка А, сильные стороны и фокус — сразу после финиша.',
  },
] as const;

export default function Landing({
  runs,
  onSelect,
}: {
  runs: Record<ExamId, RunState | null>;
  onSelect: (exam: ExamId) => void;
}) {
  const order: ExamId[] = ['ielts', 'sat'];

  return (
    <div className="flex min-h-dvh flex-col">
      {/* ================= NAV ================= */}
      <header className="shell-wide flex items-center justify-between gap-4 py-5">
        <a href="#hero" aria-label="ASHYQ — на главную" className="shrink-0">
          <Wordmark size="md" />
        </a>
        <nav aria-label="Разделы страницы" className="hidden items-center gap-6 md:flex">
          <a className="label text-ink-soft transition-colors hover:text-red" href="#learn">
            Что узнаешь
          </a>
          <a className="label text-ink-soft transition-colors hover:text-red" href="#steps">
            Как проходит
          </a>
          <a className="label text-ink-soft transition-colors hover:text-red" href="/program">
            Программа
          </a>
          <a className="label text-ink-soft transition-colors hover:text-red" href="/progress">
            Прогресс
          </a>
          <a className="label text-ink-soft transition-colors hover:text-red" href="/community">
            Сообщество
          </a>
          <a className="label text-ink-soft transition-colors hover:text-red" href="/faq">
            FAQ
          </a>
        </nav>
        <a href="#start" className="btn btn-primary btn-small w-auto shrink-0">
          Начать
        </a>
      </header>

      {/* ================= S1 HERO ================= */}
      <section id="hero" className="shell-wide pb-10 pt-4 sm:pt-8">
        <div className="grid items-start gap-10 lg:grid-cols-12 lg:gap-8">
          {/* left: hook + CTA */}
          <div className="lg:col-span-7">
            <EditorialLabel num="01">Быстрая диагностика IELTS / SAT</EditorialLabel>

            <h1 className="serif mt-5 max-w-[19ch] text-h1 text-red">
              Какой балл ты получил бы, если бы сдавал экзамен{' '}
              <span className="relative inline-block">
                сегодня?
                <svg
                  aria-hidden="true"
                  viewBox="0 0 220 14"
                  preserveAspectRatio="none"
                  className="absolute -bottom-1.5 left-0 h-2.5 w-full text-red"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="3"
                  strokeLinecap="round"
                >
                  <path d="M4 9c40-5 82-6 122-3 32 2 62 3 90 1" />
                </svg>
              </span>
            </h1>

            <p className="label mt-6 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-ink-soft">
              <span>≈20 минут</span>
              <RedStar className="h-2 w-2 text-red" />
              <span>Бесплатно</span>
              <RedStar className="h-2 w-2 text-red" />
              <span>Результат сразу</span>
            </p>

            {/* CTA — выше сгиба на любом телефоне */}
            <div id="start" className="mt-7 grid max-w-md gap-3 sm:grid-cols-2">
              {order.map((exam) => {
                const cfg = EXAMS[exam];
                const saved = runs[exam];
                const cont = saved ? continueLabel(saved) : null;
                return (
                  <div key={exam} className="relative">
                    <button
                      type="button"
                      onClick={() => onSelect(exam)}
                      className={`btn ${exam === 'ielts' ? 'btn-primary' : 'btn-ink'}`}
                      aria-label={`Начать диагностику ${cfg.name}`}
                    >
                      {cfg.name}
                      <svg viewBox="0 0 20 12" aria-hidden="true" className="h-3 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                        <path d="M1 6h17M13 1.5 18 6l-5 4.5" />
                      </svg>
                    </button>
                    {cont ? (
                      <span className="absolute -bottom-3.5 left-1/2 z-10 -translate-x-1/2 whitespace-nowrap rounded-full border border-line bg-paper-card px-2.5 py-0.5 font-mono text-[0.6rem] font-bold uppercase tracking-[0.1em] text-ink-soft">
                        {cont}
                      </span>
                    ) : null}
                  </div>
                );
              })}
            </div>

            <p className="mt-8 text-[0.95rem] text-ink-soft">
              Без регистрации: имя и телефон не нужны, чтобы узнать точку А.
            </p>
          </div>

          {/* right: коллаж из одной карточки и одного фото */}
          <div className="relative lg:col-span-5">
            <div className="relative mx-auto max-w-[22rem]">
              <Tape className="-top-3 left-1/2 z-10 -translate-x-1/2 rotate-[-4deg]" />
              <PaperCard className="rotate-[-1.5deg] p-4">
                <div className="flex items-center justify-between gap-2">
                  <Wordmark size="sm" />
                  <span className="font-mono text-[0.55rem] tracking-[0.18em] text-ink-faint">
                    SAMPLE · 001
                  </span>
                </div>
                <div className="mt-3 h-px w-full bg-line" />
                <p className="label mt-3 text-red">Точка А · предварительно</p>
                <p className="display mt-1.5 text-[2.5rem] leading-none">1290–1390</p>
                <div className="mt-4 space-y-2.5">
                  <div className="flex items-center justify-between gap-2 font-mono text-[0.62rem] tracking-[0.12em]">
                    <span className="font-bold">MATH</span>
                    <span className="text-ink-faint">STRONG · 78%</span>
                  </div>
                  <div className="meter" aria-hidden="true">
                    <span className="meter-fill" style={{ width: '78%' }} />
                  </div>
                  <div className="flex items-center justify-between gap-2 font-mono text-[0.62rem] tracking-[0.12em]">
                    <span className="font-bold">R&amp;W</span>
                    <span className="text-ink-faint">FOCUS · 54%</span>
                  </div>
                  <div className="meter" aria-hidden="true">
                    <span className="meter-fill" style={{ width: '54%' }} />
                  </div>
                </div>
                <div className="mt-4 flex items-center justify-between gap-2 bg-ink px-3 py-2 text-paper">
                  <span className="font-mono text-[0.55rem] tracking-[0.16em] opacity-70">TARGET</span>
                  <span className="display text-[0.95rem]">1400+</span>
                </div>
              </PaperCard>

              <HandNote arrow="up-right" className="absolute -left-4 -top-8 hidden sm:inline-flex">
                твоя карточка будет такой
              </HandNote>

              <img
                src="/brand/lesson-grid.jpg"
                alt="Онлайн-урок Ashyq: пять студентов на видеосвязи с тренером"
                width={1000}
                height={390}
                loading="lazy"
                className="mt-5 w-full rotate-[1.2deg] border border-line bg-paper-card p-2 shadow-paper"
              />
            </div>
          </div>
        </div>
      </section>

      {/* marquee-полоса как в конце секций мокапа */}
      <div className="marquee border-y border-line-strong bg-ink py-2.5 text-paper" aria-hidden="true">
        <div className="marquee-track">
          {[0, 1].map((k) => (
            <span key={k} className="label flex items-center gap-[2.2rem]">
              {['Узнай свою точку А', 'Бесплатно', 'Результат сразу', 'IELTS', 'SAT', 'People · Knowledge · A brighter tomorrow'].map(
                (t) => (
                  <span key={t} className="flex items-center gap-[2.2rem]">
                    <span>{t}</span>
                    <RedStar className="h-2.5 w-2.5 text-red" />
                  </span>
                ),
              )}
            </span>
          ))}
        </div>
      </div>

      {/* ================= S2 ЧТО ТЫ УЗНАЕШЬ ================= */}
      <section id="learn" className="shell-wide py-14 sm:py-20">
        <EditorialLabel num="02">Что ты узнаешь</EditorialLabel>
        <h2 className="display mt-4 max-w-[24ch] text-h2">
          Четыре ответа, которые даёт диагностика
        </h2>

        <div className="mt-9 grid gap-x-10 gap-y-9 sm:grid-cols-2">
          {LEARN_ITEMS.map((item) => (
            <article key={item.n} className="border-t border-line-strong pt-4">
              <div className="flex items-baseline gap-3">
                <span className="font-mono text-[0.72rem] font-bold tracking-[0.14em] text-red">
                  {item.n}
                </span>
                <h3 className="display text-h3">{item.title}</h3>
              </div>
              <p className="mt-2.5 text-[0.98rem] leading-relaxed text-ink-soft">{item.text}</p>
            </article>
          ))}
        </div>
      </section>

      {/* ================= S3 КАК ЭТО РАБОТАЕТ ================= */}
      <section id="steps" className="border-y border-line bg-paper-deep/60">
        <div className="shell-wide py-14 sm:py-20">
          <EditorialLabel num="03">Как это работает</EditorialLabel>
          <h2 className="display mt-4 max-w-[22ch] text-h2">Три шага до точки А</h2>

          <ol className="mt-9 grid gap-8 md:grid-cols-3 md:gap-6">
            {STEPS.map((s, i) => (
              <li key={s.n} className="relative">
                <div className="flex items-center gap-3">
                  <span className="display text-[2.2rem] leading-none text-red">{s.n}</span>
                  {i < STEPS.length - 1 ? (
                    <svg
                      viewBox="0 0 48 20"
                      aria-hidden="true"
                      className="hidden h-4 w-10 text-ink md:block"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                    >
                      <path d="M2 12c12-4 26-5 38-2" />
                      <path d="M34 5l8 5-9 4" />
                    </svg>
                  ) : null}
                </div>
                <h3 className="display mt-3 text-h3">{s.title}</h3>
                <p className="mt-2 text-[0.95rem] leading-relaxed text-ink-soft">{s.text}</p>
              </li>
            ))}
          </ol>

          <p className="hand mt-8 rotate-[-1.5deg] text-[1.2rem] text-red">
            формат как на настоящем экзамене, только короче ↓
          </p>
        </div>
      </section>

      {/* ================= S4 ПРЕВЬЮ РЕЗУЛЬТАТА ================= */}
      <section id="preview" className="shell-wide py-14 sm:py-20">
        <div className="grid items-center gap-10 lg:grid-cols-12">
          <div className="lg:col-span-5">
            <EditorialLabel num="04">Результат</EditorialLabel>
            <h2 className="display mt-4 text-h2">
              Карточка, которую хочется отправить другу
            </h2>
            <ul className="mt-6 space-y-3">
              {[
                'Диапазон балла и уровень — крупно и честно.',
                'Секции: что тянет вверх, что тянет вниз.',
                'Цель, gap и один следующий шаг.',
              ].map((t) => (
                <li key={t} className="flex gap-3 text-[0.98rem] leading-relaxed text-ink-soft">
                  <RedStar className="mt-1.5 h-2.5 w-2.5 shrink-0 text-red" />
                  {t}
                </li>
              ))}
            </ul>
            <p className="mt-6 text-[0.8rem] leading-snug text-ink-faint">
              Это предварительная оценка по короткой диагностике, а не официальный
              результат IELTS или SAT.
            </p>
          </div>

          {/* player-card превью */}
          <div className="lg:col-span-7">
            <div className="relative mx-auto w-full max-w-[26rem] overflow-hidden rounded-lg bg-ink text-paper shadow-card">
              <div className="relative p-5 sm:p-6">
                <div className="flex items-start justify-between gap-3">
                  <Wordmark size="sm" tone="cream" />
                  <span className="font-mono text-[0.55rem] tracking-[0.2em] text-paper/50">
                    QUICK DIAGNOSTIC 001
                  </span>
                </div>
                <div className="mt-3 h-px w-full bg-paper/25" />
                <p className="display mt-4 text-[2.2rem] leading-none">SAT</p>
                <p className="label mt-5 text-red">Твоя точка А · предварительно</p>
                <p className="display mt-1.5 text-[clamp(2.4rem,11vw,3.4rem)] leading-none">
                  1290–1390
                </p>
                <div className="mt-5 space-y-3">
                  <div>
                    <div className="flex items-baseline justify-between font-mono text-[0.62rem] tracking-[0.12em]">
                      <span>MATH</span>
                      <span className="text-paper/50">78% · STRONG</span>
                    </div>
                    <div className="meter mt-1.5 border-paper/20 bg-paper/10" aria-hidden="true">
                      <span className="meter-fill" style={{ width: '78%' }} />
                    </div>
                  </div>
                  <div>
                    <div className="flex items-baseline justify-between font-mono text-[0.62rem] tracking-[0.12em]">
                      <span>READING &amp; WRITING</span>
                      <span className="text-paper/50">54% · FOCUS</span>
                    </div>
                    <div className="meter mt-1.5 border-paper/20 bg-paper/10" aria-hidden="true">
                      <span className="meter-fill" style={{ width: '54%' }} />
                    </div>
                  </div>
                </div>
                <div className="mt-5 grid grid-cols-2 gap-4 border-t border-paper/25 pt-4">
                  <div>
                    <p className="font-mono text-[0.55rem] tracking-[0.16em] text-paper/50">ЦЕЛЬ</p>
                    <p className="display mt-1 text-[1.3rem] leading-none">1400+</p>
                  </div>
                  <div>
                    <p className="font-mono text-[0.55rem] tracking-[0.16em] text-paper/50">GAP</p>
                    <p className="display mt-1 text-[1.3rem] leading-none text-red">≈ +100</p>
                  </div>
                </div>
                <div className="mt-4 bg-paper px-3 py-2 text-ink">
                  <p className="font-mono text-[0.52rem] tracking-[0.16em] text-ink/60">
                    СЛЕДУЮЩИЙ ШАГ
                  </p>
                  <p className="display mt-0.5 text-[0.95rem] leading-tight">
                    R&amp;W · Command of Evidence
                  </p>
                </div>
                <span className="stamp absolute right-4 top-16 border-paper/60 text-paper/70">
                  sample
                </span>
              </div>
            </div>
            <div className="mt-6 text-center">
              <a href="#start" className="btn btn-outline mx-auto w-auto px-8">
                Разобрать мой результат
                <svg viewBox="0 0 20 12" aria-hidden="true" className="h-3 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <path d="M1 6h17M13 1.5 18 6l-5 4.5" />
                </svg>
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ================= S5 COMMUNITY ================= */}
      <section id="community" className="border-t border-line bg-paper-deep/50">
        <div className="shell-wide py-14 sm:py-20">
          <EditorialLabel num="05">Сообщество ASHYQ</EditorialLabel>
          <div className="mt-5 grid items-center gap-9 lg:grid-cols-12">
            <div className="lg:col-span-5">
              <h2 className="display max-w-[18ch] text-h2">Больше, чем подготовка к экзамену</h2>
              <p className="mt-4 text-[0.98rem] leading-relaxed text-ink-soft">
                Командные Match Days, Missions, презентации и чемпионат сезона — среда,
                где виден не только балл, но и твой рост, дисциплина и вклад в команду.
              </p>
              <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                <a href="/community" className="btn btn-primary">О сообществе</a>
                <a href="/season" className="btn btn-outline">Следующий сезон</a>
              </div>
            </div>
            <div className="relative lg:col-span-7">
              <Tape className="-top-3 left-1/2 z-10 -translate-x-1/2 rotate-[2deg]" />
              <img
                src="/brand/hero-students.jpg"
                alt="Студенты ASHYQ"
                width={1200}
                height={800}
                loading="lazy"
                className="w-full rotate-[-1deg] border border-line bg-paper-card p-2 shadow-paper"
              />
            </div>
          </div>
        </div>
      </section>

      {/* ================= S6 BRAND BLOCK ================= */}
      <section className="relative bg-paper-deep">
        <TornEdge fill="var(--paper)" flip className="absolute inset-x-0 top-0" />
        <div className="shell py-16 text-center sm:py-20">
          <RedStar className="mx-auto h-4 w-4 text-red" />
          <p className="serif mx-auto mt-5 max-w-[26ch] text-[clamp(1.5rem,5.4vw,2.4rem)] leading-snug text-ink">
            {BRAND.line1} {BRAND.line2}
          </p>
          <p className="label mt-6 text-ink-faint">{BRAND.line3}</p>
          <p className="label mt-2 text-ink-faint">People · Knowledge · A brighter tomorrow</p>
        </div>
        <TornEdge fill="var(--red)" className="absolute inset-x-0 bottom-0 rotate-180" />
      </section>

      {/* ================= S7 FINAL CTA ================= */}
      <section className="bg-red text-paper">
        <div className="shell-wide py-14 sm:py-20">
          <div className="grid items-end gap-8 lg:grid-cols-12">
            <div className="lg:col-span-8">
              <p className="label text-paper/70">Готов?</p>
              <h2 className="display mt-3 max-w-[20ch] text-h2 text-paper">
                Узнай свою точку А сегодня
              </h2>
              <p className="label mt-5 flex flex-wrap items-center gap-x-3 gap-y-1 text-paper/80">
                <span>≈20 минут</span>
                <span aria-hidden="true">·</span>
                <span>Бесплатно</span>
                <span aria-hidden="true">·</span>
                <span>Без регистрации</span>
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 lg:col-span-4">
              {order.map((exam) => (
                <button
                  key={exam}
                  type="button"
                  onClick={() => onSelect(exam)}
                  className="btn btn-cream"
                  aria-label={`Начать диагностику ${EXAMS[exam].name}`}
                >
                  {EXAMS[exam].name}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ================= FOOTER ================= */}
      <footer className="border-t border-line bg-paper">
        <div className="shell-wide flex flex-col gap-6 py-8 md:flex-row md:items-end md:justify-between">
          <div>
            <Wordmark size="md" />
            <p className="mt-3 max-w-xs text-[0.85rem] leading-snug text-ink-faint">
              {BRAND.line1}
              <br />
              {BRAND.line3}
            </p>
          </div>
          <div className="flex max-w-sm flex-col gap-3">
            <nav aria-label="Разделы сайта" className="flex flex-wrap gap-x-5 gap-y-2">
              <a className="label link-underline text-ink-soft hover:text-ink" href="/program">
                Программа: Match Day и чемпионат
              </a>
              <a className="label link-underline text-ink-soft hover:text-ink" href="/progress">
                Мой прогресс
              </a>
              <a className="label link-underline text-ink-soft hover:text-ink" href="/community">
                Сообщество
              </a>
              <a className="label link-underline text-ink-soft hover:text-ink" href="/season">
                Сезон
              </a>
              <a className="label link-underline text-ink-soft hover:text-ink" href="/faq">
                FAQ
              </a>
              <a className="label link-underline text-ink-soft hover:text-ink" href="/privacy">
                Конфиденциальность
              </a>
            </nav>
            <p className="text-[0.75rem] leading-snug text-ink-faint">
              Быстрая диагностика Ashyq даёт предварительную оценку уровня и не
              является официальным пробным экзаменом IELTS или SAT. Writing и
              Speaking оцениваются отдельно.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
