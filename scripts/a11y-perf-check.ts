import { execFile } from 'node:child_process';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { promisify } from 'node:util';
import AxeBuilder from '@axe-core/playwright';
import { launch } from 'chrome-launcher';
import { chromium, type BrowserContext, type Page } from 'playwright';

const execFileAsync = promisify(execFile);
const BASE_URL = (process.env.BASE_URL ?? 'http://127.0.0.1:3000').replace(/\/$/, '');
const OUTPUT_DIR = path.resolve(process.env.A11Y_PERF_OUTPUT ?? 'artifacts/a11y-perf');
const PERFORMANCE_MIN = Number(process.env.LIGHTHOUSE_PERFORMANCE_MIN ?? '0.9');
const ACCESSIBILITY_MIN = Number(process.env.LIGHTHOUSE_ACCESSIBILITY_MIN ?? '0.95');

const PUBLIC_ROUTES = [
  '/',
  '/about',
  '/blog',
  '/blog/ielts-true-false-not-given',
  '/blog/sat-math-module-time',
  '/community',
  '/contacts',
  '/courses',
  '/courses/ielts',
  '/courses/sat',
  '/courses/ielts/lessons',
  '/courses/sat/lessons/math-time',
  '/diagnostic',
  '/faq',
  '/login',
  '/maintenance',
  '/privacy',
  '/program',
  '/progress',
  '/search',
  '/season',
  '/season/current',
  '/terms',
] as const;

type Route = (typeof PUBLIC_ROUTES)[number];

interface RouteAudit {
  route: Route;
  viewport: 'desktop-1440' | 'mobile-390';
  axeViolations: Array<{ id: string; impact: string | null; nodes: number; help: string }>;
  horizontalOverflow: number;
  undersizedTargets: Array<{ label: string; width: number; height: number }>;
  focusIndicator: { checked: number; failures: string[] };
  reducedMotionFailures: Array<{ label: string; animation: string; transition: string }>;
}

interface LighthouseSummary {
  route: Route;
  performance: number;
  accessibility: number;
  lcpMs: number | null;
  cls: number | null;
}

function slug(route: Route): string {
  return route === '/' ? 'home' : route.slice(1).replaceAll('/', '-');
}

function durationMs(value: string): number {
  return value.split(',').reduce((max, part) => {
    const item = part.trim();
    const amount = Number.parseFloat(item);
    if (!Number.isFinite(amount)) return max;
    return Math.max(max, item.endsWith('ms') ? amount : amount * 1000);
  }, 0);
}

async function inspectFocus(page: Page): Promise<RouteAudit['focusIndicator']> {
  const failures: string[] = [];
  const seen = new Set<string>();
  const focusableCount = await page.locator(
    'a[href], button:not([disabled]), input:not([disabled]):not([type="hidden"]), select:not([disabled]), textarea:not([disabled]), summary, [tabindex]:not([tabindex="-1"])',
  ).count();
  const tabLimit = Math.min(focusableCount + 1, 80);

  for (let index = 0; index < tabLimit; index += 1) {
    await page.keyboard.press('Tab');
    const result = await page.evaluate(() => {
      const element = document.activeElement as HTMLElement | null;
      if (!element || element === document.body) return null;
      const style = getComputedStyle(element);
      const rect = element.getBoundingClientRect();
      const focusable = [...document.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), input:not([disabled]):not([type="hidden"]), select:not([disabled]), textarea:not([disabled]), summary, [tabindex]:not([tabindex="-1"])',
      )];
      return {
        key: `${element.tagName}:${focusable.indexOf(element)}`,
        label: element.getAttribute('aria-label') ?? element.textContent?.trim().slice(0, 60) ?? element.tagName,
        visible: rect.width > 0 && rect.height > 0,
        outlineWidth: Number.parseFloat(style.outlineWidth) || 0,
        outlineStyle: style.outlineStyle,
        boxShadow: style.boxShadow,
      };
    });
    if (!result?.visible || seen.has(result.key)) continue;
    seen.add(result.key);
    const hasIndicator =
      (result.outlineStyle !== 'none' && result.outlineWidth >= 2) ||
      (result.boxShadow !== 'none' && result.boxShadow !== 'rgba(0, 0, 0, 0) 0px 0px 0px 0px');
    if (!hasIndicator) failures.push(result.label);
  }

  return { checked: seen.size, failures };
}

