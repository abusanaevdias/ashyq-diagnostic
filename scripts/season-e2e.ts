import { join } from 'node:path';
import { chromium, type Browser, type Locator, type Page } from 'playwright';

/**
 * E2E чемпионата (SEASON-DEMO-001) на 1440 и 390 px: гость видит «Чемпионат»
 * в шапке, хаб и превью; капитан отправляет ответ Match Day; организатор
 * засчитывает его, начисляет баллы до недельного лимита и собирает команду
 * ровно из 5; ученик видит результат (aria-live), не-капитан ответить не может,
 * автор в кабинет организатора не попадает, публичный рейтинг пересчитан.
 * Ученик и организатор — разные контексты браузера; данные переносит sync(),
 * как их доставит Supabase.
 *
 * Запуск: npx tsx scripts/season-e2e.ts   (BASE_URL, по умолчанию :3000; SHOT_DIR — скриншоты)
 */

const BASE = process.env.BASE_URL ?? 'http://localhost:3000';
const SHOT_DIR = process.env.SHOT_DIR;

const results: Array<{ name: string; ok: boolean; detail: string }> = [];
function check(name: string, ok: boolean, detail = '') {
  results.push({ name, ok, detail });
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? ` — ${detail}` : ''}`);
}

/** dataLayer → sessionStorage вкладки: события переживают переходы. */
const EVENTS_SHIM = `(() => {
  const list = [];
  list.push = function (...items) {
    try {
      const saved = JSON.parse(sessionStorage.getItem('e2e-events') || '[]');
      sessionStorage.setItem('e2e-events', JSON.stringify([...saved, ...items.map((x) => JSON.stringify(x))]));
    } catch {}
    return Array.prototype.push.apply(this, items);
  };
  window.dataLayer = list;
})()`;
const EVENTS = `(JSON.parse(sessionStorage.getItem('e2e-events') || '[]')).join(' ')`;
const DUMP = `JSON.stringify(Object.fromEntries(Object.keys(localStorage).filter((k) => k.startsWith('ashyq:v2:') && k !== 'ashyq:v2:session').map((k) => [k, localStorage.getItem(k)])))`;

async function sync(from: Page, to: Page) {
  const dump = (await from.evaluate(DUMP)) as string;
  await to.evaluate(`(() => { for (const [k, v] of Object.entries(${dump})) localStorage.setItem(k, v); })()`);
}

const shown = (loc: Locator) => loc.first().waitFor({ timeout: 15_000 }).then(() => true, () => false);
const announced = (page: Page, text: string) => page.getByText(text).first().waitFor({ state: 'attached', timeout: 15_000 }).then(() => true, () => false);
const overflow = (page: Page) => page.evaluate('document.documentElement.scrollWidth - document.documentElement.clientWidth') as Promise<number>;

/** Клик до перехода: первый клик может прийти раньше гидратации. */
async function clickTo(page: Page, target: Locator, url: string | RegExp) {
  for (let attempt = 1; ; attempt += 1) {
    await target.click();
    try {
      await page.waitForURL(url, { timeout: 5_000 });
      return;
    } catch (error) {
      if (attempt === 3) throw error;
    }
  }
}

async function signIn(page: Page, role: 'ученик' | 'учитель' | 'автор') {
  await page.evaluate("localStorage.removeItem('ashyq:v2:session')");
  await page.goto(`${BASE}/login`, { waitUntil: 'load' });
  await clickTo(page, page.getByRole('button', { name: `Войти как ${role}` }), '**/me');
}

async function signInEmail(page: Page, email: string) {
  await page.evaluate("localStorage.removeItem('ashyq:v2:session')");
  await page.goto(`${BASE}/login`, { waitUntil: 'load' });
  await page.locator('input[type="email"]').fill(email);
  await page.locator('input[type="password"]').fill('demo1234');
  await clickTo(page, page.getByRole('button', { name: 'Войти', exact: true }), '**/me');
}

async function shot(page: Page, name: string, label: string) {
  const scroll = await overflow(page);
  check(`${label} ${name}: нет горизонтального скролла`, scroll <= 0, `${scroll}px`);
  if (SHOT_DIR) await page.screenshot({ path: join(SHOT_DIR, `season-${name}-${label}.png`), fullPage: true });
}

const weekPoints = (page: Page) => page.locator('article', { hasText: 'Эта неделя' }).locator('[class*="bigValue"]').first().innerText().then(Number);

async function flow(browser: Browser, label: string, viewport: { width: number; height: number }, mobile: boolean) {
  const options = { viewport, isMobile: mobile, hasTouch: mobile };
  const studentCtx = await browser.newContext(options);
  const teacherCtx = await browser.newContext(options);
  const errors: string[] = [];
  for (const ctx of [studentCtx, teacherCtx]) {
    await ctx.addInitScript(EVENTS_SHIM);
    ctx.on('weberror', (e) => errors.push(e.error().message.slice(0, 200)));
    ctx.on('console', (m) => {
      if (m.type() === 'error' && !/Failed to load resource/.test(m.text())) errors.push(m.text().slice(0, 200));
    });
  }
  const s = await studentCtx.newPage();
  const t = await teacherCtx.newPage();
  s.setDefaultTimeout(20_000);
  t.setDefaultTimeout(20_000);

  // Гость: шапка → хаб → превью Season HQ
  await s.goto(`${BASE}/`, { waitUntil: 'load' });
  check(`${label} шапка: «Чемпионат» ведёт на /season`, (await s.locator('header a[href="/season"]', { hasText: 'Чемпионат' }).count()) >= 1);
  await s.goto(`${BASE}/season`, { waitUntil: 'load' });
  check(`${label} хаб: идущий Season 03`, (await shown(s.getByText('Season 03'))) && (await shown(s.getByText('Идёт сейчас'))));
  check(`${label} хаб: рейтинг команд из журнала баллов`, await shown(s.getByText('Qadam')));
  await shot(s, 'hub', label);
  await s.goto(`${BASE}/season/current`, { waitUntil: 'load' });
  check(`${label} гость: превью с подсказкой войти`, await shown(s.getByText(/Это демо-превью/)));

  // Ученик-капитан отправляет ответ команды
  await signIn(s, 'ученик');
  await s.goto(`${BASE}/season/current`, { waitUntil: 'load' });
  check(`${label} HQ: капитан видит задание`, await shown(s.getByText('Ты капитан')));
  const alias = ((await s.getByRole('heading', { level: 1 }).innerText()).match(/Привет, (.+)\./) ?? [])[1] ?? '';
  check(`${label} HQ: публично — псевдоним`, alias.length > 0 && !alias.includes('Dias'), alias);
  const before = await weekPoints(s);
  await s.getByLabel('Ответ команды').fill('Строки 4 и 9 подтверждают вывод; строка 12 — контрпример.');
  await s.getByRole('button', { name: 'Отправить ответ' }).click();
  check(`${label} HQ: ответ отправлен, aria-live`, await announced(s, 'Ответ команды отправлен'));
  check(`${label} HQ: ответ ждёт проверки`, await shown(s.getByText(/ждёт проверки организатора/)));
  await shot(s, 'hq', label);

  // Организатор: проверка ответа
  await t.goto(`${BASE}/login`, { waitUntil: 'load' });
  await sync(s, t);
  await signIn(t, 'учитель');
  await t.goto(`${BASE}/teacher/season`, { waitUntil: 'load' });
  check(`${label} кабинет: сезон и ответ ждёт проверки`, await shown(t.getByRole('button', { name: 'Проверить ответы' })));
  await t.getByRole('tab', { name: 'Match Days' }).click();
  check(`${label} кабинет: ответ капитана виден`, await shown(t.getByText('Строки 4 и 9')));
  await t.getByLabel(/Баллы каждому/).fill('20');
  await t.getByRole('button', { name: 'Засчитать' }).click();
  check(`${label} кабинет: засчитано, aria-live`, await announced(t, 'Команда Qadam: +20 каждому'));
  await shot(t, 'organizer-matches', label);

  // Организатор: баллы до недельного лимита
  await t.getByRole('tab', { name: 'Баллы' }).click();
  await t.getByLabel('Участник').selectOption({ label: `${alias} — Dias` });
  await t.getByLabel('Категория').selectOption('speaking');
  const hint = await t.getByText(/Осталось на неделе/).innerText();
  const left = Number(hint.match(/: (\d+) из/)?.[1] ?? '0');
  if (left > 0) {
    // панель вкладки тоже названа «Баллы» (aria-labelledby) — берём само числовое поле
    await t.getByRole('spinbutton', { name: 'Баллы', exact: true }).fill(String(left));
    await t.getByLabel('За что').fill('Speaking club');
    await t.getByRole('button', { name: 'Начислить' }).click();
    check(`${label} кабинет: начислено до лимита, aria-live`, await announced(t, `Начислено ${left}`));
  }
  check(`${label} кабинет: лимит Speaking исчерпан`, await shown(t.getByText(/Осталось на неделе \d+: 0 из 15/)), hint);
  await shot(t, 'organizer-points', label);

  // Организатор: команда ровно из 5
  await t.getByRole('tab', { name: 'Команды' }).click();
  await t.getByRole('button', { name: 'SAT', exact: true }).click();
  for (let i = 0; i < 5; i += 1) {
    await t.getByLabel('Имя (видит только организатор)').fill(`E2E ${label} ${i}`);
    await t.getByLabel('Псевдоним в рейтинге').fill(`E2E-${label}-${i}`);
    await t.getByRole('button', { name: 'Добавить в SAT' }).click();
    await t.getByRole('checkbox', { name: new RegExp(`E2E-${label}-${i}`) }).waitFor();
  }
  const build = t.getByRole('button', { name: 'Собрать команду' });
  for (let i = 0; i < 4; i += 1) await t.getByRole('checkbox', { name: new RegExp(`E2E-${label}-${i}`) }).check();
  check(`${label} кабинет: из 4 команду не собрать`, await build.isDisabled());
  await t.getByRole('checkbox', { name: new RegExp(`E2E-${label}-4`) }).check();
  check(`${label} кабинет: пятый участник включает кнопку`, await build.isEnabled());
  await t.getByLabel('Название команды').fill(`Team ${label}`);
  await t.getByLabel('Город').fill('Астана');
  await build.click();
  check(`${label} кабинет: команда собрана, aria-live`, await announced(t, `Команда «Team ${label}» собрана`));
  await shot(t, 'organizer-teams', label);

  // Ученик: засчитанный ответ приходит на открытую страницу
  const courier = await studentCtx.newPage();
  await courier.goto(`${BASE}/blog`, { waitUntil: 'load' });
  await sync(t, courier);
  await courier.close();
  check(`${label} HQ: видно «Засчитано: +20 каждому»`, await shown(s.getByText('Засчитано: +20 каждому')));
  check(`${label} HQ: aria-live о засчитанном ответе`, await announced(s, 'Ответ команды засчитан: +20 каждому'));
  const after = await weekPoints(s);
  check(`${label} HQ: баллы недели выросли`, after > before, `${before} → ${after}`);

  // Не-капитан не отвечает за команду
  await signInEmail(s, 'mepyat@demo.ashyq');
  await s.goto(`${BASE}/season/current`, { waitUntil: 'load' });
  check(`${label} HQ: не-капитан без формы ответа`, (await shown(s.getByText('Засчитано: +20 каждому'))) && (await s.getByLabel('Ответ команды').count()) === 0);

  // Автор не попадает в кабинет организатора
  await signIn(s, 'автор');
  await s.goto(`${BASE}/teacher/season`, { waitUntil: 'load' });
  check(`${label} автор → /teacher/season: «Недостаточно прав»`, await shown(s.getByText('Недостаточно прав')));

  // Публичный рейтинг пересчитан
  await t.goto(`${BASE}/season`, { waitUntil: 'load' });
  await t.getByRole('button', { name: 'SAT', exact: true }).click();
  check(`${label} хаб: новая команда в рейтинге SAT`, await shown(t.getByText(`Team ${label}`)));

  const events = `${await s.evaluate(EVENTS)} ${await t.evaluate(EVENTS)}`;
  for (const name of ['season_match_submitted', 'season_match_reviewed', 'season_points_awarded', 'season_team_created']) {
    check(`${label} analytics: ${name}`, events.includes(name));
  }
  check(`${label} нет ошибок в консоли`, errors.length === 0, errors.slice(0, 3).join(' | '));
  await studentCtx.close();
  await teacherCtx.close();
}

async function main() {
  const browser = await chromium.launch();
  try {
    await flow(browser, '1440', { width: 1440, height: 1000 }, false);
    await flow(browser, '390', { width: 390, height: 844 }, true);
  } finally {
    await browser.close();
  }
  const failed = results.filter((r) => !r.ok);
  console.log(`\n=== ${results.length - failed.length}/${results.length} проверок чемпионата пройдено ===`);
  if (failed.length) {
    console.log('Провалено:');
    for (const f of failed) console.log(` - ${f.name}${f.detail ? ` (${f.detail})` : ''}`);
    process.exit(1);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
