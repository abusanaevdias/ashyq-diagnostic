import assert from 'node:assert/strict';
import { buildCrmSnapshot, type CrmEvent } from '../src/lib/crm';
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

console.log('PASS  CRM объединяет события по runId');
console.log('PASS  CRM применяет этапы и заметки');
console.log('PASS  CRM считает контакты и заявки сезона');
console.log('PASS  CRM различает обращение с сайта и заявку сезона');
