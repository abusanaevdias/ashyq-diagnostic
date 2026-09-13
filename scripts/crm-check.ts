import assert from 'node:assert/strict';
import { buildCrmSnapshot, computeDedupeKey, isRetryDue, type CrmEvent, type DeliveryLedgerEntry } from '../src/lib/crm';
import type { StoredLead } from '../src/lib/lead-server';

const base = {
  exam: 'sat' as const,
  runId: 'run-001',
  receivedAt: '2026-09-13T10:00:00.000Z',
  ip: '127.0.0.1',
};

const leads: StoredLead[] = [
  { ...base, kind: 'result', band: '1190–1290', target: '1400', weakest: 'R&W' },
  { ...base, kind: 'contact', name: 'Aruzhan', phone: '77065554433', receivedAt: '2026-09-13T10:05:00.000Z' },
  { ...base, kind: 'whatsapp', receivedAt: '2026-09-13T10:06:00.000Z' },
  { kind: 'season', exam: 'ielts', runId: 'season-002', name: 'Dias', phone: '77061112233', receivedAt: '2026-09-13T11:00:00.000Z', ip: '127.0.0.1' },
];

const events: CrmEvent[] = [
  { id: 'event-1', runId: 'run-001', type: 'stage_change', stage: 'contacted', createdAt: '2026-09-13T10:10:00.000Z' },
  { id: 'event-2', runId: 'run-001', type: 'note', body: 'Назначен звонок', createdAt: '2026-09-13T10:11:00.000Z' },
];

const snapshot = buildCrmSnapshot(leads, events);
assert.equal(snapshot.records.length, 2, 'повторные события одного runId должны объединяться');
assert.equal(snapshot.stats.contacts, 2);
assert.equal(snapshot.stats.seasonRequests, 1);
assert.equal(snapshot.stats.byStage.contacted, 1);

const lead = snapshot.records.find((record) => record.runId === 'run-001');
assert.ok(lead);
assert.equal(lead.name, 'Aruzhan');
assert.equal(lead.band, '1190–1290');
assert.equal(lead.stage, 'contacted');
assert.equal(lead.activities[0].text, 'Назначен звонок');
assert.ok(lead.activities.some((activity) => activity.text === 'Отправил обращение с сайта'));

const seasonLead = snapshot.records.find((record) => record.runId === 'season-002');
assert.ok(seasonLead);
assert.equal(seasonLead.kind, 'season');
assert.ok(seasonLead.activities.some((activity) => activity.text === 'Оставил заявку на следующий сезон'));

// --- LEADS-DURABILITY-001: идемпотентность, outbox-ledger, политика retry ---


const keyBase = { runId: 'run-001', kind: 'contact' as const, phone: '77065554433', name: 'Aruzhan' };
const keyA = computeDedupeKey({ ...keyBase });
const keyB = computeDedupeKey({ ...keyBase });
assert.equal(keyA, keyB, 'одинаковый лид — один dedupeKey');
const keyOther = computeDedupeKey({ ...keyBase, phone: '77069998877' });
assert.notEqual(keyA, keyOther, 'другой телефон — другой dedupeKey');
// receivedAt не участвует: клиентский ретрай с новым временем не плодит дубль

const now = Date.parse('2026-09-13T12:00:00.000Z');
const retryStale: Parameters<typeof isRetryDue>[0] = {
  channel: 'telegram',
  status: 'failed',
  attempts: 1,
  updatedAt: '2026-09-13T11:50:00.000Z', // 10 минут назад — backoff 5 минут прошёл
};
assert.equal(isRetryDue(retryStale, now), true, 'неудача старше backoff — повтор нужен');
assert.equal(
  isRetryDue({ ...retryStale, updatedAt: '2026-09-13T11:58:00.000Z' }, now),
  false,
  'неудача свежее backoff — рано',
);
assert.equal(
  isRetryDue({ ...retryStale, attempts: 5 }, now),
  false,
  'лимит попыток исчерпан',
);
assert.equal(isRetryDue({ ...retryStale, status: 'sent' }, now), false, 'доставленное не ретраится');

const deliveries: DeliveryLedgerEntry[] = [
  { id: 'd1', key: keyA, runId: 'run-001', channel: 'telegram', status: 'sent', attempts: 1, updatedAt: '2026-09-13T10:12:00.000Z' },
  { id: 'd2', key: keyA, runId: 'run-001', channel: 'webhook', status: 'failed', attempts: 2, lastError: 'webhook HTTP 500', updatedAt: '2026-09-13T10:20:00.000Z' },
];
const durableSnapshot = buildCrmSnapshot(leads, events, deliveries);
const durableLead = durableSnapshot.records.find((record) => record.runId === 'run-001');
assert.ok(durableLead);
assert.equal(durableLead.delivery.length, 2, 'два канала доставки в карточке');
const webhookState = durableLead.delivery.find((item) => item.channel === 'webhook');
assert.ok(webhookState);
assert.equal(webhookState.status, 'failed');
assert.equal(webhookState.attempts, 2);
assert.equal(durableSnapshot.stats.deliveries.sent, 1);
assert.equal(durableSnapshot.stats.deliveries.failed, 1);

