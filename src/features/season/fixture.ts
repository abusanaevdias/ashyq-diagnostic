import type { SeasonFixture } from './types';

export const ACTIVE_SEASON_FIXTURE: SeasonFixture = {
  config: {
    id: 'season-03-demo',
    name: 'Season 03',
    status: 'active',
    week: 3,
    totalWeeks: 6,
    timezone: 'Asia/Almaty',
    leaderboardUpdatedAt: '13 сентября, 18:40',
  },
  events: [
    { id: 'opening', phase: 'opening', venue: 'online', title: 'Открытие сезона', date: '30 августа', place: 'Онлайн', status: 'done' },
    { id: 'qualifier-1', phase: 'qualifier', venue: 'online', title: 'Match Day · квалификация', date: '13 сентября', place: 'Онлайн', status: 'live' },
    { id: 'qualifier-2', phase: 'qualifier', venue: 'online', title: 'Match Day · решающий раунд', date: '27 сентября', place: 'Онлайн', status: 'upcoming' },
    { id: 'final', phase: 'final', venue: 'offline', title: 'Championship Final', date: '11 октября', place: 'Астана · офлайн', status: 'upcoming' },
  ],
  teams: [
    { id: 't1', division: 'ielts', rank: 1, name: 'Qadam', city: 'Алматы', points: 482, trend: 1 },
    { id: 't2', division: 'ielts', rank: 2, name: 'Samgau', city: 'Астана', points: 469, trend: -1 },
    { id: 't3', division: 'ielts', rank: 3, name: 'Orken', city: 'Шымкент', points: 451, trend: 2 },
    { id: 't4', division: 'ielts', rank: 4, name: 'Dala', city: 'Караганда', points: 438, trend: 0 },
    { id: 't5', division: 'sat', rank: 1, name: 'Vector', city: 'Астана', points: 497, trend: 0 },
    { id: 't6', division: 'sat', rank: 2, name: 'Sigma', city: 'Алматы', points: 476, trend: 1 },
    { id: 't7', division: 'sat', rank: 3, name: 'Alatau', city: 'Тараз', points: 458, trend: -1 },
    { id: 't8', division: 'sat', rank: 4, name: 'Barys', city: 'Актобе', points: 441, trend: 1 },
  ],
  individuals: [
    { id: 'p1', division: 'ielts', rank: 1, alias: 'Qyran · A7', team: 'Qadam', points: 96, trend: 1 },
    { id: 'p2', division: 'ielts', rank: 2, alias: 'Tulpar · D4', team: 'Samgau', points: 93, trend: 0 },
    { id: 'p3', division: 'ielts', rank: 3, alias: 'Samal · M8', team: 'Orken', points: 91, trend: 2 },
    { id: 'p4', division: 'ielts', rank: 4, alias: 'Nomad · A2', team: 'Dala', points: 87, trend: -1 },
    { id: 'p5', division: 'sat', rank: 1, alias: 'Barys · S5', team: 'Vector', points: 98, trend: 0 },
    { id: 'p6', division: 'sat', rank: 2, alias: 'Ornek · A9', team: 'Sigma', points: 94, trend: 1 },
    { id: 'p7', division: 'sat', rank: 3, alias: 'Daryn · T3', team: 'Alatau', points: 90, trend: -1 },
    { id: 'p8', division: 'sat', rank: 4, alias: 'Qanat · D6', team: 'Barys', points: 86, trend: 1 },
  ],
  participant: {
    alias: 'Qyran · A7', division: 'ielts', team: 'Qadam', teamRank: 1, personalRank: 1,
    weeklyPoints: 72, weeklyGoal: 100,
    score: [
      { label: 'Прогресс', value: 21, max: 25 },
      { label: 'Миссии', value: 16, max: 20 },
      { label: 'Speaking', value: 12, max: 15 },
      { label: 'Посещение', value: 9, max: 10 },
      { label: 'Команда', value: 14, max: 20 },
    ],
  },
};
