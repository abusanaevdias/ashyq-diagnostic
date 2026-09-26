import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { chromium, type Browser, type Locator, type Page } from 'playwright';

/**
 * E2E учебного слоя LMS-001: сценарии ТЗ a–e на 1440 и 390 px, приватный режим,
 * reduced-motion, события аналитики и статическая проверка «цвета только токенами».
 * Ученик и учитель — разные контексты браузера (как разные устройства); данные
 * между ними переносит sync(), как их доставит Supabase. Открытая страница
 * ученика получает их storage-событием — так проверяется aria-live.
 *
 * Запуск: npx tsx scripts/lms-e2e.ts   (сервер на BASE_URL, по умолчанию :3000)
 * SHOT_DIR=<папка> — сохранить скриншоты страниц из acceptance.
 */

const BASE = process.env.BASE_URL ?? 'http://localhost:3000';
const SHOT_DIR = process.env.SHOT_DIR;

const results: Array<{ name: string; ok: boolean; detail: string }> = [];
function check(name: string, ok: boolean, detail = '') {
  results.push({ name, ok, detail });
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? ` — ${detail}` : ''}`);
}

/* ---------- статика: цвета только токенами, моушен ≤ 300ms ---------- */

const LMS_PATHS = [
  'src/components/lms', 'src/lib/lms', 'src/components/BlogV3.tsx', 'src/components/BlogV3.module.css',
  'src/app/login', 'src/app/me', 'src/app/classes', 'src/app/assignments', 'src/app/teacher',
  'src/app/submissions', 'src/app/write', 'src/app/blog/[slug]',
];

function files(path: string): string[] {
  return statSync(path).isDirectory() ? readdirSync(path).flatMap((name) => files(join(path, name))) : [path];
}

function hardcodedColors(): string[] {
  const hits: string[] = [];
  for (const file of LMS_PATHS.flatMap(files)) {
    // в TSX короткий #abc — это чаще якорь, поэтому там ищем только 6-значный hex и inline-стили
    const pattern = file.endsWith('.css') ? /#[0-9a-f]{3,8}\b|rgba?\(|hsla?\(/i : /#[0-9a-f]{6}\b|rgba?\(|hsla?\(|style=\{\{/i;
    readFileSync(file, 'utf8').split('\n').forEach((line, i) => {
      if (pattern.test(line)) hits.push(`${file}:${i + 1}`);
    });
  }
  return hits;
}

/* ---------- браузер ---------- */

/** dataLayer → sessionStorage вкладки: события переживают переходы между страницами. */
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

/** Приватный режим Safari / запрет cookies: любое обращение к localStorage бросает. */
const NO_STORAGE = `Object.defineProperty(window, 'localStorage', { configurable: true, get() { throw new DOMException('The operation is insecure.', 'SecurityError'); } });`;

const DUMP = `JSON.stringify(Object.fromEntries(Object.keys(localStorage).filter((k) => k.startsWith('ashyq:v2:') && k !== 'ashyq:v2:session').map((k) => [k, localStorage.getItem(k)])))`;

/** Переносит данные LMS (без сессии) из одного «устройства» в другое. */
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

async function demoLogin(page: Page, role: 'ученик' | 'учитель' | 'автор') {
  await page.goto(`${BASE}/login`, { waitUntil: 'load' });
  await clickTo(page, page.getByRole('button', { name: `Войти как ${role}` }), '**/me');
}

/** Выход через UI: меню аватара на десктопе, бургер на телефоне. */
async function signOut(page: Page, mobile: boolean) {
  if (mobile) {
    await page.locator('summary[aria-label="Открыть меню"]').click();
    await page.locator('[class*="mobilePanel"]').getByRole('button', { name: 'Выйти' }).click();
  } else {
    await page.locator('summary[aria-label^="Аккаунт:"]').click();
    await page.getByRole('button', { name: 'Выйти' }).click();
  }
}

async function shot(page: Page, name: string, label: string) {
  const scroll = await overflow(page);
  check(`${label} ${name}: нет горизонтального скролла`, scroll <= 0, `${scroll}px`);
  if (SHOT_DIR) await page.screenshot({ path: join(SHOT_DIR, `lms-${name}-${label}.png`), fullPage: true });
}

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
  const t = await teacherCtx.newPage();
  const s = await studentCtx.newPage();
  t.setDefaultTimeout(20_000);
  s.setDefaultTimeout(20_000);
  const task = `Speaking Part 2 · ${label}`;

  // a) учитель выдаёт задание → ученик видит его в классе
  await t.goto(`${BASE}/login`, { waitUntil: 'load' });
  await shot(t, 'login', label);
  // пароль можно посмотреть: «Показать» делает поле текстовым, «Скрыть» — обратно (PASSWORD-TOGGLE-001)
  const password = t.getByLabel('Пароль', { exact: true });
  await password.fill('secret-123');
  await t.getByRole('button', { name: 'Показать' }).click();
  const visible = (await password.getAttribute('type')) === 'text';
  await t.getByRole('button', { name: 'Скрыть' }).click();
  check(`${label} пароль: «Показать»/«Скрыть» переключают видимость`, visible && (await password.getAttribute('type')) === 'password');
  await demoLogin(t, 'учитель'); // демо-вход сам кладёт сид в пустое хранилище
  await t.goto(`${BASE}/teacher`, { waitUntil: 'load' });
  await clickTo(t, t.getByRole('link', { name: /IELTS Intermediate · Осень/ }), /\/teacher\/classes\/[^/?]+$/);
  const teacherClassUrl = t.url();
  await clickTo(t, t.getByRole('link', { name: 'Новое задание' }), /\/teacher\/assignments\/new/);
  await t.getByLabel('Название задания').fill(task);
  await t.getByLabel('Условие').fill('Запишите монолог на 2 минуты и приложите заметки.');
  await t.getByLabel('Дедлайн').fill('2030-09-25T18:00');
  await t.getByLabel('Максимум баллов').fill('9');
  await clickTo(t, t.getByRole('button', { name: 'Выдать задание' }), teacherClassUrl);
  check(`${label} a: задание появилось в классе учителя`, await shown(t.getByText(task)));
  await shot(t, 'teacher-class', label);

  // h) учитель открывает созданный урок и исправляет опечатку; задание тоже открывается на правку (LESSON-EDIT-001)
  await clickTo(t, t.getByRole('link', { name: /^Открыть и изменить урок/ }).first(), /\/teacher\/lessons\/[^/?]+$/);
  const lessonTitle = t.getByLabel('Тема урока');
  const fixedTitle = `${await lessonTitle.inputValue()} (исправлено)`;
  await lessonTitle.fill(fixedTitle);
  await clickTo(t, t.getByRole('button', { name: 'Сохранить изменения' }), teacherClassUrl);
  check(`${label} h: исправленный урок виден в классе`, await shown(t.getByText(fixedTitle)));
  await clickTo(t, t.getByRole('link', { name: `Изменить задание «${task}»` }), /\/teacher\/assignments\/[^/?]+$/);
  check(`${label} h: форма задания открылась с текущими данными`, (await t.getByLabel('Название задания').inputValue()) === task);
  await clickTo(t, t.getByRole('link', { name: 'Отмена' }), teacherClassUrl);
  // название класса тоже можно исправить; ученик ниже находит класс по тому же началу (EDIT-MORE-001)
  await t.getByRole('button', { name: 'Изменить название' }).click();
  const classTitle = t.getByLabel('Название', { exact: true });
  const renamedClass = `${await classTitle.inputValue()} (исправлено)`;
  await classTitle.fill(renamedClass);
  await t.getByRole('button', { name: 'Сохранить', exact: true }).click();
  check(`${label} h: класс переименован`, await shown(t.getByRole('heading', { level: 1, name: renamedClass })));

  await s.goto(`${BASE}/login`, { waitUntil: 'load' });
  await sync(t, s);
  await demoLogin(s, 'ученик');
  await s.goto(`${BASE}/classes`, { waitUntil: 'load' });
  await clickTo(s, s.getByRole('link', { name: /IELTS Intermediate · Осень/ }), /\/classes\/[^/?]+$/);
  const taskLink = s.getByRole('link', { name: new RegExp(task) });
  check(`${label} a: ученик видит новое задание`, await shown(taskLink));
  await shot(s, 'class', label);

  // f) ученик оценивает понятность урока → учитель видит распределение (LESSON-RATING-001)
  await s.getByRole('radio', { name: 'Скорее всего ошибусь' }).first().check();
  await sync(s, t);
  await t.goto(teacherClassUrl, { waitUntil: 'load' });
  check(`${label} f: учитель видит самооценку урока`, await shown(t.getByText('Скорее всего ошибусь: 1').first()));

  // b) сдача текст + файл → учитель оценивает и комментирует → ученик видит, aria-live объявляет
  await clickTo(s, taskLink, /\/assignments\/[^/?]+$/);
  await s.locator('input[type="file"]').setInputFiles({ name: 'monologue.txt', mimeType: 'text/plain', buffer: Buffer.from('Part 2 notes') });
  await s.getByText('monologue.txt').first().waitFor();
  await s.getByRole('textbox', { name: 'Ответ', exact: true }).fill('Монолог записан, заметки во вложении.');
  await s.getByRole('button', { name: 'Сдать работу' }).click();
  check(`${label} b: сдача отправлена, aria-live`, await announced(s, 'Работа отправлена учителю'));

  await sync(s, t);
  await t.goto(teacherClassUrl, { waitUntil: 'load' });
  await clickTo(t, t.getByRole('link', { name: 'Проверить работу — Dias' }), /\/submissions\/[^/?]+$/);
  check(`${label} b: учитель видит текст и файл`, (await shown(t.getByText('Монолог записан'))) && (await shown(t.getByText(/monologue\.txt/))));
  await t.getByLabel(/Баллы/).fill('8');
  await t.getByRole('button', { name: 'Поставить оценку' }).click();
  check(`${label} b: оценка сохранена, aria-live`, await announced(t, 'Оценка сохранена: 8 из 9'));
  await t.getByLabel('Ваш комментарий').fill('Хорошая структура. Добавьте пример из жизни.');
  await t.getByRole('button', { name: 'Отправить' }).click();
  await t.getByText('Добавьте пример из жизни').first().waitFor();

  // данные учителя приходят на открытую страницу ученика из соседней вкладки
  const courier = await studentCtx.newPage();
  await courier.goto(`${BASE}/blog`, { waitUntil: 'load' });
  await sync(t, courier);
  await courier.close();
  check(`${label} b: ученик видит оценку`, await shown(s.getByText('8 / 9')));
  check(`${label} b: aria-live «Работа оценена»`, await announced(s, 'Работа оценена: 8 из 9'));
  check(`${label} b: ученик видит комментарий`, await shown(s.getByText('Добавьте пример из жизни')));
  check(`${label} b: aria-live «Новый комментарий»`, await announced(s, 'Новый комментарий от Айгерим К.'));
  await shot(s, 'assignment', label);

  // c) ученик не открывает кабинеты учителя и редактора; без редирект-петли
  for (const path of ['/teacher', new URL(teacherClassUrl).pathname, '/write']) {
    await s.goto(`${BASE}${path}`, { waitUntil: 'load' });
    const blocked = await shown(s.getByText('Недостаточно прав'));
    check(`${label} c: ученик → ${path}: «Недостаточно прав»`, blocked && new URL(s.url()).pathname === path);
  }

  // g) курс → программа уроков → бесплатный урок; гостю основные закрыты, ученику класса открыты (COURSE-LESSONS-001/002)
  const guest = await browser.newPage(options);
  await guest.goto(`${BASE}/courses/ielts`, { waitUntil: 'load' });
  await clickTo(guest, guest.getByRole('link', { name: 'Вся программа уроков' }), /\/courses\/ielts\/lessons$/);
  check(`${label} g: гостю основные уроки закрыты`, await shown(guest.getByRole('link', { name: 'Я ученик — войти' })));
  await shot(guest, 'course-lessons', label);
  await clickTo(guest, guest.getByRole('link', { name: /Как устроен IELTS/ }), /\/lessons\/how-ielts-works$/);
  check(`${label} g: бесплатный урок открыт гостю`, await shown(guest.getByRole('heading', { name: 'Попробуйте сами' })));
  await shot(guest, 'free-lesson', label);
  const lockedLesson = await guest.goto(`${BASE}/courses/ielts/lessons/writing-task-2`);
  check(`${label} g: у закрытого урока нет страницы`, lockedLesson?.status() === 404);
  await guest.close();
  await s.goto(`${BASE}/courses/ielts/lessons`, { waitUntil: 'load' });
  check(`${label} g: ученик класса видит «Доступ открыт»`, await shown(s.getByText(/Доступ открыт/)));

  // e) refresh сохраняет сессию
  await s.goto(`${BASE}/classes`, { waitUntil: 'load' });
  await s.reload({ waitUntil: 'load' });
  check(`${label} e: после refresh сессия на месте`, await shown(s.getByRole('link', { name: /IELTS Intermediate · Осень/ })));

  // reduced-motion: переходы карточек отключены
  await s.emulateMedia({ reducedMotion: 'reduce' });
  const duration = await s.evaluate(`getComputedStyle(document.querySelector('[class*="cardLink"]')).transitionDuration`);
  check(`${label} reduced-motion: у карточек нет перехода`, duration === '0s', String(duration));

  // e) выход очищает сессию
  await signOut(t, mobile);
  await t.waitForFunction(`localStorage.getItem('ashyq:v2:session') === null`).catch(() => undefined);
  check(`${label} e: выход очищает сессию`, (await t.evaluate(`localStorage.getItem('ashyq:v2:session')`)) === null);
  await t.goto(`${BASE}/classes`, { waitUntil: 'load' });
  check(`${label} e: после выхода кабинет просит войти`, await shown(t.getByText('Нужно войти')));

  // d) автор публикует → пост на /blog и /blog/[slug]
  const post = `Speaking без пауз ${label}`;
  await demoLogin(t, 'автор');
  await t.goto(`${BASE}/write`, { waitUntil: 'load' });
  await clickTo(t, t.getByRole('button', { name: 'Новый пост' }), /\/write\/[^/?]+$/);
  await t.getByLabel('Заголовок').fill(post);
  await t.getByLabel('Анонс').fill('Как не молчать на Part 2.');
  await t.getByLabel('Текст поста').fill('## Паузы\n\nСчитайте до двух и продолжайте.\n\n- план на 3 пункта\n- пример из жизни');
  await t.getByRole('button', { name: 'Опубликовать' }).click();
  check(`${label} d: пост опубликован, aria-live`, await announced(t, 'Пост опубликован'));
  await shot(t, 'write', label);
  const href = await t.getByRole('link', { name: 'Открыть в блоге' }).getAttribute('href');
  await t.goto(`${BASE}/blog`, { waitUntil: 'load' });
  check(`${label} d: пост в списке /blog`, await shown(t.getByRole('link', { name: new RegExp(post) })));
  await t.goto(`${BASE}${href}`, { waitUntil: 'load' });
  check(`${label} d: пост на ${href}`, (await shown(t.getByRole('heading', { level: 1, name: post }))) && (await shown(t.locator('main').getByText('Считайте до двух'))));
  await shot(t, 'post', label);

  // события аналитики из ТЗ
  const events = `${await s.evaluate(EVENTS)} ${await t.evaluate(EVENTS)}`;
  for (const name of ['lms_signed_in', 'lms_assignment_created', 'lms_submission_created', 'lms_comment_created', 'lms_grade_set', 'blog_post_published']) {
    check(`${label} analytics: ${name}`, events.includes(name));
  }
  check(`${label} нет ошибок в консоли`, errors.length === 0, errors.slice(0, 3).join(' | '));
  await studentCtx.close();
  await teacherCtx.close();
}

/** Приватный режим: страницы не падают, демо работает в памяти вкладки. */
async function privateMode(browser: Browser) {
  const ctx = await browser.newContext();
  await ctx.addInitScript(NO_STORAGE);
  const errors: string[] = [];
  ctx.on('weberror', (e) => errors.push(e.error().message.slice(0, 200)));
  const page = await ctx.newPage();
  page.setDefaultTimeout(20_000);
  for (const path of ['/login', '/me', '/classes', '/teacher', '/write', '/blog', '/blog/ielts-writing-task-2']) {
    await page.goto(`${BASE}${path}`, { waitUntil: 'load' });
    await page.waitForTimeout(400);
  }
  check('private: страницы открываются без ошибок', errors.length === 0, errors.slice(0, 3).join(' | '));
  await page.goto(`${BASE}/login`, { waitUntil: 'load' });
  check('private: плашка «Данные не сохраняются»', await shown(page.getByText(/Данные не сохраняются/)));
  const signedIn = await clickTo(page, page.getByRole('button', { name: 'Войти как ученик' }), '**/me').then(() => shown(page.getByText('Привет, Dias')), () => false);
  check('private: демо-вход работает в памяти вкладки', signedIn);
  await ctx.close();
}

async function main() {
  const colors = hardcodedColors();
  check('tokens: нет хардкод-цветов в файлах LMS', colors.length === 0, colors.join(', '));
  const durations = [...readFileSync('design/tokens.css', 'utf8').matchAll(/--t-[\w-]+:\s*(\d+)ms/g)].map((m) => Number(m[1]));
  check('motion: длительности токенов ≤ 300ms', durations.length > 0 && durations.every((d) => d <= 300), durations.map((d) => `${d}ms`).join(', '));

  const browser = await chromium.launch();
  try {
    await flow(browser, '1440', { width: 1440, height: 1000 }, false);
    await flow(browser, '390', { width: 390, height: 844 }, true);
    await privateMode(browser);
  } finally {
    await browser.close();
  }

  const failed = results.filter((r) => !r.ok);
  console.log(`\n=== ${results.length - failed.length}/${results.length} проверок LMS пройдено ===`);
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
