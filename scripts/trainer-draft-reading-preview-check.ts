import assert from 'node:assert/strict';
import { chromium } from 'playwright';
import AxeBuilder from '@axe-core/playwright';
import batch from '../src/data/trainer-drafts/batch-06.json';
import batch01 from '../src/data/trainer-drafts/batch-01.json';
import { parseDraftReading, READING_LABELS } from '../src/lib/trainers/draft-reading';

async function main() {
  const original = batch.units[0].exercise_data;
  for (const value of [null, [], {}, { ...original, publication_ready: true }, { ...original, rounds: [original.rounds[0], original.rounds[0]] }, { ...original, rounds: original.rounds.map(round => ({ ...round, claims: [] })) }, { ...original, rounds: original.rounds.map(round => ({ ...round, claims: round.claims.map(claim => ({ ...claim, answer: 'MAYBE' })) })) }, { ...original, rounds: original.rounds.map(round => ({ ...round, claims: round.claims.map(claim => ({ ...claim, evidence: 'fabricated excerpt' })) })) }]) assert.equal(parseDraftReading(value), null);
  const base = process.env.TRAINER_CHECK_BASE ?? 'http://127.0.0.1:3043';
  assert.ok(['localhost','127.0.0.1'].includes(new URL(base).hostname), 'LocalDemo fixtures only');
  const browser = await chromium.launch({ headless: true });
  try {
    const context = await browser.newContext(), page = await context.newPage();
    const errors: string[] = []; page.on('pageerror', error => errors.push(error.message));
    await page.goto(base + '/trainers/material-review');
    await page.getByRole('heading', { name: 'Нужно войти', exact: true }).waitFor();
    await page.evaluate(() => { localStorage.setItem('ashyq:v2:session', JSON.stringify({ user: { id: 'synthetic-reading-preview', name: 'Synthetic reviewer', email: 'synthetic@example.invalid', role: 'teacher', avatarColor: 'red' }, expiresAt: new Date(Date.now() + 3600000).toISOString() })); dispatchEvent(new Event('storage')); });
    await page.getByLabel('Партия материалов', { exact: true }).selectOption('06');
    for (const unit of [...batch.units,...batch01.units.filter(value=>value.id.startsWith('R'))]) {
      await page.getByLabel('Партия материалов', { exact: true }).selectOption(batch01.units.some(value=>value.id===unit.id)?'01':'06');
      const pair = parseDraftReading(unit.exercise_data); assert.ok(pair);
      await page.getByLabel('Выбери материал', { exact: true }).selectOption(unit.id);
      const preview = page.getByRole('region', { name: 'Пробное Reading · DRAFT', exact: true });
      await preview.getByRole('button', { name: 'Пройти Reading-черновик', exact: true }).click();
      for (const [roundIndex, round] of pair.rounds.entries()) {
        await preview.getByRole('heading', { name: `${roundIndex ? 'Новый текст' : 'Первый текст'} · ${round.id}`, exact: true }).waitFor();
        if (!roundIndex) assert.equal(await preview.getByText(pair.rounds[1].text, { exact: true }).count(), 0);
        assert.equal(await preview.getByText(/^Ключ:/).count(), 0, 'feedback hidden');
        await preview.getByRole('button', { name: 'Зафиксировать ответы и открыть разбор', exact: true }).click();
        await preview.getByRole('status').filter({ hasText: 'выбери категорию' }).waitFor();
        for (const [i, claim] of round.claims.entries()) {
          const choice = roundIndex ? claim.answer : READING_LABELS[(READING_LABELS.indexOf(claim.answer) + 1) % 3];
          await preview.getByLabel(`Категория до разбора · ${i+1}`, { exact: true }).selectOption(choice);
          await preview.getByLabel(`Почему эта категория · ${i+1}`, { exact: true }).fill(`Synthetic independent reasoning ${round.id}-${i}.`);
          if (choice !== 'NOT GIVEN') await preview.getByLabel(`Своя цитата из текста · ${i+1}`, { exact: true }).fill(claim.evidence);
        }
        await preview.getByLabel('Своя цитата из текста · 1', { exact: true }).fill('fabricated excerpt absent from passage');
        await preview.getByRole('button', { name: 'Зафиксировать ответы и открыть разбор', exact: true }).click();
        await preview.getByRole('status').filter({ hasText: 'дословно присутствовать' }).waitFor();
        await preview.getByLabel('Своя цитата из текста · 1', { exact: true }).fill(round.claims[0].evidence);
        await preview.getByRole('button', { name: 'Зафиксировать ответы и открыть разбор', exact: true }).click();
        const feedback = preview.getByText(`${roundIndex ? 'Первая категория совпала с ключом.' : 'Первая категория отличается от ключа.'} Качество объяснения не оценивалось.`, { exact: true });
        assert.equal(await feedback.count(), 3);
        assert.ok(await feedback.evaluateAll((elements, correct) => elements.every(element => getComputedStyle(element).borderLeftWidth === (correct ? '0px' : '3px')), !!roundIndex), 'warning stripe only for a differing first category');
        for (let i = 0; i < 3; i++) {
          assert.equal(await preview.getByLabel(`Категория до разбора · ${i+1}`, { exact: true }).isDisabled(), true);
          assert.equal(await preview.getByLabel(`Почему эта категория · ${i+1}`, { exact: true }).isDisabled(), true);
          assert.equal(await preview.getByLabel(`Своя цитата из текста · ${i+1}`, { exact: true }).isDisabled(), true);
        }
        const advance = preview.getByRole('button', { name: roundIndex ? 'Сравнить две Reading-попытки' : 'Перейти к новому Reading-тексту', exact: true });
        await advance.click(); await preview.getByRole('status').filter({ hasText: 'для всех трёх' }).waitFor();
        for (const [i, claim] of round.claims.entries()) await preview.getByLabel(`Категория после разбора · ${i+1}`, { exact: true }).selectOption(READING_LABELS[(READING_LABELS.indexOf(claim.answer) + 1) % 3]);
        await advance.click(); await preview.getByRole('status').filter({ hasText: 'ещё отличается' }).waitFor();
        for (const [i, claim] of round.claims.entries()) await preview.getByLabel(`Категория после разбора · ${i+1}`, { exact: true }).selectOption(claim.answer);
        await advance.click(); await preview.getByRole('status').filter({ hasText: 'минимум 3 символа' }).waitFor();
        await preview.getByLabel('Что проверишь в новом тексте?', { exact: true }).fill(`Synthetic post-feedback plan for ${round.id}.`);
        if (['R01','R02','R03','R06','R10'].includes(unit.id)) for (const width of [320,390,768,1440]) {
          await page.setViewportSize({ width, height: 900 });
          assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false, `overflow ${round.id}/${width}`);
          assert.deepEqual((await new AxeBuilder({ page }).include('main').withTags(['wcag2a','wcag2aa','wcag21aa']).analyze()).violations, []);
          if (unit.id === 'R06' && roundIndex === 0 && (width === 390 || width === 1440)) {
            await preview.getByRole('heading', { name: `1. ${round.claims[0].statement}`, exact: true }).evaluate(element => element.scrollIntoView({ block: 'start', behavior: 'instant' }));
            await page.screenshot({ path: `artifacts/trainers-complete-033/draft-reading-feedback-${width}.png` });
          }
        }
        await advance.click();
      }
      await preview.getByRole('heading', { name: 'Сравнение двух Reading-попыток', exact: true }).waitFor();
      assert.equal(await preview.getByText('Категории до разбора совпали с ключом: 0 из 3. Это не оценка объяснений.', { exact: true }).count(), 1);
      assert.equal(await preview.getByText('Категории до разбора совпали с ключом: 3 из 3. Это не оценка объяснений.', { exact: true }).count(), 1);
      for (const round of pair.rounds) for (let i=0; i<3; i++) await preview.getByText(`Первое объяснение: Synthetic independent reasoning ${round.id}-${i}.`, { exact: true }).waitFor();
      await preview.getByRole('button', { name: 'Начать новую временную Reading-пробу', exact: true }).click();
      assert.equal(await preview.getByLabel('Категория до разбора · 1', { exact: true }).inputValue(), '');
    }
    await page.reload(); await page.getByLabel('Партия материалов', { exact: true }).selectOption('06');
    assert.equal(await page.getByRole('button', { name: 'Пройти Reading-черновик', exact: true }).count(), 1);
    assert.equal(await page.evaluate(() => Object.keys(localStorage).filter(key => key.startsWith('ashyq:trainer-review:')).length), 0);
    assert.deepEqual(errors, []);
    console.log('PASS ten Reading draft pairs/twenty texts/60 first responses including legacy v2: malformed data, hidden feedback/fresh text, own category/reason/exact-quote guards including empty NG excerpt, frozen first evidence, explicit repair/reflection, wrong first/correct fresh reports, reset/reload, four widths and axe. Excerpt relevance/reasoning manual; no IELTS score/publication.');
  } finally { await browser.close(); }
}
main().catch(error => { console.error(error); process.exitCode = 1; });
