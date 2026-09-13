'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { track } from '@/lib/analytics';
import { formatDate, relativeTime } from '@/lib/lms/format';
import { useLmsData, useSession } from '@/lib/lms/hooks';
import { can, canSubmitMatch } from '@/lib/lms/permissions';
import type { User } from '@/lib/lms/types';
import { getSeasonRepo } from '@/lib/season/repo';
import { currentSeason, individualStandings, matchStatus, participantFor, teamOf, teamStandings, totalWeeks, weekBreakdown, weekOf } from '@/lib/season/scoring';
import { CATEGORY_LABELS, DIVISION_LABELS } from '@/lib/season/types';
import lms from '@/components/lms/Lms.module.css';
import SeasonHQ from './SeasonHQ';
import styles from './SeasonV3.module.css';

/**
 * /season/current: ученик-участник видит свой Season HQ на данных сезона
 * (SEASON-DEMO-001); гость и организатор — прежнее демо-превью с подсказкой,
 * куда идти дальше.
 */
export default function SeasonHome() {
  const { session, ready } = useSession();
  const user = ready ? session?.user : undefined;
  if (user && can(user.role, 'season.play')) return <MyHQ user={user} />;
  const notice = user && can(user.role, 'season.manage') ? (
    <div className={styles.previewNote}>
      <p>Вы вошли как организатор — сезоном управляют в кабинете.</p>
      <Link className={styles.secondary} href="/teacher/season">Кабинет организатора</Link>
    </div>
  ) : (
    <div className={styles.previewNote}>
      <p>Это демо-превью. Войдите как ученик, чтобы открыть свой сезон: команду, баллы недели и Match Day.</p>
      <Link className={styles.secondary} href="/login?next=/season/current">Войти</Link>
    </div>
  );
  return <SeasonHQ notice={notice} />;
}

function useNow(intervalMs: number): number {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), intervalMs);
    return () => window.clearInterval(id);
  }, [intervalMs]);
  return now;
}

function clock(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000));
  const pad = (n: number) => String(n).padStart(2, '0');
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  return h > 0 ? `${h}:${pad(m)}:${pad(total % 60)}` : `${pad(m)}:${pad(total % 60)}`;
}

