// Самопроверка ИИ-ведения Threads (THREADS-BOT-001): npx tsx scripts/threads-check.ts
import assert from 'node:assert/strict';
import {
  buildPrompt,
  handleThreadsUpdate,
  isThreadsUpdate,
  matchTriggers,
  parseReply,
  repliesToAnswer,
  runThreads,
  type Candidate,
  type Draft,
  type DraftStatus,
  type ThreadsIo,
  type ThreadsPost,
} from '../src/lib/threads-bot';

const now = Date.parse('2026-09-16T10:00:00Z');
const at = (hoursAgo: number) => new Date(now - hoursAgo * 3_600_000).toISOString();

// ответы под постом: только адресованные мне, свежие и без моего ответа
const post: ThreadsPost = { id: 'p1', text: 'Как готовиться к IELTS?', timestamp: at(30), isMine: true };
const conversation: ThreadsPost[] = [
  { id: 'c1', text: 'А сколько стоит курс?', username: 'aru', timestamp: at(2), repliedTo: 'p1' },
  { id: 'c2', text: 'Спасибо!', username: 'dana', timestamp: at(3), repliedTo: 'p1' },
  { id: 'm1', text: 'Пожалуйста!', username: 'ashyqedu', timestamp: at(2), repliedTo: 'c2', isMine: true },
  { id: 'c3', text: 'А на SAT есть?', username: 'aru', timestamp: at(1), repliedTo: 'm1' },
  { id: 'c4', text: '@aru согласен', username: 'bek', timestamp: at(1), repliedTo: 'c1' },
  { id: 'c5', text: 'старый', username: 'old', timestamp: at(72), repliedTo: 'p1' },
];
const picked = repliesToAnswer(post, conversation, now - 48 * 3_600_000);
assert.deepEqual(picked.map((item) => item.targetId), ['c1', 'c3'], 'c2 уже отвечен, c4 — не мне, c5 — старый');
assert.match(picked[1].context ?? '', /Мой ответ, на который пишут: Пожалуйста!/, 'контекст вложенного ответа');

assert.equal(matchTriggers('СКОЛЬКО СТОИТ?').length, 1, 'триггер без учёта регистра');
assert.equal(matchTriggers('привет').length, 0, 'без триггера');
assert.equal(parseReply('  SKIP '), null, 'SKIP — пропуск');
assert.equal(parseReply('«Привет!»'), 'Привет!', 'кавычки снимаются');

const prompt = buildPrompt({ targetId: 'c1', kind: 'reply', author: 'aru', targetText: 'Сколько стоит?' }, [
  { id: '1', targetId: 'x', kind: 'reply', author: 'a', targetText: 'q1', status: 'published', draft: 'черновик', finalText: 'исправлено', decidedBy: 'Дана' },
  { id: '2', targetId: 'y', kind: 'search', author: 'b', targetText: 'q2', status: 'rejected', draft: 'плохо', decidedBy: 'Дана' },
]);
assert.match(prompt.system, /было «черновик» → стало «исправлено»/, 'правка человека — пример');
assert.match(prompt.system, /так НЕ отвечать/, 'отказ — антипример');
assert.match(prompt.user, /Сработали триггеры/, 'инструкция триггера в запросе');
assert.match(prompt.user, /<post author="@aru">/, 'чужой текст обёрнут как данные');

