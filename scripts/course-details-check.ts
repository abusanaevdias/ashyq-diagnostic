import { mkdir } from 'node:fs/promises';
import path from 'node:path';
import { chromium, type Page } from 'playwright';

const BASE_URL = (process.env.BASE_URL ?? 'http://127.0.0.1:3027').replace(/\/$/, '');
const EXPECTED_ORIGIN = (process.env.EXPECTED_ORIGIN ?? 'https://ashyq.example').replace(/\/$/, '');
const SCREENSHOT_DIR = path.resolve('screenshots');

const COURSES = [
  {
    slug: 'ielts',
    title: 'IELTS',
    modules: ['Reading', 'Listening', 'Writing', 'Speaking'],
    ctaName: 'Начать диагностику IELTS',
  },
  {
    slug: 'sat',
    title: 'SAT',
    modules: ['Reading & Writing', 'Math'],
    ctaName: 'Начать диагностику SAT',
  },
] as const;

const VIEWPORTS = [
  { width: 1440, height: 900, mobile: false },
  { width: 390, height: 844, mobile: true },
] as const;

type Result = { name: string; ok: boolean; detail?: string };
const results: Result[] = [];

function check(name: string, ok: boolean, detail?: string) {
  results.push({ name, ok, detail });
  console.log(`${ok ? 'PASS' : 'FAIL'} ${name}${detail ? ` (${detail})` : ''}`);
}

function normalizeUrl(value: string): string {
  return value.replace(/\/$/, '');
}

async function revealFullPage(page: Page) {
  for (let index = 0; index < 20; index += 1) {
    const pending = page.locator('[data-pending]').first();
    if (await pending.count() === 0) break;
    await pending.scrollIntoViewIfNeeded();
    await page.waitForTimeout(320);
  }
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'auto' }));
  await page.waitForTimeout(100);
}

async function collectTapTargetFailures(page: Page) {
  return page.locator('body').evaluate(() => {
    const selector = [
      'a[href]',
      'button:not([disabled])',
      'input:not([disabled]):not([type="hidden"])',
      'select:not([disabled])',
      'textarea:not([disabled])',
      'summary',
      '[role="button"]',
      '[role="tab"]',
    ].join(',');

    return [...document.querySelectorAll<HTMLElement>(selector)].flatMap((element) => {
      const input = element instanceof HTMLInputElement ? element : null;
      const target = input && (input.type === 'checkbox' || input.type === 'radio')
        ? element.closest<HTMLElement>('label') ?? element
        : element;
      const rect = target.getBoundingClientRect();
      const style = getComputedStyle(element);
      const visible = rect.width > 0 && rect.height > 0 && style.display !== 'none' &&
        style.visibility !== 'hidden' && element.getAttribute('aria-hidden') !== 'true';
      const inlineTextLink = element.tagName === 'A' && style.display === 'inline';

      if (!visible || inlineTextLink || (rect.width >= 44 && rect.height >= 44)) return [];
      return [{
        label: element.getAttribute('aria-label') ?? element.textContent?.trim().slice(0, 60) ?? element.tagName,
        width: Math.round(rect.width),
        height: Math.round(rect.height),
      }];
    });
  });
}

