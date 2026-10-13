import assert from 'node:assert/strict';
import { chromium } from 'playwright';
import AxeBuilder from '@axe-core/playwright';
import batch from '../src/data/trainer-drafts/batch-05.json';
import batch11 from '../src/data/trainer-drafts/batch-11.json';
import batch01 from '../src/data/trainer-drafts/batch-01.json';
import { draftMathChoiceLabel, parseDraftMath, parseDraftMathNumber } from '../src/lib/trainers/draft-math';

async function main() {
  for (const unit of [...batch.units, ...batch11.units,...batch01.units.filter(value=>value.id.startsWith('M'))]) assert.ok(parseDraftMath(unit.exercise_data), unit.id);
  for (const [raw, expected] of [[' 6,5 ',6.5],['-0.5',-0.5],['-.5',-.5],['+6',6],['0006.00',6],['0',0]] as const) assert.equal(parseDraftMathNumber(raw), expected);
  for (const raw of ['', ' ', 'NaN', 'Infinity', '1e2', '6 dollars', '6.5.2', '6.0000000000000001']) assert.equal(parseDraftMathNumber(raw), null);
  const original = batch.units[0].exercise_data;
  for (const value of [null, [], {}, { ...original, publication_ready: true }, { ...original, family: 'unknown' }, { ...original, rounds: [original.rounds[0], original.rounds[0]] }, { ...original, rounds: original.rounds.map(round => ({ ...round, answer: Infinity })) }, { ...original, rounds: original.rounds.map(round => ({ ...round, models: [] })) }, { ...original, rounds: original.rounds.map(round => ({ ...round, models: 'models' in round ? round.models.map(model => ({ ...model, best: true })) : [] })) }]) assert.equal(parseDraftMath(value), null);
  const forensics = batch.units.find(unit => unit.id === 'M06')!.exercise_data;
  assert.equal(parseDraftMath({ ...forensics, rounds: forensics.rounds.map(round => ({ ...round, first_invalid: 99 })) }), null);
  const methods = batch.units.find(unit => unit.id === 'M07')!.exercise_data;
  assert.equal(parseDraftMath({ ...methods, rounds: methods.rounds.map(round => ({ ...round, methods: [] })) }), null);
  const base = process.env.TRAINER_CHECK_BASE ?? 'http://127.0.0.1:3043';
  assert.ok(['localhost','127.0.0.1'].includes(new URL(base).hostname), 'LocalDemo fixtures only');
  const browser = await chromium.launch({ headless: true });
  try {
    const context = await browser.newContext(), page = await context.newPage();
    const errors: string[] = []; page.on('pageerror', error => errors.push(error.message));
    await page.goto(base + '/trainers/material-review');
    await page.getByRole('heading', { name: 'Нужно войти', exact: true }).waitFor();
    await page.evaluate(() => { localStorage.setItem('ashyq:v2:session', JSON.stringify({ user: { id: 'synthetic-math-preview', name: 'Synthetic reviewer', email: 'synthetic@example.invalid', role: 'teacher', avatarColor: 'red' }, expiresAt: new Date(Date.now() + 3600000).toISOString() })); dispatchEvent(new Event('storage')); });
    await page.getByLabel('Партия материалов', { exact: true }).selectOption('05');
    for (const unit of [...batch.units, ...batch11.units,...batch01.units.filter(value=>value.id.startsWith('M'))]) {
      await page.getByLabel('Партия материалов', { exact: true }).selectOption(batch01.units.some(value=>value.id===unit.id)?'01':batch11.units.some(value => value.id === unit.id) ? '11' : '05');
      const pair = parseDraftMath(unit.exercise_data)!;
      await page.getByLabel('Выбери материал', { exact: true }).selectOption(unit.id);
      const preview = page.getByRole('region', { name: 'Пробная математика · DRAFT', exact: true });
      await preview.getByRole('button', { name: 'Пройти Math-черновик', exact: true }).click();
      for (const [index, item] of pair.rounds.entries()) {
        await preview.getByRole('heading', { name: `${index === 0 ? 'Первая задача' : 'Новая задача'} · ${item.id}`, exact: true }).waitFor();
        if (index === 0) assert.equal(await preview.getByText(pair.rounds[1].prompt, { exact: true }).count(), 0);
        if (pair.family !== 'method-switch') assert.equal(await preview.getByRole('radio').count(), 0, 'comparison choices hidden before own attempt');
        await preview.getByRole('button', { name: 'Зафиксировать своё решение', exact: true }).click();
        await preview.getByRole('status').filter({ hasText: 'Запиши модель или действия' }).waitFor();
        const own = `My synthetic first working for ${item.id}.`;
        await preview.getByLabel('Твоя модель или действия до разбора', { exact: true }).fill(own);
        await preview.getByLabel(/^Твой числовой ответ(?: ·|$)/).fill('NaN');
        await preview.getByRole('button', { name: 'Зафиксировать своё решение', exact: true }).click();
        await preview.getByRole('status').filter({ hasText: 'до 15 символов' }).waitFor();
        await preview.getByLabel(/^Твой числовой ответ(?: ·|$)/).fill(String(pair.family === 'method-switch' && index === 0 ? item.answer + 1 : item.answer));
        if (pair.family === 'method-switch') {
          await preview.getByRole('button', { name: 'Зафиксировать своё решение', exact: true }).click();
          await preview.getByRole('status').filter({ hasText: 'каким способом начнёшь' }).waitFor();
          await preview.getByRole('radio').nth(index).check();
        }
        await preview.getByRole('button', { name: 'Зафиксировать своё решение', exact: true }).click();
        assert.equal(await preview.getByLabel('Твоя модель или действия до разбора', { exact: true }).isDisabled(), true);
        assert.equal(await preview.getByLabel(/^Твой числовой ответ(?: ·|$)/).isDisabled(), true);
        let choice = index;
        if (pair.family !== 'method-switch') {
          await preview.getByRole('button', { name: 'Сравнить с разбором', exact: true }).click();
          await preview.getByRole('status').filter({ hasText: pair.family === 'translation' ? 'Выбери модель' : 'Укажи первый неверный переход' }).waitFor();
          const correct = pair.family === 'translation' ? item.models!.findIndex(model => model.best) : item.first_invalid!;
          choice = index === 0 ? (correct + 1) % (pair.family === 'translation' ? item.models!.length : item.steps!.length) : correct;
          await preview.getByRole('radio').nth(choice).check();
        }
        await preview.getByRole('button', { name: 'Сравнить с разбором', exact: true }).click();
        await preview.getByText(draftMathChoiceLabel(item, pair.family, choice), { exact: true }).waitFor();
        await preview.getByRole('heading', { name: pair.family === 'method-switch' && index === 0 ? 'Число отличается от подготовленного ответа' : 'Число совпало с подготовленным ответом', exact: true }).waitFor();
        if (pair.family === 'method-switch') await preview.getByText('Сравнить два допустимых способа', { exact: true }).click();
        const next = preview.getByRole('button', { name: index === 0 ? 'Перейти к новой Math-задаче' : 'Сравнить две Math-попытки', exact: true });
        await next.click(); await preview.getByRole('status').filter({ hasText: 'что проверишь в новой задаче' }).waitFor();
        await preview.getByLabel('Что проверишь в новой задаче?', { exact: true }).fill(`Check the condition and original model for ${item.id}.`);
        await next.click(); await preview.getByRole('status').filter({ hasText: 'отдельную версию решения' }).waitFor();
        await preview.getByLabel('Твоё решение после разбора', { exact: true }).fill(`Synthetic repaired working for ${item.id}.`);
        await preview.getByLabel('Твой числовой ответ после разбора', { exact: true }).fill('1e2');
        await next.click(); await preview.getByRole('status').filter({ hasText: 'отдельную версию решения' }).waitFor();
        await preview.getByLabel('Твой числовой ответ после разбора', { exact: true }).fill(String(unit.id === 'M09' && index === 0 ? item.answer + 1 : item.answer));
        if (['M01','M02','M03','M06','M08',...batch11.units.map(value => value.id)].includes(unit.id)) {
          for (const width of [320,390,768,1440]) { await page.setViewportSize({ width, height: 900 }); assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1), false, `Math draft overflow ${item.id}/${width}`); }
          const axe = await new AxeBuilder({ page }).include('main').analyze(); assert.deepEqual(axe.violations.map(value => ({ id: value.id, targets: value.nodes.map(node => node.target) })), []);
          if (unit.id === 'M12' && index === 0) {
            await page.setViewportSize({ width: 390, height: 900 });
            await preview.getByRole('heading', { name: 'Число совпало с подготовленным ответом', exact: true }).scrollIntoViewIfNeeded();
            await page.screenshot({ path: 'artifacts/trainers-complete-033/draft-math-domain-mobile.png' });
          }
        }
        await next.click();
      }
      await preview.getByRole('heading', { name: 'Сравнение двух Math-попыток', exact: true }).waitFor();
      for (const item of pair.rounds) await preview.getByText(`Свои действия: My synthetic first working for ${item.id}.`, { exact: true }).waitFor();
      for (const item of pair.rounds) await preview.getByText(`Версия решения после помощи: Synthetic repaired working for ${item.id}.`, { exact: true }).waitFor();
      if (unit.id === 'M09') await preview.getByText('После помощи число всё ещё отличается от ключа; проверь решение с учителем.', { exact: true }).waitFor();
      if (pair.family === 'translation') await preview.getByText('Выбор модели нужно пересмотреть; верное число не исправляет выбранную модель.', { exact: true }).waitFor();
      if (pair.family === 'method-switch') { await preview.getByText('Число отличается от подготовленного ответа.', { exact: true }).waitFor(); await preview.getByText('Число совпало с подготовленным ответом.', { exact: true }).waitFor(); }
      await preview.getByRole('button', { name: 'Начать новую временную Math-пробу', exact: true }).click();
      assert.equal(await preview.getByLabel('Твоя модель или действия до разбора', { exact: true }).inputValue(), '');
      assert.equal(await preview.getByLabel(/^Твой числовой ответ(?: ·|$)/).inputValue(), '');
    }
    await page.reload(); await page.getByLabel('Партия материалов', { exact: true }).selectOption('05');
    assert.equal(await page.getByRole('button', { name: 'Пройти Math-черновик', exact: true }).count(), 1);
    assert.equal(await page.evaluate(() => Object.keys(localStorage).filter(key => key.startsWith('ashyq:trainer-review:')).length), 0);
    assert.deepEqual(errors, []);
    console.log('PASS sixteen Math draft pairs/thirty-two problems including legacy v2: malformed data/numeric precision guards, frozen own solution before comparison, correct number with wrong model/step, separate method choice and numeric result, fresh-task/reflection/report/reset, four widths and axe. Working quality manual; no SAT score or publication.');
  } finally { await browser.close(); }
}
main().catch(error => { console.error(error); process.exitCode = 1; });
