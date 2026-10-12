import assert from 'node:assert/strict';
import { chromium } from 'playwright';
import AxeBuilder from '@axe-core/playwright';

async function main() {
  const base = process.env.TRAINER_CHECK_BASE ?? 'http://127.0.0.1:3043';
  assert.ok(['localhost', '127.0.0.1', 'ashyq-diagnostic.vercel.app'].includes(new URL(base).hostname));
  const browser = await chromium.launch({ headless: true });
  try {
    const context = await browser.newContext(), page = await context.newPage();
    const errors: string[] = []; page.on('pageerror', error => errors.push(error.message));
    const response = await page.goto(base + '/trainers/material-review');
    assert.equal(response?.status(), 200);
    await page.getByRole('heading', { name: 'Нужно войти', exact: true }).waitFor();
    assert.equal(await page.getByLabel('Результат проверки', { exact: true }).count(), 0);
    assert.equal(await page.getByRole('button', { name: /Пройти.*черновик/ }).count(), 0);
    for (const width of [320,390,768,1440]) { await page.setViewportSize({ width, height: 900 }); assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1), false, `guest review overflow at ${width}`); }
    const axe = await new AxeBuilder({ page }).include('main').analyze();
    assert.deepEqual(axe.violations.map(value => ({ id: value.id, targets: value.nodes.map(node => node.target) })), []);
    assert.deepEqual(errors, []);
    console.log(`PASS anonymous review gate at ${base}: no decision form or draft trial, four widths and axe. UI-only evidence; no authenticated teacher, RLS or server-authorization certification.`);
  } finally { await browser.close(); }
}
main().catch(error => { console.error(error); process.exitCode = 1; });
