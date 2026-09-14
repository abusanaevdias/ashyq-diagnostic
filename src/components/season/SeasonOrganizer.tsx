'use client';

import { useState } from 'react';
import { track } from '@/lib/analytics';
import { formatDate, formatDay, relativeTime } from '@/lib/lms/format';
import { useLmsData } from '@/lib/lms/hooks';
import { ROUTE_ROLES } from '@/lib/lms/permissions';
import type { User } from '@/lib/lms/types';
import { getSeasonRepo } from '@/lib/season/repo';
import { currentSeason, matchStatus, remainingCap, seasonPhase, totalWeeks, weekOf } from '@/lib/season/scoring';
import {
  CATEGORIES,
  CATEGORY_LABELS,
  DIVISION_LABELS,
  DIVISIONS,
  TEAM_SIZE,
  WEEKLY_CAPS,
  type Category,
  type Division,
  type MatchSubmission,
  type Season,
  type SeasonData,
  type Team,
} from '@/lib/season/types';
import { MicroLabel } from '@/components/ui/CleanUi';
import ui from '@/components/ui/CleanUi.module.css';
import RequireRole from '@/components/lms/RequireRole';
import { Loading } from '@/components/lms/States';
import lms from '@/components/lms/Lms.module.css';
import styles from './SeasonV3.module.css';

/**
 * Кабинет организатора чемпионата (SEASON-DEMO-001): сезон, команды ровно по 5,
 * начисление баллов в пределах недельных лимитов, проверка ответов Match Day.
 * Права — только через permissions.ts (season.manage).
 */

type Tab = 'overview' | 'teams' | 'points' | 'matches';
const TABS: Array<[Tab, string]> = [['overview', 'Обзор'], ['teams', 'Команды'], ['points', 'Баллы'], ['matches', 'Match Days']];
const PHASE = { upcoming: 'скоро старт', active: 'идёт', finished: 'завершён' } as const;
const MATCH_STATUS = { live: 'Сейчас', upcoming: 'Скоро', done: 'Прошёл' } as const;

const message = (err: unknown, fallback: string) => (err instanceof Error ? err.message : fallback);

interface PanelProps {
  data: SeasonData;
  season: Season;
  user: User;
  onDone: (text: string) => void;
}

export default function SeasonOrganizer() {
  return <RequireRole roles={ROUTE_ROLES.seasonManage}>{(user) => <Organizer user={user} />}</RequireRole>;
}

function Organizer({ user }: { user: User }) {
  const { data, loading, error } = useLmsData(() => getSeasonRepo().load(), 'season:organizer');
  const [tab, setTab] = useState<Tab>('overview');
  const [selectedId, setSelectedId] = useState('');
  const [status, setStatus] = useState('');

  if (loading) return <Loading />;
  if (error || !data) return <p className={lms.error} role="alert">{error ?? 'Не удалось загрузить сезон'}</p>;

  const season = data.seasons.find((s) => s.id === selectedId) ?? currentSeason(data.seasons);
  const props = season ? { data, season, user, onDone: setStatus } : null;

  return (
    <>
      <MicroLabel>Организатору</MicroLabel>
      <h1 className={lms.title}>Чемпионат</h1>
      <p className={lms.lead}>
        {season ? `${season.name} · ${PHASE[seasonPhase(season)]} · неделя ${weekOf(season)} из ${totalWeeks(season)}` : 'Сезонов пока нет — создайте первый.'}
      </p>
      <p className={lms.srOnly} aria-live="polite" role="status">{status}</p>
      {data.seasons.length > 1 ? (
        <label className={`${lms.fieldLabel} ${lms.section}`} style={{ maxWidth: 360 }}>
          Сезон
          <select className={lms.field} value={season?.id ?? ''} onChange={(e) => setSelectedId(e.target.value)}>
            {data.seasons.map((s) => <option key={s.id} value={s.id}>{s.name} · {PHASE[seasonPhase(s)]}</option>)}
          </select>
        </label>
      ) : null}

      <div className={`${styles.tabs} ${lms.section}`} role="tablist" aria-label="Разделы организатора">
        {TABS.map(([key, label]) => (
          <button key={key} type="button" role="tab" id={`org-tab-${key}`} aria-selected={tab === key} aria-controls="org-panel" className={styles.tab} onClick={() => setTab(key)}>
            {label}
          </button>
        ))}
      </div>
      <div role="tabpanel" id="org-panel" aria-labelledby={`org-tab-${tab}`} className={lms.section}>
        {tab === 'overview' ? <Overview data={data} season={season} user={user} onDone={setStatus} onTab={setTab} /> : null}
        {props && tab === 'teams' ? <Teams {...props} /> : null}
        {props && tab === 'points' ? <Points {...props} /> : null}
        {props && tab === 'matches' ? <Matches {...props} /> : null}
        {!props && tab !== 'overview' ? <p className={lms.notice}>Сначала создайте сезон во вкладке «Обзор».</p> : null}
      </div>
    </>
  );
}

