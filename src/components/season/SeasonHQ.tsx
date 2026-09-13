'use client';

import { useState } from 'react';
import { ACTIVE_SEASON_FIXTURE } from '@/features/season/fixture';
import type { SeasonView } from '@/features/season/types';
import styles from './SeasonV3.module.css';

type Tab = 'overview' | 'matches' | 'leaderboard' | 'rules';

function Overview() {
  const { participant, config } = ACTIVE_SEASON_FIXTURE;
  return <>
    <div className={styles.summaryGrid}>
      <article className={`${styles.card} ${styles.summaryCard}`}><p className={styles.micro}>Следующее действие</p><h2>Подготовь командный спринт</h2><p className={styles.subhead}>Сегодня в 19:00 · Match Day онлайн. Комната откроется за 15 минут.</p><button className={styles.secondary} type="button" disabled aria-describedby="room-note" style={{ marginTop: 18 }}>Комната откроется позже</button><p className={styles.safeNote} id="room-note" style={{ marginTop: 8 }}>Демо: подключение к игровой комнате ещё не реализовано.</p></article>
      <article className={`${styles.card} ${styles.summaryCard}`}><p className={styles.micro}>Команда {participant.team}</p><p className={styles.bigValue}>#{participant.teamRank}</p><p className={styles.subhead}>в IELTS дивизионе</p></article>
      <article className={`${styles.card} ${styles.summaryCard}`}><p className={styles.micro}>Эта неделя</p><p className={styles.bigValue}>{participant.weeklyPoints}</p><p className={styles.subhead}>из {participant.weeklyGoal} баллов</p></article>
    </div>
    <div className={styles.scoreGrid}>
      <article className={`${styles.card} ${styles.scoreCard}`}><p className={styles.micro}>Мой вклад</p><h2 className={styles.heading}>Баллы недели</h2>{participant.score.map((item) => <div className={styles.skill} key={item.label}><div className={styles.skillLine}><span>{item.label}</span><strong>{item.value}/{item.max}</strong></div><div className={styles.progressTrack} role="progressbar" aria-label={item.label} aria-valuemin={0} aria-valuemax={item.max} aria-valuenow={item.value}><div className={styles.progressFill} style={{ width: `${item.value / item.max * 100}%` }} /></div></div>)}</article>
      <article className={`${styles.card} ${styles.scoreCard}`}><p className={styles.micro}>Ритм сезона</p><h2 className={styles.heading}>Неделя {config.week} из {config.totalWeeks}</h2><p className={styles.subhead}>В зачёт идут регулярность, учебный прогресс, миссии и работа с командой. Демо-конфигурация сезона — 6 недель; длительность будет задаваться на сервере.</p></article>
    </div>
  </>;
}

function LiveArena() {
  const [taskOpen, setTaskOpen] = useState(false);
  return <section className={styles.liveArena} aria-label="Live Arena">
    <div className={styles.arenaHead}><div><span className={styles.live}><span className={styles.dot} />Live Arena</span><h2 className={styles.arenaTitle}>Командный спринт</h2><p style={{ marginTop: 12 }}>IELTS · Reading Relay · раунд 2 из 3</p></div><div><p className={styles.micro}>Осталось</p><p className={styles.timer}>12:48</p></div></div>
    <div className={styles.arenaGrid}>
      <article className={styles.darkCard}><p className={styles.micro}>Текущая задача</p><h3 style={{ marginTop: 10, fontFamily: 'var(--font-display)', fontSize: '1.35rem', fontWeight: 700 }}>Соберите доказательства для двух выводов</h3><p style={{ marginTop: 10 }}>У каждого участника своя часть текста. Итоговый ответ отправляет капитан.</p><div className={styles.progressTrack} role="progressbar" aria-label="Прогресс раунда" aria-valuemin={0} aria-valuemax={4} aria-valuenow={3}><div className={styles.progressFill} style={{ width: '75%' }} /></div><button type="button" className={styles.arenaButton} aria-expanded={taskOpen} aria-controls="arena-task" onClick={() => setTaskOpen((open) => !open)}>{taskOpen ? 'Скрыть задание' : 'Открыть задание'}</button>{taskOpen ? <div id="arena-task" className={styles.darkCard} style={{ marginTop: 16 }}><p><strong>Фрагмент B.</strong> Найди две цитаты, которые подтверждают вывод команды, и передай номера строк капитану.</p></div> : null}</article>
      <article className={styles.darkCard}><p className={styles.micro}>Сейчас в группе</p><p className={styles.bigValue}>2 место</p><p>Qadam · 86 баллов</p><p style={{ marginTop: 18, color: 'var(--on-dark)' }}>До первого места: 4 балла</p></article>
    </div>
    <p className={styles.disclaimer} style={{ color: 'var(--on-dark)' }}>Демо Live Arena: таймер и баллы — fixture, не результаты реального матча.</p>
  </section>;
}

