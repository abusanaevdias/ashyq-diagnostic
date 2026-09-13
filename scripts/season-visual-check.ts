import { chromium, devices, type Page } from 'playwright';

const BASE = process.env.BASE_URL || 'http://127.0.0.1:3001';

async function audit(page: Page, label: string) {
  const data = await page.evaluate(() => ({
    overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
    title: document.title,
    demo: /demo|демо/i.test(document.body.innerText),
  }));
  if (data.overflow > 0 || !data.demo) throw new Error(`${label}: ${JSON.stringify(data)}`);
  console.log(`PASS ${label}: ${JSON.stringify(data)}`);
}

async function main() {
  const browser = await chromium.launch({ headless: true });
  const desktop = await browser.newContext({ viewport: { width: 1440, height: 1000 }, reducedMotion: 'reduce' });
  const d = await desktop.newPage();
  await d.goto(`${BASE}/season`, { waitUntil: 'networkidle' });
  await audit(d, 'season desktop');
  await d.screenshot({ path: 'screenshots/v3-season-public-desktop.png', fullPage: true });
  await d.goto(`${BASE}/season/current`, { waitUntil: 'networkidle' });
  await audit(d, 'season HQ desktop');
  await d.screenshot({ path: 'screenshots/v3-season-hq-desktop.png', fullPage: true });
  await d.getByRole('button', { name: 'Live Arena' }).click();
  await d.screenshot({ path: 'screenshots/v3-season-live-desktop.png', fullPage: true });
  await d.getByRole('button', { name: 'После сезона' }).click();
  await d.screenshot({ path: 'screenshots/v3-season-journey-desktop.png', fullPage: true });
  await desktop.close();

  const mobile = await browser.newContext({ ...devices['iPhone 12'], viewport: { width: 390, height: 844 }, reducedMotion: 'reduce' });
  const m = await mobile.newPage();
  await m.goto(`${BASE}/season`, { waitUntil: 'networkidle' });
  await audit(m, 'season mobile');
  await m.screenshot({ path: 'screenshots/v3-season-public-mobile.png', fullPage: true });
  await m.goto(`${BASE}/season/current`, { waitUntil: 'networkidle' });
  await audit(m, 'season HQ mobile');
  await m.screenshot({ path: 'screenshots/v3-season-hq-mobile.png', fullPage: true });
  await browser.close();
}

main().catch((error) => { console.error(error); process.exit(1); });