/* ---------- обзор и новый сезон ---------- */

function Overview({ data, season, user, onDone, onTab }: { data: SeasonData; season: Season | undefined; user: User; onDone: (text: string) => void; onTab: (tab: Tab) => void }) {
  const [name, setName] = useState('');
  const [startsAt, setStartsAt] = useState('');
  const [endsAt, setEndsAt] = useState('');
  const [divisions, setDivisions] = useState<Division[]>(['ielts', 'sat']);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const create = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setBusy(true);
    setError('');
    try {
      const created = await getSeasonRepo().createSeason({ name, divisions, startsAt, endsAt, createdBy: user.id });
      track('season_created', { weeks: totalWeeks(created) });
      onDone(`Сезон «${created.name}» создан`);
      setName('');
      setStartsAt('');
      setEndsAt('');
    } catch (err) {
      setError(message(err, 'Сезон не создан'));
    } finally {
      setBusy(false);
    }
  };

  const reset = async () => {
    await getSeasonRepo().resetDemo();
    onDone('Демо-сезон восстановлен');
  };

  const count = (list: Array<{ seasonId: string }>) => (season ? list.filter((x) => x.seasonId === season.id).length : 0);
  const matchIds = new Set(season ? data.matchDays.filter((m) => m.seasonId === season.id).map((m) => m.id) : []);
  const pending = data.submissions.filter((s) => !s.review && matchIds.has(s.matchDayId)).length;

  return (
    <div className={lms.feedGrid}>
      {season ? (
        <section className={lms.card} aria-labelledby="org-season-title">
          <h2 id="org-season-title" className={lms.sectionTitle}>{season.name}</h2>
          <p className={lms.muted}>{formatDay(season.startsAt)} — {formatDay(season.endsAt)} · {season.divisions.map((d) => DIVISION_LABELS[d]).join(' и ')}</p>
          <ul className={styles.capList}>
            <li><span>Участники</span><strong>{count(data.participants)}</strong></li>
            <li><span>Команды по {TEAM_SIZE}</span><strong>{count(data.teams)}</strong></li>
            <li><span>Match Days</span><strong>{matchIds.size}</strong></li>
            <li><span>Ждут проверки</span><strong>{pending}</strong></li>
          </ul>
          {pending > 0 ? (
            <div className={lms.actions}>
              <button type="button" className={ui.buttonBlack} onClick={() => onTab('matches')}>Проверить ответы</button>
            </div>
          ) : null}
        </section>
      ) : null}

      <section className={lms.card} aria-labelledby="org-new-title">
        <h2 id="org-new-title" className={lms.sectionTitle}>Новый сезон</h2>
        <form className={lms.form} onSubmit={create} aria-busy={busy}>
          <label className={lms.fieldLabel}>
            Название сезона
            <input className={lms.field} value={name} onChange={(e) => setName(e.target.value)} required maxLength={60} placeholder="Season 04" />
          </label>
          <fieldset className={lms.fieldset}>
            <legend className={lms.legend}>Дивизионы</legend>
            {DIVISIONS.map((d) => (
              <label key={d} className={styles.checkRow}>
                <input type="checkbox" checked={divisions.includes(d)} onChange={() => setDivisions((list) => (list.includes(d) ? list.filter((x) => x !== d) : [...list, d]))} />
                <span>{DIVISION_LABELS[d]}</span>
              </label>
            ))}
          </fieldset>
          <div className={lms.fieldRow}>
            <label className={lms.fieldLabel}>
              Начало
              <input className={lms.field} type="date" value={startsAt} onChange={(e) => setStartsAt(e.target.value)} required />
            </label>
            <label className={lms.fieldLabel}>
              Конец
              <input className={lms.field} type="date" value={endsAt} onChange={(e) => setEndsAt(e.target.value)} required />
            </label>
          </div>
          <p className={lms.hint}>Длительность задаёт организатор: недели считаются от даты начала.</p>
          {error ? <p className={lms.error} role="alert">{error}</p> : null}
          <div>
            <button type="submit" className={ui.buttonBlack} disabled={busy}>Создать сезон</button>
          </div>
        </form>
        {process.env.NEXT_PUBLIC_AUTH_PROVIDER === 'supabase' ? null : (
          <div className={lms.actions}>
            <button type="button" className={lms.textButton} onClick={reset}>Сбросить демо-сезон</button>
          </div>
        )}
      </section>
    </div>
  );
}