async function auditRoute(context: BrowserContext, route: Route, viewport: RouteAudit['viewport']): Promise<RouteAudit> {
  const page = await context.newPage();
  await page.goto(`${BASE_URL}${route}`, { waitUntil: 'networkidle' });
  await page.evaluate(() => document.fonts.ready);

  const axe = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
    .analyze();

  const layout = await page.evaluate(() => {
    const interactive = [...document.querySelectorAll<HTMLElement>(
      'a, button, input:not([type="hidden"]), select, textarea, summary, [role="tab"]',
    )];
    const undersizedTargets = interactive.flatMap((element) => {
      const input = element instanceof HTMLInputElement ? element : null;
      const target = input && (input.type === 'checkbox' || input.type === 'radio')
        ? element.closest<HTMLElement>('label') ?? element
        : element;
      const rect = target.getBoundingClientRect();
      const style = getComputedStyle(element);
      const visible = rect.width > 0 && rect.height > 0 && style.visibility !== 'hidden' && style.display !== 'none';
      const inlineTextLink = element.tagName === 'A' && style.display === 'inline';
      if (!visible || inlineTextLink || (rect.width >= 44 && rect.height >= 44)) return [];
      return [{
        label: element.getAttribute('aria-label') ?? element.textContent?.trim().slice(0, 60) ?? element.tagName,
        width: Math.round(rect.width),
        height: Math.round(rect.height),
      }];
    });

    const reducedMotionFailures = [...document.querySelectorAll<HTMLElement>('body *')].flatMap((element) => {
      const rect = element.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) return [];
      const style = getComputedStyle(element);
      const animation = style.animationDuration;
      const transition = style.transitionDuration;
      const hasDuration = [...animation.split(','), ...transition.split(',')].some((part) => {
        const item = part.trim();
        const amount = Number.parseFloat(item);
        return Number.isFinite(amount) && amount > 0;
      });
      if (!hasDuration) return [];
      return [{
        label: element.getAttribute('aria-label') ?? element.textContent?.trim().slice(0, 60) ?? element.tagName,
        animation,
        transition,
      }];
    });

    return {
      horizontalOverflow: Math.max(0, document.documentElement.scrollWidth - document.documentElement.clientWidth),
      undersizedTargets,
      reducedMotionFailures,
    };
  });

  const focusIndicator = await inspectFocus(page);
  await page.close();

  return {
    route,
    viewport,
    axeViolations: axe.violations.map(({ id, impact, nodes, help }) => ({ id, impact: impact ?? null, nodes: nodes.length, help })),
    ...layout,
    undersizedTargets: viewport === 'mobile-390' ? layout.undersizedTargets : [],
    focusIndicator,
  };
}

async function runLighthouse(route: Route, port: number): Promise<LighthouseSummary> {
  const outputPath = path.join(OUTPUT_DIR, `lighthouse-${slug(route)}.json`);
  const cliPath = path.resolve('node_modules/lighthouse/cli/index.js');
  await execFileAsync(
    process.execPath,
    [
      cliPath,
      `${BASE_URL}${route}`,
      '--quiet',
      `--port=${port}`,
      '--preset=desktop',
      '--only-categories=performance,accessibility',
      '--output=json',
      `--output-path=${outputPath}`,
    ],
    { maxBuffer: 4 * 1024 * 1024 },
  );
  const report = JSON.parse(await readFile(outputPath, 'utf8')) as {
    categories: { performance: { score: number | null }; accessibility: { score: number | null } };
    audits: { 'largest-contentful-paint': { numericValue?: number }; 'cumulative-layout-shift': { numericValue?: number } };
  };
  return {
    route,
    performance: report.categories.performance.score ?? 0,
    accessibility: report.categories.accessibility.score ?? 0,
    lcpMs: report.audits['largest-contentful-paint'].numericValue ?? null,
    cls: report.audits['cumulative-layout-shift'].numericValue ?? null,
  };
}

