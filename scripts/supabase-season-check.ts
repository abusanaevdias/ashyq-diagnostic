// Интеграционная проверка SupabaseSeasonRepo против локального Supabase (SUPABASE-SEASON-001).
// Нужен стек `npx supabase@2.117.0 start`; ключи — из `supabase status -o env`:
//   SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY.
import assert from 'node:assert/strict';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { createSupabaseSeasonRepo } from '../src/lib/season/supabase-repo';

const URL = process.env.SUPABASE_URL ?? 'http://127.0.0.1:54321';
const ANON = process.env.SUPABASE_ANON_KEY ?? '';
const SERVICE = process.env.SUPABASE_SERVICE_ROLE_KEY ?? '';
if (!ANON || !SERVICE) throw new Error('Нужны SUPABASE_ANON_KEY и SUPABASE_SERVICE_ROLE_KEY из `npx supabase@2.117.0 status -o env`');

const run = Date.now();
const admin = createClient(URL, SERVICE, { auth: { persistSession: false } });
const created: string[] = [];
const DAY = 86_400_000;

async function account(tag: string, role: 'student' | 'teacher'): Promise<{ id: string; email: string; client: SupabaseClient }> {
  const email = `season-check-${tag}-${run}@example.test`;
  const made = await admin.auth.admin.createUser({ email, password: 'password-123', email_confirm: true, user_metadata: { name: tag } });
  if (made.error || !made.data.user) throw made.error ?? new Error('createUser failed');
  created.push(made.data.user.id);
  if (role === 'teacher') {
    const { error } = await admin.from('profiles').update({ role }).eq('id', made.data.user.id);
    if (error) throw error;
  }
  const client = createClient(URL, ANON, { auth: { persistSession: false } });
  const signed = await client.auth.signInWithPassword({ email, password: 'password-123' });
  if (signed.error) throw signed.error;
  return { id: made.data.user.id, email, client };
}

