import assert from 'node:assert/strict';
import { chromium } from 'playwright';
import AxeBuilder from '@axe-core/playwright';
import batch from '../src/data/trainer-drafts/batch-04.json';
import { parseDraftSatPair } from '../src/lib/trainers/draft-sat-rw';

async function main() {
  for (const unit of batch.units) assert.ok(parseDraftSatPair(unit.exercise_data), unit.id);
  const original = batch.units[0].exercise_data;
  for (const value of [null, [], {}, { ...original, publication_ready: true }, { ...original, trainer: 'reading' }, { ...original, rounds: [] }, { ...original, rounds: [original.rounds[0], original.rounds[0]] }, { ...original, rounds: [{ ...original.rounds[0], key: 99 }, original.rounds[1]] }, { ...original, rounds: [{ ...original.rounds[0], evidence: 'Invented evidence' }, original.rounds[1]] }, { ...original, difficulty_status: 'CALIBRATED' }]) assert.equal(parseDraftSatPair(value), null);
  const normalized = parseDraftSatPair({ ...original, unknown: 'discard' })!;
  assert.equal('unknown' in normalized, false);
  assert.notEqual(normalized.rounds[0].choices, original.rounds[0].choices);
  const base = process.env.TRAINER_CHECK_BASE ?? 'http://127.0.0.1:3043';
  assert.ok(['localhost','127.0.0.1'].includes(new URL(base).hostname), 'LocalDemo fixtures only');
  const browser = await chromium.launch({ headless: true });
  try {
    const context = await browser.newContext();
    const page = await context.newPage();
    const errors: string[] = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.goto(base + '/trainers/material-review');
    await page.getByRole('heading', { name: 'Нужно войти', exact: true }).waitFor();
    await page.evaluate(() => { localStorage.setItem('ashyq:v2:session', JSON.stringify({ user: { id: 'synthetic-sat-preview', name: 'Synthetic reviewer', email: 'synthetic@example.invalid', role: 'teacher', avatarColor: 'red' }, expiresAt: new Date(Date.now() + 3600000).toISOString() })); dispatchEvent(new Event('storage')); });
    await page.getByLabel('Партия материалов', { exact: true }).selectOption('04');
    for (const unit of batch.units) {
      await page.getByLabel('Выбери материал', { exact: true }).selectOption(unit.id);
      const preview = page.getByRole('region', { name: 'Пробное прохождение SAT · DRAFT', exact: true });
      await preview.getByRole('button', { name: 'Пройти SAT-черновик как ученик', exact: true }).click();
      const predictions: string[] = [];
      for (const [index, round] of unit.exercise_data.rounds.entries()) {
        await preview.getByRole('heading', { name: `${index === 0 ? 'Первая задача' : 'Новый текст после разбора'} · ${round.id}`, exact: true }).waitFor();
        assert.equal(await page.evaluate(() => document.activeElement?.tagName), 'H4');
        assert.equal(await preview.getByRole('radio').count(), 0);
        if (index === 0) assert.equal(await preview.getByText(unit.exercise_data.rounds[1].passage, { exact: true }).count(), 0, 'fresh passage hidden');
        await preview.getByRole('button', { name: 'Зафиксировать прогноз и показать варианты', exact: true }).click();
        await preview.getByRole('status').filter({ hasText: 'Сначала сформулируй' }).waitFor();
        const prediction = index === 0 ? 'My independent prediction before choices.' : 'My fresh prediction on the second text.';
        predictions.push(prediction);
        await preview.getByLabel('Твой прогноз до вариантов', { exact: true }).fill(prediction);
        await preview.getByRole('button', { name: 'Зафиксировать прогноз и показать варианты', exact: true }).click();
        assert.equal(await preview.getByLabel('Твой прогноз до вариантов', { exact: true }).isDisabled(), true);
        await preview.getByRole('button', { name: 'Проверить первый выбор', exact: true }).click();
        await preview.getByRole('status').filter({ hasText: 'Выбери вариант.' }).waitFor();
        const selected = index === 0 ? (round.key + 1) % 4 : round.key;
        await preview.getByRole('radio').nth(selected).check();
        if (unit.exercise_data.trainer === 'sat-distractor') {
          await preview.getByRole('button', { name: 'Проверить первый выбор', exact: true }).click();
          await preview.getByRole('status').filter({ hasText: 'трёх оставшихся' }).waitFor();
          for (let choice = 0; choice < 4; choice++) if (choice !== selected) await preview.getByLabel(`Почему вариант ${choice + 1} подходит или не подходит?`, { exact: false }).fill(`Manual synthetic reasoning for option ${choice + 1}; may be right or wrong.`);
        }
        await preview.getByRole('button', { name: 'Проверить первый выбор', exact: true }).click();
        await preview.getByRole('heading', { name: index === 0 ? 'Первый выбор нужно пересмотреть' : 'Выбор совпал с ключом', exact: true }).waitFor();
        assert.equal(await preview.getByRole('radio').nth(selected).isDisabled(), true);
        const next = preview.getByRole('button', { name: index === 0 ? 'Перейти к новому тексту' : 'Сравнить две попытки', exact: true });
        await next.click();
        await preview.getByRole('status').filter({ hasText: 'Запиши, что подтверждает' }).waitFor();
        await preview.getByLabel('Что подтверждает ответ или что ты пересмотрел?', { exact: true }).fill('My manual reflection after the supplied explanation.');
        await preview.getByText('Разбор всех четырёх вариантов', { exact: true }).click();
        if (unit.id === 'RW01' || unit.id === 'RW08') {
          for (const width of [320,390,768,1440]) { await page.setViewportSize({ width, height: 900 }); assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1), false, `SAT draft overflow ${unit.id}/${index}/${width}`); }
          const axe = await new AxeBuilder({ page }).include('main').analyze();
          assert.deepEqual(axe.violations.map(value => ({ id: value.id, targets: value.nodes.map(node => node.target) })), []);
        }
        await next.click();
      }
      await preview.getByRole('heading', { name: 'Сравнение двух первых выборов', exact: true }).waitFor();
      assert.equal(await page.evaluate(() => document.activeElement?.textContent), 'Сравнение двух первых выборов');
      for (const prediction of predictions) await preview.getByText(`Прогноз: ${prediction}`, { exact: true }).waitFor();
      await preview.getByText('Первый выбор не совпал с подготовленным ключом.', { exact: true }).waitFor();
      await preview.getByText('Выбор совпал с подготовленным ключом.', { exact: true }).waitFor();
      await preview.getByRole('button', { name: 'Начать новую временную SAT-пробу', exact: true }).click();
      assert.equal(await preview.getByLabel('Твой прогноз до вариантов', { exact: true }).inputValue(), '');
      assert.equal(await preview.getByRole('radio').count(), 0);
    }
    await page.reload();
    await page.getByLabel('Партия материалов', { exact: true }).selectOption('04');
    assert.equal(await page.getByRole('button', { name: 'Пройти SAT-черновик как ученик', exact: true }).count(), 1);
    assert.equal(await page.evaluate(() => Object.keys(localStorage).filter(key => key.startsWith('ashyq:trainer-review:')).length), 0);
    assert.deepEqual(errors, []);
    console.log('PASS eight SAT draft pairs: invalid data rejected, own predictions before options, frozen wrong first/correct fresh selections, three-reason and reflection gates, first/fresh provenance, focus/reset/temporary reload, four widths and axe. No free-text grading, calibration or publication.');
  } finally { await browser.close(); }
}
main().catch(error => { console.error(error); process.exitCode = 1; });
