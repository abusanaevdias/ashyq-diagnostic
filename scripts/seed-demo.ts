import assert from 'node:assert/strict';
import { buildDemoSeed } from '../src/lib/lms/seed';

/**
 * Демо-сид LMS (ТЗ §4). В браузере его применяет кнопка «Заполнить
 * демо-данными» на /login; здесь проверяем состав и печатаем сводку.
 * Запуск: npx tsx scripts/seed-demo.ts
 */

const now = new Date('2026-09-20T12:00:00.000Z');
const seed = buildDemoSeed(now);
const role = (r: string) => seed.accounts.filter((a) => a.user.role === r).map((a) => a.user.name);

assert.deepEqual(role('teacher'), ['Айгерим К.']);
assert.deepEqual(role('student'), ['Dias', 'Mepyat']);
assert.deepEqual(role('author'), ['Санжар']);
assert.equal(seed.classes[0].title, 'IELTS Intermediate · Осень');
assert.equal(seed.lessons.length, 2);
assert(seed.lessons.every((l) => l.materials.some((m) => m.kind === 'link') && l.materials.some((m) => m.kind === 'text')), 'у каждого урока ссылка + текст');
assert.equal(seed.assignments.length, 2);
assert.equal(seed.assignments.filter((a) => Date.parse(a.dueAt) < now.getTime()).length, 1, 'ровно одно задание просрочено');

const name = (id: string) => seed.accounts.find((a) => a.user.id === id)?.user.name;
const graded = seed.submissions.find((s) => name(s.studentId) === 'Dias');
assert.equal(graded?.status, 'graded');
assert.equal(graded?.grade, 8);
assert.equal(seed.assignments.find((a) => a.id === graded?.assignmentId)?.maxPoints, 10);
assert.equal(seed.comments.filter((c) => c.submissionId === graded?.id).length, 2);
assert.equal(seed.submissions.find((s) => name(s.studentId) === 'Mepyat')?.status, 'submitted');
assert.equal(seed.posts.filter((p) => p.status === 'published').length, 2);
assert.equal(seed.posts.filter((p) => p.status === 'draft').length, 1);

console.log('PASS demo seed:', JSON.stringify({
  accounts: seed.accounts.map((a) => `${a.user.name} (${a.user.role}) ${a.user.email}`),
  class: seed.classes[0].title,
  lessons: seed.lessons.length,
  assignments: seed.assignments.length,
  submissions: seed.submissions.map((s) => `${name(s.studentId)}: ${s.status}${s.grade != null ? ` ${s.grade}` : ''}`),
  posts: seed.posts.map((p) => `${p.status}: ${p.title}`),
}, null, 1));
