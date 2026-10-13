import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import { chromium } from 'playwright';
import AxeBuilder from '@axe-core/playwright';
import { draftBatches } from '../src/lib/trainers/draft-review';
import { parseDraftSpeaking } from '../src/lib/trainers/draft-speaking';
import { checkpointKey, emptyRecord } from '../src/lib/trainers/checkpoints';

async function main() {
  const units = draftBatches.flatMap(batch => batch.units.flatMap(unit => {
    const pair = parseDraftSpeaking('exercise_data' in unit ? unit.exercise_data : null);
    return pair ? [{ batch, unit, pair }] : [];
  }));
  assert.equal(units.length, 10);
  const original = units[0].pair;
  const source = { kind: 'speaking-pair-v1', publication_ready: false, topics: original.topics };
  for (const value of [null, [], {}, { ...source, publication_ready: true }, { ...source, skill: 7 }, { ...source, topics: [source.topics[0],source.topics[0]] }, { ...source, topics: source.topics.map(topic => ({ ...topic, cues: [] })) }, { ...source, topics: source.topics.map(topic => ({ ...topic, ideas: ['same','same','same'] })) }]) assert.equal(parseDraftSpeaking(value), null);
  const base = process.env.TRAINER_CHECK_BASE ?? 'http://127.0.0.1:3043';
  assert.ok(['localhost','127.0.0.1'].includes(new URL(base).hostname), 'Synthetic LocalDemo role fixtures only');
  const browser = await chromium.launch({ headless: true, args: ['--mute-audio'] });
  try {
    const context = await browser.newContext();
    await context.addInitScript({ content: String.raw`(() => {
      const state = { requested: 0, stopped: 0 }; Object.assign(window, { syntheticMicrophone: state });
      if (!navigator.mediaDevices) return;
      Object.defineProperty(navigator.mediaDevices, 'getUserMedia', { value: async () => {
        state.requested++; const audio = new AudioContext(); Object.assign(window, { syntheticAudio: audio }); await audio.resume();
        const oscillator = audio.createOscillator(), destination = audio.createMediaStreamDestination();
        oscillator.connect(destination); oscillator.start();
        for (const track of destination.stream.getTracks()) { const stop = track.stop.bind(track); track.stop = () => { state.stopped++; stop(); oscillator.stop(); void audio.close(); }; }
        return destination.stream;
      } });
    })();` });
    const errors: string[] = [], posts: string[] = [];
    context.on('page', page => page.on('pageerror', error => errors.push(error.message)));
    context.on('request', request => { if (request.method() === 'POST') posts.push(new URL(request.url()).pathname); });
    const page = await context.newPage();
    const checkGate = async () => {
      assert.equal(await page.locator('main').count(), 1);
      for (const width of [320,390,768,1440]) { await page.setViewportSize({ width, height: 900 }); assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false); }
      assert.deepEqual((await new AxeBuilder({ page }).include('main').withTags(['wcag2a','wcag2aa','wcag21aa']).analyze()).violations, []);
    };
    const first = units[0], query = new URLSearchParams({ reviewBatch: first.batch.batch, reviewUnit: first.unit.id, reviewHash: first.batch.content_sha256 });
    const url = base + '/trainers/speaking-second-take?' + query;
    await page.goto(url);
    await page.getByRole('heading', { name: 'Нужно войти для Speaking-черновика', exact: true }).waitFor();
    await checkGate();
    const login = new URL((await page.getByRole('link', { name: 'Войти в учебный кабинет', exact: true }).getAttribute('href'))!, base);
    assert.equal(login.searchParams.get('next'), '/trainers/speaking-second-take?' + query, 'login preserves the exact draft/version');
    const session = (role: string) => ({ user: { id: 'synthetic-speaking-preview', name: 'Synthetic reviewer', email: 'synthetic@example.invalid', role, avatarColor: 'red' }, expiresAt: new Date(Date.now() + 3600000).toISOString() });
    await page.evaluate(value => { localStorage.setItem('ashyq:v2:session', JSON.stringify(value)); dispatchEvent(new Event('storage')); }, session('student'));
    await page.getByRole('heading', { name: 'Недостаточно прав', exact: true }).waitFor();
    await checkGate();
    assert.equal(await page.getByRole('button', { name: /Начать подготовку/ }).count(), 0);
    await page.evaluate(value => { localStorage.setItem('ashyq:v2:session', JSON.stringify(value)); dispatchEvent(new Event('storage')); }, session('teacher'));
    await page.getByRole('heading', { name: `Speaking-проба · ${first.unit.id} · DRAFT`, exact: true }).waitFor();
    await page.goto(url + '&reviewUnit=S99');
    await page.getByRole('heading', { name: 'Не удалось открыть черновик', exact: true }).waitFor();
    await checkGate();
    const stale = new URL(url); stale.searchParams.set('reviewHash', '0'.repeat(64));
    await page.goto(stale.href);
    await page.getByRole('heading', { name: 'Версия Speaking-черновика недоступна', exact: true }).waitFor();
    await checkGate();
    const unknown = new URL(url); unknown.searchParams.set('reviewUnit', 'S99');
    await page.goto(unknown.href);
    await page.getByRole('heading', { name: 'Версия Speaking-черновика недоступна', exact: true }).waitFor();
    const sentinelKey = checkpointKey('speaking-second-take','synthetic-speaking-preview'), sentinel = JSON.stringify(emptyRecord('speaking-second-take'));
    await page.evaluate(({ key, value }) => localStorage.setItem(key,value), { key: sentinelKey, value: sentinel });
    await page.goto(base + '/trainers/material-review');
    for (const { batch, unit, pair } of units) {
      await page.getByLabel('Партия материалов', { exact: true }).selectOption(batch.batch);
      await page.getByLabel('Выбери материал', { exact: true }).selectOption(unit.id);
      const link = page.getByRole('link', { name: 'Открыть Speaking-пробу в новой вкладке ↗', exact: true });
      assert.equal(await link.evaluate(element => element.tagName), 'A');
      const popupPromise = page.waitForEvent('popup'); await link.click(); const trial = await popupPromise;
      await trial.getByRole('heading', { name: `Speaking-проба · ${unit.id} · DRAFT`, exact: true }).waitFor();
      const policy = await trial.evaluate(() => (document as unknown as {featurePolicy: {allowsFeature: (feature: string) => boolean}}).featurePolicy.allowsFeature('microphone'));
      assert.equal(policy, true, 'native document gets only the existing Speaking microphone policy');
      assert.equal(await trial.getByRole('button', { name: 'Сохранять на этом устройстве', exact: true }).count(), 0);
      await trial.getByRole('button', { name: /Начать подготовку/ }).click();
      for (let index = 0; index < 3; index++) {
        const topic = pair.topics[index === 2 ? 1 : 0];
        await trial.getByRole('heading', { name: topic.prompt, exact: true }).waitFor();
        assert.equal(await trial.getByRole('heading', { name: 'Идеи после попытки · DRAFT', exact: true }).count(), 0);
        if (index === 0) assert.equal(await trial.getByText(pair.topics[1].prompt, { exact: true }).count(), 0);
        const notes = `Own independent preparation ${unit.id}-${index}.`;
        await trial.getByLabel('Твои заметки: ключевые идеи, не готовый текст', { exact: true }).fill(notes);
        await trial.getByRole('button', { name: /Я готов к ответу/ }).click();
        if (unit.id === 'S05' && index === 0) {
          assert.equal(await trial.evaluate(() => navigator.mediaDevices.getUserMedia.toString().includes('state.requested')), true, 'synthetic capture hook installed before explicit start');
          assert.equal(await trial.evaluate(() => (window as unknown as {syntheticMicrophone:{requested:number}}).syntheticMicrophone.requested), 0);
          await trial.getByRole('button', { name: 'Разрешить микрофон и начать запись', exact: true }).click();
          try { await trial.getByText(/Идёт запись · 0:01/).waitFor(); }
          catch (error) { console.error('Draft synthetic capture:', await trial.evaluate(() => ({ microphone: (window as unknown as {syntheticMicrophone: unknown}).syntheticMicrophone, audio: (window as unknown as {syntheticAudio?: AudioContext}).syntheticAudio?.state, visibility: document.visibilityState })), (await trial.locator('main').innerText()).slice(-1800), errors); throw error; }
          await trial.getByRole('button', { name: 'Закончить запись', exact: true }).click();
          await trial.getByRole('heading', { name: '3. Прослушай и проверь себя', exact: true }).waitFor();
          assert.deepEqual(await trial.evaluate(() => (window as unknown as {syntheticMicrophone:{requested:number;stopped:number}}).syntheticMicrophone), { requested: 1, stopped: 1 });
          const downloadPromise = trial.waitForEvent('download'); await trial.getByRole('button', { name: 'Скачать эту аудиозапись', exact: true }).click();
          const download = await downloadPromise; assert.match(download.suggestedFilename(), /^ASHYQ-speaking-S05-answer-1\.(webm|m4a|ogg)$/);
          const path = 'artifacts/trainers-complete-033/draft-' + download.suggestedFilename(); await download.saveAs(path); assert.ok((await fs.stat(path)).size > 1000);
          await trial.locator('audio').evaluate(element => (element as HTMLAudioElement).play());
          await trial.waitForFunction(() => (document.querySelector('audio')?.currentTime ?? 0) > 0.1);
          await trial.locator('audio').evaluate(element => (element as HTMLAudioElement).pause());
        } else await trial.getByRole('button', { name: /Самостоятельная попытка без аудио/ }).click();
        await trial.getByRole('heading', { name: 'Идеи после попытки · DRAFT', exact: true }).waitFor();
        for (const idea of topic.ideas) await trial.getByText(idea, { exact: true }).waitFor();
        await trial.getByRole('checkbox', { name: /Не выделил отдельные моменты/ }).check();
        for (let criterion = 0; criterion < 4; criterion++) await trial.locator(`#speaking-rating-${criterion}`).selectOption({ label: 'Нужно поработать' });
        await trial.getByLabel('План: что конкретно сделаешь в следующем ответе?', { exact: true }).fill(`Post-feedback plan ${unit.id}-${index}.`);
        await trial.getByRole('checkbox', { name: unit.id === 'S05' && index === 0 ? 'Я прослушал запись и заполнил самопроверку' : 'Я ответил вслух самостоятельно и заполнил самопроверку', exact: true }).check();
        await trial.getByRole('button', { name: /Сохранить самопроверку/ }).click();
        await trial.getByText(notes, { exact: true }).waitFor();
        if (index < 2) await trial.getByRole('button', { name: index === 0 ? /Повторить ту же тему по плану/ : /Проверить себя на новой теме/ }).click();
      }
      await trial.getByRole('heading', { name: 'Три попытки: что ты заметил', exact: true }).waitFor();
      for (let index=0; index<3; index++) await trial.getByText(`Own independent preparation ${unit.id}-${index}.`, { exact: true }).waitFor();
      if (['S03','S05','S12'].includes(unit.id)) for (const width of [320,390,768,1440]) {
        await trial.setViewportSize({ width, height: 900 });
        assert.equal(await trial.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
        assert.deepEqual((await new AxeBuilder({ page: trial }).include('main').withTags(['wcag2a','wcag2aa','wcag21aa']).analyze()).violations, []);
        if (unit.id === 'S05' && width === 390) { await trial.getByRole('heading', { name: 'Первый ответ', exact: true }).evaluate(element => window.scrollTo({ top: element.getBoundingClientRect().top + scrollY - 140, behavior: 'instant' })); await trial.screenshot({ path: 'artifacts/trainers-complete-033/draft-speaking-result-mobile.png' }); }
      }
      assert.equal(await trial.evaluate(key => localStorage.getItem(key), sentinelKey), sentinel, 'draft never overwrites public checkpoint/history');
      if (unit.id === 'S05') {
        let warned = false; trial.once('dialog', async dialog => { warned = dialog.type() === 'beforeunload'; await dialog.accept(); });
        await trial.reload(); await trial.getByRole('heading', { name: 'Speaking-проба · S05 · DRAFT', exact: true }).waitFor();
        assert.equal(warned, true); assert.equal(await trial.getByRole('heading', { name: 'Три попытки: что ты заметил', exact: true }).count(), 0);
      }
      if (unit.id === 'S12') {
        let warned = false; trial.once('dialog', async dialog => { warned = dialog.type() === 'beforeunload'; await dialog.accept(); });
        await trial.getByRole('link', { name: '← К проверке материалов', exact: true }).click();
        await trial.getByRole('heading', { name: 'Проверка учебных материалов', exact: true }).waitFor(); assert.equal(warned, true);
      }
      await trial.close();
    }
    const recorded = units.find(value => value.unit.id === 'S05')!;
    await page.goto(base + '/trainers/speaking-second-take?' + new URLSearchParams({ reviewBatch: recorded.batch.batch, reviewUnit: recorded.unit.id, reviewHash: recorded.batch.content_sha256 }));
    await page.getByRole('button', { name: /Начать подготовку/ }).click(); await page.getByRole('button', { name: /Я готов к ответу/ }).click();
    assert.equal(await page.evaluate(() => navigator.mediaDevices.getUserMedia.toString().includes('state.requested')), true);
    await page.getByRole('button', { name: 'Разрешить микрофон и начать запись', exact: true }).click(); await page.getByText(/Идёт запись · 0:01/).waitFor();
    await page.evaluate(value => { localStorage.setItem('ashyq:v2:session', JSON.stringify(value)); dispatchEvent(new Event('storage')); }, session('student'));
    await page.getByRole('heading', { name: 'Недостаточно прав', exact: true }).waitFor();
    assert.deepEqual(await page.evaluate(() => (window as unknown as {syntheticMicrophone:{requested:number;stopped:number}}).syntheticMicrophone), { requested: 1, stopped: 1 });
    assert.equal(await page.locator('audio').count(), 0);
    await page.evaluate(value => { localStorage.setItem('ashyq:v2:session', JSON.stringify(value)); dispatchEvent(new Event('storage')); }, session('teacher'));
    await page.getByRole('heading', { name: 'Speaking-проба · S05 · DRAFT', exact: true }).waitFor();
    assert.equal(await page.getByRole('heading', { name: 'Три попытки: что ты заметил', exact: true }).count(), 0);
    await page.evaluate(() => { localStorage.removeItem('ashyq:v2:session'); dispatchEvent(new Event('storage')); });
    await page.getByRole('heading', { name: 'Нужно войти для Speaking-черновика', exact: true }).waitFor();
    assert.equal(await page.evaluate(() => Object.keys(localStorage).filter(key => key.startsWith('ashyq:trainer-review:')).length), 0);
    assert.deepEqual(posts, []); assert.deepEqual(errors, []);
    console.log('PASS ten Speaking draft pairs/thirty take flows: malformed/duplicate/stale/missing source gates, login preserves version, student denied/teacher trial, native document microphone policy, no auto microphone, generated-stream recording/download/cleanup, frozen own preparation, hidden fresh ideas, first/repeat/fresh provenance, public checkpoint isolation, explicit unload warning/ephemeral reload/native return link, active-capture role change cleanup/signout reset, gate and result landmarks/four widths/axe. LocalDemo UI only; no physical microphone, server-role, pronunciation, band or approval claim.');
  } finally { await browser.close(); }
}
main().catch(error => { console.error(error); process.exitCode = 1; });
