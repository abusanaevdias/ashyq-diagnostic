import assert from 'node:assert/strict';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { safePath } from './harness.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = file => readFileSync(path.join(root, file), 'utf8');
let articles = 0;
for (const file of readdirSync(path.join(root, 'harness/content')).filter(name => name.endsWith('.json'))) {
  const record = JSON.parse(read(`harness/content/${file}`));
  if (record.kind === 'prompt-portfolio') {
    assert.equal(record.version, 1);
    assert.ok(record.prompts.length >= 10);
    assert.deepEqual(record.measurements, [], 'Populate measured observations in a separate dated evidence file');
    for (const prompt of record.prompts) assert.equal(prompt.status, 'hypothesis-unmeasured');
    continue;
  }
  assert.equal(record.version, 1);
  assert.match(record.reviewedOn, /^\d{4}-\d{2}-\d{2}$/);
  assert.ok(Date.parse(record.reviewedOn) <= Date.now() + 24 * 60 * 60 * 1000);
  assert.ok(record.publisherRelationship?.includes('ASHYQ'));
  if (record.research.frequencies !== null) {
    assert.ok(Array.isArray(record.research.frequencies));
    for (const row of record.research.frequencies) assert.ok(Number.isInteger(row.frequency) && row.frequency >= 0 && row.source && row.region && row.checkedOn && safePath(row.evidence) && existsSync(path.join(root, row.evidence)), 'Frequency needs captured source evidence');
  }
  for (const source of record.sources) {
    const url = new URL(source.url);
    assert.equal(url.protocol, 'https:');
    assert.ok(!url.searchParams.has('mcp_token') && !url.username && !url.password);
    assert.ok(source.supports && source.accessedOn);
  }
  for (const file of record.productEvidence) assert.ok(safePath(file) && existsSync(path.join(root, file)), `Missing product source ${file}`);
  const evidence = record.caseEvidence;
  assert.equal(evidence.status, 'owner-confirmed-first-party');
  assert.equal(evidence.causalEffectEstablished, false);
  for (const item of evidence.cases) {
    assert.ok(item.duration && item.type && item.scores.length);
    for (const score of item.scores) assert.ok(score.from >= 0 && score.to <= 9 && score.to >= score.from && score.from * 2 % 1 === 0 && score.to * 2 % 1 === 0);
  }
  const sourceText = [...new Set(record.articles.map(article => article.file))].map(read).join('\n');
  for (const fragment of record.caseRequiredFragments) assert.ok(sourceText.includes(fragment), `Missing case attribution/scope/data: ${fragment}`);
  for (const article of record.articles) {
    assert.ok(/^[a-z0-9-]+$/.test(article.slug));
    assert.ok(safePath(article.file) && safePath(article.cover));
    assert.ok(read(article.file).includes(`slug: '${article.slug}'`));
    const cover = read(article.cover);
    assert.match(cover, /<svg/); assert.match(cover, /<title/); assert.match(cover, /<desc/);
    assert.ok(article.intent && article.examples);
    articles++;
  }
}
console.log(`PASS content evidence structure: ${articles} registered articles, primary-source records, product anchors, owner-attributed cases and explicit causal boundary. This is not independent fact verification.`);