// фейковые Threads, база, ИИ и Telegram
function fakeIo(options: { search?: ThreadsPost[]; aiText?: (user: string) => string; failSearch?: boolean; searchToday?: number } = {}) {
  const drafts = new Map<string, Draft>();
  const published: Array<{ to: string; text: string }> = [];
  const telegram: Array<{ method: string; body: Record<string, unknown> }> = [];
  let seq = 0;
  const io: ThreadsIo = {
    myUsername: 'ashyqedu',
    myPosts: async () => [post],
    conversation: async () => conversation,
    mentions: async () => [{ id: 'men1', text: '@ashyqedu посоветуйте курс', username: 'zhan', timestamp: at(1) }],
    search: async () => {
      if (options.failSearch) throw new Error('нет разрешения threads_keyword_search');
      return options.search ?? [];
    },
    reply: async (to, text) => {
      published.push({ to, text });
      return `r${published.length}`;
    },
    knownTargets: async (ids) => new Set(ids.filter((id) => [...drafts.values()].some((draft) => draft.targetId === id))),
    claim: async (candidate: Candidate) => {
      if ([...drafts.values()].some((draft) => draft.targetId === candidate.targetId)) return null;
      const draft: Draft = { ...candidate, id: `d${++seq}`, status: 'writing' };
      drafts.set(draft.id, draft);
      return { ...draft };
    },
    save: async (draft) => void drafts.set(draft.id, { ...draft }),
    transition: async (id, from: DraftStatus, to: DraftStatus) => {
      const draft = drafts.get(id);
      if (draft?.status !== from) return false;
      draft.status = to;
      return true;
    },
    find: async (by) => [...drafts.values()].find((draft) => ('id' in by ? draft.id === by.id : draft.tgMessageId === by.tgMessageId)) ?? null,
    examples: async () => [],
    searchCommentsSince: async () => options.searchToday ?? 0,
    write: async ({ user }) => (options.aiText ? options.aiText(user) : 'Напишите нам в Telegram @ashyqeducation'),
    telegram: async (method, body) => {
      telegram.push({ method, body });
      return { message_id: 100 + telegram.length };
    },
    isManager: async (userId) => userId === 7,
  };
  return { io, drafts, published, telegram };
}