async function main() {
  await mkdir(OUTPUT_DIR, { recursive: true });
  const browser = await chromium.launch({ headless: true, args: ['--no-sandbox'] });
  const desktop = await browser.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: 'reduce' });
  const mobile = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, reducedMotion: 'reduce' });
  const routeAudits: RouteAudit[] = [];

  for (const route of PUBLIC_ROUTES) {
    for (const [context, viewport] of [[desktop, 'desktop-1440'], [mobile, 'mobile-390']] as const) {
      const result = await auditRoute(context, route, viewport);
      routeAudits.push(result);
      console.log(`AUDITED ${route} ${viewport}`);
    }
  }
  await desktop.close();
  await mobile.close();
  await browser.close();

  const lighthouse: LighthouseSummary[] = [];
  const chrome = await launch({
    chromePath: chromium.executablePath(),
    chromeFlags: ['--headless=new', '--no-sandbox', '--disable-dev-shm-usage'],
    logLevel: 'silent',
  });
  try {
    for (const route of PUBLIC_ROUTES) {
      const result = await runLighthouse(route, chrome.port);
      lighthouse.push(result);
      console.log(`PASS Lighthouse ${route}: performance ${Math.round(result.performance * 100)}, accessibility ${Math.round(result.accessibility * 100)}`);
    }
  } finally {
    try {
      chrome.kill();
    } catch (error) {
      if (process.platform !== 'win32') throw error;
      console.warn('WARN Lighthouse: Windows could not remove the shared temporary Chrome profile');
    }
  }

  const report = { generatedAt: new Date().toISOString(), baseUrl: BASE_URL, performanceMinimum: PERFORMANCE_MIN, accessibilityMinimum: ACCESSIBILITY_MIN, routeAudits, lighthouse };
  await writeFile(path.join(OUTPUT_DIR, 'summary.json'), `${JSON.stringify(report, null, 2)}\n`, 'utf8');

  const failures: string[] = [];
  for (const result of routeAudits) {
    const label = `${result.route} ${result.viewport}`;
    if (result.axeViolations.length) failures.push(`${label}: axe ${result.axeViolations.map((item) => `${item.id}(${item.nodes})`).join(', ')}`);
    if (result.horizontalOverflow > 0) failures.push(`${label}: overflow ${result.horizontalOverflow}px`);
    if (result.viewport === 'mobile-390' && result.undersizedTargets.length) failures.push(`${label}: tap targets ${JSON.stringify(result.undersizedTargets)}`);
    if (result.focusIndicator.checked === 0) failures.push(`${label}: keyboard focus did not reach a visible control`);
    if (result.focusIndicator.failures.length) failures.push(`${label}: missing focus indicator ${result.focusIndicator.failures.join(', ')}`);
    if (result.reducedMotionFailures.some((item) => durationMs(item.animation) > 0 || durationMs(item.transition) > 0)) {
      failures.push(`${label}: reduced-motion ${JSON.stringify(result.reducedMotionFailures.slice(0, 5))}`);
    }
  }
  for (const result of lighthouse) {
    if (result.performance < PERFORMANCE_MIN) failures.push(`${result.route}: Lighthouse performance ${Math.round(result.performance * 100)} < ${Math.round(PERFORMANCE_MIN * 100)}`);
    if (result.accessibility < ACCESSIBILITY_MIN) failures.push(`${result.route}: Lighthouse accessibility ${Math.round(result.accessibility * 100)} < ${Math.round(ACCESSIBILITY_MIN * 100)}`);
  }

  if (failures.length) throw new Error(`A11Y/PERF gate failed:\n- ${failures.join('\n- ')}`);
  console.log(`PASS A11Y/PERF: ${routeAudits.length} responsive audits, ${lighthouse.length} Lighthouse routes`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
