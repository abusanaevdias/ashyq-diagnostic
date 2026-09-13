import assert from 'node:assert/strict';
import { can, canSubmitMatch } from '../src/lib/lms/permissions';
import { DEMO_EMAILS } from '../src/lib/lms/seed';
import { getSeasonRepo } from '../src/lib/season/repo';
import {
  currentSeason,
  individualStandings,
  matchStatus,
  participantFor,
  participantPoints,
  remainingCap,
  teamOf,
  teamStandings,
  totalWeeks,
  weekBreakdown,
  weekOf,
} from '../src/lib/season/scoring';
import { buildSeasonSeed, DEMO_SEASON_ID } from '../src/lib/season/seed';
import { TEAM_SIZE, WEEKLY_CAPS } from '../src/lib/season/types';
import type { User } from '../src/lib/lms/types';

/**
 * Правила чемпионата без браузера (SEASON-DEMO-001). В Node нет localStorage —
 * репозиторий работает в памяти вкладки.
 * Запуск: npx tsx scripts/season-unit-check.ts
 */

async function main() {
  // 1. Решения пользователя: 5 категорий = 100 в неделю, команды по 5
  assert.equal(Object.values(WEEKLY_CAPS).reduce((sum, cap) => sum + cap, 0), 100);
  assert.equal(TEAM_SIZE, 5);
  assert(can('teacher', 'season.manage') && !can('student', 'season.manage') && !can('author', 'season.manage'));
  assert(can('student', 'season.play') && !can('teacher', 'season.play') && !can('author', 'season.play'));

  // 2. Демо-сид
  const now = Date.now();
  const seed = buildSeasonSeed(now);
  const season = seed.seasons[0];
  assert.equal(season.name, 'Season 03');
  assert.equal(weekOf(season, now), 3);
  assert.equal(totalWeeks(season), 6);
  assert.equal(seed.teams.length, 8);
  assert(seed.teams.every((t) => t.memberIds.length === TEAM_SIZE && t.memberIds.includes(t.captainId)));
  assert.equal(new Set(seed.participants.map((p) => p.alias)).size, seed.participants.length, 'псевдонимы уникальны');
  assert.equal(seed.matchDays.filter((m) => matchStatus(m, now) === 'live').length, 1, 'один Match Day идёт сейчас');
  for (const p of seed.participants) {
    for (const week of [1, 2, 3]) assert(weekBreakdown(seed.points, p.id, week).every((row) => row.value <= row.max));
  }
  const dias = participantFor(seed.participants, season.id, { id: 'any', email: DEMO_EMAILS.student });
  assert(dias, 'Dias в сезоне по email');
  const qadam = teamOf(seed.teams, dias.id);
  assert.equal(qadam?.name, 'Qadam');
  assert.equal(qadam?.captainId, dias.id);
  const diasUser: User = { id: 'u-dias', name: 'Dias', email: DEMO_EMAILS.student, role: 'student', avatarColor: 'red' };
  const mepyat = participantFor(seed.participants, season.id, { id: 'x', email: DEMO_EMAILS.student2 });
  assert(canSubmitMatch(diasUser, dias, qadam) && !canSubmitMatch({ ...diasUser, role: 'teacher' }, dias, qadam));
  assert(!canSubmitMatch({ ...diasUser, email: DEMO_EMAILS.student2 }, mepyat, qadam), 'не капитан не отвечает');

  // 3. Рейтинг: сортировка, сумма пятерых, IELTS и SAT раздельно
  const teams = teamStandings(seed.teams, seed.points, 'ielts', 3);
  assert.equal(teams.length, 4);
  assert(teams.every((row, i) => i === 0 || teams[i - 1].points >= row.points));
  assert.equal(teams.find((row) => row.id === qadam!.id)?.points, qadam!.memberIds.reduce((sum, id) => sum + participantPoints(seed.points, id, 3), 0));
  const sat = individualStandings(seed.participants, seed.teams, seed.points, 'sat', 3);
  assert.equal(sat.length, 20);
  assert.equal(sat[0].rank, 1);
  assert(sat.every((row) => seed.participants.find((p) => p.id === row.id)?.division === 'sat'));

  // 4. Репозиторий: лимиты недели
  const repo = getSeasonRepo();
  const data = await repo.load();
  const active = currentSeason(data.seasons);
  assert.equal(active?.id, DEMO_SEASON_ID);
  const s = active!;
  const pid = data.participants[5].id;
  const left = remainingCap(data.points, pid, 'speaking', weekOf(s));
  if (left > 0) await repo.awardPoints({ seasonId: s.id, participantId: pid, category: 'speaking', points: left, reason: 'unit', awardedBy: 'u' });
  await assert.rejects(repo.awardPoints({ seasonId: s.id, participantId: pid, category: 'speaking', points: 1, reason: 'unit', awardedBy: 'u' }), /Лимит «Speaking»/);
  await assert.rejects(repo.awardPoints({ seasonId: s.id, participantId: pid, category: 'progress', points: 1.5, reason: 'unit', awardedBy: 'u' }), /целое/);
  await assert.rejects(
    repo.awardPoints({ seasonId: s.id, participantId: pid, category: 'progress', points: 1, reason: 'unit', awardedBy: 'u', at: Date.parse(s.startsAt) - 1000 }),
    /во время сезона/,
  );

  // 5. Команды: ровно 5, без повторов, капитан в составе
  const free: string[] = [];
  for (let i = 0; i < TEAM_SIZE; i += 1) free.push((await repo.addParticipant({ seasonId: s.id, division: 'sat', alias: `Unit ${i}`, name: `U${i}` })).id);
  await assert.rejects(repo.addParticipant({ seasonId: s.id, division: 'sat', alias: 'unit 0', name: 'dup' }), /псевдоним/);
  await assert.rejects(repo.createTeam({ seasonId: s.id, division: 'sat', name: 'Four', city: '', memberIds: free.slice(0, 4), captainId: free[0] }), /ровно 5/);
  await assert.rejects(repo.createTeam({ seasonId: s.id, division: 'sat', name: 'NoCap', city: '', memberIds: free, captainId: 'nobody' }), /Капитан/);
  const taken = data.teams.find((t) => t.division === 'sat')!.memberIds[0];
  await assert.rejects(repo.createTeam({ seasonId: s.id, division: 'sat', name: 'Taken', city: '', memberIds: [...free.slice(0, 4), taken], captainId: free[0] }), /уже в команде/);
  await assert.rejects(repo.createTeam({ seasonId: s.id, division: 'ielts', name: 'Wrong', city: '', memberIds: free, captainId: free[0] }), /другом дивизионе/);
  const team = await repo.createTeam({ seasonId: s.id, division: 'sat', name: 'Unit Team', city: 'Астана', memberIds: free, captainId: free[0] });
  assert.equal(team.memberIds.length, TEAM_SIZE);

  // 6. Match Day: отвечает капитан, пока матч идёт; проверка даёт «Команду» всем пятерым
  const live = data.matchDays.find((m) => matchStatus(m) === 'live')!;
  const upcoming = data.matchDays.find((m) => matchStatus(m) === 'upcoming')!;
  await assert.rejects(repo.submitMatch({ matchDayId: live.id, teamId: team.id, participantId: free[1], answer: 'x' }), /капитан/);
  await assert.rejects(repo.submitMatch({ matchDayId: upcoming.id, teamId: team.id, participantId: free[0], answer: 'x' }), /во время Match Day/);
  const submission = await repo.submitMatch({ matchDayId: live.id, teamId: team.id, participantId: free[0], answer: 'Строки 4 и 9' });
  await assert.rejects(repo.reviewMatch({ submissionId: submission.id, points: WEEKLY_CAPS.team + 1, reviewedBy: 'u' }), new RegExp(`от 0 до ${WEEKLY_CAPS.team}`));
  await repo.reviewMatch({ submissionId: submission.id, points: 12, reviewedBy: 'u' });
  const after = await repo.load();
  assert(free.every((id) => participantPoints(after.points, id) === 12), 'каждый из пятерых получил 12');
  await assert.rejects(repo.reviewMatch({ submissionId: submission.id, points: 5, reviewedBy: 'u' }), /уже проверен/);
  await assert.rejects(repo.submitMatch({ matchDayId: live.id, teamId: team.id, participantId: free[0], answer: 'again' }), /проверен/);

  // 7. Новый сезон с датами организатора
  await assert.rejects(repo.createSeason({ name: 'Bad', divisions: ['ielts'], startsAt: '2026-10-10', endsAt: '2026-10-01', createdBy: 'u' }), /позже/);
  const next = await repo.createSeason({ name: 'Season 04', divisions: ['sat'], startsAt: '2027-01-10T00:00:00Z', endsAt: '2027-03-07T00:00:00Z', createdBy: 'u' });
  assert.equal(totalWeeks(next), 8);
  assert.equal(currentSeason((await repo.load()).seasons)?.id, DEMO_SEASON_ID, 'витрина держит идущий сезон');

  console.log('PASS season unit: caps, teams of 5, standings, match flow, permissions, memory mode');
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