(async () => {
  // режим одобрения: черновики в Telegram, в Threads ничего не уходит
  const approve = fakeIo({
    search: [
      { id: 's1', text: 'Сдаю IELTS через месяц, страшно', username: 'ali', timestamp: at(1) },
      { id: 's2', text: 'мой же пост про IELTS', username: 'AshyqEdu', timestamp: at(1) },
      { id: 's3', text: 'купи крипту', username: 'spam', timestamp: at(1) },
    ],
    aiText: (user) => (user.includes('крипту') ? 'SKIP' : 'Черновик ответа'),
    failSearch: false,
  });
  const run = await runThreads(approve.io, { autopublish: false, chatId: '-100', queries: ['IELTS'] }, now);
  assert.equal(approve.published.length, 0, 'без одобрения ничего не публикуется');
  assert.equal(run.drafts, 4, 'c1, c3, упоминание, s1');
  assert.deepEqual([...approve.drafts.values()].map((draft) => draft.status).sort(), ['pending', 'pending', 'pending', 'pending', 'skipped']);
  assert.equal([...approve.drafts.values()].some((draft) => draft.targetId === 's2'), false, 'свой пост из поиска не трогаем');
  const card = approve.telegram[0];
  assert.equal(card.method, 'sendMessage');
  assert.equal((card.body.reply_markup as { inline_keyboard: unknown[][] }).inline_keyboard[0].length, 2, 'кнопки Опубликовать/Отклонить');

  const again = await runThreads(approve.io, { autopublish: false, chatId: '-100', queries: ['IELTS'] }, now);
  assert.equal(again.written, 0, 'повторный запуск не пишет на то же самое');

  // кнопка: не участник — отказ; участник — публикация; повтор — «уже обработано»
  const first = [...approve.drafts.values()].find((draft) => draft.targetId === 'c1')!;
  const press = (userId: number, data: string) =>
    handleThreadsUpdate({ callback_query: { id: 'q', from: { id: userId, first_name: 'Дана' }, data, message: { message_id: first.tgMessageId!, chat: { id: -100 } } } }, approve.io);
  assert.equal(isThreadsUpdate({ callback_query: { id: 'q', from: { id: 7 }, data: `th:ok:${first.id}` } }), true);
  assert.equal(isThreadsUpdate({ callback_query: { id: 'q', from: { id: 7 }, data: 'a:run1' } }), false, 'кнопки CRM не перехватываем');
  await press(99, `th:ok:${first.id}`);
  assert.equal(approve.published.length, 0, 'не участник группы не публикует');
  await press(7, `th:ok:${first.id}`);
  assert.deepEqual(approve.published, [{ to: 'c1', text: 'Черновик ответа' }]);
  assert.equal(approve.drafts.get(first.id)?.status, 'published');
  assert.equal(approve.drafts.get(first.id)?.decidedBy, 'Дана');
  const edit = approve.telegram.find((call) => call.method === 'editMessageText');
  assert.match(String(edit?.body.text), /✅ Опубликовано — Дана/);
  assert.equal(edit?.body.reply_markup, undefined, 'кнопки убраны');
  await press(7, `th:ok:${first.id}`);
  assert.equal(approve.published.length, 1, 'двойное нажатие не публикует дважды');

  // отклонение
  const second = [...approve.drafts.values()].find((draft) => draft.targetId === 'c3')!;
  await press(7, `th:no:${second.id}`);
  assert.equal(approve.drafts.get(second.id)?.status, 'rejected');

  // правка: ответ на карточку своим текстом публикует его
  const third = [...approve.drafts.values()].find((draft) => draft.targetId === 'men1')!;
  const handled = await handleThreadsUpdate({
    message: { message_id: 500, chat: { id: -100 }, from: { id: 7, first_name: 'Дана' }, text: 'Мой вариант ответа', reply_to_message: { message_id: third.tgMessageId! } },
  }, approve.io);
  assert.equal(handled, true);
  assert.deepEqual(approve.published.at(-1), { to: 'men1', text: 'Мой вариант ответа' });
  assert.equal(approve.drafts.get(third.id)?.finalText, 'Мой вариант ответа');
  assert.equal(approve.drafts.get(third.id)?.draft, 'Черновик ответа', 'черновик сохраняется для обучения');
  assert.equal(await handleThreadsUpdate({ message: { message_id: 501, chat: { id: -100 }, from: { id: 7 }, text: 'ок', reply_to_message: { message_id: 1 } } }, approve.io), false, 'ответ на обычное сообщение — не наш');

  // автопубликация, упавший поиск не мешает остальному, лимит поиска в сутки
  const auto = fakeIo({ failSearch: true });
  const autoRun = await runThreads(auto.io, { autopublish: true, chatId: '-100', queries: ['IELTS'] }, now);
  assert.equal(autoRun.published, 3, 'c1, c3, упоминание — сразу в Threads');
  assert.equal(autoRun.errors.length, 1, 'ошибка поиска записана');
  assert.equal(auto.telegram.every((call) => !call.body.reply_markup), true, 'в Telegram — только уведомления без кнопок');

  const capped = fakeIo({ search: [{ id: 's9', text: 'IELTS вопрос', username: 'x', timestamp: at(1) }], searchToday: 10 });
  await runThreads(capped.io, { autopublish: true, queries: ['IELTS'], searchPerDay: 10 }, now);
  assert.equal(capped.published.some((item) => item.to === 's9'), false, 'дневной лимит комментариев по поиску');

  const limited = fakeIo();
  const limitedRun = await runThreads(limited.io, { autopublish: false, chatId: '-100', maxPerRun: 1, queries: [] }, now);
  assert.equal(limitedRun.written, 1, 'не больше maxPerRun вызовов ИИ за запуск');

  const long = fakeIo({ aiText: () => 'а'.repeat(501) });
  await runThreads(long.io, { autopublish: true, queries: [] }, now);
  assert.equal(long.published.length, 0, 'длиннее 500 символов Threads не примет');
  assert.equal([...long.drafts.values()][0].status, 'failed');

  console.log('threads-check: OK');
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
