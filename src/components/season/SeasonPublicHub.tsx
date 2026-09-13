'use client';

import { useState } from 'react';
import Link from 'next/link';
import SeasonForm from '@/components/SeasonForm';
import { ACTIVE_SEASON_FIXTURE } from '@/features/season/fixture';
import type { SeasonDivision } from '@/features/season/types';
import styles from './SeasonV3.module.css';

type Board = 'teams' | 'individuals';
const LABELS: Record<SeasonDivision, string> = { ielts: 'IELTS', sat: 'SAT' };

export default function SeasonPublicHub() {
  const [division, setDivision] = useState<SeasonDivision>('ielts');
  const [board, setBoard] = useState<Board>('teams');
  const season = ACTIVE_SEASON_FIXTURE;
  const rows = board === 'teams'
    ? season.teams.filter((row) => row.division === division)
    : season.individuals.filter((row) => row.division === division);

  return (
    <main className={styles.page}>
      <section className={styles.hero}>
        <div className={`${styles.shell} ${styles.heroGrid}`}>
          <div>
            <p className={styles.eyebrow}>ASHYQ Championship · активный сезон</p>
            <h1 className={styles.title}>Учись. Играй. Расти вместе.</h1>
            <p className={styles.lead}>Шесть недель прогресса, командных задач и Match Days. Открытие и квалификации проходят онлайн, финал — офлайн в Астане.</p>
            <div className={styles.actions}>
              <Link className={styles.primary} href="/season/current">Открыть демо Season HQ</Link>
              <a className={styles.secondary} href="#leaderboard">Смотреть рейтинг</a>
            </div>
          </div>
          <aside className={styles.statusCard} aria-label="Статус сезона">
            <div className={styles.liveRow}><span className={styles.live}><span className={styles.dot} />Идёт сейчас</span><span className={styles.micro}>Демо-данные</span></div>
            <p className={styles.week}>{season.config.name} · неделя {season.config.week} из {season.config.totalWeeks}</p>
            <div className={styles.progressTrack} role="progressbar" aria-label="Прогресс сезона" aria-valuemin={0} aria-valuemax={season.config.totalWeeks} aria-valuenow={season.config.week}><div className={styles.progressFill} style={{ width: `${season.config.week / season.config.totalWeeks * 100}%` }} /></div>
            <div className={styles.statusGrid}>
              <div className={styles.stat}><strong>Сегодня · 19:00</strong><span>Match Day, онлайн</span></div>
              <div className={styles.stat}><strong>11 октября</strong><span>финал, Астана</span></div>
            </div>
          </aside>
        </div>
      </section>

      <section className={styles.section} id="leaderboard">
        <div className={styles.shell}>
          <div className={styles.sectionHead}>
            <div><p className={styles.micro}>Рейтинг сезона</p><h2 className={styles.heading}>Две гонки. Один общий ритм.</h2><p className={styles.subhead}>IELTS и SAT считаются отдельно. Командный рейтинг и личный вклад доступны всем.</p></div>
            <div className={styles.filters} aria-label="Направление">
              {(['ielts', 'sat'] as const).map((item) => <button className={styles.filter} type="button" aria-pressed={division === item} onClick={() => setDivision(item)} key={item}>{LABELS[item]}</button>)}
            </div>
          </div>
          <div className={styles.filters} role="tablist" aria-label="Тип рейтинга" style={{ marginTop: 24 }}>
            <button className={styles.filter} role="tab" aria-selected={board === 'teams'} onClick={() => setBoard('teams')}>Команды</button>
            <button className={styles.filter} role="tab" aria-selected={board === 'individuals'} onClick={() => setBoard('individuals')}>Участники</button>
          </div>
          <div className={styles.leaderGrid}>
            <div className={`${styles.card} ${styles.leaderboard}`}>
              <div className={styles.leaderTitle}><h3>{board === 'teams' ? 'Команды' : 'Участники'} · {LABELS[division]}</h3><span className={styles.micro}>обновлено {season.config.leaderboardUpdatedAt}</span></div>
              {rows.map((row) => (
                <div className={styles.row} key={row.id}>
                  <span className={styles.rank}>0{row.rank}</span>
                  <div><p className={styles.rowName}>{'name' in row ? row.name : row.alias}</p><p className={styles.rowMeta}>{'city' in row ? row.city : row.team}</p></div>
                  <span className={styles.points}>{row.points}</span>
                </div>
              ))}
            </div>
            <aside className={`${styles.card} ${styles.summaryCard}`}>
              <p className={styles.micro}>Как читается рейтинг</p>
              <h3 className={styles.heading}>Рост важнее одного рывка</h3>
              <p className={styles.subhead}>Баллы дают регулярный прогресс, миссии, участие в Match Days и вклад в команду. Командный результат нормализуется, чтобы размер команды не давал преимущества.</p>
              <p className={styles.safeNote} style={{ marginTop: 22 }}>Личный рейтинг публичен с безопасными псевдонимами. Настоящие имена несовершеннолетних не показываем.</p>
            </aside>
          </div>
        </div>
      </section>

      <section className={styles.section}>
        <div className={styles.shell}>
          <p className={styles.micro}>Гибридный формат</p><h2 className={styles.heading}>От открытия к финалу</h2>
          <div className={styles.timeline}>
            {season.events.map((event, index) => <article className={`${styles.card} ${styles.event}`} key={event.id}><span className={styles.eventBadge}>{event.status === 'live' ? 'Сейчас' : `0${index + 1}`}</span><h3>{event.title}</h3><p>{event.date} · {event.place}</p></article>)}
          </div>
        </div>
      </section>

      <section className={styles.section} id="join">
        <div className={`${styles.shell} ${styles.blush} ${styles.formArea}`}>
          <div><p className={styles.micro}>Следующий набор</p><h2 className={styles.heading}>Хочешь в следующий сезон?</h2><p className={styles.subhead}>Оставь контакт. Команда сообщит только подтверждённые даты, формат и стоимость.</p></div>
          <SeasonForm />
        </div>
      </section>
    </main>
  );
}