async function auditCourse(
  page: Page,
  course: (typeof COURSES)[number],
  viewport: (typeof VIEWPORTS)[number],
) {
  const prefix = `/courses/${course.slug} ${viewport.width}`;
  const browserErrors: string[] = [];
  page.on('console', (message) => {
    if (message.type() === 'error') browserErrors.push(`console: ${message.text()}`);
  });
  page.on('pageerror', (error) => browserErrors.push(`page: ${error.message}`));

  const response = await page.goto(`${BASE_URL}/courses/${course.slug}`, { waitUntil: 'networkidle' });
  await page.evaluate(() => document.fonts.ready);

  check(`${prefix}: HTTP 200`, response?.status() === 200, `HTTP ${response?.status() ?? 'no response'}`);
  check(
    `${prefix}: landmarks`,
    await page.locator('header').count() === 1 &&
      await page.locator('main').count() === 1 &&
      await page.locator('footer').count() === 1,
  );
  check(`${prefix}: exactly one h1`, await page.locator('h1').count() === 1, `${await page.locator('h1').count()} h1`);

  const mainText = await page.locator('main').innerText();
  for (const moduleName of course.modules) {
    check(`${prefix}: module ${moduleName}`, mainText.includes(moduleName));
  }

  check(`${prefix}: provisional marker`, mainText.toLocaleLowerCase('ru').includes('предварительная информация'));
  for (const field of ['Длительность', 'Расписание', 'Преподаватель', 'Стоимость']) {
    const uncertainty = new RegExp(`${field}[\\s\\S]{0,160}(уточняется|не утвержден(?:о|ы|а)?)`, 'i');
    check(`${prefix}: ${field.toLowerCase()} is uncertain`, uncertainty.test(mainText));
  }

  const cta = page.getByRole('link', { name: course.ctaName, exact: true });
  check(`${prefix}: diagnostic CTA name`, await cta.count() >= 1, `${await cta.count()} links`);
  if (await cta.count()) {
    check(
      `${prefix}: diagnostic CTA href`,
      await cta.first().getAttribute('href') === `/?start=${course.slug}`,
      (await cta.first().getAttribute('href')) ?? 'missing href',
    );
  }

  const canonical = page.locator('link[rel="canonical"]');
  const canonicalHref = await canonical.first().getAttribute('href');
  const expectedCanonical = `${EXPECTED_ORIGIN}/courses/${course.slug}`;
  check(
    `${prefix}: canonical`,
    await canonical.count() === 1 && canonicalHref !== null && normalizeUrl(canonicalHref) === normalizeUrl(expectedCanonical),
    canonicalHref ?? 'missing',
  );
  const robots = await page.locator('meta[name="robots"]').allTextContents();
  const robotsContent = await page.locator('meta[name="robots"]').evaluateAll((elements) =>
    elements.map((element) => element.getAttribute('content') ?? ''),
  );
  check(`${prefix}: indexable`, ![...robots, ...robotsContent].some((value) => /noindex/i.test(value)));

  const imageAlts = await page.locator('main img').evaluateAll((images) =>
    images.map((image) => image.getAttribute('alt')),
  );
  check(
    `${prefix}: image alts`,
    imageAlts.length > 0 && imageAlts.every((alt) => Boolean(alt?.trim())),
    `${imageAlts.length} images`,
  );
  check(`${prefix}: FAQ has at least 3 items`, await page.locator('main details').count() >= 3, `${await page.locator('main details').count()} items`);

  const overflow = await page.evaluate(() =>
    Math.max(0, document.documentElement.scrollWidth - document.documentElement.clientWidth),
  );
  check(`${prefix}: no horizontal overflow`, overflow === 0, `${overflow}px`);

  if (viewport.mobile) {
    const undersized = await collectTapTargetFailures(page);
    check(`${prefix}: mobile tap targets >=44px`, undersized.length === 0, JSON.stringify(undersized));
  }

  await revealFullPage(page);
  await page.screenshot({
    path: path.join(SCREENSHOT_DIR, `course-${course.slug}-${viewport.width}.png`),
    fullPage: true,
  });
  check(`${prefix}: no browser errors`, browserErrors.length === 0, browserErrors.join(' | '));
}

async function auditNotFound(page: Page, viewport: (typeof VIEWPORTS)[number]) {
  const prefix = `/courses/toefl ${viewport.width}`;
  const browserErrors: string[] = [];
  page.on('console', (message) => {
    const text = message.text();
    const expectedNavigation404 = message.type() === 'error' &&
      /Failed to load resource: the server responded with a status of 404/i.test(text);
    if (message.type() === 'error' && !expectedNavigation404) browserErrors.push(`console: ${text}`);
  });
  page.on('pageerror', (error) => browserErrors.push(`page: ${error.message}`));

  const response = await page.goto(`${BASE_URL}/courses/toefl`, { waitUntil: 'networkidle' });
  check(`${prefix}: real HTTP 404`, response?.status() === 404, `HTTP ${response?.status() ?? 'no response'}`);

  const bodyText = await page.locator('body').innerText();
  check(`${prefix}: branded not-found copy`, bodyText.includes('Такой страницы нет'));
  const noindex = await page.locator('meta[name="robots"]').evaluateAll((elements) =>
    elements.some((element) => /noindex/i.test(element.getAttribute('content') ?? '')),
  );
  check(`${prefix}: noindex`, noindex);
  const overflow = await page.evaluate(() =>
    Math.max(0, document.documentElement.scrollWidth - document.documentElement.clientWidth),
  );
  check(`${prefix}: no horizontal overflow`, overflow === 0, `${overflow}px`);

  await page.screenshot({
    path: path.join(SCREENSHOT_DIR, `course-toefl-${viewport.width}.png`),
    fullPage: true,
  });
  check(`${prefix}: no browser errors`, browserErrors.length === 0, browserErrors.join(' | '));
}

async function main() {
  await mkdir(SCREENSHOT_DIR, { recursive: true });
  const browser = await chromium.launch({ headless: true, args: ['--no-sandbox'] });

  try {
    for (const viewport of VIEWPORTS) {
      const context = await browser.newContext({
        viewport: { width: viewport.width, height: viewport.height },
        isMobile: viewport.mobile,
        hasTouch: viewport.mobile,
      });
      for (const course of COURSES) {
        const page = await context.newPage();
        try {
          await auditCourse(page, course, viewport);
        } catch (error) {
          check(`/courses/${course.slug} ${viewport.width}: audit completed`, false, error instanceof Error ? error.message : String(error));
        } finally {
          await page.close();
        }
      }

      const notFoundPage = await context.newPage();
      try {
        await auditNotFound(notFoundPage, viewport);
      } catch (error) {
        check(`/courses/toefl ${viewport.width}: audit completed`, false, error instanceof Error ? error.message : String(error));
      } finally {
        await notFoundPage.close();
        await context.close();
      }
    }
  } finally {
    await browser.close();
  }

  const failures = results.filter((result) => !result.ok);
  console.log(`\n=== COURSE DETAILS: ${results.length - failures.length}/${results.length} PASS ===`);
  if (failures.length) {
    console.log('Failed checks:');
    failures.forEach((failure) => console.log(` - ${failure.name}${failure.detail ? ` (${failure.detail})` : ''}`));
    process.exit(1);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
