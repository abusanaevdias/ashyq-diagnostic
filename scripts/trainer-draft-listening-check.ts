import assert from 'node:assert/strict';
import fs from 'node:fs';
import crypto from 'node:crypto';
import { chromium } from 'playwright';
import AxeBuilder from '@axe-core/playwright';
import batch from '../src/data/trainer-drafts/batch-02.json';
import audio from '../src/data/trainer-drafts/listening-audio-02.json';
import { compareDraftAnswer, parseDraftListening } from '../src/lib/trainers/draft-listening';

function wavDuration(buffer: Buffer) {
  assert.equal(buffer.toString('ascii', 0, 4), 'RIFF'); assert.equal(buffer.toString('ascii', 8, 12), 'WAVE');
  assert.equal(buffer.readUInt32LE(4) + 8, buffer.length);
  let byteRate = 0, dataBytes = 0;
  for (let offset = 12; offset + 8 <= buffer.length;) {
    const id = buffer.toString('ascii', offset, offset + 4), size = buffer.readUInt32LE(offset + 4);
    assert.ok(offset + 8 + size <= buffer.length);
    if (id === 'fmt ') { assert.ok(size >= 16); assert.equal(buffer.readUInt16LE(offset + 8), 1, 'PCM WAV'); byteRate = buffer.readUInt32LE(offset + 16); }
    if (id === 'data') dataBytes += size;
    offset += 8 + size + size % 2;
  }
  assert.ok(byteRate > 0 && dataBytes > 0);
  return dataBytes / byteRate;
}
async function main() {
  assert.equal(audio.assets.length, 8); assert.equal(audio.publication_ready, false);
  const units = batch.units.filter(unit => unit.exercise_data.kind === 'listening-pair-v1');
  assert.equal(units.length, 2);
  for (const unit of units) {
    const pair = parseDraftListening(unit.exercise_data, unit.id)!; assert.ok(pair);
    for (const [index, item] of pair.rounds.entries()) {
      assert.equal(compareDraftAnswer(` ${item.answer.toUpperCase()} `, item), 'match');
      assert.equal(compareDraftAnswer(item.distractors[0], item), 'known-distractor');
      assert.equal(compareDraftAnswer('unreviewed-word', item), 'unreviewed');
      const duration: number[] = [];
      for (const url of [item.fullUrl, item.segmentUrl]) {
        const asset = audio.assets.find(value => value.url === url)!; assert.ok(asset);
        assert.equal(asset.round, index); assert.equal(asset.unit, unit.id);
        const buffer = fs.readFileSync('public' + url);
        assert.equal(buffer.length, asset.bytes); assert.equal(crypto.createHash('sha256').update(buffer).digest('hex'), asset.sha256);
        duration.push(wavDuration(buffer));
      }
      assert.ok(duration[0] > duration[1] && duration[1] > 1);
    }
    const source = unit.exercise_data;
    for (const invalid of [{ ...source, audio_status: 'NOT_GENERATED' }, { ...source, publication_ready: true }, { ...source, rounds: [] }, { ...source, rounds: source.rounds!.map(round => ({ ...round, script: 'Wrong script' })) }, { ...source, rounds: source.rounds!.map(round => ({ ...round, accepted: [round.answer, round.answer] })) }]) assert.equal(parseDraftListening(invalid, unit.id), null);
    assert.equal(parseDraftListening(source, 'L99'), null);
    assert.equal(parseDraftListening(source, '../L03'), null);
  }
  const plural = units.find(unit => unit.id === 'L04')!;
  assert.ok(plural.exercise_data.rounds![0].prompt.includes('____ are'));
  assert.ok(plural.exercise_data.rounds![1].prompt.includes('____ are'));
  const base = process.env.TRAINER_CHECK_BASE ?? 'http://127.0.0.1:3043';
  assert.ok(['localhost', '127.0.0.1'].includes(new URL(base).hostname), 'LocalDemo fixtures only');
  const browser = await chromium.launch({ headless: true, args: ['--autoplay-policy=no-user-gesture-required'] });
  try {
    const context = await browser.newContext(), page = await context.newPage();
    const errors: string[] = []; page.on('pageerror', error => errors.push(error.message));
    let failFull = true, failSegment = true;
    await page.route('**/audio/trainers/drafts/l03-1-full.wav', route => { if (failFull) { failFull = false; return route.abort('failed'); } return route.continue(); });
    await page.route('**/audio/trainers/drafts/l03-1-segment.wav', route => { if (failSegment) { failSegment = false; return route.abort('failed'); } return route.continue(); });
    await page.goto(base + '/trainers/material-review');
    await page.getByRole('heading', { name: 'Нужно войти', exact: true }).waitFor();
    await page.evaluate(() => { localStorage.setItem('ashyq:v2:session', JSON.stringify({ user: { id: 'synthetic-listening-preview', name: 'Synthetic reviewer', email: 'synthetic@example.invalid', role: 'teacher', avatarColor: 'red' }, expiresAt: new Date(Date.now() + 3600000).toISOString() })); dispatchEvent(new Event('storage')); });
    await page.getByLabel('Партия материалов', { exact: true }).selectOption('02');
    for (const unit of units) {
      const pair = parseDraftListening(unit.exercise_data, unit.id)!;
      await page.getByLabel('Выбери материал', { exact: true }).selectOption(unit.id);
      const preview = page.getByRole('region', { name: 'Пробное аудирование · DRAFT', exact: true });
      await preview.getByRole('button', { name: 'Пройти Listening-черновик', exact: true }).click();
      for (const [index, item] of pair.rounds.entries()) {
        await preview.getByRole('heading', { name: `${index === 0 ? 'Первая запись' : 'Новая запись'} · ${index + 1}`, exact: true }).waitFor();
        const full = preview.locator('audio[aria-label="Полная синтетическая запись"]');
        assert.equal(await full.evaluate((node: HTMLAudioElement) => node.paused), true, 'no automatic playback');
        await preview.getByRole('button', { name: 'Зафиксировать первый ответ', exact: true }).click();
        await preview.getByRole('status').filter({ hasText: 'Сначала запиши ответ.' }).waitFor();
        await preview.getByLabel('Первый ответ до разбора', { exact: true }).fill(index === 0 ? unit.id === 'L03' ? item.distractors[0] : item.answer : 'unreviewed-word');
        await preview.getByRole('button', { name: 'Зафиксировать первый ответ', exact: true }).click();
        await preview.getByRole('status').filter({ hasText: 'Запусти запись или явно' }).waitFor();
        if (index === 0) {
          if (unit.id === 'L03') { await preview.getByRole('alert').filter({ hasText: 'Запись не загрузилась' }).waitFor(); await preview.getByRole('button', { name: 'Повторить загрузку записи', exact: true }).click(); }
          await full.evaluate(async (node: HTMLAudioElement) => { node.playbackRate = 16; await node.play(); });
          await page.waitForFunction(() => document.querySelector<HTMLAudioElement>('audio[aria-label="Полная синтетическая запись"]')?.ended);
        } else await preview.getByRole('button', { name: 'Открыть текст · отметить текстовую помощь', exact: true }).click();
        await preview.getByRole('button', { name: 'Зафиксировать первый ответ', exact: true }).click();
        assert.equal(await preview.getByLabel('Первый ответ до разбора', { exact: true }).isDisabled(), true);
        if (index === 1) { await preview.getByRole('heading', { name: 'Ответ требует ручной проверки', exact: true }).waitFor(); await preview.getByText('Текст открыт до ответа — это практика по тексту.', { exact: true }).waitFor(); }
        const segment = preview.locator('audio[aria-label="Ключевой синтетический фрагмент"]');
        if (unit.id === 'L03' && index === 0) { await preview.getByRole('alert').filter({ hasText: 'Фрагмент не загрузился' }).waitFor(); await preview.getByRole('button', { name: 'Повторить загрузку фрагмента', exact: true }).click(); }
        await segment.evaluate(async (node: HTMLAudioElement) => { node.playbackRate = 16; await node.play(); });
        const next = preview.getByRole('button', { name: index === 0 ? 'Перейти к новой записи' : 'Сравнить попытки аудирования', exact: true });
        await next.click(); await preview.getByRole('status').filter({ hasText: 'Запиши ответ после разбора отдельно' }).waitFor();
        await preview.getByLabel('Ответ после разбора', { exact: true }).fill(item.answer);
        for (const width of [320,390,768,1440]) { await page.setViewportSize({ width, height: 900 }); assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1), false, `Listening preview overflow ${unit.id}/${index}/${width}`); }
        const axe = await new AxeBuilder({ page }).include('main').analyze(); assert.deepEqual(axe.violations.map(value => ({ id: value.id, targets: value.nodes.map(node => node.target) })), []);
        // Keep a detached-node handle: checking only that the player vanished
        // would not prove that active sound stopped at the round transition.
        const oldSegment = await segment.elementHandle(); assert.ok(oldSegment);
        await segment.evaluate(async (node: HTMLAudioElement) => { node.currentTime = 0; node.playbackRate = 1; await node.play(); });
        await next.click();
        assert.equal(await oldSegment.evaluate((node: HTMLAudioElement) => node.paused), true, 'active segment paused on transition');
      }
      await preview.getByRole('heading', { name: 'Две попытки аудирования и помощи', exact: true }).waitFor();
      await preview.getByText('Текст открыт до ответа — это практика по тексту.', { exact: true }).waitFor();
      await preview.getByText('Браузер сообщил о завершении полной записи.', { exact: true }).waitFor();
      assert.equal(await preview.locator('audio').count(), 0);
      await preview.getByRole('button', { name: 'Начать новую временную Listening-пробу', exact: true }).click();
      assert.equal(await preview.getByLabel('Первый ответ до разбора', { exact: true }).inputValue(), '');
    }
    const activeFull = page.locator('audio[aria-label="Полная синтетическая запись"]');
    const oldFull = await activeFull.elementHandle(); assert.ok(oldFull);
    await activeFull.evaluate(async (node: HTMLAudioElement) => { node.currentTime = 0; await node.play(); });
    await page.getByLabel('Партия материалов', { exact: true }).selectOption('01');
    assert.equal(await oldFull.evaluate((node: HTMLAudioElement) => node.paused), true, 'active full recording paused on workspace unmount');
    // Decode every served asset as well as validating the bytes on disk.
    for (const asset of audio.assets) {
      const media = await page.evaluate(async url => { const response = await fetch(url); const ctx = new AudioContext(); try { const decoded = await ctx.decodeAudioData(await response.arrayBuffer()); return { status: response.status, duration: decoded.duration }; } finally { await ctx.close(); } }, asset.url);
      assert.ok([200,206].includes(media.status) && media.duration > 1);
    }
    assert.equal(await page.evaluate(() => Object.keys(localStorage).filter(key => key.startsWith('ashyq:trainer-review:')).length), 0);
    assert.deepEqual(errors, []);
    console.log('PASS eight generated WAV hashes/PCM/durations and served decoding; two Listening draft pairs, full/segment network failure+retry, no autoplay, first-answer freeze, known/unknown answers, explicit text transfer, help provenance, separate repair/report/reset, four widths and axe. No listening-quality, native-device or methodology certification.');
  } finally { await browser.close(); }
}
main().catch(error => { console.error(error); process.exitCode = 1; });
