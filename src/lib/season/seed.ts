import { DEMO_EMAILS } from '@/lib/lms/seed';
import { CATEGORIES, TEAM_SIZE, WEEKLY_CAPS, type Division, type MatchDay, type PointEntry, type SeasonData, type SeasonParticipant, type Team } from './types';

/**
 * Демо-сезон: 2 дивизиона × 4 команды × 5 участников, идущий Match Day и
 * баллы за прошедшие недели. Всё демонстрационное. Id стабильные — сид можно
 * собирать при каждом чтении, пока на устройстве нет своих данных сезона.
 * Dias и Mepyat из демо-LMS — в команде Qadam (Dias — капитан), связь по email.
 */

export const DEMO_SEASON_ID = 'season-03';
export const DEMO_ORGANIZER = 'demo-organizer';

const DAY = 86_400_000;
const TEAMS: Record<Division, Array<[string, string]>> = {
  ielts: [['Qadam', 'Алматы'], ['Samgau', 'Астана'], ['Orken', 'Шымкент'], ['Dala', 'Караганда']],
  sat: [['Vector', 'Астана'], ['Sigma', 'Алматы'], ['Alatau', 'Тараз'], ['Barys', 'Актобе']],
};
const NICKS = ['Qyran', 'Tulpar', 'Samal', 'Nomad', 'Barys', 'Ornek', 'Daryn', 'Qanat', 'Aray', 'Zhuldyz'];
const REAL: Array<{ name: string; email: string }> = [
  { name: 'Dias', email: DEMO_EMAILS.student },
  { name: 'Mepyat', email: DEMO_EMAILS.student2 },
];

/** Детерминированный PRNG (mulberry32): одинаковые баллы при каждой сборке сида. */
function random(seed: number) {
  let t = seed;
  return () => {
    t = (t + 0x6d2b79f5) | 0;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r = (r + Math.imul(r ^ (r >>> 7), 61 | r)) ^ r;
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

export function buildSeasonSeed(now = Date.now()): SeasonData {
  const dayStart = new Date(now);
  dayStart.setHours(0, 0, 0, 0);
  const start = dayStart.getTime() - 15 * DAY; // сейчас идёт 3-я неделя из 6
  const end = start + 42 * DAY;
  const iso = (t: number) => new Date(t).toISOString();
  const at19 = (t: number) => {
    const d = new Date(t);
    d.setHours(19, 0, 0, 0);
    return d.getTime();
  };
  const seasonId = DEMO_SEASON_ID;

  const participants: SeasonParticipant[] = [];
  const teams: Team[] = [];
  let n = 0;
  for (const division of ['ielts', 'sat'] as const) {
    TEAMS[division].forEach(([name, city], teamIndex) => {
      const memberIds: string[] = [];
      for (let m = 0; m < TEAM_SIZE; m += 1) {
        n += 1;
        const id = `sp-${String(n).padStart(2, '0')}`;
        const real = division === 'ielts' && teamIndex === 0 ? REAL[m] : undefined;
        participants.push({
          id,
          seasonId,
          division,
          // (n mod 10, n mod 26) уникальны до 130 участников
          alias: `${NICKS[n % NICKS.length]} · ${String.fromCharCode(65 + (n % 26))}${n % 10}`,
          name: real?.name ?? `Демо-участник ${String(n).padStart(2, '0')}`,
          ...(real ? { email: real.email } : {}),
        });
        memberIds.push(id);
      }
      teams.push({ id: `team-${name.toLowerCase()}`, seasonId, division, name, city, memberIds, captainId: memberIds[0] });
    });
  }

  const currentWeek = Math.floor((now - start) / (7 * DAY)) + 1;
  const rand = random(3);
  const points: PointEntry[] = [];
  for (const p of participants) {
    const talent = 0.55 + rand() * 0.4;
    for (let week = 1; week <= currentWeek; week += 1) {
      const share = week < currentWeek ? 1 : 0.45; // текущая неделя ещё идёт
      for (const category of CATEGORIES) {
        const value = Math.round(WEEKLY_CAPS[category] * share * Math.min(1, talent + (rand() - 0.5) * 0.3));
        if (value <= 0) continue;
        points.push({
          id: `pt-${p.id}-${week}-${category}`,
          seasonId,
          participantId: p.id,
          category,
          points: value,
          week,
          reason: 'Демо: баллы за неделю',
          awardedBy: DEMO_ORGANIZER,
          createdAt: iso(Math.min(now - 3_600_000, start + ((week - 1) * 7 + 5) * DAY)),
        });
      }
    }
  }

  const matchDays: MatchDay[] = [
    {
      id: 'md-opening', seasonId, title: 'Открытие сезона', startsAt: iso(at19(start)), durationMin: 90, venue: 'online', place: 'Онлайн',
      task: { title: 'Знакомство команд', brief: 'Команды выбирают капитана и ставят цель на сезон.' },
    },
    {
      id: 'md-qualifier-1', seasonId, title: 'Match Day · квалификация', startsAt: iso(now - 20 * 60_000), durationMin: 180, venue: 'online', place: 'Онлайн',
      task: {
        title: 'Командный спринт · Reading Relay',
        brief: 'У каждого участника своя часть текста. Найдите две цитаты, которые подтверждают вывод команды, и укажите номера строк. Итоговый ответ отправляет капитан.',
      },
    },
    {
      id: 'md-qualifier-2', seasonId, title: 'Match Day · решающий раунд', startsAt: iso(at19(now + 13 * DAY)), durationMin: 90, venue: 'online', place: 'Онлайн',
      task: { title: 'Speaking Battle', brief: 'Команда готовит аргументы за и против; капитан отправляет план выступления.' },
    },
    {
      id: 'md-final', seasonId, title: 'Championship Final', startsAt: iso(at19(end - DAY)), durationMin: 240, venue: 'offline', place: 'Астана · офлайн',
      task: { title: 'Финальная миссия', brief: 'Лучшие команды дивизионов встречаются офлайн в Астане.' },
    },
  ];

  return {
    seasons: [{ id: seasonId, name: 'Season 03', divisions: ['ielts', 'sat'], startsAt: iso(start), endsAt: iso(end), createdBy: DEMO_ORGANIZER, createdAt: iso(start - 14 * DAY) }],
    participants,
    teams,
    matchDays,
    submissions: [],
    points,
  };
}
