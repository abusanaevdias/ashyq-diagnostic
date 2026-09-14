'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { track } from '@/lib/analytics';
import {
  EditorialLabel,
  HandNote,
  RedStar,
  PaperCard,
  BrandIcon,
} from './ui/Brand';
import { Footer, NavBar } from './ui/CleanUi';
import { Glyph, GlyphBadge, type GlyphName } from './ui/Glyphs';

/**
 * /program — витрина программы ASHYQ: то, что мы обещаем ученикам
 * (progress tracking, Match Day, leaderboard, чемпионат сезона).
 * Контент = brand-постеры серии FAQ/Program, данные демо помечены sample.
 */

const TOOLS: Array<{ glyph: GlyphName; label: string }> = [
  { glyph: 'doc', label: 'Пробные тесты' },
  { glyph: 'house', label: 'Домашние задания' },
  { glyph: 'spark', label: 'Missions' },
  { glyph: 'people', label: 'Match Days' },
  { glyph: 'chart', label: 'Отчёты и статистика' },
];

const SKILL_SAMPLE = [
  { label: 'Listening', was: 62, now: 85 },
  { label: 'Speaking', was: 58, now: 82 },
  { label: 'Reading', was: 70, now: 88 },
  { label: 'Writing', was: 60, now: 80 },
];

const MATCH_DAY = [
  {
    glyph: 'speech' as GlyphName,
    title: 'Speaking Battle',
    text: 'Живые диалоги, реальные задачи, на время.',
  },
  {
    glyph: 'book' as GlyphName,
    title: 'Reading Sprint',
    text: 'Скорость, понимание и точность в реальных текстах.',
  },
  {
    glyph: 'chart' as GlyphName,
    title: 'SAT Math Race',
    text: 'Логика, скорость и стратегия решения задач.',
  },
];

const POINTS = [
  { glyph: 'chart' as GlyphName, title: 'Progress', text: 'Личный рост и динамика результатов.' },
  { glyph: 'calendar' as GlyphName, title: 'Attendance', text: 'Регулярное участие в занятиях.' },
  { glyph: 'flag' as GlyphName, title: 'Missions', text: 'Выполнение заданий и недельных задач.' },
  { glyph: 'mic' as GlyphName, title: 'Speaking', text: 'Активность, уверенность и развитие речи.' },
  { glyph: 'people' as GlyphName, title: 'Teamwork', text: 'Вклад в команду и совместные результаты.' },
  { glyph: 'target' as GlyphName, title: 'Discipline', text: 'Постоянство, ответственность и отношение к учёбе.' },
];

const BOARD_SAMPLE = [
  { place: 1, team: 'TEAM 04', points: 128, crown: true },
  { place: 2, team: 'TEAM 02', points: 121, crown: false },
  { place: 3, team: 'TEAM 07', points: 116, crown: false },
  { place: 4, team: 'TEAM 01', points: 110, crown: false },
];

const JOURNEY = [
  { glyph: 'calendar' as GlyphName, title: 'Season', text: 'Занятия, развитие и командная работа' },
  { glyph: 'people' as GlyphName, title: 'Match Day', text: 'Решаем задачи, набираем баллы' },
  { glyph: 'chart' as GlyphName, title: 'Leaderboard', text: 'Следим за результатами' },
  { glyph: 'medal' as GlyphName, title: 'Top Teams', text: 'Лучшие команды выходят в Championship' },
  { glyph: 'trophy' as GlyphName, title: 'Championship', text: 'Финальное соревнование сезона' },
];

const FINAL_ACTS = [
  { glyph: 'mic' as GlyphName, label: 'Speaking Battle' },
  { glyph: 'people' as GlyphName, label: 'Team Problem' },
  { glyph: 'monitor' as GlyphName, label: 'Presentation' },
  { glyph: 'bulb' as GlyphName, label: 'Critical Thinking' },
  { glyph: 'flag' as GlyphName, label: 'Final Mission' },
];