(async () => {
  let seasonId = '';
  try {
    const org = await account('org', 'teacher');
    const captain = await account('captain', 'student');
    const member = await account('member', 'student');
    const o = createSupabaseSeasonRepo(() => org.client);
    const c = createSupabaseSeasonRepo(() => captain.client);
    const m = createSupabaseSeasonRepo(() => member.client);
    const anon = createSupabaseSeasonRepo(() => createClient(URL, ANON, { auth: { persistSession: false } }));

    // 1. Организатор: сезон, участники (двое по email аккаунтов), ученик сезон создать не может
    const season = await o.createSeason({ name: `Season Check ${run}`, divisions: ['ielts'], startsAt: new Date(run - 8 * DAY).toISOString(), endsAt: new Date(run + 20 * DAY).toISOString(), createdBy: org.id });
    seasonId = season.id;
    await assert.rejects(c.createSeason({ name: 'Мой сезон', divisions: ['sat'], startsAt: new Date(run).toISOString(), endsAt: new Date(run + DAY).toISOString(), createdBy: captain.id }), /прав|организатор/i);
    const p1 = await o.addParticipant({ seasonId, division: 'ielts', alias: 'Qadam-1', name: 'Капитан Приватный', email: captain.email });
    const p2 = await o.addParticipant({ seasonId, division: 'ielts', alias: 'Qadam-2', name: 'Участник Приватный', email: member.email });
    const rest = [];
    for (const n of [3, 4, 5]) rest.push(await o.addParticipant({ seasonId, division: 'ielts', alias: `Qadam-${n}`, name: `Без аккаунта ${n}` }));
    await assert.rejects(o.addParticipant({ seasonId, division: 'ielts', alias: 'Qadam-1', name: 'Дубль' }), /псевдоним уже занят/);
    await assert.rejects(o.addParticipant({ seasonId, division: 'ielts', alias: 'Ghost', name: 'Ghost', email: `nobody-${run}@example.test` }), /Аккаунта с таким email нет/);

    // 2. Команда: ровно пять, капитан из состава
    const five = [p1.id, p2.id, ...rest.map((p) => p.id)];
    await assert.rejects(o.createTeam({ seasonId, division: 'ielts', name: 'Short', city: '', memberIds: five.slice(0, 4), captainId: p1.id }), /ровно 5/);
    const team = await o.createTeam({ seasonId, division: 'ielts', name: 'Qadam', city: 'Астана', memberIds: five, captainId: p1.id });

    // 3. Match Day идёт сейчас: капитан отвечает, участник — нет; баллы через проверку
    const match = await o.createMatchDay({ seasonId, title: 'Квалификация', startsAt: new Date(run - 10 * 60_000).toISOString(), durationMin: 120, venue: 'online', place: 'Онлайн', task: { title: 'Speaking Battle', brief: 'Аргументы за и против' } });
    await assert.rejects(m.submitMatch({ matchDayId: match.id, teamId: team.id, participantId: p2.id, answer: 'Не капитан' }), /капитан|прав/i);
    const answer = await c.submitMatch({ matchDayId: match.id, teamId: team.id, participantId: p1.id, answer: 'План выступления' });
    const again = await c.submitMatch({ matchDayId: match.id, teamId: team.id, participantId: p1.id, answer: 'План выступления v2' });
    assert.equal(again.id, answer.id, 'повторный ответ правит ту же запись');
    await assert.rejects(c.reviewMatch({ submissionId: answer.id, points: 30, reviewedBy: captain.id }), /организатор/);
    const reviewed = await o.reviewMatch({ submissionId: answer.id, points: 12, reviewedBy: org.id });
    assert.equal(reviewed.review?.points, 12);
    await assert.rejects(c.submitMatch({ matchDayId: match.id, teamId: team.id, participantId: p1.id, answer: 'После проверки' }), /уже проверен/);

    // 4. Баллы вручную с недельным лимитом
    await o.awardPoints({ seasonId, participantId: p1.id, category: 'progress', points: 20, reason: 'Пробный тест', awardedBy: org.id });
    await assert.rejects(o.awardPoints({ seasonId, participantId: p1.id, category: 'progress', points: 6, reason: 'Сверх лимита', awardedBy: org.id }), /осталось 5 из 25/);

    // 5. Снимки по ролям
    const orgView = await o.load();
    assert.equal(orgView.points.filter((p) => p.seasonId === seasonId && p.category === 'team').length, 5, 'баллы «Команда» всем пятерым');
    assert.ok(orgView.participants.some((p) => p.name === 'Капитан Приватный'), 'организатор видит приватные имена');
    const mine = await m.load();
    assert.equal(mine.participants.find((p) => p.id === p2.id)?.userId, member.id, 'ученик узнаёт себя по userId');
    assert.ok(!mine.participants.some((p) => p.name.includes('Приватный')), 'ученик не видит чужих имён');
    assert.equal(mine.submissions.filter((s) => s.teamId === team.id).length, 1, 'ученик видит ответ своей команды');
    const guest = await anon.load();
    assert.ok(guest.seasons.some((s) => s.id === seasonId), 'аноним видит сезон');
    assert.equal(guest.submissions.length, 0, 'аноним не видит ответов');
    assert.ok(!guest.participants.some((p) => p.name.includes('Приватный') || p.userId), 'аноним видит только псевдонимы');
    assert.ok(guest.points.filter((p) => p.seasonId === seasonId).every((p) => p.reason === ''), 'аноним не видит поводов начисления');
    assert.equal(guest.matchDays.find((d) => d.id === match.id)?.task.brief, '', 'аноним не видит бриф задания');
    await assert.rejects(o.resetDemo(), /только в демо-режиме/);

    console.log('PASS supabase season: organizer season/participants(email link)/team of 5/match day, captain-only answers, review→team points, weekly cap, role-redacted snapshots');
  } finally {
    if (seasonId) await admin.from('seasons').delete().eq('id', seasonId);
    for (const id of created) await admin.auth.admin.deleteUser(id);
  }
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
