import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { chromium, type Browser, type Locator, type Page } from 'playwright';
import tokens from '../design/tokens.json';

/**
 * V3-TOKEN-AUDIT-002: цвета, радиусы и шрифты только из design/tokens.*.
 *  1. tokens.json ↔ tokens.css — одни и те же цвета, радиусы, семейства, длительности.
 *  2. Исходники src/ — нет hex/rgb/hsl-литералов, числовых радиусов и чужих шрифтов.
 *  3. Рантайм на 1440 и 390 px — вычисленные цвет/фон/рамка/SVG, радиусы видимых
 *     блоков и шрифты на публичных маршрутах, в LMS и в воронке диагностики
 *     (квиз → результат → разбор) сверяются с набором токенов.
 *
 * Запуск: npx tsx scripts/token-audit.ts   (сервер на BASE_URL, по умолчанию :3000)
 */

const BASE = process.env.BASE_URL ?? 'http://localhost:3000';

const results: Array<{ name: string; ok: boolean }> = [];
function check(name: string, ok: boolean, detail = '') {
  results.push({ name, ok });
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? ` — ${detail}` : ''}`);
}

const FONTS = ['manrope', 'inter', 'caveat'];
const kebab = (name: string) => name.replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`);
const firstFamily = (stack: string) => stack.split(',')[0].trim().replace(/['"]/g, '').toLowerCase();

/* ---------- 1. tokens.json ↔ tokens.css ---------- */

function tokenParity(): string[] {
  const cssVars = new Map([...readFileSync('design/tokens.css', 'utf8').matchAll(/--([\w-]+):\s*([^;]+);/g)].map((m) => [m[1], m[2].trim()]));
  const diff: string[] = [];
  const expect = (cssName: string, jsonValue: string, same: (css: string) => boolean) => {
    const cssValue = cssVars.get(cssName);
    if (cssValue === undefined || !same(cssValue)) diff.push(`--${cssName}: css ${cssValue ?? '—'} ≠ json ${jsonValue}`);
  };
  for (const [name, token] of Object.entries(tokens.color)) expect(kebab(name), token.$value, (v) => v.toLowerCase() === token.$value.toLowerCase());
  for (const [name, token] of Object.entries(tokens.radius)) {
    if (name !== 'circle') expect(`r-${name}`, token.$value, (v) => v === token.$value); // 50% — без css-переменной
  }
  for (const name of ['fontDisplay', 'fontBody', 'fontScript'] as const) {
    const json = tokens.typography[name].$value;
    expect(kebab(name), json, (v) => firstFamily(v) === firstFamily(json));
  }
  for (const name of ['fast', 'base'] as const) {
    const json = tokens.motion[name].$value;
    expect(`t-${name}`, json, (v) => v.startsWith(json));
  }
  // RGB-каналы tailwind в globals.css — копии токенов, CSS не выводит их из hex
  const channels = new Map([...readFileSync('src/app/globals.css', 'utf8').matchAll(/--c-([\w-]+):\s*(\d+ \d+ \d+);/g)].map((m) => [m[1], m[2].replace(/ /g, ',')]));
  const CHANNEL_TOKEN: Record<string, keyof typeof tokens.color> = {
    paper: 'bg', 'paper-deep': 'hairline', 'paper-card': 'surface', ink: 'ink', 'ink-soft': 'inkSoft', 'ink-faint': 'inkSoft',
    'ink-invert': 'onDark', red: 'red', 'red-deep': 'redDeep', 'red-wash': 'blush', line: 'hairline', 'line-strong': 'ink',
  };
  for (const [channel, token] of Object.entries(CHANNEL_TOKEN)) {
    const want = hexToRgb(tokens.color[token].$value);
    if (channels.get(channel) !== want) diff.push(`--c-${channel}: ${channels.get(channel) ?? '—'} ≠ ${token} ${want}`);
  }
  if (channels.size !== Object.keys(CHANNEL_TOKEN).length) diff.push(`globals.css: ${channels.size} каналов --c-*, ожидалось ${Object.keys(CHANNEL_TOKEN).length}`);
  return diff;
}

/* ---------- 2. исходники ---------- */

function files(path: string): string[] {
  return statSync(path).isDirectory() ? readdirSync(path).flatMap((name) => files(join(path, name))) : [path];
}

/** Комментарии → пробелы, чтобы номера строк не съезжали; `://` в URL не комментарий. */
const blankComments = (text: string) =>
  text.replace(/\/\*[\s\S]*?\*\//g, (m) => m.replace(/[^\n]/g, ' ')).replace(/(^|[^:\\])\/\/[^\n]*/g, '$1');

const radiusPartOk = (part: string) => /^(0|50%|inherit|var\(--r-[\w-]+\))$/.test(part);

function sourceFindings(): string[] {
  const hits: string[] = [];
  for (const file of files('src').filter((f) => /\.(tsx?|css)$/.test(f))) {
    const isCss = file.endsWith('.css');
    blankComments(readFileSync(file, 'utf8')).split('\n').forEach((line, index) => {
      const at = `${file.replace(/\\/g, '/')}:${index + 1}`;
      const snippet = line.trim().slice(0, 100);
      if (/#[0-9a-f]{3,8}\b|rgba?\((?!\s*var\()|hsla?\(/i.test(line)) hits.push(`цвет   ${at}  ${snippet}`);

      if (isCss) {
        const radius = line.match(/border(?:-[a-z]+)*-radius:\s*([^;]+)/);
        if (radius && !radius[1].trim().split(/\s+/).every(radiusPartOk)) hits.push(`радиус ${at}  ${snippet}`);
      } else if (/borderRadius:\s*['"]?\d|rounded-\[(?!var\()/.test(line)) {
        hits.push(`радиус ${at}  ${snippet}`);
      }

      const font = isCss ? line.match(/font-family:\s*([^;]+)/) : line.match(/fontFamily[=:]\s*\{?\s*['"`]([^'"`]+)/);
      if (font) {
        const value = font[1].trim();
        if (!/^(var\(--font-|inherit)/.test(value) && !FONTS.some((f) => firstFamily(value).startsWith(f))) hits.push(`шрифт  ${at}  ${snippet}`);
      }
    });
  }
  return hits;
}

/* ---------- 3. рантайм ---------- */

const hexToRgb = (hex: string) => {
  const n = parseInt(hex.slice(1), 16);
  return `${(n >> 16) & 255},${(n >> 8) & 255},${n & 255}`;
};
const TOKEN_RGB = [...new Set(Object.values(tokens.color).map((t) => hexToRgb(t.$value)))];

/** Выполняется в странице (строкой — без трансформаций tsx). */
const COLLECT = `(() => {
  const allowed = new Set(${JSON.stringify(TOKEN_RGB)});
  const fonts = ${JSON.stringify(FONTS)};
  const radii = [0, 8, 12, 16, 20, 24];
  const found = {};
  const describe = (el) => el.tagName.toLowerCase() + (typeof el.className === 'string' && el.className.trim() ? '.' + el.className.trim().split(/\\s+/).slice(0, 2).join('.') : '');
  const add = (kind, value, el) => {
    const key = kind + ' ' + value;
    found[key] = found[key] || { kind, value, count: 0, where: describe(el) };
    found[key].count += 1;
  };
  const color = (kind, value, el) => {
    const m = value.match(/^rgba?\\((\\d+),\\s*(\\d+),\\s*(\\d+)(?:,\\s*([\\d.]+))?\\)$/);
    if (m && m[4] !== undefined && Number(m[4]) === 0) return;
    if (!m || !allowed.has(m[1] + ',' + m[2] + ',' + m[3])) add(kind, value, el);
  };
  for (const el of document.body.querySelectorAll('*')) {
    if (/^(SCRIPT|STYLE|NOSCRIPT|TEMPLATE|BR)$/.test(el.tagName)) continue;
    const cs = getComputedStyle(el);
    if (cs.display === 'none' || cs.visibility === 'hidden' || Number(cs.opacity) === 0) continue;
    const rect = el.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) continue;
    const text = [...el.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim());
    if (text || /^(INPUT|TEXTAREA|SELECT|BUTTON)$/.test(el.tagName)) {
      color('color', cs.color, el);
      const family = cs.fontFamily.split(',')[0].trim().replace(/['"]/g, '').toLowerCase();
      if (!fonts.includes(family)) add('font', family, el);
    }
    if (el instanceof SVGElement) {
      if (/^(path|circle|rect|line|polyline|polygon|ellipse|text)$/.test(el.tagName)) {
        for (const prop of ['fill', 'stroke']) {
          const v = cs[prop];
          if (v && v !== 'none' && !v.startsWith('url(')) color(prop, v, el);
        }
      }
      continue;
    }
    const filled = !/^(transparent|rgba\\(\\d+, \\d+, \\d+, 0\\))$/.test(cs.backgroundColor);
    if (filled) color('background', cs.backgroundColor, el);
    let bordered = false;
    for (const side of ['Top', 'Right', 'Bottom', 'Left']) {
      if (parseFloat(cs['border' + side + 'Width']) > 0 && cs['border' + side + 'Style'] !== 'none') {
        bordered = true;
        color('border', cs['border' + side + 'Color'], el);
      }
    }
    if (!(filled || bordered || cs.boxShadow !== 'none' || cs.backgroundImage !== 'none' || /^(IMG|VIDEO|IFRAME|CANVAS)$/.test(el.tagName))) continue;
    // радиус ≥ половины меньшей стороны рисуется как пилюля/круг — это токен pill/circle
    const half = Math.min(rect.width, rect.height) / 2;
    for (const corner of ['TopLeft', 'TopRight', 'BottomRight', 'BottomLeft']) {
      const v = cs['border' + corner + 'Radius'];
      if (v === '50%') continue;
      if (!/^[\\d.]+px$/.test(v)) { add('radius', v, el); continue; }
      const px = parseFloat(v);
      if (!radii.includes(Math.round(px)) && px < half - 0.5) add('radius', v, el);
    }
  }
  return found;
})()`;

type Finding = { kind: string; value: string; count: number; where: string };
const runtime = new Map<string, Finding & { pages: Set<string> }>();
let audited = 0;

async function audit(page: Page, label: string) {
  await page.waitForTimeout(700); // данные LMS и гидратация
  const found = (await page.evaluate(COLLECT)) as Record<string, Finding>;
  audited += 1;
  for (const [key, f] of Object.entries(found)) {
    const entry = runtime.get(key) ?? { ...f, count: 0, pages: new Set<string>() };
    entry.count += f.count;
    entry.pages.add(label);
    runtime.set(key, entry);
  }
}

/** Клик, пока не появится следующий шаг: первый клик может прийти раньше гидратации. */
async function clickUntil(target: Locator, next: Locator | string | RegExp, page: Page) {
  for (let attempt = 1; ; attempt += 1) {
    await target.first().click();
    try {
      if (typeof next === 'string' || next instanceof RegExp) await page.waitForURL(next, { timeout: 5_000 });
      else await next.first().waitFor({ timeout: 5_000 });
      return;
    } catch (error) {
      if (attempt === 3) throw error;
    }
  }
}

const ROUTES = [
  '/', '/courses', '/diagnostic', '/program', '/progress', '/community', '/about', '/faq', '/privacy', '/terms',
  '/blog', '/blog/ielts-true-false-not-given', '/contacts', '/season', '/season/current', '/search?q=IELTS',
  '/crm', '/maintenance', '/login', '/token-audit-404',
];

/** SHOT_DIR=<папка> — снимки экранов, где drift был виден глазом. */
const SHOT_DIR = process.env.SHOT_DIR;
const SHOTS = ['quiz', 'result', 'review', '/program', '/contacts', '/season'];

async function walk(browser: Browser, width: number, height: number) {
  const mobile = width < 768;
  const context = await browser.newContext({ viewport: { width, height }, isMobile: mobile, hasTouch: mobile });
  const page = await context.newPage();
  page.setDefaultTimeout(20_000);
  const at = async (name: string) => {
    await audit(page, `${name} @${width}`);
    if (SHOT_DIR && SHOTS.includes(name)) {
      await page.screenshot({ path: join(SHOT_DIR, `tokens-${name.replace(/\//g, '') || 'home'}-${width}.png`), fullPage: true });
    }
  };

  for (const route of ROUTES) {
    await page.goto(`${BASE}${route}`, { waitUntil: 'load' });
    await at(route);
  }

  // воронка диагностики: онбординг → квиз → подтверждение → результат → разбор (success-state)
  await page.goto(`${BASE}/`, { waitUntil: 'load' });
  await clickUntil(page.locator('#hero').getByRole('button', { name: 'Начать диагностику IELTS' }), page.getByRole('button', { name: '7.0', exact: true }), page);
  await at('onboarding');
  await page.getByRole('button', { name: '7.0', exact: true }).first().click();
  await page.getByRole('button', { name: '1–3 месяца' }).click();
  await page.getByRole('button', { name: 'Начать', exact: true }).click();
  await page.getByText(/Вопрос \d+ из \d+/).first().waitFor();
  if (await page.locator('.option').count()) await page.locator('.option').first().click();
  await at('quiz');
  // «Финиш» появляется со второго вопроса (UX-FIXES-001)
  await page.getByRole('button', { name: 'Далее' }).click();
  await page.getByText(/Вопрос 2 из \d+/).first().waitFor();
  await page.getByRole('button', { name: 'Завершить диагностику' }).click();
  await page.locator('[role="dialog"]').waitFor();
  await at('quiz-finish');
  await page.getByRole('button', { name: 'Завершить и увидеть результат' }).click();
  const reviewButton = page.getByRole('button', { name: 'Посмотреть разбор вопросов' });
  await reviewButton.waitFor();
  await at('result');
  await reviewButton.click();
  await page.getByRole('button', { name: 'К результату' }).first().waitFor();
  await at('review');

  // LMS под тремя демо-ролями
  const login = async (role: string) => {
    await page.evaluate("localStorage.removeItem('ashyq:v2:session')");
    await page.goto(`${BASE}/login`, { waitUntil: 'load' });
    await clickUntil(page.getByRole('button', { name: `Войти как ${role}` }), '**/me', page);
  };
  await login('ученик');
  await at('/me');
  await page.goto(`${BASE}/classes`, { waitUntil: 'load' });
  await at('/classes');
  await clickUntil(page.getByRole('link', { name: /IELTS Intermediate/ }), /\/classes\/[^/?]+$/, page);
  await at('/classes/[id]');
  await clickUntil(page.getByRole('link', { name: /Essay Task 2/ }), /\/assignments\/[^/?]+$/, page);
  await at('/assignments/[id]');
  await page.goto(`${BASE}/season/current`, { waitUntil: 'load' });
  await page.getByText('Ты капитан').first().waitFor();
  await at('/season/current · ученик');

  await login('учитель');
  await page.goto(`${BASE}/teacher`, { waitUntil: 'load' });
  await at('/teacher');
  await clickUntil(page.getByRole('link', { name: /IELTS Intermediate/ }), /\/teacher\/classes\/[^/?]+$/, page);
  const classUrl = page.url();
  await at('/teacher/classes/[id]');
  await clickUntil(page.getByRole('link', { name: 'Новый урок' }), /\/teacher\/lessons\/new/, page);
  await at('/teacher/lessons/new');
  await page.goto(classUrl, { waitUntil: 'load' });
  await clickUntil(page.getByRole('link', { name: 'Открыть работу — Dias' }), /\/submissions\/[^/?]+$/, page);
  await at('/submissions/[id]');
  await page.goto(`${BASE}/teacher/season`, { waitUntil: 'load' });
  await at('/teacher/season · обзор');
  for (const tab of ['Команды', 'Баллы', 'Match Days']) {
    await page.getByRole('tab', { name: tab }).click();
    await at(`/teacher/season · ${tab}`);
  }

  await login('автор');
  await page.goto(`${BASE}/write`, { waitUntil: 'load' });
  await at('/write');
  await clickUntil(page.getByRole('link', { name: /Как выбрать дату экзамена/ }), /\/write\/[^/?]+$/, page);
  await at('/write/[id]');

  await context.close();
}

async function main() {
  const parity = tokenParity();
  check('tokens.json ↔ tokens.css', parity.length === 0, parity.join('; '));

  const source = sourceFindings();
  check('исходники: нет литералов цветов, радиусов и чужих шрифтов', source.length === 0, source.length ? `${source.length} мест` : '');
  for (const hit of source) console.log(`      ${hit}`);

  const browser = await chromium.launch();
  try {
    await walk(browser, 1440, 1000);
    await walk(browser, 390, 844);
  } finally {
    await browser.close();
  }
  console.log(`\nпроверено экранов: ${audited}`);
  for (const kind of ['color', 'background', 'border', 'fill', 'stroke', 'radius', 'font']) {
    const list = [...runtime.values()].filter((f) => f.kind === kind).sort((a, b) => b.count - a.count);
    check(`рантайм: ${kind}`, list.length === 0, list.length ? `${list.length} неизвестных значений` : '');
    for (const f of list) {
      const pages = [...f.pages];
      console.log(`      ${f.value} — ${f.count} эл., напр. ${f.where}; ${pages.slice(0, 4).join(', ')}${pages.length > 4 ? ` +${pages.length - 4}` : ''}`);
    }
  }

  const failed = results.filter((r) => !r.ok);
  console.log(`\n=== ${results.length - failed.length}/${results.length} проверок токенов пройдено ===`);
  if (failed.length) process.exit(1);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
