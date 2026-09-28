import assert from 'node:assert/strict';
import { chromium, type Page } from 'playwright';
import { mkdir } from 'node:fs/promises';
const base = process.env.BASE_URL || 'http://127.0.0.1:3032';
async function main() {
  const browser = await chromium.launch({ headless: true });
  try {
    const context = await browser.newContext({ viewport: { width: 390, height: 844 }, reducedMotion: 'reduce' });
    const page = await context.newPage();
    const errors: string[] = [];
    page.on('pageerror', (error) => errors.push(error.message));
    async function open(slug: string, code: string) {
      await page.goto(`${base}/library/${slug}`, { waitUntil: 'networkidle' });
      return page.getByRole('region', { name: `Интерактивная практика ${code}`, exact: true });
    }
    async function noOverflow(page: Page) { assert.equal(await page.evaluate(() => Math.max(0, document.documentElement.scrollWidth - innerWidth)), 0); }
    let quiz = await open('u01-work-experience', 'U01-Q-1');
    assert.equal(await quiz.getByRole('button', { name: 'Проверить ответ', exact: true }).isEnabled(), false);
    await quiz.locator('input[value="A"]').check();
    await quiz.getByRole('button', { name: 'Проверить ответ', exact: true }).click();
    assert.ok((await quiz.getByRole('status').first().innerText()).includes('Пока неверно'));
    await quiz.locator('input[value="B"]').check();
    assert.equal(await quiz.locator('[class*="quizFeedback"]').count(), 0, 'edited answer removes stale grading');
    await quiz.getByRole('button', { name: 'Проверить ответ', exact: true }).click();
    assert.ok((await quiz.getByRole('status').first().innerText()).startsWith('Верно'));
    await quiz.getByRole('button', { name: 'Следующий вопрос →', exact: true }).click();
    await quiz.getByLabel('Ваш ответ', { exact: true }).fill('Students need to communicate with supervisors because these skills are important.');
    await quiz.getByRole('button', { name: 'Сравнить с образцом', exact: true }).click();
    assert.ok((await quiz.getByRole('status').first().innerText()).startsWith('Сравните смысл'));
    assert.ok((await quiz.innerText()).includes('1 верных из 1 проверенных'), 'open writing excluded from automatic score');
    await quiz.getByRole('button', { name: '← Назад', exact: true }).click();
    assert.equal(await quiz.locator('input[value="B"]').isChecked(), true, 'answer retained between steps');
    await noOverflow(page);
    await page.reload({ waitUntil: 'networkidle' });
    assert.equal(await quiz.locator('input[value="B"]').isChecked(), false, 'no undisclosed persistence');
    quiz = await open('reading-equipment', 'R01-B');
    await quiz.getByRole('radio', { name: 'FALSE', exact: true }).check();
    await quiz.getByRole('button', { name: 'Проверить ответ', exact: true }).click();
    assert.ok((await quiz.getByRole('status').first().innerText()).startsWith('Верно'));
    assert.ok((await quiz.getByRole('status').first().innerText()).includes('no new cameras'));
    quiz = await open('reading-room', 'R02-B');
    assert.equal(await quiz.getByRole('radio').count(), 7);
    await quiz.getByRole('button', { name: /^Вопрос 6$/, exact: true }).click();
    await quiz.getByLabel('Ваш ответ', { exact: true }).fill(' QUESTION ');
    await quiz.getByRole('button', { name: 'Проверить ответ', exact: true }).click();
    assert.ok((await quiz.getByRole('status').first().innerText()).startsWith('Верно'));
    await page.setViewportSize({ width: 320, height: 740 }); await noOverflow(page);
    quiz = await open('grammar-block-1', 'G1-Q');
    await quiz.getByRole('radio', { name: 'lives', exact: true }).check();
    await quiz.getByRole('button', { name: 'Проверить ответ', exact: true }).click();
    assert.ok((await quiz.getByRole('status').first().innerText()).startsWith('Верно'));
    await noOverflow(page);
    quiz = await open('listening-workshop', 'L01-A');
    await quiz.getByRole('button', { name: /^Вопрос 2$/, exact: true }).click();
    await quiz.getByLabel('Ваш ответ', { exact: true }).fill('ten thirty');
    await quiz.getByRole('button', { name: 'Проверить ответ', exact: true }).click();
    assert.ok((await quiz.getByRole('status').first().innerText()).startsWith('Верно'));
    page.once('dialog', (dialog) => dialog.accept());
    await quiz.getByRole('button', { name: 'Начать заново', exact: true }).click();
    assert.equal(await quiz.getByLabel('Ваш ответ', { exact: true }).inputValue(), '');
    assert.ok((await quiz.innerText()).includes('Разобрано: 0 / 6'));
    assert.deepEqual(errors, []);
    await mkdir('screenshots', { recursive: true });
    await quiz.getByLabel('Ваш ответ', { exact: true }).fill('Thursday');
    await quiz.getByRole('button', { name: 'Проверить ответ', exact: true }).click();
    await quiz.scrollIntoViewIfNeeded();
    await page.screenshot({ path: 'screenshots/library-interactive-mobile.png', fullPage: false });
    console.log('PASS practice E2E: MCQ wrong/correct/edit, open comparison, score boundaries, step retention, reload, Reading/Grammar/Listening, spelling variants, reset, mobile overflow, console');
  } finally { await browser.close(); }
}
main().catch((error) => { console.error(error); process.exitCode = 1; });