export default function ProgramScreen() {
  useEffect(() => {
    track('program_page_view', {});
  }, []);

  return (
    <div className="v3 min-h-dvh">
      <NavBar />
      <main>

      {/* ---------- hero ---------- */}
      <section className="shell-wide pb-12 pt-4 sm:pt-8">
        <EditorialLabel>People · Knowledge · A brighter tomorrow</EditorialLabel>
        <h1 className="display mt-5 max-w-[10.8em] text-display text-red">
          Больше,
          <br />
          чем курсы
        </h1>
        <p className="mt-6 max-w-md text-[1.02rem] leading-relaxed text-ink-soft">
          Диагностика показывает точку А. Дальше работает система: прогресс
          в баллах, Match Days, рейтинг команд и чемпионат сезона с финалом.
        </p>
        <p className="label mt-6 flex flex-wrap gap-x-3 gap-y-1 text-ink-faint">
          <span>Astana, KZ</span>
          <span aria-hidden="true">·</span>
          <span>Online, worldwide</span>
          <span aria-hidden="true">·</span>
          <span>Est. 2024</span>
        </p>
      </section>

      {/* ---------- 01 progress tracking ---------- */}
      <section className="border-t border-line">
        <div className="shell-wide py-14 sm:py-18">
          <EditorialLabel>Progress tracking</EditorialLabel>
          <div className="mt-4 grid gap-8 lg:grid-cols-12">
            <div className="lg:col-span-5">
              <h2 className="display text-h2">Как отслеживается прогресс</h2>
              <p className="mt-4 max-w-md text-[1rem] leading-relaxed text-ink-soft">
                Регулярные пробные тесты, домашние задания, Missions, Match Days,
                отчёты и личная статистика. Студент видит свой прогресс в баллах,
                родители при желании получают понятную обратную связь.
              </p>
              <HandNote className="mt-5">track. improve. climb.</HandNote>
            </div>

            {/* sample progress report */}
            <div className="lg:col-span-7">
              <PaperCard className="relative p-4 sm:p-5">
                <span className="stamp absolute right-4 top-4">sample</span>
                <div className="flex items-center gap-3">
                  <BrandIcon size={34} />
                  <div>
                    <p className="display text-[1rem] leading-none">Ashyq</p>
                    <p className="label mt-1 text-ink-faint">Student progress report</p>
                  </div>
                </div>
                <div className="mt-4 h-px w-full bg-line" />
                <dl className="mt-4 grid gap-1.5 font-mono text-[0.72rem] tracking-[0.08em] text-ink-soft">
                  {[
                    ['STUDENT', 'Student 07'],
                    ['LEVEL', 'Intermediate'],
                    ['PROGRAM', 'IELTS Preparation'],
                    ['PERIOD', 'Sep 2024 — Jan 2025'],
                  ].map(([k, v]) => (
                    <div key={k} className="flex gap-3">
                      <dt className="w-20 shrink-0 text-ink-faint">{k}</dt>
                      <dd className="font-semibold text-ink">{v}</dd>
                    </div>
                  ))}
                </dl>

                <div className="mt-4 rounded-md bg-paper-deep/70 p-3.5">
                  <p className="label text-ink-faint">Overall progress</p>
                  <p className="display mt-1 text-[2.4rem] leading-none text-red">+42%</p>
                  <p className="label mt-1.5 text-ink-faint">
                    Consistent effort. Real results.
                  </p>
                </div>

                <p className="label mt-5 text-ink-faint">Skill scores</p>
                <div className="mt-3 space-y-3">
                  {SKILL_SAMPLE.map((s) => (
                    <div key={s.label} className="grid grid-cols-[5.2rem_1fr_2.4rem] items-center gap-2 sm:grid-cols-[6rem_1fr_3rem]">
                      <span className="font-mono text-[0.7rem] tracking-[0.08em]">{s.label}</span>
                      <span className="space-y-1">
                        <span className="flex items-center gap-2">
                          <span className="meter h-[7px] flex-1 border-line bg-paper-deep" aria-hidden="true">
                            <span className="meter-fill meter-fill-ink opacity-40" style={{ width: `${s.was}%` }} />
                          </span>
                          <span className="w-7 text-right font-mono text-[0.66rem] text-ink-faint">{s.was}</span>
                        </span>
                        <span className="flex items-center gap-2">
                          <span className="meter h-[7px] flex-1 border-line bg-paper-deep" aria-hidden="true">
                            <span className="meter-fill" style={{ width: `${s.now}%` }} />
                          </span>
                          <span className="w-7 text-right font-mono text-[0.66rem] font-bold">{s.now}</span>
                        </span>
                      </span>
                      <span className="text-right font-mono text-[0.7rem] font-bold text-red">
                        ↑+{s.now - s.was}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="mt-5 grid grid-cols-3 gap-2 sm:grid-cols-5">
                  {TOOLS.map((t) => (
                    <span key={t.label} className="flex flex-col items-center gap-1.5 rounded-md bg-paper-deep/60 p-2.5 text-center">
                      <Glyph name={t.glyph} className="h-5 w-5 text-red" />
                      <span className="text-[0.66rem] leading-tight text-ink-soft">{t.label}</span>
                    </span>
                  ))}
                </div>
              </PaperCard>
            </div>
          </div>
        </div>
      </section>

      {/* ---------- 02 growth & rating ---------- */}
      <section className="border-t border-line bg-paper-deep/50">
        <div className="shell-wide py-14 sm:py-18">
          <EditorialLabel>Growth & rating</EditorialLabel>
          <div className="mt-4 flex flex-wrap items-end justify-between gap-4">
            <h2 className="display max-w-[12.1em] text-h2">Рост и рейтинг</h2>
            <p className="label max-w-[12rem] text-right text-red">
              More than just classes
            </p>
          </div>
          <p className="mt-4 max-w-lg text-[1rem] leading-relaxed text-ink-soft">
            В ASHYQ важен не только результат, но и путь к нему. Мы оцениваем
            рост, дисциплину, участие и командную работу.
          </p>

          {/* match day */}
          <h3 className="display mt-10 text-h3">Match Day</h3>
          <div className="mt-5 grid gap-4 sm:grid-cols-3">
            {MATCH_DAY.map((m) => (
              <article key={m.title} className="rounded-md border border-line bg-paper-card p-4 text-center">
                <GlyphBadge name={m.glyph} className="h-14 w-14" />
                <h4 className="display mt-3 text-[1.05rem]">{m.title}</h4>
                <p className="mt-2 text-[0.85rem] leading-snug text-ink-soft">{m.text}</p>
              </article>
            ))}
          </div>

          {/* points */}
          <h3 className="display mt-10 text-h3">Leaderboard points</h3>
          <p className="mt-2 max-w-md text-[0.92rem] text-ink-soft">
            Рост имеет больший вес, чем стартовый уровень.
          </p>
          <div className="mt-5 grid gap-x-6 gap-y-5 sm:grid-cols-2 lg:grid-cols-3">
            {POINTS.map((pt) => (
              <div key={pt.title} className="flex items-start gap-3">
                <GlyphBadge name={pt.glyph} className="h-11 w-11 shrink-0" />
                <div>
                  <p className="display text-[1rem]">{pt.title}</p>
                  <p className="mt-1 text-[0.84rem] leading-snug text-ink-soft">{pt.text}</p>
                </div>
              </div>
            ))}
          </div>

          {/* leaderboard demo + principle */}
          <div className="mt-10 grid gap-8 lg:grid-cols-12">
            <div className="lg:col-span-6">
              <h3 className="display text-h3">Current leaderboard</h3>
              <table className="mt-4 w-full border-collapse text-[0.92rem]">
                <caption className="sr-only">Пример таблицы рейтинга команд сезона</caption>
                <thead>
                  <tr>
                    {['#', 'Team', 'Points'].map((h) => (
                      <th key={h} scope="col" className="border-b border-ink px-2 py-2 text-left font-mono text-[0.66rem] font-bold uppercase tracking-[0.12em] text-ink-faint">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {BOARD_SAMPLE.map((row) => (
                    <tr key={row.team}>
                      <td className="border-b border-line px-2 py-2.5">
                        <span
                          className={`inline-flex h-6 w-6 items-center justify-center rounded-full font-mono text-[0.7rem] font-bold ${
                            row.place === 1 ? 'bg-red text-paper' : 'bg-paper-deep text-ink'
                          }`}
                        >
                          {row.place}
                        </span>
                      </td>
                      <td className="border-b border-line px-2 py-2.5 font-mono text-[0.8rem] font-bold tracking-[0.08em]">
                        {row.team}
                      </td>
                      <td className="border-b border-line px-2 py-2.5">
                        <span className="font-mono text-[0.9rem] font-bold text-red">{row.points}</span>
                        {row.crown ? <Glyph name="crown" className="ml-2 inline h-4 w-4 text-red" /> : null}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <p className="label mt-2 text-ink-faint">sample · current season</p>
            </div>
            <div className="lg:col-span-6 lg:pl-8">
              <GlyphBadge name="trophy" className="h-14 w-14" />
              <p className="serif mt-4 max-w-[14.8em] text-[clamp(1.3rem,4.4vw,1.9rem)] leading-snug">
                Рост важнее стартовой точки.
              </p>
              <p className="mt-3 max-w-sm text-[0.95rem] leading-relaxed text-ink-soft">
                IELTS 4.5 → 6.0 может быть ценнее, чем 7.0 → 7.0. Поэтому баллы
                рейтинга считают прогресс, а не только абсолютный уровень.
              </p>
              <p className="label mt-6 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-ink-faint">
                <span>Match Day</span>
                <Glyph name="arrow" className="h-3 w-4 text-red" />
                <span>Points</span>
                <Glyph name="arrow" className="h-3 w-4 text-red" />
                <span>Leaderboard</span>
                <Glyph name="arrow" className="h-3 w-4 text-red" />
                <span>Growth</span>
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ---------- 03 championship ---------- */}
      <section className="border-t border-line">
        <div className="shell-wide py-14 sm:py-18">
          <EditorialLabel>Championship</EditorialLabel>
          <h2 className="display mt-4 max-w-[10.8em] text-h2 text-red">Чемпионат</h2>
          <p className="mt-4 max-w-lg text-[1rem] leading-relaxed text-ink-soft">
            В конце каждого сезона лучшие команды выходят в Championship.
            Это уже не обычные занятия, а финальное соревнование.
          </p>

          {/* journey */}
          <ol className="mt-9 grid gap-6 sm:grid-cols-3 lg:grid-cols-5">
            {JOURNEY.map((j, i) => (
              <li key={j.title} className="relative text-center">
                <GlyphBadge name={j.glyph} className="h-14 w-14" />
                <p className="display mt-2.5 text-[1rem]">{j.title}</p>
                <p className="mt-1 text-[0.8rem] leading-snug text-ink-soft">{j.text}</p>
                {i < JOURNEY.length - 1 ? (
                  <Glyph name="arrow" className="absolute -right-4 top-5 hidden h-3.5 w-5 text-red lg:block" />
                ) : null}
              </li>
            ))}
          </ol>

          {/* bracket */}
          <div className="mt-10 grid gap-6 lg:grid-cols-12">
            <div className="lg:col-span-7">
              <p className="label text-ink-faint">Championship stage · sample</p>
              <div className="mt-3 grid grid-cols-2 items-center gap-3 sm:grid-cols-[1fr_auto_1fr]">
                <div className="space-y-2.5">
                  {['TEAM 04', 'TEAM 02', 'TEAM 07', 'TEAM 01'].map((t) => (
                    <p key={t} className="flex items-center gap-2 rounded-md bg-paper-deep/70 px-3 py-2 font-mono text-[0.78rem] font-bold tracking-[0.08em]">
                      <Glyph name="people" className="h-4 w-4 text-red" />
                      {t}
                    </p>
                  ))}
                </div>
                <div className="hidden flex-col items-center gap-1 px-2 sm:flex">
                  <span className="label text-ink-faint">Semifinals</span>
                  <Glyph name="arrow" className="h-3.5 w-6 text-red" />
                  <span className="label text-ink-faint">Final</span>
                </div>
                <div className="flex items-center justify-center gap-3 rounded-md border border-line bg-paper-card p-4">
                  <Glyph name="trophy" className="h-8 w-8 text-red" />
                  <p className="display text-[1.05rem] leading-tight">
                    Season
                    <br />
                    Champion
                  </p>
                </div>
              </div>
            </div>

            {/* beyond the season */}
            <div className="lg:col-span-5">
              <p className="label text-ink-faint">Beyond the season</p>
              <p className="mt-2 text-[0.98rem] leading-relaxed text-ink-soft">
                <span className="font-semibold text-ink">4 сезона в год.</span> Каждый
                сезон даёт свой Championship. Лучшие игроки и команды попадают
                в ASHYQ Super Game.
              </p>
              <div className="mt-4 grid grid-cols-2 gap-3">
                <p className="rounded-md border border-line bg-paper-card p-3">
                  <Glyph name="trophy" className="h-5 w-5 text-red" />
                  <span className="label mt-2 block text-ink-faint">Season Champion</span>
                  <span className="display mt-1 block text-[1.3rem] text-red">100 000 ₸</span>
                </p>
                <p className="rounded-md border border-line bg-paper-card p-3">
                  <Glyph name="crown" className="h-5 w-5 text-red" />
                  <span className="label mt-2 block text-ink-faint">Super Game</span>
                  <span className="display mt-1 block text-[1.3rem] text-red">500 000 ₸</span>
                </p>
              </div>
            </div>
          </div>

          {/* final acts */}
          <div className="mt-10 rounded-md border border-line bg-paper-card p-4 sm:p-5">
            <p className="label text-red">Что вас ждёт в финале?</p>
            <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-5">
              {FINAL_ACTS.map((f) => (
                <span key={f.label} className="flex flex-col items-center gap-2 text-center">
                  <GlyphBadge name={f.glyph} className="h-12 w-12" />
                  <span className="text-[0.8rem] leading-tight text-ink-soft">{f.label}</span>
                </span>
              ))}
            </div>
          </div>

          <p className="serif mt-10 max-w-[17.5em] text-[clamp(1.4rem,5vw,2.1rem)] leading-snug">
            Мы готовим не просто к экзаменам. Мы готовим к тому, что будет
            после него.
          </p>
          <p className="label mt-4 text-red">Built for what comes next</p>
        </div>
      </section>

      {/* ---------- CTA ---------- */}
      <section className="shell-wide pb-14 sm:pb-18">
        <div className="band-dark px-6 py-12 sm:px-10">
          <div className="grid items-end gap-8 lg:grid-cols-12">
            <div className="lg:col-span-7">
              <p className="label flex items-center gap-2 text-paper/75">
                <RedStar className="h-2.5 w-2.5" />
                Первый шаг — точка А
              </p>
              <h2 className="display mt-3 max-w-[12.1em] text-h2 text-paper">
                Система начинается с диагностики
              </h2>
              <p className="mt-4 max-w-md text-[0.95rem] leading-snug text-paper/85">
                ≈20 минут, бесплатно, без регистрации. Результат сохранится
                в личном прогрессе на этом устройстве.
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 lg:col-span-5">
              <Link href="/?start=ielts" className="btn btn-cream" aria-label="Начать диагностику IELTS">
                IELTS
              </Link>
              <Link href="/?start=sat" className="btn btn-cream" aria-label="Начать диагностику SAT">
                SAT
              </Link>
              <Link href="/progress" className="btn btn-quiet sm:col-span-2 border-paper/40 text-paper hover:border-paper hover:text-paper">
                Мой прогресс
              </Link>
            </div>
          </div>
        </div>
      </section>
      </main>

      <Footer />
    </div>
  );
}
