'use client';

import { useState } from 'react';
import Link from 'next/link';
import SeasonForm from '@/components/SeasonForm';
import { formatDate } from '@/lib/lms/format';
import { useLmsData } from '@/lib/lms/hooks';
import { getSeasonRepo } from '@/lib/season/repo';
import { currentSeason, individualStandings, matchStatus, seasonPhase, teamStandings, totalWeeks, weekOf } from '@/lib/season/scoring';
import { buildSeasonSeed } from '@/lib/season/seed';
import { CATEGORIES, CATEGORY_LABELS, DIVISION_LABELS, TEAM_SIZE, WEEKLY_CAPS, type Division, type Standing } from '@/lib/season/types';
import styles from './SeasonV3.module.css';

/**
 * Публичный хаб чемпионата: рейтинг считается из журнала баллов (SEASON-DEMO-001).
 * Демо-сезон из сида — начальные данные: страница сразу полная и на сервере, без
 * сдвига макета после загрузки. Время зависит от часового пояса и минуты рендера,
 * поэтому у элементов с датами suppressHydrationWarning — клиент тихо уточняет текст.
 */

type Board = 'teams' | 'individuals';
const TOP = 10;
const PHASE_TITLE = { upcoming: 'Скоро старт', active: 'Идёт сейчас', finished: 'Сезон завершён' } as const;

function weeksLabel(n: number): string {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return `${n} неделя`;
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return `${n} недели`;
  return `${n} недель`;
}

function Trend({ value }: { value: number }) {
  if (value === 0) return <span className={styles.trend}><span aria-hidden="true">—</span><span className={styles.srOnly}>без изменений</span></span>;
  const up = value > 0;
  return (
    <span className={`${styles.trend} ${up ? styles.trendUp : styles.trendDown}`}>
      <span aria-hidden="true">{up ? `↑${value}` : `↓${-value}`}</span>
      <span className={styles.srOnly}>{up ? `поднялся на ${value}` : `опустился на ${-value}`}</span>
    </span>
  );
}

