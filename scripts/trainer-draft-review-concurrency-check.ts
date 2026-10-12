import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import { chromium, type BrowserContext, type Page } from 'playwright';
import AxeBuilder from '@axe-core/playwright';
import { decisionSignature, draftBatches, emptyDraftReview, MAX_DRAFT_REVIEW_BYTES, parseDraftReview, reviewKey, type DraftBatch } from '../src/lib/trainers/draft-review';
import { reviewWriteLock } from '../src/lib/trainers/draft-review-storage';

async function main() {
  const batch = draftBatches[2];
  const expanded: DraftBatch = { ...batch, units: Array.from({ length: 100 }, (_, index) => ({ ...batch.units[0], id: `D${index + 100}` })) };
  const large = emptyDraftReview('synthetic-capacity', expanded);
  for (const unit of expanded.units) large.decisions[unit.id] = { decision: 'revise', comment: 'ࠀ'.repeat(3000), attested: false, savedAt: '2026-10-13T00:00:00.000Z' };
  const rawLarge = JSON.stringify(large);
  assert.ok(rawLarge.length > 100_000 && new TextEncoder().encode(rawLarge).byteLength < MAX_DRAFT_REVIEW_BYTES);
  assert.ok(parseDraftReview(rawLarge, 'synthetic-capacity', expanded), 'maximum importer-sized batch can retain valid comments');
  assert.equal(parseDraftReview(' '.repeat(MAX_DRAFT_REVIEW_BYTES + 1), 'synthetic-capacity', expanded), null);
  const example = large.decisions.D100;
  assert.equal(decisionSignature(example), decisionSignature({ savedAt: example.savedAt, attested: example.attested, comment: example.comment, decision: example.decision }));
  assert.notEqual(decisionSignature(example), decisionSignature({ ...example, comment: 'Changed with the same timestamp' }));
  const base = process.env.TRAINER_CHECK_BASE ?? 'http://127.0.0.1:3043';
  assert.ok(['127.0.0.1','localhost'].includes(new URL(base).hostname), 'LocalDemo fixtures only');
  const browser = await chromium.launch({ headless: true });
  const allErrors: string[] = [];
  const dialogs: string[] = [];
  const init = async (context: BrowserContext, id: string) => context.addInitScript(reviewerId => { localStorage.setItem('ashyq:v2:session', JSON.stringify({ user: { id: reviewerId, name: 'Synthetic reviewer', email: 'synthetic@example.invalid', role: 'teacher', avatarColor: 'red' }, expiresAt: new Date(Date.now() + 3600000).toISOString() })); }, id);
  async function open(context: BrowserContext) {
    const page = await context.newPage(); page.on('pageerror', error => allErrors.push(error.message)); page.on('dialog', dialog => { dialogs.push(dialog.type()); void dialog.accept(); });
    await page.goto(base + '/trainers/material-review');
    await page.getByLabel('Партия материалов', { exact: true }).selectOption('03');
    return page;
  }
  async function edit(page: Page, unit: string, comment: string) {
    await page.getByLabel('Выбери материал', { exact: true }).selectOption(unit);
    await page.getByLabel('Результат проверки', { exact: true }).selectOption('revise');
    await page.getByLabel('Замечание', { exact: true }).fill(comment);
  }
  const save = (page: Page) => page.getByRole('button', { name: 'Сохранить решение в этом браузере', exact: true });
  try {
    const context = await browser.newContext(), id = 'synthetic-concurrent-reviewer'; await init(context, id);
    const first = await open(context), second = await open(context), key = reviewKey(id, batch);
    await first.getByLabel('Выбери материал', { exact: true }).selectOption('D13');
    await second.getByLabel('Выбери материал', { exact: true }).selectOption('D13');
    await edit(first, 'D13', 'First tab saved comment.');
    await first.getByRole('link', { name: 'К тренажёрам →', exact: true }).click();
    assert.ok(first.url().includes('/trainers/material-review'));
    await first.getByRole('button', { name: 'Остаться на материале', exact: true }).click();
    assert.equal(await first.getByLabel('Замечание', { exact: true }).inputValue(), 'First tab saved comment.');
    await save(first).click();
    await first.getByRole('status').filter({ hasText: 'Решение для D13 сохранено локально' }).waitFor();
    await edit(second, 'D13', 'Second tab stale comment must be retained in its field.'); await save(second).click();
    await second.getByRole('status').filter({ hasText: 'Этот материал изменён в другой вкладке' }).waitFor();
    assert.equal(await second.getByLabel('Замечание', { exact: true }).inputValue(), 'Second tab stale comment must be retained in its field.');
    let raw = await first.evaluate(value => localStorage.getItem(value), key);
    assert.equal(parseDraftReview(raw, id, batch)?.decisions.D13.comment, 'First tab saved comment.');
    for (const width of [320,390,768,1440]) { await second.setViewportSize({ width, height: 900 }); assert.equal(await second.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1), false, `review conflict overflow ${width}`); }
    const axe = await new AxeBuilder({ page: second }).include('main').analyze(); assert.deepEqual(axe.violations.map(value => ({ id: value.id, targets: value.nodes.map(node => node.target) })), []);
    await second.reload();
    assert.ok(dialogs.includes('beforeunload'), 'dirty editor warns before native reload');
    await second.getByLabel('Партия материалов', { exact: true }).selectOption('03');
    await second.getByLabel('Выбери материал', { exact: true }).selectOption('D13');
    assert.equal(await second.getByLabel('Замечание', { exact: true }).inputValue(), 'First tab saved comment.');
    await second.getByLabel('Замечание', { exact: true }).fill('Second tab explicitly loaded the saved version before editing.'); await save(second).click();
    await second.getByRole('status').filter({ hasText: 'Решение для D13 сохранено локально' }).waitFor();
    await edit(first, 'D14', 'Independent first-tab material.'); await edit(second, 'D15', 'Independent second-tab material.');
    await first.evaluate(async name => { await new Promise<void>(ready => { void navigator.locks.request(name, () => new Promise<void>(release => { (window as unknown as { releaseReviewLock: () => void }).releaseReviewLock = release; ready(); })); }); }, reviewWriteLock(id, batch));
    await save(first).click(); await save(second).click();
    for (const page of [first, second]) { assert.equal(await save(page).isDisabled(), true); assert.equal(await page.getByLabel('Партия материалов', { exact: true }).isDisabled(), true); assert.equal(await page.getByLabel('Замечание', { exact: true }).isDisabled(), true); }
    await first.getByRole('link', { name: 'К тренажёрам →', exact: true }).click();
    assert.ok(first.url().includes('/trainers/material-review'));
    await first.getByRole('status').filter({ hasText: 'Дождись завершения записи перед выходом' }).waitFor();
    await first.evaluate(() => (window as unknown as { releaseReviewLock: () => void }).releaseReviewLock());
    await first.getByRole('status').filter({ hasText: 'Решение для D14 сохранено локально' }).waitFor();
    await second.getByRole('status').filter({ hasText: 'Решение для D15 сохранено локально' }).waitFor();
    raw = await first.evaluate(value => localStorage.getItem(value), key);
    const merged = parseDraftReview(raw, id, batch)!;
    assert.equal(merged.decisions.D14.comment, 'Independent first-tab material.'); assert.equal(merged.decisions.D15.comment, 'Independent second-tab material.');
    assert.equal(merged.decisions.D13.comment, 'Second tab explicitly loaded the saved version before editing.');
    await first.evaluate(value => { localStorage.setItem(value, '{broken'); dispatchEvent(new Event('storage')); }, key);
    await first.getByLabel('Замечание', { exact: true }).fill('This unsaved comment survives a corrupt-record failure.'); await save(first).click();
    await first.getByRole('status').filter({ hasText: 'Локальная запись повреждена' }).waitFor();
    assert.equal(await first.evaluate(value => localStorage.getItem(value), key), '{broken');
    assert.equal(await first.getByRole('button', { name: 'Скачать сохранённые решения', exact: true }).isDisabled(), true);
    const downloaded = first.waitForEvent('download'); await first.getByRole('button', { name: 'Скачать исходную запись для восстановления', exact: true }).click();
    await fs.mkdir('artifacts/trainers-complete-033', { recursive: true });
    const recovery = 'artifacts/trainers-complete-033/synthetic-review-recovery.txt'; await (await downloaded).saveAs(recovery);
    assert.equal(await fs.readFile(recovery, 'utf8'), '{broken');
    await first.evaluate(value => { localStorage.setItem(value, ''); dispatchEvent(new Event('storage')); }, key); await save(first).click();
    await first.getByRole('status').filter({ hasText: 'Локальная запись повреждена' }).waitFor(); assert.equal(await first.evaluate(value => localStorage.getItem(value), key), '', 'empty string is corrupt, not absent');
    await context.close();
    for (const failure of ['quota', 'no-locks', 'timeout']) {
      const isolated = await browser.newContext(), reviewer = `synthetic-review-${failure}`; await init(isolated, reviewer);
      if (failure === 'no-locks') await isolated.addInitScript(() => { Object.defineProperty(navigator, 'locks', { value: undefined, configurable: true }); });
      const page = await open(isolated);
      if (failure === 'quota') await page.evaluate(() => { const original = Storage.prototype.setItem; Storage.prototype.setItem = function(key, value) { if (key.startsWith('ashyq:trainer-review:')) throw new DOMException('Synthetic quota', 'QuotaExceededError'); original.call(this, key, value); }; });
      if (failure === 'timeout') await page.evaluate(async name => { await new Promise<void>(ready => { void navigator.locks.request(name, () => new Promise<void>(release => { (window as unknown as { releaseReviewLock: () => void }).releaseReviewLock = release; ready(); })); }); }, reviewWriteLock(reviewer, batch));
      await edit(page, 'D13', `Unsaved ${failure} comment remains available to copy.`); await save(page).click();
      await page.getByRole('status').filter({ hasText: failure === 'quota' ? 'Браузер не разрешил сохранение' : failure === 'no-locks' ? 'не поддерживает безопасное сохранение' : 'слишком долго удерживает запись' }).waitFor();
      assert.equal(await page.getByLabel('Замечание', { exact: true }).inputValue(), `Unsaved ${failure} comment remains available to copy.`);
      assert.equal(await page.evaluate(value => localStorage.getItem(value), reviewKey(reviewer, batch)), null);
      if (failure === 'timeout') {
        await page.evaluate(() => (window as unknown as { releaseReviewLock: () => void }).releaseReviewLock());
        assert.equal(await page.evaluate(value => localStorage.getItem(value), reviewKey(reviewer, batch)), null, 'aborted request does not write after lock release');
        await save(page).click(); await page.getByRole('status').filter({ hasText: 'Решение для D13 сохранено локально' }).waitFor();
      } else {
        await page.getByRole('link', { name: 'К тренажёрам →', exact: true }).click();
        await page.getByRole('link', { name: 'Перейти без сохранения', exact: true }).click();
        await page.waitForURL('**/trainers');
      }
      await isolated.close();
    }
    assert.deepEqual(allErrors, []);
    console.log('PASS review capacity/UTF-8/signatures, two-tab stale same-unit protection, locked merge of different units, pending edit/navigation guards, real beforeunload/explicit discard, corrupt/empty record preservation and exact recovery download, quota/no-lock retention and 10s abort/retry, four widths and axe. Synthetic local decisions only; no methodological approval.');
  } finally { await browser.close(); }
}
main().catch(error => { console.error(error); process.exitCode = 1; });
