import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import { chromium } from 'playwright';
import AxeBuilder from '@axe-core/playwright';
import { checkpointKey, parseRecord } from '../src/lib/trainers/checkpoints';

async function main() {
  const browser = await chromium.launch({ headless: true, args: ['--mute-audio'] });
  try {
    const context = await browser.newContext();
    await context.addInitScript({ content: String.raw`(() => {
      const state = { requested: 0, stopped: 0 };
      Object.assign(window, { syntheticMicrophone: state });
      if (!navigator.mediaDevices) return;
      // A generated stream exercises real MediaRecorder/codec APIs, never a physical microphone.
      Object.defineProperty(navigator.mediaDevices, 'getUserMedia', { value: async () => {
        state.requested++;
        const audio = new AudioContext();
        await audio.resume();
        const oscillator = audio.createOscillator(), gain = audio.createGain(), destination = audio.createMediaStreamDestination();
        gain.gain.value = 0.01; oscillator.frequency.value = 440;
        oscillator.connect(gain); gain.connect(destination); oscillator.start();
        for (const track of destination.stream.getTracks()) {
          const stop = track.stop.bind(track);
          track.stop = () => { state.stopped++; stop(); oscillator.stop(); void audio.close(); };
        }
        return destination.stream;
      } });
    })();` });
    const page = await context.newPage();
    const errors: string[] = [];
    page.on('pageerror', error => errors.push(error.message));
    const base = process.env.TRAINER_CHECK_BASE ?? 'http://127.0.0.1:3043';
    await page.goto(base + '/trainers');
    const navigation = page.waitForResponse(response => response.url() === base + '/trainers/speaking-second-take' && response.request().isNavigationRequest());
    await page.getByRole('link', { name: 'Попробовать Speaking →', exact: true }).click();
    const response = await navigation;
    await page.getByRole('heading', { name: 'Услышь свой ответ. Попробуй ещё раз.', exact: true }).waitFor();
    const headers = response!.headers();
    assert.ok(headers['permissions-policy'].includes('microphone=(self)'));
    assert.ok(headers['content-security-policy'].includes("media-src 'self' blob:"));
    const microphoneAllowed = await page.evaluate(() => (document as unknown as {featurePolicy?: {allowsFeature: (feature: string) => boolean}}).featurePolicy?.allowsFeature('microphone'));
    assert.equal(microphoneAllowed, true, 'catalog entry must create a document with the microphone exception applied');
    const ordinary = await context.request.get(base + '/trainers/reading-evidence');
    assert.ok(ordinary.headers()['permissions-policy'].includes('microphone=()'), 'microphone exception must remain scoped');
    assert.equal(ordinary.headers()['content-security-policy'].includes('media-src'), false);
    const microphoneState = () => page.evaluate(() => (window as unknown as {syntheticMicrophone: {requested: number; stopped: number}}).syntheticMicrophone);
    assert.equal((await microphoneState()).requested, 0);
    await page.getByRole('button', { name: 'Сохранять на этом устройстве', exact: true }).click();
    await page.getByRole('button', { name: /Начать подготовку/ }).click();
    await page.getByLabel('Твои заметки: ключевые идеи, не готовый текст', { exact: true }).fill('Synthetic codec verification only.');
    await page.getByRole('button', { name: /Я готов к ответу/ }).click();
    assert.equal((await microphoneState()).requested, 0, 'preparation must not request audio');
    await page.getByRole('button', { name: 'Разрешить микрофон и начать запись', exact: true }).click();
    try { await page.getByText(/Идёт запись · 0:01/).waitFor(); }
    catch (error) { console.error('Synthetic recorder state:', await microphoneState(), (await page.locator('main').innerText()).slice(-1800), errors); throw error; }
    await page.getByRole('button', { name: 'Закончить запись', exact: true }).click();
    await page.getByRole('heading', { name: '3. Прослушай и проверь себя', exact: true }).waitFor();
    assert.deepEqual(await microphoneState(), { requested: 1, stopped: 1 });
    const download = page.waitForEvent('download');
    await page.getByRole('button', { name: 'Скачать эту аудиозапись', exact: true }).click();
    const downloaded = await download;
    await fs.mkdir('artifacts/trainers-complete-033', { recursive: true });
    const audioPath = 'artifacts/trainers-complete-033/' + downloaded.suggestedFilename();
    await downloaded.saveAs(audioPath);
    const bytes = await fs.readFile(audioPath);
    const decodingPage = await context.newPage();
    // Decode the downloaded bytes in a blank page; app CSP intentionally blocks fetch(blob:).
    const decoded = await decodingPage.evaluate(async encoded => {
      const data = Uint8Array.from(atob(encoded), char => char.charCodeAt(0));
      const audio = new AudioContext();
      try { const decoded = await audio.decodeAudioData(data.buffer); return { duration: decoded.duration, length: decoded.length }; }
      finally { await audio.close(); }
    }, bytes.toString('base64'));
    await decodingPage.close();
    assert.ok(decoded.duration >= 0.5 && decoded.duration < 6, `decoded duration ${decoded.duration}`);
    assert.ok(decoded.length > 1000 && bytes.length > 1000);
    assert.ok(downloaded.suggestedFilename().endsWith('.webm'));
    await page.locator('audio').evaluate(element => (element as HTMLAudioElement).play());
    await page.waitForFunction(() => (document.querySelector('audio')?.currentTime ?? 0) > 0.1);
    await page.locator('audio').evaluate(element => (element as HTMLAudioElement).pause());
    await page.getByLabel('Конкретный момент: слово, фраза или идея', { exact: true }).fill('Generated tone: media plumbing check only.');
    await page.getByRole('button', { name: 'Отметить текущий момент', exact: true }).click();
    for (let index = 0; index < 4; index++) await page.locator(`#speaking-rating-${index}`).selectOption({ label: 'Есть удачные и трудные места' });
    await page.getByLabel('План: что конкретно сделаешь в следующем ответе?', { exact: true }).fill('Next attempt checks the no-audio path.');
    await page.getByRole('checkbox', { name: 'Я прослушал запись и заполнил самопроверку', exact: true }).check();
    await page.getByRole('button', { name: /Сохранить самопроверку/ }).click();
    for (let index = 1; index <= 2; index++) {
      await page.getByRole('button', { name: index === 1 ? /Повторить ту же тему по плану/ : /Проверить себя на новой теме/ }).click();
      await page.getByRole('button', { name: /Я готов к ответу/ }).click();
      await page.getByRole('button', { name: /Самостоятельная попытка без аудио/ }).click();
      await page.getByRole('checkbox', { name: /Не выделил отдельные моменты/ }).check();
      for (let criterion = 0; criterion < 4; criterion++) await page.locator(`#speaking-rating-${criterion}`).selectOption({ label: 'Нужно поработать' });
      await page.getByLabel('План: что конкретно сделаешь в следующем ответе?', { exact: true }).fill('Synthetic self-review fixture.');
      await page.getByRole('checkbox', { name: 'Я ответил вслух самостоятельно и заполнил самопроверку', exact: true }).check();
      await page.getByRole('button', { name: /Сохранить самопроверку/ }).click();
    }
    await page.getByRole('heading', { name: 'Три попытки: что ты заметил', exact: true }).waitFor();
    for (const width of [320,390,768,1440]) {
      await page.setViewportSize({ width, height: 900 });
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1), false, `Speaking result overflow ${width}`);
    }
    const axe = await new AxeBuilder({ page }).include('main').analyze();
    assert.deepEqual(axe.violations.map(v => ({ id: v.id, targets: v.nodes.map(n => n.target) })), []);
    await page.getByText('Сохранено на этом устройстве.', { exact: true }).waitFor();
    const record = parseRecord(await page.evaluate(key => localStorage.getItem(key), checkpointKey('speaking-second-take', 'guest')), 'speaking-second-take')!;
    assert.equal((record.checkpoint!.data.takes as {url: string | null}[]).every(take => take.url === null), true, 'audio URLs never persist');
    await page.reload();
    await page.getByRole('button', { name: 'Продолжить сохранённую', exact: true }).click();
    await page.getByRole('heading', { name: 'Три попытки: что ты заметил', exact: true }).waitFor();
    assert.equal(await page.locator('audio').count(), 0, 'restored notes do not pretend audio exists');
    assert.deepEqual(errors, []);
    console.log(`PASS real Chromium MediaRecorder with generated stream: ${bytes.length} bytes, ${decoded.duration.toFixed(2)}s decoded; download, playback, track cleanup, three-attempt flow and notes-only restore. No physical microphone, human speech, pronunciation quality or other browser/device claim.`);
  } finally { await browser.close(); }
}
main().catch(error => { console.error(error); process.exitCode = 1; });
