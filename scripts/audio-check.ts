import { chromium, devices } from 'playwright';

/**
 * Проверка IELTS Listening с настоящими MP3:
 *  - файл грузится (режим file, а не tts-fallback);
 *  - проигрывание увеличивает счётчик;
 *  - после maxPlays кнопка блокируется.
 */

let failures = 0;

function check(name: string, ok: boolean, detail = ''): void {
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? ` — ${detail}` : ''}`);
  if (!ok) failures += 1;
}

async function main() {
  const browser = await chromium.launch({ args: ['--no-sandbox', '--autoplay-policy=no-user-gesture-required'] });
  const context = await browser.newContext({ ...devices['iPhone 12'] });
  const page = await context.newPage();

  await page.goto('http://localhost:3000/?utm_source=test', { waitUntil: 'networkidle' });
  await page.locator('#hero').getByRole('button', { name: 'Начать диагностику IELTS' }).click();
  await page.getByRole('button', { name: '6.5', exact: true }).first().click();
  await page.waitForTimeout(300);
  await page.getByRole('button', { name: '1–3 месяца' }).click();
  await page.waitForTimeout(300);
  await page.getByRole('button', { name: 'Начать', exact: true }).click();
  await page.waitForTimeout(500);

  // идём к первому listening-вопросу (последние 4)
  for (let i = 0; i < 8; i++) {
    const radio = page.getByRole('radio');
    if (await radio.count()) await radio.first().click();
    else await page.locator('main input[type="text"]').fill('x');
    const next = page.getByRole('button', { name: 'Далее' });
    if (await next.count()) await next.click();
    await page.waitForTimeout(120);
  }

  // теперь мы в Listening; дождёмся аудио-карточки
  await page.waitForSelector('text=/Аудио/i', { timeout: 10000 });

  const hasFallbackNotice = async () =>
    (await page.locator('text=Временный режим').count()) > 0;

  // слушаем первый раз (accessible name берётся из aria-label)
  await page.getByRole('button', { name: 'Воспроизвести запись' }).first().click();
  await page.waitForTimeout(1500);

  const audioState = await page.evaluate(() => {
    const el = document.querySelector('audio');
    if (!el) {
      return {
        present: false as const,
        readyState: 0,
        paused: true,
        duration: 0,
        currentTime: 0,
        error: null as number | null,
      };
    }
    return {
      present: true as const,
      readyState: el.readyState,
      paused: el.paused,
      duration: el.duration,
      currentTime: el.currentTime,
      error: el.error ? el.error.code : null,
    };
  });

  console.log('audio element state:', JSON.stringify(audioState));

  const playing = audioState.present && !audioState.paused && audioState.currentTime > 0;
  check('MP3 реально играет (currentTime растёт)', playing);
  check('нет ошибки загрузки файла', !audioState.error);
  const fallback = await hasFallbackNotice();
  check('fallback-режим НЕ показан (файл найден)', !fallback);

  await page.screenshot({ path: 'screenshots/ielts-listening-audio.png', fullPage: true });

  // доигрываем/перематываем: слушаем ещё раз (2-е прослушивание), затем кнопка должна заблокироваться
  const pauseBtn = page.getByRole('button', { name: 'Пауза' });
  if (await pauseBtn.count()) await pauseBtn.click();

  const again = page.getByRole('button', { name: 'Воспроизвести запись' });
  await again.waitFor();
  await again.click();
  await page.waitForTimeout(800);
  const pause2 = page.getByRole('button', { name: 'Пауза' });
  await pause2.waitFor();
  await pause2.click();

  // после 2 прослушиваний кнопка «Слушать» должна быть disabled
  await page.locator('text=ограниченное число раз').waitFor();
  const disabledCount = await page.locator('button[disabled]').count();
  const notice = await page.locator('text=ограниченное число раз').count();
  check('после лимита показана пометка про ограниченное число прослушиваний', notice > 0);
  check('после лимита кнопка заблокирована', disabledCount > 0, `${disabledCount} disabled`);

  await context.close();
  await browser.close();

  if (failures > 0) process.exit(1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
