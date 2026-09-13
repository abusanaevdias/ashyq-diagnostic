import { chromium, type Page } from 'playwright';

const BASE = process.env.BASE_URL ?? 'http://127.0.0.1:3001';

async function inspect(page: Page, label: string) {
  await page.goto(BASE, { waitUntil: 'networkidle' });
  await page.evaluate(() => document.fonts.ready);
  const sections = page.locator('main section');
  for (let index = 0; index < await sections.count(); index += 1) {
    await sections.nth(index).scrollIntoViewIfNeeded();
    await page.waitForTimeout(300);
  }
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
  const metrics = await page.evaluate(() => ({
    overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
    title: document.querySelector('h1')?.textContent?.trim(),
    logoHeight: Math.round(document.querySelector('nav img')?.getBoundingClientRect().height ?? 0),
    redButtons: document.querySelectorAll('button[class*="buttonRed"], a[class*="buttonRed"]').length,
  }));
  if (metrics.overflow > 0) throw new Error(`${label}: horizontal overflow ${metrics.overflow}px`);
  if (metrics.logoHeight < 20 || metrics.logoHeight > 22) throw new Error(`${label}: wordmark height ${metrics.logoHeight}px`);
  if (!metrics.title?.includes('Больше, чем подготовка')) throw new Error(`${label}: missing v3 hero`);
  console.log(`${label}:`, metrics);
}

async function main() {
  const browser = await chromium.launch({ args: ['--no-sandbox'] });
  const desktop = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
  await inspect(desktop, 'desktop-1440');
  await desktop.screenshot({ path: 'screenshots/v3-home-desktop.png', fullPage: true });

  const mobile = await browser.newPage({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  await inspect(mobile, 'mobile-390');
  const cta = await mobile.locator('#hero').getByRole('button', { name: 'Начать диагностику IELTS' }).boundingBox();
  if (!cta || cta.y + cta.height > 844) throw new Error(`mobile-390: primary CTA is below the fold (${cta ? cta.y + cta.height : 'missing'})`);
  const smallTargets = await mobile.locator('header a, header button, header summary, main a, main button, footer a').evaluateAll((elements) => elements.flatMap((element) => {
    const rect = element.getBoundingClientRect();
    const visible = rect.width > 0 && rect.height > 0 && getComputedStyle(element).visibility !== 'hidden';
    return visible && (rect.width < 44 || rect.height < 44) ? [{ name: element.textContent?.trim() || element.getAttribute('aria-label'), width: Math.round(rect.width), height: Math.round(rect.height) }] : [];
  }));
  if (smallTargets.length) throw new Error(`mobile-390: undersized tap targets ${JSON.stringify(smallTargets)}`);
  await mobile.screenshot({ path: 'screenshots/v3-home-mobile.png', fullPage: true });

  const reduced = await browser.newPage({ viewport: { width: 390, height: 844 }, reducedMotion: 'reduce' });
  await reduced.goto(BASE, { waitUntil: 'networkidle' });
  const transition = await reduced.locator('#hero button').first().evaluate((element) => getComputedStyle(element).transitionDuration);
  if (transition !== '0s') throw new Error(`reduced-motion: transition remains ${transition}`);
  console.log('reduced-motion:', transition);
  await browser.close();
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
