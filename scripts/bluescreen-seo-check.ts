import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';
import { chromium } from 'playwright';
import AxeBuilder from '@axe-core/playwright';
import { ASHYQ_BLUESCREEN_POST } from '../src/data/ashyq-bluescreen-post';
import { BLUESCREEN_COVERAGE } from '../src/data/press-coverage';

const base = process.env.BASE_URL || 'http://127.0.0.1:3040';
const shots = 'screenshots/bluescreen-030';
async function main() {
await mkdir(shots, { recursive: true });
const browser = await chromium.launch({ headless: true });
try {
  const context = await browser.newContext();
  const page = await context.newPage();
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  for (const width of [1440, 390, 320]) {
    await page.setViewportSize({ width, height: 1000 });
    const response = await page.goto(`${base}${BLUESCREEN_COVERAGE.postPath}`, { waitUntil: 'networkidle' });
    assert.equal(response?.status(), 200);
    assert.equal(await page.locator('h1').innerText(), ASHYQ_BLUESCREEN_POST.title);
    assert.equal(await page.locator('meta[name="description"]').getAttribute('content'), ASHYQ_BLUESCREEN_POST.metaDescription);
    assert.equal(await page.locator('link[rel="canonical"]').getAttribute('href'), `${process.env.NEXT_PUBLIC_SITE_URL || base}${BLUESCREEN_COVERAGE.postPath}`);
    assert.equal(await page.locator('meta[name="robots"][content*="noindex"]').count(), 0);
    assert(await page.locator('article p').allTextContents().then((p) => p.some((t) => t.startsWith('Bluescreen написал об ASHYQ'))));
    assert.equal(await page.locator('article a').filter({ hasText: 'полное интервью' }).getAttribute('href'), BLUESCREEN_COVERAGE.url);
    const schemas = await page.locator('script[type="application/ld+json"]').allTextContents();
    const parsed = schemas.map((s) => JSON.parse(s));
    const post = parsed.find((s) => s['@type'] === 'BlogPosting');
    assert.deepEqual(post.citation, [BLUESCREEN_COVERAGE.url]);
    const org = parsed.find((s) => s['@type'] === 'EducationalOrganization');
    assert.equal(org.subjectOf[0].url, BLUESCREEN_COVERAGE.url);
    assert(!org.sameAs.includes(BLUESCREEN_COVERAGE.url));
    assert(await page.locator('article img').evaluateAll((imgs) => imgs.every((img) => (img as HTMLImageElement).complete && (img as HTMLImageElement).naturalWidth > 0 && img.getAttribute('alt'))));
    assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
    const audit = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze();
    assert.equal(audit.violations.length, 0, JSON.stringify(audit.violations));
    await page.screenshot({ path: `${shots}/article-${width}.png`, fullPage: true });
    await page.screenshot({ path: `${shots}/article-preview-${width}.png` });
    await page.locator('article img').screenshot({ path: `${shots}/cover-${width}.png` });
  }
  await page.goto(`${base}/about`, { waitUntil: 'networkidle' });
  assert.equal(await page.locator('#press-coverage-heading').innerText(), 'Bluescreen об ASHYQ');
  assert.equal(await page.locator(`a[href="${BLUESCREEN_COVERAGE.postPath}"]`).count(), 1);
  assert((await page.locator('main').innerText()).includes('Ищете ASHYQ EDU?'));
  assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
  const aboutAudit = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze();
  assert.equal(aboutAudit.violations.length, 0, JSON.stringify(aboutAudit.violations));
  await page.locator('section[aria-labelledby="press-coverage-heading"]').screenshot({ path: `${shots}/press-section-320.png` });
  await page.screenshot({ path: `${shots}/about-320.png`, fullPage: true });
  await page.goto(`${base}/blog`, { waitUntil: 'networkidle' });
  await page.getByRole('button', { name: 'Новости ASHYQ', exact: true }).click();
  assert.equal(await page.locator(`main a[href="${BLUESCREEN_COVERAGE.postPath}"]`).count(), 1);
  assert.equal(await page.locator('main article').count(), 1);
  assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
  const sitemap = await page.request.get(`${base}/sitemap.xml`);
  assert((await sitemap.text()).includes(BLUESCREEN_COVERAGE.postPath));
  assert.equal(errors.length, 0, errors.join('\n'));
  console.log('BlueScreen SEO: article 1440/390/320, cover, schema/citation, About, news filter, sitemap and accessibility PASS');
} finally {
  await browser.close();
}
}

main().catch((error) => { console.error(error); process.exitCode = 1; });
