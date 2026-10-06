import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';
import { chromium } from 'playwright';
import AxeBuilder from '@axe-core/playwright';

const base = process.env.BASE_URL || 'http://127.0.0.1:3034';

async function main() {
  const browser = await chromium.launch({ headless: true });
  try {
    const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
    const page = await context.newPage();
    const errors: string[] = [];
    page.on('pageerror', (error) => errors.push(error.message));
    const response = await page.goto(`${base}/press`, { waitUntil: 'networkidle' });
    assert.equal(response?.status(), 200);
    assert.equal(await page.getByRole('heading', { level: 1 }).count(), 1);
    assert.match(await page.title(), /ASHYQ для СМИ/);
    assert.ok((await page.locator('link[rel="canonical"]').getAttribute('href'))?.endsWith('/press'));
    assert.ok(!(await page.locator('meta[name="robots"]').getAttribute('content'))?.includes('noindex'));
    const text = await page.locator('main').innerText();
    for (const value of ['42 раздела', '322 уникальных', '148 с автоматической', '174 со сравнением', 'не AI-оценивание', 'не официальный IELTS/SAT score', 'не реальные работы учеников']) assert.ok(text.includes(value), value);
    assert.equal(await page.locator('main a[href="mailto:ashyqhub@gmail.com"]').count(), 1);
    const coverage = page.getByRole('region', { name: 'Публикации об ASHYQ', exact: true });
    assert.match(await coverage.innerText(), /5 октября 2026 года.*Bluescreen/);
    assert.match(await coverage.innerText(), /Жанна Аксентий/);
    assert.equal(await coverage.locator('a[href^="https://bluescreen.kz/"]').count(), 1);
    assert.equal(await coverage.locator('a[href="/blog/ashyq-bluescreen-interview"]').count(), 1);
    const news = await context.request.get(`${base}/blog/ashyq-bluescreen-interview`);
    assert.equal(news.status(), 200);
    assert.match(await news.text(), /href="\/press"/);
    const links = await page.locator('main a').evaluateAll((anchors) => anchors.map((anchor) => anchor.getAttribute('href') || ''));
    for (const href of new Set(links.filter((href) => href.startsWith('/')))) {
      const url = new URL(href, base);
      const resource = await context.request.get(url.href);
      assert.equal(resource.status(), 200, href);
      if (url.pathname.endsWith('.pdf')) assert.ok((await resource.body()).subarray(0, 5).toString().startsWith('%PDF-'), href);
    }
    const sitemap = await context.request.get(`${base}/sitemap.xml`);
    assert.match(await sitemap.text(), /\/press<\/loc>/);
    await mkdir('screenshots', { recursive: true });
    for (const width of [1440, 390, 320]) {
      await page.setViewportSize({ width, height: 900 });
      assert.equal(await page.evaluate(() => Math.max(0, document.documentElement.scrollWidth - innerWidth)), 0, `overflow ${width}`);
      const axe = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze();
      assert.deepEqual(axe.violations, [], `axe ${width}`);
      await page.screenshot({ path: `screenshots/press-${width}.png`, fullPage: true });
    }
    await page.getByRole('link', { name: 'Попробовать интерактивный Reading', exact: true }).click();
    await page.waitForURL('**/library/reading-equipment#r01-b');
    assert.equal(new URL(page.url()).hash, '#r01-b');
    const quiz = page.getByRole('region', { name: 'Интерактивная практика R01-B', exact: true });
    await quiz.getByRole('radio', { name: 'FALSE', exact: true }).check();
    await quiz.getByRole('button', { name: 'Проверить ответ', exact: true }).click();
    assert.ok((await quiz.getByRole('status').first().innerText()).startsWith('Верно'));
    await page.goto(`${base}/press`, { waitUntil: 'networkidle' });
    await page.getByRole('link', { name: 'Открыть предварительную диагностику', exact: true }).click();
    await page.waitForURL('**/diagnostic');
    assert.equal(new URL(page.url()).pathname, '/diagnostic');
    assert.deepEqual(errors, []);
    console.log('PASS press: HTTP/meta/canonical/indexability, source counts/limits, contact, public links/PDFs/sitemap, axe and overflow 1440/390/320, actual Reading check and diagnostic navigation, no page errors');
  } finally { await browser.close(); }
}
main().catch((error) => { console.error(error); process.exitCode = 1; });
