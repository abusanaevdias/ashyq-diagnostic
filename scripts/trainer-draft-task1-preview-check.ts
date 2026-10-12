import assert from 'node:assert/strict';
import { chromium } from 'playwright';
import AxeBuilder from '@axe-core/playwright';
import batch from '../src/data/trainer-drafts/batch-02.json';
import { draftTask1ClaimLabel, draftTask1Words, parseDraftTask1 } from '../src/lib/trainers/draft-task1';

async function main() {
  const units = batch.units.filter(unit => unit.exercise_data.kind === 'task1-pair-v1');
  assert.equal(units.length, 2);
  const original = units[0].exercise_data;
  assert.ok(original.charts);
  for (const value of [null, [], {}, { ...original, publication_ready: true }, { ...original, charts: [original.charts[0], original.charts[0]] }, { ...original, charts: original.charts.map(chart => ({ ...chart, key: [0,0,1] })) }, { ...original, charts: original.charts.map(chart => ({ ...chart, key: [0,1,99] })) }, { ...original, charts: original.charts.map(chart => ({ ...chart, model: 'Too short.' })) }, { ...original, charts: original.charts.map(chart => ({ ...chart, years: [2020,2022,2021,2023] })) }, { ...original, charts: original.charts.map(chart => ({ ...chart, series: chart.series.map(series => ({ ...series, values: [0,0,0,0] })) })) }, { ...original, charts: original.charts.map(chart => ({ ...chart, series: chart.series.map(series => ({ ...series, values: [1,2,3,Infinity] })) })) }]) assert.equal(parseDraftTask1(value), null);
  assert.equal(draftTask1Words(' \n '), 0); assert.equal(draftTask1Words('one\n two  three'), 3);
  const base = process.env.TRAINER_CHECK_BASE ?? 'http://127.0.0.1:3043';
  assert.ok(['localhost','127.0.0.1'].includes(new URL(base).hostname), 'LocalDemo only');
  const browser = await chromium.launch({ headless: true });
  try {
    const context = await browser.newContext(), page = await context.newPage();
    const errors: string[] = []; page.on('pageerror', error => errors.push(error.message));
    await page.goto(base + '/trainers/material-review');
    await page.getByRole('heading', { name: 'Нужно войти', exact: true }).waitFor();
    await page.evaluate(() => { localStorage.setItem('ashyq:v2:session', JSON.stringify({ user: { id: 'synthetic-task1-preview', name: 'Synthetic reviewer', email: 'synthetic@example.invalid', role: 'teacher', avatarColor: 'red' }, expiresAt: new Date(Date.now() + 3600000).toISOString() })); dispatchEvent(new Event('storage')); });
    await page.getByLabel('Партия материалов', { exact: true }).selectOption('02');
    for (const unit of units) {
      const pair = parseDraftTask1(unit.exercise_data); assert.ok(pair);
      await page.getByLabel('Выбери материал', { exact: true }).selectOption(unit.id);
      const preview = page.getByRole('region', { name: 'Пробный Task 1 · DRAFT', exact: true });
      await preview.getByRole('button', { name: 'Пройти Task 1-черновик', exact: true }).click();
      const independent: string[] = [];
      for (const [roundIndex, chart] of pair.charts.entries()) {
        await preview.getByRole('heading', { name: `${roundIndex ? 'Новый график' : 'Первый график'} · Свой обзор`, exact: true }).waitFor();
        if (!roundIndex) assert.equal(await preview.getByText(pair.charts[1].title, { exact: true }).count(), 0);
        assert.equal(await preview.getByText(chart.overview, { exact: false }).count(), 0);
        assert.equal(await preview.getByText(chart.model, { exact: true }).count(), 0);
        await preview.getByRole('button', { name: 'Зафиксировать overview и написать ответ', exact: true }).click();
        await preview.getByRole('status').filter({ hasText: 'ровно три' }).waitFor();
        const selected = roundIndex ? chart.key : [0,3,4];
        for (const i of selected) await preview.getByRole('checkbox', { name: chart.claims[i][0], exact: true }).check();
        await preview.getByRole('button', { name: 'Зафиксировать overview и написать ответ', exact: true }).click();
        await preview.getByRole('status').filter({ hasText: '12 символов' }).waitFor();
        await preview.getByLabel('Свой overview до образца', { exact: true }).fill(`Synthetic own overview for ${unit.id} round ${roundIndex}.`);
        await preview.getByRole('button', { name: 'Зафиксировать overview и написать ответ', exact: true }).click();
        await preview.getByRole('status').filter({ hasText: 'Для каждой выбранной' }).waitFor();
        for (const i of selected) await preview.getByLabel(`Опора в данных · ${chart.claims[i][0]}`, { exact: true }).fill(`Own evidence for claim ${i}, manual interpretation.`);
        await preview.getByRole('button', { name: 'Зафиксировать overview и написать ответ', exact: true }).click();
        await preview.getByLabel('Полный ответ до образца', { exact: true }).fill(Array.from({ length: 149 }, () => 'synthetic').join(' '));
        await preview.getByRole('button', { name: 'Зафиксировать полный ответ и открыть разбор', exact: true }).click();
        await preview.getByRole('status').filter({ hasText: 'не менее 150 слов' }).waitFor();
        assert.equal(await preview.getByText(chart.model, { exact: true }).count(), 0);
        const full = `Independent-${unit.id}-${roundIndex} ` + Array.from({ length: 150 }, () => 'synthetic').join(' '); independent.push(full);
        await preview.getByLabel('Полный ответ до образца', { exact: true }).fill(full);
        await preview.getByRole('button', { name: 'Зафиксировать полный ответ и открыть разбор', exact: true }).click();
        assert.equal(await preview.getByLabel('Полный ответ до образца', { exact: true }).count(), 0, 'independent draft no longer editable');
        assert.equal(await preview.getByLabel('Пересмотренный полный ответ', { exact: true }).inputValue(), full);
        await preview.getByText('Пример полного ответа · ' + draftTask1Words(chart.model) + ' слов', { exact: true }).click();
        await preview.getByText(chart.model, { exact: true }).waitFor();
        // Native details may retain its open state across chart changes.
        // Open if needed; blindly clicking an already-open table closes it.
        const table = preview.getByRole('table');
        if (!await table.isVisible()) await preview.getByText('Точные значения таблицей', { exact: true }).click();
        await table.waitFor();
        assert.equal(await table.count(), 1, `${unit.id}/${roundIndex}: one visible values table`);
        for (const i of selected) await preview.getByText(draftTask1ClaimLabel(chart, i), { exact: true }).first().waitFor();
        const next = preview.getByRole('button', { name: roundIndex ? 'Сравнить две Task 1-попытки' : 'Перейти к новому Task 1-графику', exact: true });
        await preview.getByLabel('Пересмотренный полный ответ', { exact: true }).fill('Short revision.');
        await next.click(); await preview.getByRole('status').filter({ hasText: 'не менее 150 слов' }).waitFor();
        await preview.getByLabel('Пересмотренный полный ответ', { exact: true }).fill(full + ' Revised.');
        await next.click(); await preview.getByRole('status').filter({ hasText: 'Подтверди сравнение' }).waitFor();
        await preview.getByRole('checkbox', { name: 'Сопоставил свой текст с данными; понимаю, что он не получил автоматическую оценку.', exact: true }).check();
        await next.click(); await preview.getByRole('status').filter({ hasText: 'Подтверди сравнение' }).waitFor();
        await preview.getByLabel('Что проверишь на новом графике?', { exact: true }).fill(`Synthetic post-feedback plan ${roundIndex}.`);
        for (const width of [320,390,768,1440]) {
          await page.setViewportSize({ width, height: 900 });
          assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false, `Task1 overflow ${unit.id}/${roundIndex}/${width}`);
          assert.deepEqual((await new AxeBuilder({ page }).include('main').withTags(['wcag2a','wcag2aa','wcag21aa']).analyze()).violations, []);
          if (unit.id === 'T103' && !roundIndex && (width === 390 || width === 1440)) {
            await preview.getByRole('heading', { name: 'Первый график · Разбор и пересмотр', exact: true }).evaluate(element => element.scrollIntoView({ block: 'start', behavior: 'instant' }));
            await page.screenshot({ path: `artifacts/trainers-complete-033/draft-task1-feedback-${width}.png` });
          }
        }
        await next.click();
      }
      await preview.getByRole('heading', { name: 'Сравнение двух Task 1-попыток', exact: true }).waitFor();
      await preview.getByText('Из выбранных особенностей входят в авторский набор: 1 из 3. Другой отбор может быть обоснован вручную.', { exact: true }).waitFor();
      await preview.getByText('Из выбранных особенностей входят в авторский набор: 3 из 3. Другой отбор может быть обоснован вручную.', { exact: true }).waitFor();
      for (const summary of await preview.locator('summary').all()) await summary.click();
      for (const full of independent) { assert.equal(await preview.getByText(full, { exact: true }).count(), 1); assert.equal(await preview.getByText(full + ' Revised.', { exact: true }).count(), 1); }
      await preview.getByRole('button', { name: 'Начать новую временную Task 1-пробу', exact: true }).click();
      assert.equal(await preview.getByLabel('Свой overview до образца', { exact: true }).inputValue(), '');
    }
    await page.reload(); await page.getByLabel('Партия материалов', { exact: true }).selectOption('02'); await page.getByLabel('Выбери материал', { exact: true }).selectOption('T103');
    assert.equal(await page.getByRole('button', { name: 'Пройти Task 1-черновик', exact: true }).count(), 1);
    assert.equal(await page.evaluate(() => Object.keys(localStorage).filter(key => key.startsWith('ashyq:trainer-review:')).length), 0);
    assert.deepEqual(errors, []);
    console.log('PASS two Task1 draft pairs/four charts: malformed data/zero-scale/key guards, own overview/evidence and 149-versus-150 word boundary before model, frozen first/full revisions, true detail versus unsupported claim, explicit review/reflection/fresh chart, separate report/reset/reload, shared chart/table four widths and axe. Word count is quantity only; no free-text grade/publication.');
  } finally { await browser.close(); }
}
main().catch(error => { console.error(error); process.exitCode = 1; });