// --- CRM-ANALYTICS-001: воронка, источники, 14-дневный тренд ---

const DAY_MS = 24 * 60 * 60_000;
const daysAgoIso = (days: number): string => new Date(Date.now() - days * DAY_MS).toISOString();

const analyticsLeads: StoredLead[] = [
  // instagram: 3 лида (2 диагностики + 1 обращение), всё в пределах 14 дней
  { ...base, kind: 'result', runId: 'an-run-1', utm: { utm_source: 'instagram' }, receivedAt: daysAgoIso(0) },
  { ...base, kind: 'result', runId: 'an-run-2', utm: { utm_source: 'instagram' }, receivedAt: daysAgoIso(1) },
  { ...base, kind: 'contact', runId: 'an-run-3', name: 'Aruzhan', phone: '77065554433', utm: { utm_source: 'instagram' }, receivedAt: daysAgoIso(3) },
  // google: 2 лида (диагностика + заявка на сезон)
  { ...base, kind: 'result', runId: 'an-run-4', utm: { utm_source: 'google' }, receivedAt: daysAgoIso(2) },
  { ...base, kind: 'season', runId: 'an-run-5', name: 'Dias', phone: '77061112233', utm: { utm_source: 'google' }, receivedAt: daysAgoIso(2) },
  // без utm_source — в bySource не попадает
  { ...base, kind: 'whatsapp', runId: 'an-run-6', receivedAt: daysAgoIso(0) },
  // старые лиды: не считаются ни в last14Days, ни в leadsLast7Days
  { ...base, kind: 'contact', runId: 'an-run-7', name: 'Alia', phone: '77067778899', utm: { utm_source: 'tiktok' }, receivedAt: daysAgoIso(20) },
  { ...base, kind: 'result', runId: 'an-run-8', utm: { utm_source: 'instagram' }, receivedAt: daysAgoIso(40) },
];

const analyticsSnapshot = buildCrmSnapshot(analyticsLeads, []);
const { analytics } = analyticsSnapshot.stats;

// Воронка считается по записям (без ограничения по времени): an-run-1,2,4,8 — диагностики
assert.equal(analytics.funnel.diagnostics, 4, 'воронка: 4 записи с диагностикой');
assert.equal(analytics.funnel.whatsapp, 1, 'воронка: 1 запись с WhatsApp');
assert.equal(analytics.funnel.contacts, 2, 'воронка: 2 записи с обращением (включая старую)');
assert.equal(analytics.funnel.season, 1, 'воронка: 1 запись с заявкой сезона');

// bySource: лиды (не записи), сортировка по leads desc
assert.deepEqual(
  analytics.bySource.map((row) => [row.source, row.leads, row.contacts, row.season]),
  [
    ['instagram', 4, 1, 0],
    ['google', 2, 0, 1],
    ['tiktok', 1, 1, 0],
  ],
  'bySource: группировка по utm_source, без utm не попадает, сортировка по leads desc',
);

// last14Days: ровно 14 элементов, последний — сегодня (UTC)
assert.equal(analytics.last14Days.length, 14, 'last14Days: ровно 14 дней');
assert.equal(analytics.last14Days[13].date, new Date().toISOString().slice(0, 10), 'last14Days: последний день — сегодня');
assert.equal(
  analytics.last14Days.reduce((sum, point) => sum + point.leads, 0),
  6,
  'last14Days: считаются лиды за 14 дней, старые (20 и 40 дней) не считаются',
);
assert.equal(analytics.last14Days[12].leads + analytics.last14Days[13].leads >= 2, true, 'last14Days: свежие лиды попали в конец тренда');

// leadsLast7Days: записи с firstSeenAt в пределах 7 дней
assert.equal(analytics.leadsLast7Days, 6, 'leadsLast7Days: 6 свежих записей, старые не считаются');

console.log('PASS  аналитика: воронка по типам лидов считается по записям');
console.log('PASS  аналитика: bySource группирует лиды по utm_source и сортирует по убыванию');
console.log('PASS  аналитика: last14Days — 14 дней, последний = сегодня, старые лиды не считаются');
console.log('PASS  аналитика: leadsLast7Days учитывает записи за 7 дней');

console.log('PASS  CRM объединяет события по runId');
console.log('PASS  CRM применяет этапы и заметки');
console.log('PASS  CRM считает контакты и заявки сезона');
console.log('PASS  CRM различает обращение с сайта и заявку сезона');
console.log('PASS  dedupeKey стабилен и различает разные лиды');
console.log('PASS  политика retry: backoff, лимит попыток, sent не трогаем');
console.log('PASS  CRM показывает статусы доставки и считает sent/failed');
