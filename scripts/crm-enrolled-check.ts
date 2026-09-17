import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync } from 'node:fs';
import Module from 'node:module';
import os from 'node:os';
import path from 'node:path';

// CRM-ENROLLED-001: перевод в «Зачислен» шлёт одно поздравление в чат заявок, повторный — нет.
const dir = mkdtempSync(path.join(os.tmpdir(), 'ashyq-enrolled-'));

// server-only ставит сам Next.js; вне сборки подкладываем пустой пакет через NODE_PATH
mkdirSync(path.join(dir, 'node_modules', 'server-only'), { recursive: true });
writeFileSync(path.join(dir, 'node_modules', 'server-only', 'index.js'), '');
process.env.NODE_PATH = path.join(dir, 'node_modules');
(Module as unknown as { _initPaths: () => void })._initPaths();

Object.assign(process.env, {
  ASHYQ_LEADS_DIR: dir,
  ASHYQ_LEADS_PROVIDER: 'file',
  ASHYQ_TELEGRAM_BOT_TOKEN: 'test-token',
  ASHYQ_TELEGRAM_CHAT_ID: '-100123',
  ASHYQ_TELEGRAM_THREAD_ID: '7',
});
writeFileSync(path.join(dir, 'leads.jsonl'), `${JSON.stringify({
  kind: 'contact', exam: 'sat', runId: 'run-enr', name: 'Айдана', phone: '77011112233', target: '1400',
  receivedAt: '2026-09-17T10:00:00.000Z', ip: '127.0.0.1', dedupeKey: 'run-enr|contact',
})}\n`);

const sent: Array<Record<string, unknown>> = [];
let telegramDown = false;
globalThis.fetch = (async (url: string | URL, init?: RequestInit) => {
  if (String(url).includes('api.telegram.org')) {
    if (telegramDown) return new Response('fail', { status: 500 });
    sent.push(JSON.parse(String(init?.body)));
  }
  return new Response('{"ok":true}', { status: 200 });
}) as typeof fetch;

async function main() {
  const { appendCrmEvents, readCrmSnapshot } = await import('../src/lib/crm-server');
  const { enrolledText, ENROLLED_PHRASES } = await import('../src/lib/crm');
  const stage = (id: string, value: 'contacted' | 'enrolled' | 'lost', minute: number) =>
    appendCrmEvents([{ id, runId: 'run-enr', type: 'stage_change', stage: value, createdAt: `2026-09-17T10:0${minute}:00.000Z` }]);

  await stage('e1', 'contacted', 1);
  assert.equal(sent.length, 0, 'другие этапы не шлют поздравление');

  await stage('e2', 'enrolled', 2);
  assert.equal(sent.length, 1, 'зачисление — одно сообщение');
  assert.equal(sent[0].chat_id, '-100123');
  assert.equal(sent[0].message_thread_id, 7, 'в ту же тему форума, что и заявки');
  const text = String(sent[0].text);
  assert.ok(ENROLLED_PHRASES.some((phrase) => text.startsWith(phrase)), 'начинается со случайной фразы');
  assert.ok(text.includes('Айдана') && text.includes('SAT') && text.includes('1400'), 'имя, экзамен и цель в сообщении');

  await stage('e3', 'enrolled', 3);
  assert.equal(sent.length, 1, 'повторный «Зачислен» не поздравляет второй раз');

  const record = (await readCrmSnapshot()).records[0];
  assert.ok(enrolledText(record, () => 0).startsWith(ENROLLED_PHRASES[0]));
  assert.ok(enrolledText(record, () => 0.9999).startsWith(ENROLLED_PHRASES[ENROLLED_PHRASES.length - 1]));

  await stage('e4', 'lost', 4);
  telegramDown = true;
  await stage('e5', 'enrolled', 5);
  assert.equal((await readCrmSnapshot()).records[0].stage, 'enrolled', 'сбой Telegram не откатывает этап');

  console.log('PASS  CRM: «Зачислен» → одно поздравление со случайной фразой в чат заявок; повтор и сбой Telegram не ломают этап');
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