function MyHQ({ user }: { user: User }) {
  const { data, loading } = useLmsData(() => getSeasonRepo().load(), `season:hq:${user.id}`);
  const now = useNow(1000);
  const [answer, setAnswer] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [announce, setAnnounce] = useState('');
  const [seen, setSeen] = useState<string | null>(null);

  if (loading || !data) {
    return <main className={styles.page}><p className={`${lms.state} ${lms.muted}`} role="status">Загружаем сезон…</p></main>;
  }

  const season = currentSeason(data.seasons);
  const participant = season ? participantFor(data.participants, season.id, user) : undefined;
  if (!season || !participant) {
    return (
      <main className={styles.page}>
        <div className={styles.shell}>
          <header className={styles.hqTop}>
            <div>
              <p className={styles.micro}>Season HQ</p>
              <h1 className={styles.hqTitle}>Ты пока не в сезоне</h1>
              <p className={styles.subhead}>Организатор добавит тебя в команду из пяти человек. А пока можно посмотреть рейтинг.</p>
            </div>
            <Link className={styles.primary} href="/season">Рейтинг сезона</Link>
          </header>
        </div>
      </main>
    );
  }

  const seasonTeams = data.teams.filter((t) => t.seasonId === season.id);
  const seasonParticipants = data.participants.filter((p) => p.seasonId === season.id);
  const points = data.points.filter((p) => p.seasonId === season.id);
  const team = teamOf(seasonTeams, participant.id);
  const week = weekOf(season, now);
  const breakdown = weekBreakdown(points, participant.id, week);
  const weekTotal = breakdown.reduce((sum, row) => sum + row.value, 0);
  const weekCap = breakdown.reduce((sum, row) => sum + row.max, 0);
  const teamRank = team ? teamStandings(seasonTeams, points, participant.division, week).find((row) => row.id === team.id) : undefined;
  const myRank = individualStandings(seasonParticipants, seasonTeams, points, participant.division, week).find((row) => row.id === participant.id);
  const matches = data.matchDays.filter((m) => m.seasonId === season.id).sort((a, b) => a.startsAt.localeCompare(b.startsAt));
  const live = matches.find((m) => matchStatus(m, now) === 'live');
  const next = matches.find((m) => matchStatus(m, now) === 'upcoming');
  const submission = live && team ? data.submissions.find((s) => s.matchDayId === live.id && s.teamId === team.id) : undefined;
  const captain = team ? seasonParticipants.find((p) => p.id === team.captainId) : undefined;
  const isCaptain = canSubmitMatch(user, participant, team);

  // Производное состояние в рендере: ответ засчитали, пока страница открыта → объявить
  const state = submission ? (submission.review ? `reviewed:${submission.review.points}` : 'sent') : 'none';
  if (state !== seen) {
    if (seen === 'sent' && submission?.review) setAnnounce(`Ответ команды засчитан: +${submission.review.points} каждому`);
    setSeen(state);
  }

  const draft = answer ?? submission?.answer ?? '';
  const send = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!live || !team) return;
    setBusy(true);
    setError('');
    try {
      await getSeasonRepo().submitMatch({ matchDayId: live.id, teamId: team.id, participantId: participant.id, answer: draft });
      track('season_match_submitted', { division: participant.division });
      setAnswer(null);
      setAnnounce('Ответ команды отправлен');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ответ не отправлен');
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className={styles.page}>
      <p className={styles.demoBar}>Демо: команды и баллы хранятся на этом устройстве. Серверные баллы и авторизация появятся с Supabase.</p>
      <div className={styles.shell}>
        <header className={styles.hqTop}>
          <div>
            <p className={styles.micro}>Season HQ · {participant.alias}</p>
            <h1 className={styles.hqTitle}>Привет, {participant.alias}.</h1>
            <p className={styles.subhead}>
              {team ? `${team.name} · ` : ''}{DIVISION_LABELS[participant.division]} · {season.name} · неделя {week} из {totalWeeks(season)}
            </p>
          </div>
          <Link className={styles.secondary} href="/season">Рейтинг сезона</Link>
        </header>
        <p className={lms.srOnly} aria-live="polite" role="status">{announce}</p>

        <div className={styles.dashboard}>
          <div className={styles.summaryGrid}>
            <article className={`${styles.card} ${styles.summaryCard}`}>
              <p className={styles.micro}>Следующее действие</p>
              {live ? (
                <>
                  <h2>{live.title} идёт сейчас</h2>
                  <p className={styles.subhead}>{isCaptain ? 'Ты капитан: отправь ответ команды до конца матча.' : `Ответ команды отправляет капитан ${captain?.alias ?? ''}.`}</p>
                  <div className={styles.actions}><a className={styles.secondary} href="#match">К заданию</a></div>
                </>
              ) : next ? (
                <>
                  <h2>{next.title}</h2>
                  <p className={styles.subhead}>{formatDate(next.startsAt)} · {next.place}</p>
                </>
              ) : (
                <>
                  <h2>Match Days завершены</h2>
                  <p className={styles.subhead}>Итоги — в рейтинге сезона.</p>
                </>
              )}
            </article>
            <article className={`${styles.card} ${styles.summaryCard}`}>
              <p className={styles.micro}>Команда {team?.name ?? '—'}</p>
              <p className={styles.bigValue}>{teamRank ? `#${teamRank.rank}` : '—'}</p>
              <p className={styles.subhead}>в дивизионе {DIVISION_LABELS[participant.division]}</p>
            </article>
            <article className={`${styles.card} ${styles.summaryCard}`}>
              <p className={styles.micro}>Эта неделя</p>
              <p className={styles.bigValue}>{weekTotal}</p>
              <p className={styles.subhead}>из {weekCap} баллов · лично #{myRank?.rank ?? '—'}</p>
            </article>
          </div>

          <div className={styles.scoreGrid}>
            <article className={`${styles.card} ${styles.scoreCard}`}>
              <p className={styles.micro}>Мой вклад</p>
              <h2 className={styles.heading}>Баллы недели</h2>
              {breakdown.map((row) => (
                <div className={styles.skill} key={row.category}>
                  <div className={styles.skillLine}><span>{CATEGORY_LABELS[row.category]}</span><strong>{row.value}/{row.max}</strong></div>
                  <div className={styles.progressTrack} role="progressbar" aria-label={CATEGORY_LABELS[row.category]} aria-valuemin={0} aria-valuemax={row.max} aria-valuenow={row.value}>
                    <div className={styles.progressFill} style={{ width: `${(row.value / row.max) * 100}%` }} />
                  </div>
                </div>
              ))}
            </article>
            <article className={`${styles.card} ${styles.scoreCard}`}>
              <p className={styles.micro}>Состав</p>
              <h2 className={styles.heading}>{team?.name ?? 'Команда формируется'}</h2>
              {team ? (
                <ul className={styles.capList} aria-label={`Состав ${team.name}`}>
                  {team.memberIds.map((id) => {
                    const member = seasonParticipants.find((p) => p.id === id);
                    return <li key={id}><span>{member?.alias}{id === participant.id ? ' · ты' : ''}</span>{id === team.captainId ? <strong>капитан</strong> : null}</li>;
                  })}
                </ul>
              ) : (
                <p className={styles.subhead}>Организатор соберёт команду из пяти человек.</p>
              )}
            </article>
          </div>

          {live ? (
            <section className={styles.liveArena} aria-labelledby="match-title" id="match" style={{ marginTop: 18 }}>
              <div className={styles.arenaHead}>
                <div>
                  <span className={styles.live}><span className={styles.dot} />Match Day</span>
                  <h2 id="match-title" className={styles.arenaTitle}>{live.task.title}</h2>
                  <p style={{ marginTop: 12 }}>{live.title} · {live.place}</p>
                </div>
                <div>
                  <p className={styles.micro}>Осталось</p>
                  <p className={styles.timer} role="timer">{clock(Date.parse(live.startsAt) + live.durationMin * 60_000 - now)}</p>
                </div>
              </div>
              <div className={styles.arenaGrid}>
                <article className={styles.darkCard}>
                  <p className={styles.micro}>Задание</p>
                  <p style={{ marginTop: 10 }}>{live.task.brief}</p>
                  {submission?.review ? <p className={styles.reviewed}>Засчитано: +{submission.review.points} каждому в «Команда»</p> : null}
                  {isCaptain && !submission?.review ? (
                    <form onSubmit={send} className={styles.answerForm} aria-busy={busy}>
                      <label className={styles.answerLabel}>
                        Ответ команды
                        <textarea className={styles.answerField} value={draft} onChange={(e) => setAnswer(e.target.value)} maxLength={2000} required />
                      </label>
                      {error ? <p className={lms.error} role="alert">{error}</p> : null}
                      <div><button type="submit" className={styles.arenaButton} disabled={busy}>{submission ? 'Обновить ответ' : 'Отправить ответ'}</button></div>
                    </form>
                  ) : null}
                  {!isCaptain && !submission ? <p className={styles.noteDark}>Ответ отправляет капитан {captain?.alias}.</p> : null}
                  {submission && !submission.review ? <p className={styles.noteDark}>Ответ отправлен {relativeTime(submission.submittedAt)} — ждёт проверки организатора.</p> : null}
                </article>
                <article className={styles.darkCard}>
                  <p className={styles.micro}>Команда сейчас</p>
                  <p className={styles.bigValue}>{teamRank ? `${teamRank.rank} место` : '—'}</p>
                  <p>{team?.name} · {teamRank?.points ?? 0} баллов</p>
                </article>
              </div>
            </section>
          ) : null}

          <section aria-labelledby="hq-calendar" style={{ marginTop: 40 }}>
            <p className={styles.micro}>Календарь</p>
            <h2 id="hq-calendar" className={styles.heading}>Match Days сезона</h2>
            <div className={styles.timeline}>
              {matches.map((m, index) => {
                const status = matchStatus(m, now);
                return (
                  <article key={m.id} className={`${styles.card} ${styles.event}`}>
                    <span className={styles.eventBadge}>{status === 'live' ? 'Сейчас' : status === 'done' ? 'Прошёл' : String(index + 1).padStart(2, '0')}</span>
                    <h3>{m.title}</h3>
                    <p>{formatDate(m.startsAt)} · {m.place}</p>
                  </article>
                );
              })}
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
