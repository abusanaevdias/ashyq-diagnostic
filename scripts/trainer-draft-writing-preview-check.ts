import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import { chromium } from 'playwright';
import AxeBuilder from '@axe-core/playwright';
import batch from '../src/data/trainer-drafts/batch-03.json';
import { parseDraftWriting } from '../src/lib/trainers/draft-writing';

async function main() {
  for (const unit of batch.units) assert.ok(parseDraftWriting(unit.exercise_data), unit.id);
  const original = batch.units[0].exercise_data;
  for (const value of [null, [], {}, { ...original, publication_ready: true }, { ...original, mode: 'unknown' }, { ...original, source: [] }, { ...original, accepted_alternatives: [] }, { ...original, choices: original.choices.map(choice => ({ ...choice, best: true })) }, { ...original, example: 'Wrong example' }, { ...original, task: 'x'.repeat(4001) }, { ...original, choices: [original.choices[1], original.choices[1], original.choices[0]] }]) assert.equal(parseDraftWriting(value), null);
  const normalized = parseDraftWriting({ ...original, unexpected: 'discard me' })!;
  assert.equal('unexpected' in normalized, false);
  assert.notEqual(normalized.source, original.source);
  const base = process.env.TRAINER_CHECK_BASE ?? 'http://127.0.0.1:3043';
  assert.ok(['localhost', '127.0.0.1'].includes(new URL(base).hostname), 'LocalDemo fixtures only');
  const browser = await chromium.launch({ headless: true });
  try {
    const context = await browser.newContext();
    const page = await context.newPage();
    const errors: string[] = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.goto(base + '/trainers/material-review');
    await page.getByRole('heading', { name: 'Нужно войти', exact: true }).waitFor();
    await page.evaluate(() => { localStorage.setItem('ashyq:v2:session', JSON.stringify({ user: { id: 'synthetic-draft-preview', name: 'Synthetic reviewer', email: 'synthetic@example.invalid', role: 'teacher', avatarColor: 'red' }, expiresAt: new Date(Date.now() + 3600000).toISOString() })); dispatchEvent(new Event('storage')); });
    await page.getByLabel('Партия материалов', { exact: true }).selectOption('03');
    for (const [index, unit] of batch.units.entries()) {
      await page.getByLabel('Выбери материал', { exact: true }).selectOption(unit.id);
      const preview = page.getByRole('region', { name: 'Пробное прохождение · DRAFT', exact: true });
      await preview.getByRole('button', { name: 'Пройти черновик как ученик', exact: true }).click();
      assert.equal(await preview.getByRole('radio').count(), 0, 'options hidden before own attempt');
      await preview.getByRole('button', { name: 'Зафиксировать попытку и показать варианты', exact: true }).click();
      await preview.getByRole('status').filter({ hasText: '12 символов' }).waitFor();
      const own = index === 0 ? 'Я'.repeat(600) : 'My synthetic attempt is not a graded response.';
      await preview.getByLabel('Твоя первая попытка', { exact: true }).fill(own);
      await preview.getByRole('button', { name: 'Зафиксировать попытку и показать варианты', exact: true }).click();
      assert.equal(await preview.getByLabel('Твоя первая попытка', { exact: true }).isDisabled(), true);
      await preview.getByRole('button', { name: 'Проверить выбранный вариант', exact: true }).click();
      await preview.getByRole('status').filter({ hasText: 'Выбери вариант' }).waitFor();
      const wrong = unit.exercise_data.choices.findIndex(choice => !choice.best);
      const correct = unit.exercise_data.choices.findIndex(choice => choice.best);
      await preview.getByRole('radio').nth(wrong).check();
      await preview.getByRole('button', { name: 'Проверить выбранный вариант', exact: true }).click();
      await preview.getByRole('status').filter({ hasText: unit.exercise_data.choices[wrong].feedback }).waitFor();
      assert.equal(await preview.getByRole('heading', { name: 'Сравни с первой попыткой', exact: true }).count(), 0);
      if (index % 2 === 0) {
        await preview.getByRole('button', { name: 'Показать разбор без выбора', exact: true }).click();
        await preview.getByRole('status').filter({ hasText: 'Это не самостоятельный выбор' }).waitFor();
      } else {
        await preview.getByRole('radio').nth(correct).check();
        await preview.getByRole('button', { name: 'Проверить выбранный вариант', exact: true }).click();
      }
      await preview.getByRole('heading', { name: 'Сравни с первой попыткой', exact: true }).waitFor();
      assert.equal(await preview.locator('p').filter({ hasText: own }).textContent(), own, 'frozen first draft shown alongside the model');
      await preview.getByText('Другие допустимые формулировки и замечания автору', { exact: true }).click();
      for (const line of unit.exercise_data.accepted_alternatives) await preview.locator('details').getByText(line, { exact: true }).waitFor();
      if (index === 0 || index === 17) {
        for (const width of [320, 390, 768, 1440]) {
          await page.setViewportSize({ width, height: 900 });
          assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1), false, `preview overflow ${unit.id}/${width}`);
        }
        const axe = await new AxeBuilder({ page }).include('main').analyze();
        assert.deepEqual(axe.violations.map(value => ({ id: value.id, targets: value.nodes.map(node => node.target) })), []);
        if (index === 17) {
          await fs.mkdir('artifacts/trainers-complete-033', { recursive: true });
          await page.setViewportSize({ width: 390, height: 844 });
          await preview.screenshot({ path: 'artifacts/trainers-complete-033/draft-preview-mobile.png' });
        }
      }
      await preview.getByRole('button', { name: 'Начать новую временную пробу', exact: true }).click();
      assert.equal(await preview.getByLabel('Твоя первая попытка', { exact: true }).inputValue(), '');
      assert.equal(await preview.getByRole('radio').count(), 0);
    }
    await page.reload();
    await page.getByLabel('Партия материалов', { exact: true }).selectOption('03');
    assert.equal(await page.getByRole('button', { name: 'Пройти черновик как ученик', exact: true }).count(), 1);
    assert.equal(await page.evaluate(() => Object.keys(localStorage).filter(key => key.startsWith('ashyq:trainer-review:')).length), 0, 'trial never saves approval decisions');
    assert.deepEqual(errors, []);
    await fs.mkdir('artifacts/trainers-complete-033', { recursive: true });
    await page.setViewportSize({ width: 390, height: 844 });
    await page.screenshot({ path: 'artifacts/trainers-complete-033/draft-review-entry-mobile.png' });
    console.log('PASS 18 draft-only adapters; malformed data rejected; own attempt locked before choices, wrong retry/help or correct choice, alternatives, reset, temporary-only reload, four widths and axe. No methodology approval, publication or free-text grading.');
  } finally { await browser.close(); }
}
main().catch(error => { console.error(error); process.exitCode = 1; });