function Journey() {
  return <section className={styles.journeyHero} aria-label="Отчёт Journey">
    <p className={styles.micro}>Превью после сезона</p><h2 className={styles.heading}>Твой Season Journey</h2><p className={styles.subhead}>Личный отчёт собирает рост, регулярность и вклад в команду — без публичного раскрытия настоящего имени.</p>
    <div className={styles.journeyStats}><div className={styles.journeyStat}><strong>+18%</strong><span>рост навыков</span></div><div className={styles.journeyStat}><strong>91%</strong><span>посещаемость</span></div><div className={styles.journeyStat}><strong>14</strong><span>миссий закрыто</span></div><div className={styles.journeyStat}><strong>5/6</strong><span>Match Days</span></div></div>
    <article className={`${styles.card} ${styles.summaryCard}`} style={{ marginTop: 18 }}><p className={styles.micro}>Сильный момент</p><h3 style={{ marginTop: 10, fontFamily: 'var(--font-display)', fontSize: '1.35rem', fontWeight: 700 }}>Ты стал увереннее в Reading и помог команде на трёх ключевых раундах.</h3><p className={styles.disclaimer}>Это demo-preview. Учебная динамика и предварительная диагностика не равны официальному баллу IELTS или SAT.</p></article>
  </section>;
}

/** Демо-превью Season HQ для гостей и организатора; ученик-участник видит SeasonHome → MyHQ. */
export default function SeasonHQ({ notice }: { notice?: React.ReactNode }) {
  const [view, setView] = useState<SeasonView>('overview');
  const [tab, setTab] = useState<Tab>('overview');
  const participant = ACTIVE_SEASON_FIXTURE.participant;
  return <main className={styles.page}>
    <p className={styles.demoBar}>Интерактивный прототип · demo data · авторизация и серверные баллы ещё не подключены</p>
    {notice}
    <div className={styles.shell}>
      <header className={styles.hqTop}><div><p className={styles.micro}>Season HQ · {participant.alias}</p><h1 className={styles.hqTitle}>Привет, {participant.alias}.</h1><p className={styles.subhead}>{participant.team} · IELTS · активный сезон</p></div><div className={styles.statePicker} aria-label="Состояние прототипа">{([['overview','Активный сезон'],['live','Live Arena'],['journey','После сезона']] as const).map(([key,label]) => <button className={styles.tab} type="button" aria-pressed={view === key} onClick={() => setView(key)} key={key}>{label}</button>)}</div></header>
      <div className={styles.tabs} role="tablist" aria-label="Разделы Season HQ">{([['overview','Обзор'],['matches','Match Days'],['leaderboard','Рейтинг'],['rules','Правила']] as const).map(([key,label]) => <button className={styles.tab} role="tab" aria-selected={tab === key} onClick={() => setTab(key)} key={key}>{label}</button>)}</div>
      <div className={styles.dashboard} role="tabpanel">
        {view === 'live' ? <LiveArena /> : view === 'journey' ? <Journey /> : tab === 'overview' ? <Overview /> : <article className={`${styles.card} ${styles.summaryCard}`}><p className={styles.micro}>{tab === 'matches' ? 'Календарь' : tab === 'leaderboard' ? 'Моя позиция' : 'Fair play'}</p><h2 className={styles.heading}>{tab === 'matches' ? 'Ближайшие Match Days' : tab === 'leaderboard' ? 'Рейтинг IELTS' : 'Понятные правила для всех'}</h2><p className={styles.subhead}>{tab === 'matches' ? 'Квалификации проходят онлайн, финал — офлайн в Астане.' : tab === 'leaderboard' ? `Команда ${participant.team} — #${participant.teamRank}. ${participant.alias} — #${participant.personalRank}.` : 'Баллы фиксируются по категориям. Спорный результат уходит на проверку до блокировки таблицы.'}</p></article>}
      </div>
    </div>
  </main>;
}