/* ---------- команды и участники ---------- */

function Teams({ data, season, onDone }: PanelProps) {
  const [division, setDivision] = useState<Division>(season.divisions[0]);
  const [teamName, setTeamName] = useState('');
  const [city, setCity] = useState('');
  const [picks, setPicks] = useState<string[]>([]);
  const [captain, setCaptain] = useState('');
  const [teamError, setTeamError] = useState('');
  const [name, setName] = useState('');
  const [alias, setAlias] = useState('');
  const [email, setEmail] = useState('');
  const [addError, setAddError] = useState('');

  const activeDivision = season.divisions.includes(division) ? division : season.divisions[0];
  const participants = data.participants.filter((p) => p.seasonId === season.id && p.division === activeDivision);
  const teams = data.teams.filter((t) => t.seasonId === season.id && t.division === activeDivision);
  const free = participants.filter((p) => !teams.some((t) => t.memberIds.includes(p.id)));
  const aliasOf = (id: string) => data.participants.find((p) => p.id === id)?.alias ?? '—';
  const captainId = picks.includes(captain) ? captain : picks[0] ?? '';

  const toggle = (id: string) => setPicks((list) => (list.includes(id) ? list.filter((x) => x !== id) : list.length < TEAM_SIZE ? [...list, id] : list));

  const createTeam = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setTeamError('');
    try {
      const team = await getSeasonRepo().createTeam({ seasonId: season.id, division: activeDivision, name: teamName, city, memberIds: picks, captainId });
      track('season_team_created', { division: activeDivision });
      onDone(`Команда «${team.name}» собрана`);
      setTeamName('');
      setCity('');
      setPicks([]);
      setCaptain('');
    } catch (err) {
      setTeamError(message(err, 'Команда не создана'));
    }
  };

  const addParticipant = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setAddError('');
    try {
      const p = await getSeasonRepo().addParticipant({ seasonId: season.id, division: activeDivision, alias, name, email: email.trim() || undefined });
      onDone(`Участник ${p.alias} добавлен в ${DIVISION_LABELS[activeDivision]}`);
      setName('');
      setAlias('');
      setEmail('');
    } catch (err) {
      setAddError(message(err, 'Участник не добавлен'));
    }
  };

  return (
    <>
      <div className={styles.filters} aria-label="Дивизион">
        {season.divisions.map((d) => (
          <button key={d} type="button" className={styles.filter} aria-pressed={activeDivision === d} onClick={() => { setDivision(d); setPicks([]); }}>{DIVISION_LABELS[d]}</button>
        ))}
      </div>
      <div className={lms.feedGrid}>
        <section aria-labelledby="org-teams-title">
          <h2 id="org-teams-title" className={lms.sectionTitle}>Команды · {DIVISION_LABELS[activeDivision]}</h2>
          {teams.length === 0 ? <p className={lms.muted}>Команд пока нет.</p> : null}
          <div className={lms.list}>
            {teams.map((team) => (
              <article key={team.id} className={`${lms.card} ${lms.rowCard}`}>
                <h3 className={lms.cardTitle}>{team.name}</h3>
                <p className={lms.muted}>{team.city || 'Город не указан'} · капитан {aliasOf(team.captainId)}</p>
                <ul className={lms.reviewList} aria-label={`Состав ${team.name}`}>
                  {team.memberIds.map((id) => {
                    const p = data.participants.find((x) => x.id === id);
                    return <li key={id} className={lms.reviewRow}><span className={lms.reviewWho}>{p?.alias ?? id}</span><span className={lms.hint}>{p?.name}</span></li>;
                  })}
                </ul>
              </article>
            ))}
          </div>
        </section>

        <aside>
          <section className={lms.card} aria-labelledby="org-new-team">
            <h2 id="org-new-team" className={lms.sectionTitle}>Новая команда</h2>
            <p className={lms.hint}>Ровно {TEAM_SIZE} участников без команды · выбрано {picks.length} из {TEAM_SIZE}</p>
            <form className={lms.form} onSubmit={createTeam}>
              <div className={lms.fieldRow}>
                <label className={lms.fieldLabel}>
                  Название команды
                  <input className={lms.field} value={teamName} onChange={(e) => setTeamName(e.target.value)} required maxLength={40} />
                </label>
                <label className={lms.fieldLabel}>
                  Город
                  <input className={lms.field} value={city} onChange={(e) => setCity(e.target.value)} maxLength={40} />
                </label>
              </div>
              <fieldset className={lms.fieldset}>
                <legend className={lms.legend}>Состав</legend>
                {free.length === 0 ? <p className={lms.muted}>Свободных участников нет — добавьте новых ниже.</p> : null}
                {free.map((p) => (
                  <label key={p.id} className={styles.checkRow}>
                    <input type="checkbox" checked={picks.includes(p.id)} disabled={!picks.includes(p.id) && picks.length >= TEAM_SIZE} onChange={() => toggle(p.id)} />
                    <span>{p.alias}</span>
                    <span className={lms.hint}>{p.name}</span>
                  </label>
                ))}
              </fieldset>
              <label className={lms.fieldLabel}>
                Капитан
                <select className={lms.field} value={captainId} onChange={(e) => setCaptain(e.target.value)} disabled={picks.length === 0}>
                  {picks.length === 0 ? <option value="">Сначала выберите состав</option> : null}
                  {picks.map((id) => <option key={id} value={id}>{aliasOf(id)}</option>)}
                </select>
              </label>
              {teamError ? <p className={lms.error} role="alert">{teamError}</p> : null}
              <div>
                <button type="submit" className={ui.buttonBlack} disabled={picks.length !== TEAM_SIZE}>Собрать команду</button>
              </div>
            </form>
          </section>

          <section className={`${lms.card} ${lms.section}`} aria-labelledby="org-new-member">
            <h2 id="org-new-member" className={lms.sectionTitle}>Добавить участника</h2>
            <form className={lms.form} onSubmit={addParticipant}>
              <label className={lms.fieldLabel}>
                Имя (видит только организатор)
                <input className={lms.field} value={name} onChange={(e) => setName(e.target.value)} required maxLength={60} />
              </label>
              <label className={lms.fieldLabel}>
                Псевдоним в рейтинге
                <input className={lms.field} value={alias} onChange={(e) => setAlias(e.target.value)} required maxLength={24} placeholder="Qyran · A7" />
              </label>
              <label className={lms.fieldLabel}>
                Email аккаунта ученика (необязательно)
                <input className={lms.field} type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="off" maxLength={120} />
                <span className={lms.hint}>Связывает участника с аккаунтом: ученик увидит свой сезон в кабинете.</span>
              </label>
              {addError ? <p className={lms.error} role="alert">{addError}</p> : null}
              <div>
                <button type="submit" className={ui.buttonOutline}>Добавить в {DIVISION_LABELS[activeDivision]}</button>
              </div>
            </form>
          </section>
        </aside>
      </div>
    </>
  );
}