export default function SeasonPublicHub() {
  const [division, setDivision] = useState<Division>('ielts');
  const [board, setBoard] = useState<Board>('teams');
  // Демо-сид как стартовые данные — только в демо: с Supabase показываем настоящий сезон, а не фикстуру
  const [initial] = useState(() => (process.env.NEXT_PUBLIC_AUTH_PROVIDER === 'supabase' ? undefined : buildSeasonSeed()));
  const { data: loaded } = useLmsData(() => getSeasonRepo().load(), 'season:public', initial);
  const data = loaded ?? initial;

  if (!data) {
    return (
      <main className={styles.page}>
        <section className={`${styles.shell} ${styles.hero}`}>
          <p className={styles.eyebrow}>ASHYQ Championship</p>
          <p className={styles.lead} role="status">Загружаем сезон…</p>
        </section>
      </main>
    );
  }

  const season = currentSeason(data.seasons);

  if (!season) {
    return (
      <main className={styles.page}>
        <section className={`${styles.shell} ${styles.hero}`}>
          <p className={styles.eyebrow}>ASHYQ Championship</p>
          <h1 className={styles.title}>Сезон готовится</h1>
          <p className={styles.lead}>Даты следующего сезона ещё не объявлены.</p>
        </section>
      </main>
    );
  }

  const week = weekOf(season);
  const weeks = totalWeeks(season);
  const phase = seasonPhase(season);
  const teams = data.teams.filter((t) => t.seasonId === season.id);
  const participants = data.participants.filter((p) => p.seasonId === season.id);
  const points = data.points.filter((p) => p.seasonId === season.id);
  const activeDivision = season.divisions.includes(division) ? division : season.divisions[0];
  const standings: Standing[] = board === 'teams'
    ? teamStandings(teams, points, activeDivision, week)
    : individualStandings(participants, teams, points, activeDivision, week);
  const rows = board === 'teams' ? standings : standings.slice(0, TOP);
  const matches = data.matchDays.filter((m) => m.seasonId === season.id).sort((a, b) => a.startsAt.localeCompare(b.startsAt));
  const next = matches.find((m) => matchStatus(m) === 'live') ?? matches.find((m) => matchStatus(m) === 'upcoming');
  const final = [...matches].reverse().find((m) => m.venue === 'offline');
  const updated = points.reduce((latest, p) => (p.createdAt > latest ? p.createdAt : latest), '');

  return (
    <main className={styles.page}>
      <section className={styles.hero}>
        <div className={`${styles.shell} ${styles.heroGrid}`}>
          <div>
            <p className={styles.eyebrow}>ASHYQ Championship · {PHASE_TITLE[phase].toLowerCase()}</p>
            <h1 className={styles.title}>Учись. Играй. Расти вместе.</h1>
            <p className={styles.lead}>{weeksLabel(weeks)} прогресса, командных задач и Match Days. Открытие и квалификации проходят онлайн, финал — офлайн в Астане.</p>
            <div className={styles.actions}>
              <Link className={styles.primary} href="/season/current">Мой сезон</Link>
              <a className={styles.secondary} href="#leaderboard">Смотреть рейтинг</a>
            </div>
          </div>
          <aside className={styles.statusCard} aria-label="Статус сезона">
            <div className={styles.liveRow}>
              <span className={styles.live}><span className={styles.dot} />{PHASE_TITLE[phase]}</span>
              {process.env.NEXT_PUBLIC_AUTH_PROVIDER === 'supabase' ? null : <span className={styles.micro}>Демо-данные</span>}
            </div>
            <p className={styles.week}>{season.name} · неделя {week} из {weeks}</p>
            <div className={styles.progressTrack} role="progressbar" aria-label="Прогресс сезона" aria-valuemin={0} aria-valuemax={weeks} aria-valuenow={week}>
              <div className={styles.progressFill} style={{ width: `${(week / weeks) * 100}%` }} />
            </div>
            <div className={styles.statusGrid}>
              <div className={styles.stat}>
                <strong suppressHydrationWarning>{next ? (matchStatus(next) === 'live' ? 'Сейчас' : formatDate(next.startsAt)) : '—'}</strong>
                <span>{next ? `${next.title}, ${next.place.toLowerCase()}` : 'Match Days завершены'}</span>
              </div>
              <div className={styles.stat}>
                <strong suppressHydrationWarning>{final ? formatDate(final.startsAt) : '—'}</strong>
                <span>{final ? `финал, ${final.place}` : 'финал'}</span>
              </div>
            </div>
          </aside>
        </div>
      </section>

      <section className={styles.section} id="leaderboard">
        <div className={styles.shell}>
          <div className={styles.sectionHead}>
            <div>
              <p className={styles.micro}>Рейтинг сезона</p>
              <h2 className={styles.heading}>Две гонки. Один общий ритм.</h2>
              <p className={styles.subhead}>IELTS и SAT считаются отдельно. Командный рейтинг и личный вклад доступны всем.</p>
            </div>
            <div className={styles.filters} aria-label="Направление">
              {season.divisions.map((item) => (
                <button className={styles.filter} type="button" aria-pressed={activeDivision === item} onClick={() => setDivision(item)} key={item}>{DIVISION_LABELS[item]}</button>
              ))}
            </div>
          </div>
          <div className={styles.filters} role="tablist" aria-label="Тип рейтинга" style={{ marginTop: 24 }}>
            <button className={styles.filter} role="tab" aria-selected={board === 'teams'} onClick={() => setBoard('teams')}>Команды</button>
            <button className={styles.filter} role="tab" aria-selected={board === 'individuals'} onClick={() => setBoard('individuals')}>Участники</button>
          </div>
          <div className={styles.leaderGrid}>
            <div className={`${styles.card} ${styles.leaderboard}`}>
              <div className={styles.leaderTitle}>
                <h3>{board === 'teams' ? 'Команды' : 'Участники'} · {DIVISION_LABELS[activeDivision]}</h3>
                <span className={styles.micro} suppressHydrationWarning>{updated ? `обновлено ${formatDate(updated)}` : `неделя ${week}`}</span>
              </div>
              {rows.length === 0 ? <p className={styles.emptyRow}>{board === 'teams' ? 'Команды ещё формируются.' : 'Участники ещё не заявлены.'}</p> : null}
              {rows.map((row) => (
                <div className={styles.row} key={row.id}>
                  <span className={styles.rank}>{String(row.rank).padStart(2, '0')}</span>
                  <div><p className={styles.rowName}>{row.name}</p><p className={styles.rowMeta}>{row.meta}</p></div>
                  <span className={styles.points}>{row.points}</span>
                  <Trend value={row.trend} />
                </div>
              ))}
              {board === 'individuals' && standings.length > TOP ? <p className={styles.emptyRow}>Показаны первые {TOP} из {standings.length}.</p> : null}
            </div>
            <aside className={`${styles.card} ${styles.summaryCard}`}>
              <p className={styles.micro}>Как считаются баллы</p>
              <h3 className={styles.heading}>Рост важнее одного рывка</h3>
              <p className={styles.subhead}>Каждую неделю участник набирает до 100 баллов в пяти категориях. В команде ровно {TEAM_SIZE} человек, поэтому команды сравниваются по сумме баллов.</p>
              <ul className={styles.capList}>
                {CATEGORIES.map((category) => <li key={category}><span>{CATEGORY_LABELS[category]}</span><strong>до {WEEKLY_CAPS[category]}</strong></li>)}
              </ul>
              <p className={styles.safeNote} style={{ marginTop: 18 }}>Личный рейтинг публичен с безопасными псевдонимами. Настоящие имена несовершеннолетних не показываем.</p>
            </aside>
          </div>
        </div>
      </section>

      <section className={styles.section}>
        <div className={styles.shell}>
          <p className={styles.micro}>Гибридный формат</p>
          <h2 className={styles.heading}>От открытия к финалу</h2>
          <div className={styles.timeline}>
            {matches.map((match, index) => {
              const status = matchStatus(match);
              return (
                <article className={`${styles.card} ${styles.event}`} key={match.id}>
                  <span className={styles.eventBadge}>{status === 'live' ? 'Сейчас' : status === 'done' ? 'Прошёл' : String(index + 1).padStart(2, '0')}</span>
                  <h3>{match.title}</h3>
                  <p suppressHydrationWarning>{`${formatDate(match.startsAt)} · ${match.place}`}</p>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <section className={styles.section} id="join">
        <div className={`${styles.shell} ${styles.blush} ${styles.formArea}`}>
          <div>
            <p className={styles.micro}>Следующий набор</p>
            <h2 className={styles.heading}>Хочешь в следующий сезон?</h2>
            <p className={styles.subhead}>Оставь контакт. Команда сообщит только подтверждённые даты, формат и стоимость.</p>
          </div>
          <SeasonForm />
        </div>
      </section>
    </main>
  );
}
