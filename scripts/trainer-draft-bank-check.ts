import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import batch from '../src/data/trainer-drafts/batch-02.json';
import { draftBatches, emptyDraftReview, parseDraftReview, reviewCounts, reviewKey } from '../src/lib/trainers/draft-review';

assert.equal(batch.methodically_approved, false);
assert.equal(batch.units.length, 6);
assert.equal(new Set(draftBatches.flatMap(b => b.units.map(u => u.id))).size, 18, 'unique IDs across batches');
assert.equal(crypto.createHash('sha256').update(JSON.stringify(batch.units)).digest('hex'), batch.content_sha256);
for (const unit of batch.units) {
  assert.equal(unit.status, 'DRAFT');
  const data = unit.exercise_data;
  assert.equal(data.publication_ready, false);
  assert.ok(unit.student_markdown.trim() && unit.teacher_markdown.trim());
  if (data.kind === 'listening-pair-v1') {
    assert.equal(data.audio_status, 'NOT_GENERATED');
    assert.equal(data.rounds!.length, 2);
    for (const round of data.rounds!) {
      assert.ok(round.script.includes(round.segment), 'segment must be an exact contiguous excerpt');
      assert.ok(round.accepted.includes(round.answer));
      assert.equal(new Set(round.accepted).size, round.accepted.length);
      assert.ok(round.distractors.every(value => !round.accepted.includes(value)));
      assert.ok(round.accepted.every(value => /^\d+$/.test(value) || value.split(/\s+/).length === 1), 'answers satisfy supplied word limit');
    }
    assert.notEqual(data.rounds![0].script, data.rounds![1].script, 'fresh transfer content');
  }
  if (data.kind === 'task1-pair-v1') {
    assert.equal(data.charts!.length, 2);
    for (const chart of data.charts!) {
      assert.equal(chart.years.length, 4);
      assert.ok(chart.years.every((year, i) => i === 0 || year > chart.years[i-1]));
      assert.equal(chart.series.length, 3);
      assert.ok(chart.series.every(s => s.values.length === chart.years.length && s.values.every(v => Number.isFinite(v) && v >= 0)));
      assert.equal(chart.claims.length, 6);
      assert.equal(chart.key.length, 3);
      assert.ok(chart.key.every(i => chart.claims[i][1] === true));
      assert.ok(chart.model.trim().split(/\s+/).length >= 150, 'complete model meets explicit task length');
      const [a,b,c] = chart.series.map(s => s.values);
      const rises = (values: number[]) => values.slice(1).every((v,i) => v > values[i]);
      const falls = (values: number[]) => values.slice(1).every((v,i) => v < values[i]);
      const lowest = c.every((v,i) => v < a[i] && v < b[i]);
      // Independent arithmetic checks of every binary claim, including true details
      // which are not the selected overview, ties and unobserved crossing dates.
      const expected = chart.title.includes('Electricity') ? [rises(a),rises(b),falls(c)&&c[3]<a[3]&&c[3]<b[3],c[3]>a[3]&&c[3]>b[3],a[3]===4*a[0],false]
        : chart.title.includes('Enrolments') ? [rises(a)&&rises(c),falls(b),a[3]>b[3]&&a[3]>c[3]&&c[3]>b[3],b.every((v,i)=>v>a[i]&&v>c[i]),c[3]===25,a[3]===2*a[0]]
        : chart.title.includes('Passenger') ? [rises(a)&&falls(b),a[1]<b[1]&&a[2]>b[2],lowest,rises(c),a[3]===95,false]
        : [a[3]>a[0]&&c[3]>c[0]&&falls(b),a[2]===b[2]&&a[3]>b[3],lowest,a[2]>b[2]&&a[2]>c[2],c[3]===2*c[0],false];
      assert.deepEqual(chart.claims.map(claim => claim[1]), expected, chart.title);
    }
  }
  if (data.kind === 'speaking-pair-v1') {
    assert.equal(data.topics!.length, 2);
    assert.notEqual(data.topics![0].prompt, data.topics![1].prompt);
    assert.ok(data.topics!.every(t => t.cues.length === 4 && t.ideas.length === 3 && t.followup));
  }
}
const original = emptyDraftReview('reviewer');
const second = emptyDraftReview('reviewer', batch);
assert.notEqual(reviewKey('reviewer'), reviewKey('reviewer', batch));
assert.equal(parseDraftReview(JSON.stringify(original), 'reviewer', batch), null);
assert.equal(parseDraftReview(JSON.stringify(second), 'reviewer'), null);
assert.ok(parseDraftReview(JSON.stringify(second), 'reviewer', batch));
assert.equal(reviewCounts(second, batch).total, 6);
const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'ashyq-draft-negative-'));
const fixture = path.join(temp, 'fixture.json');
try {
  const source = { ...batch, format: 'ashyq-author-review-material-v1' };
  const invalid = [
    { ...source, batch: '../../outside-bank' },
    { ...source, batch: 'C:\\outside-bank' },
    { ...source, methodically_approved: true },
    { ...source, units: [] },
    { ...source, units: [source.units[0], source.units[0]] },
    { ...source, units: [{ ...source.units[0], status: 'PUBLISHED' }] },
    { ...source, units: [{ ...source.units[0], exercise_data: [] }] },
  ];
  for (const value of invalid) {
    fs.writeFileSync(fixture, JSON.stringify(value));
    const result = spawnSync(process.execPath, ['--import', 'tsx', 'scripts/import-trainer-draft-batch.ts', fixture], { encoding: 'utf8', timeout: 15_000 });
    assert.equal(result.error, undefined);
    assert.notEqual(result.status, 0, 'unsafe or malformed input must fail before any output');
    assert.equal(result.stdout, '');
  }
} finally { if (fs.existsSync(fixture)) fs.unlinkSync(fixture); fs.rmdirSync(temp); }
console.log('PASS 18 unique DRAFT units; six new module structures, four chart models/arithmetic/ties, listening variants/excerpts, fresh topics, cross-batch identity/fingerprint isolation and seven rejected importer cases. No methodology, audio or band-quality certification.');