/* ---------- баллы ---------- */

function Points({ data, season, user, onDone }: PanelProps) {
  const [participantId, setParticipantId] = useState('');
  const [category, setCategory] = useState<Category>('progress');
  const [points, setPoints] = useState('');
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');

  const week = weekOf(season);
  const open = seasonPhase(season) === 'active' && week > 0;
  const participants = data.participants.filter((p) => p.seasonId === season.id).sort((a, b) => a.alias.localeCompare(b.alias));
  const left = participantId ? remainingCap(data.points, participantId, category, week) : null;
  const recent = data.points.filter((p) => p.seasonId === season.id).sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 8);
  const aliasOf = (id: string) => data.participants.find((p) => p.id === id)?.alias ?? '—';

  const award = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    try {
      const entry = await getSeasonRepo().awardPoints({
        seasonId: season.id,
        participantId,
        category,
        points: points.trim() ? Number(points) : Number.NaN,
        reason,
        awardedBy: user.id,
      });
      track('season_points_awarded', { category, points: entry.points });
      onDone(`Начислено ${entry.points} — ${aliasOf(entry.participantId)}, «${CATEGORY_LABELS[category]}»`);
      setPoints('');
      setReason('');
    } catch (err) {
      setError(message(err, 'Баллы не начислены'));
    }
  };

  return (
    <div className={lms.feedGrid}>
      <section className={lms.card} aria-labelledby="org-points-title">
        <h2 id="org-points-title" className={lms.sectionTitle}>Начислить баллы</h2>
        {!open ? <p className={`${lms.notice} ${lms.spaced}`}>Начисление открыто только во время сезона.</p> : null}
        <form className={lms.form} onSubmit={award}>
          <label className={lms.fieldLabel}>
            Участник
            <select className={lms.field} value={participantId} onChange={(e) => setParticipantId(e.target.value)} required>
              <option value="">Выберите участника</option>
              {season.divisions.map((d) => (
                <optgroup key={d} label={DIVISION_LABELS[d]}>
                  {participants.filter((p) => p.division === d).map((p) => <option key={p.id} value={p.id}>{p.alias} — {p.name}</option>)}
                </optgroup>
              ))}
            </select>
          </label>
          <div className={lms.fieldRow}>
            <label className={lms.fieldLabel}>
              Категория
              <select className={lms.field} value={category} onChange={(e) => setCategory(e.target.value as Category)}>
                {CATEGORIES.map((c) => <option key={c} value={c}>{CATEGORY_LABELS[c]} · до {WEEKLY_CAPS[c]}</option>)}
              </select>
            </label>
            <label className={lms.fieldLabel}>
              Баллы
              <input className={lms.field} type="number" inputMode="numeric" min={1} max={left ?? WEEKLY_CAPS[category]} step={1} value={points} onChange={(e) => setPoints(e.target.value)} required />
            </label>
          </div>
          <p className={lms.hint}>{left === null ? `Недельный лимит категории — ${WEEKLY_CAPS[category]}.` : `Осталось на неделе ${week}: ${left} из ${WEEKLY_CAPS[category]}.`}</p>
          <label className={lms.fieldLabel}>
            За что
            <input className={lms.field} value={reason} onChange={(e) => setReason(e.target.value)} required maxLength={120} placeholder="Например: пробный Reading 7.0" />
          </label>
          {error ? <p className={lms.error} role="alert">{error}</p> : null}
          <div>
            <button type="submit" className={ui.buttonBlack} disabled={!open}>Начислить</button>
          </div>
        </form>
      </section>

      <section aria-labelledby="org-ledger-title">
        <h2 id="org-ledger-title" className={lms.sectionTitle}>Последние начисления</h2>
        <ul className={lms.reviewList}>
          {recent.map((p) => (
            <li key={p.id} className={lms.reviewRow}>
              <span className={lms.reviewWho}>{aliasOf(p.participantId)}</span>
              <span className={lms.chip}>{CATEGORY_LABELS[p.category]} +{p.points}</span>
              <span className={lms.hint}>{relativeTime(p.createdAt)}</span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

/* ---------- Match Days ---------- */

function ReviewForm({ submission, team, user, onDone }: { submission: MatchSubmission; team: Team; user: User; onDone: (text: string) => void }) {
  const [points, setPoints] = useState('');
  const [error, setError] = useState('');

  const review = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    try {
      const value = points.trim() ? Number(points) : Number.NaN;
      await getSeasonRepo().reviewMatch({ submissionId: submission.id, points: value, reviewedBy: user.id });
      track('season_match_reviewed', { points: value });
      onDone(`Команда ${team.name}: +${value} каждому в «Команда»`);
    } catch (err) {
      setError(message(err, 'Ответ не проверен'));
    }
  };

  return (
    <form className={lms.inlineForm} onSubmit={review} aria-label={`Проверка ответа ${team.name}`}>
      <label className={lms.fieldLabel}>
        Баллы каждому (0–{WEEKLY_CAPS.team})
        <input className={lms.field} type="number" inputMode="numeric" min={0} max={WEEKLY_CAPS.team} step={1} value={points} onChange={(e) => setPoints(e.target.value)} required />
      </label>
      <button type="submit" className={ui.buttonBlack}>Засчитать</button>
      {error ? <p className={lms.error} role="alert">{error}</p> : null}
    </form>
  );
}

function Matches({ data, season, user, onDone }: PanelProps) {
  const [title, setTitle] = useState('');
  const [startsAt, setStartsAt] = useState('');
  const [duration, setDuration] = useState('90');
  const [venue, setVenue] = useState<'online' | 'offline'>('online');
  const [place, setPlace] = useState('Онлайн');
  const [taskTitle, setTaskTitle] = useState('');
  const [brief, setBrief] = useState('');
  const [error, setError] = useState('');

  const matches = data.matchDays.filter((m) => m.seasonId === season.id).sort((a, b) => a.startsAt.localeCompare(b.startsAt));

  const create = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    try {
      const match = await getSeasonRepo().createMatchDay({ seasonId: season.id, title, startsAt, durationMin: Number(duration), venue, place, task: { title: taskTitle, brief } });
      onDone(`Match Day «${match.title}» добавлен`);
      setTitle('');
      setStartsAt('');
      setTaskTitle('');
      setBrief('');
    } catch (err) {
      setError(message(err, 'Match Day не добавлен'));
    }
  };

  return (
    <div className={lms.feedGrid}>
      <section aria-labelledby="org-matches-title">
        <h2 id="org-matches-title" className={lms.sectionTitle}>Match Days</h2>
        <div className={lms.list}>
          {matches.map((match) => {
            const status = matchStatus(match);
            const submissions = data.submissions.filter((s) => s.matchDayId === match.id);
            return (
              <article key={match.id} className={lms.card}>
                <h3 className={lms.cardTitle}>{match.title}</h3>
                <div className={lms.chipsRow}>
                  <span className={`${lms.chip} ${status === 'live' ? lms.chipInk : ''}`}>{MATCH_STATUS[status]}</span>
                  <span className={lms.chip}>{formatDate(match.startsAt)} · {match.durationMin} мин</span>
                  <span className={lms.chip}>{match.place}</span>
                </div>
                <p className={`${lms.muted} ${lms.spaced}`}>{match.task.title}</p>
                {submissions.length > 0 ? (
                  <ul className={lms.reviewList} aria-label={`Ответы: ${match.title}`}>
                    {submissions.map((s) => {
                      const team = data.teams.find((t) => t.id === s.teamId);
                      if (!team) return null;
                      return (
                        <li key={s.id} className={lms.reviewRow} style={{ display: 'block' }}>
                          <p><strong>{team.name}</strong> <span className={lms.hint}>· {relativeTime(s.submittedAt)}</span></p>
                          <p className={lms.subContent}>{s.answer}</p>
                          {s.review ? (
                            <p className={lms.spaced}><span className={`${lms.chip} ${lms.chipInk}`}>засчитано +{s.review.points} каждому</span></p>
                          ) : (
                            <ReviewForm submission={s} team={team} user={user} onDone={onDone} />
                          )}
                        </li>
                      );
                    })}
                  </ul>
                ) : (
                  <p className={lms.hint}>{status === 'upcoming' ? 'Ответы появятся во время матча.' : 'Ответов пока нет.'}</p>
                )}
              </article>
            );
          })}
        </div>
      </section>

      <section className={lms.card} aria-labelledby="org-new-match">
        <h2 id="org-new-match" className={lms.sectionTitle}>Новый Match Day</h2>
        <form className={lms.form} onSubmit={create}>
          <label className={lms.fieldLabel}>
            Название
            <input className={lms.field} value={title} onChange={(e) => setTitle(e.target.value)} required maxLength={80} />
          </label>
          <div className={lms.fieldRow}>
            <label className={lms.fieldLabel}>
              Начало
              <input className={lms.field} type="datetime-local" value={startsAt} onChange={(e) => setStartsAt(e.target.value)} required />
            </label>
            <label className={lms.fieldLabel}>
              Длительность, мин
              <input className={lms.field} type="number" inputMode="numeric" min={10} max={480} step={5} value={duration} onChange={(e) => setDuration(e.target.value)} required />
            </label>
          </div>
          <div className={lms.fieldRow}>
            <label className={lms.fieldLabel}>
              Формат
              <select className={lms.field} value={venue} onChange={(e) => { const next = e.target.value as 'online' | 'offline'; setVenue(next); setPlace(next === 'online' ? 'Онлайн' : 'Астана · офлайн'); }}>
                <option value="online">Онлайн</option>
                <option value="offline">Офлайн</option>
              </select>
            </label>
            <label className={lms.fieldLabel}>
              Место
              <input className={lms.field} value={place} onChange={(e) => setPlace(e.target.value)} required maxLength={60} />
            </label>
          </div>
          <label className={lms.fieldLabel}>
            Задание команде
            <input className={lms.field} value={taskTitle} onChange={(e) => setTaskTitle(e.target.value)} required maxLength={80} />
          </label>
          <label className={lms.fieldLabel}>
            Условие
            <textarea className={lms.field} value={brief} onChange={(e) => setBrief(e.target.value)} maxLength={2000} />
          </label>
          <p className={lms.hint}>Ответ команды отправляет капитан, пока матч идёт; баллы засчитываются в категорию «Команда».</p>
          {error ? <p className={lms.error} role="alert">{error}</p> : null}
          <div>
            <button type="submit" className={ui.buttonBlack}>Добавить Match Day</button>
          </div>
        </form>
      </section>
    </div>
  );
}
