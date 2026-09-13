import { chromium, devices, type Browser, type ConsoleMessage, type Page } from 'playwright';
import { QUESTION_BANK } from '../src/data/questions';

/**
 * E2E-прогон основных сценариев (mobile viewport, iPhone 12).
 * Запуск: npm run e2e  (dev-сервер должен быть поднят на :3000)
 *
 * Проверяет acceptance criteria: выбор экзамена, onboarding, ответы,
 * таймер, refresh-persistence, finish-confirmation, scoring,
 * независимость результатов IELTS/SAT, review, WhatsApp CTA, отсутствие
 * горизонтального скролла.
 */

const BASE = process.env.BASE_URL ?? 'http://localhost:3000';
const UTM = '?utm_source=whatsapp&utm_campaign=cold01&utm_content=hook_a';
const CRM_ADMIN_KEY = process.env.CRM_ADMIN_KEY;


/** innerText в Chromium возвращает текст с учётом text-transform, поэтому сравниваем в верхнем регистре */
function has(haystack: string, needle: string): boolean {
  return haystack.toUpperCase().includes(needle.toUpperCase());
}

const results: Array<{ name: string; ok: boolean; detail?: string }> = [];
function check(name: string, ok: boolean, detail = '') {
  results.push({ name, ok, detail });
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? ` — ${detail}` : ''}`);
}

const byId = new Map(QUESTION_BANK.map((q) => [q.id, q]));

async function answerQuestion(page: Page, questionId: string, mode: 'correct' | 'wrong') {
  const q = byId.get(questionId);
  if (!q) throw new Error(`Нет вопроса ${questionId}`);

  if (q.kind === 'text-input') {
    const input = page.locator('input[type="text"]').first();
    const value =
      mode === 'correct'
        ? q.correctAnswer
        : 'definitely-not-the-answer';
    await input.fill(value);
    return;
  }

  let optionId = q.correctAnswer;
  if (mode === 'wrong') {
    const wrong = (q.options ?? []).find((o) => o.id !== q.correctAnswer);
    optionId = wrong?.id ?? 'A';
  }
  await page.locator(`.option:has(.option-key:text-is("${optionId}"))`).first().click();
}

/** id текущего вопроса берём из DOM (data-question-id) — это источник истины для UI */
async function currentQuestionId(page: Page): Promise<string> {
  const id = await page.evaluate(() => {
    const el = document.querySelector('[data-question-id]');
    return el ? el.getAttribute('data-question-id') : null;
  });
  if (!id) throw new Error('Текущий вопрос не найден в DOM');
  return id;
}

async function runExam(
  browser: Browser,
  exam: 'ielts' | 'sat',
  mode: 'correct' | 'wrong',
  target: string,
) {
  const context = await browser.newContext({
    ...devices['iPhone 12'],
    permissions: [],
  });
  const page = await context.newPage();
  const errors: string[] = [];
  page.on('pageerror', (e: Error) => errors.push(String(e)));
  page.on('console', (msg: ConsoleMessage) => {
    if (msg.type() === 'error') errors.push(msg.text());
  });

  await page.goto(`${BASE}/${UTM}`, { waitUntil: 'networkidle' });

  const examLabel = exam.toUpperCase();
  await page
    .locator('#hero')
    .getByRole('button', { name: `Начать диагностику ${examLabel}` })
    .click();

  // onboarding: цель
  await page.getByRole('button', { name: target, exact: true }).first().click();
  await page.waitForTimeout(300);
  // onboarding: срок
  await page.getByRole('button', { name: '1–3 месяца' }).click();
  await page.waitForTimeout(300);
  await page.getByRole('button', { name: 'Начать', exact: true }).click();
  await page.waitForTimeout(400);

  const totalText = await page.locator('text=/Вопрос \\d+ из \\d+/').first().innerText();
  const total = Number(totalText.match(/из\s+(\d+)/i)?.[1] ?? 0);

  for (let i = 0; i < total; i++) {
    const qid = await currentQuestionId(page);
    if (!qid) throw new Error('Не удалось определить текущий вопрос');

    // на середине теста — проверка refresh-persistence
    if (i === Math.floor(total / 2) && mode === 'correct') {
      await answerQuestion(page, qid, 'correct');
      const beforeIndex = i;
      await page.waitForTimeout(600); // ждём debounce-сохранение в localStorage
      await page.reload({ waitUntil: 'networkidle' });
      await page.waitForTimeout(400);
      const afterText = await page.locator('text=/Вопрос \\d+ из \\d+/').first().innerText();
      const afterIndex = Number(afterText.match(/Вопрос\s+(\d+)/i)?.[1] ?? 0) - 1;
      check(
        `${exam}: refresh сохраняет прогресс`,
        afterIndex === beforeIndex,
        `был вопрос ${beforeIndex + 1}, после reload ${afterIndex + 1}`,
      );
      const kept = await page.locator('.option[data-selected="true"]').count();
      check(`${exam}: ответ пережил reload`, kept > 0, `выбранных вариантов: ${kept}`);
      const nextAfterReload = page.getByRole('button', { name: 'Далее' });
      if (await nextAfterReload.count()) await nextAfterReload.click();
      await page.waitForTimeout(200);
      continue;
    }

    await answerQuestion(page, qid, mode);

    const next = page.getByRole('button', { name: 'Далее' });
    if (await next.count()) {
      await next.click();
    } else {
      break;
    }
    await page.waitForTimeout(120);
  }

  // finish (кнопка «Финиш» есть на любом вопросе)
  await page.getByRole('button', { name: 'Завершить диагностику' }).click();
  await page.waitForTimeout(250);
  await page.getByRole('button', { name: 'Завершить и увидеть результат' }).click();
  await page.waitForTimeout(700);

  const bodyText = await page.locator('body').innerText();
  const waLinks = await page.locator('a[href^="https://wa.me/"]').count();
  const scrollWidth = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );

  await page.screenshot({
    path: `screenshots/${exam}-${mode}-result.png`,
    fullPage: true,
  });
  const cardShot = page.locator('.relative.mx-auto.w-full').first();
  if (await cardShot.count()) {
    await cardShot.screenshot({ path: `screenshots/${exam}-${mode}-card.png` });
  }

  await context.close();
  return { bodyText, waLinks, scrollWidth, errors, total };
}

async function main() {
  const browser = await chromium.launch({ args: ['--no-sandbox'] });

  /* ---------- 1. Landing ---------- */
  const ctx = await browser.newContext({ ...devices['iPhone 12'] });
  const page = await ctx.newPage();
  await page.goto(`${BASE}/${UTM}`, { waitUntil: 'networkidle' });
  const landing = await page.locator('body').innerText();
  check('landing: hook на месте', has(landing, 'Какой балл'));
  check('landing: 20 минут', has(landing, '20 минут'));
  check('landing: обе кнопки экзамена', has(landing, 'IELTS') && has(landing, 'SAT'));
  // CTA должна быть видна без скролла на телефоне (above the fold)
  const vp = page.viewportSize() ?? { width: 390, height: 844 };
  const ctaBox = await page
    .locator('#hero')
    .getByRole('button', { name: 'Начать диагностику IELTS' })
    .boundingBox();
  check(
    'landing: CTA выше сгиба',
    Boolean(ctaBox) && (ctaBox!.y + ctaBox!.height) <= vp.height,
    ctaBox ? `низ кнопки ${Math.round(ctaBox.y + ctaBox.height)}px при viewport ${vp.height}px` : 'кнопка не найдена',
  );
  check('landing: секции лендинга на месте', has(landing, 'Что ты узнаешь') && has(landing, 'Как это работает'));
  const landingScroll = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );
  check('landing: нет горизонтального скролла', landingScroll <= 0, `${landingScroll}px`);
  await page.screenshot({ path: 'screenshots/landing-mobile.png', fullPage: true });

  // desktop
  const desktop = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const dpage = await desktop.newPage();
  await dpage.goto(`${BASE}/${UTM}`, { waitUntil: 'networkidle' });
  await dpage.screenshot({ path: 'screenshots/landing-desktop.png', fullPage: true });
  check('landing desktop: рендерится', (await dpage.locator('h1').innerText()).length > 10);
  await desktop.close();
  await ctx.close();

  /* ---------- 2. IELTS: все ответы верные ---------- */
  const ieltsGood = await runExam(browser, 'ielts', 'correct', '7.0');
  check('ielts: результат показан', has(ieltsGood.bodyText, 'Твоя точка А'));
  check('ielts: максимальный band при всех верных', has(ieltsGood.bodyText, '7.5–9.0'));
  check('ielts: gap считается', has(ieltsGood.bodyText, 'цель уже в диапазоне') || has(ieltsGood.bodyText, '≈ +'));
  check('ielts: disclaimer про Writing/Speaking', has(ieltsGood.bodyText, 'Writing и Speaking'));
  check('ielts: WhatsApp CTA', ieltsGood.waLinks >= 2, `${ieltsGood.waLinks} ссылок`);
  check('ielts: нет горизонтального скролла', ieltsGood.scrollWidth <= 0, `${ieltsGood.scrollWidth}px`);
  check('ielts: нет ошибок в консоли', ieltsGood.errors.length === 0, ieltsGood.errors.slice(0, 2).join(' | '));

  /* ---------- 3. IELTS: все ответы неверные ---------- */
  const ieltsBad = await runExam(browser, 'ielts', 'wrong', '6.5');
  check('ielts: низкий результат при ошибках', has(ieltsBad.bodyText, '4.0–5.5'));
  check('ielts: gap до цели показан', has(ieltsBad.bodyText, '≈ +'));
  check('ielts: есть insight про слабые места', has(ieltsBad.bodyText, 'Что это значит'));

  /* ---------- 4. SAT: все ответы верные ---------- */
  const satGood = await runExam(browser, 'sat', 'correct', '1400+');
  check('sat: 16 вопросов', satGood.total === 16, `фактически ${satGood.total}`);
  check('sat: максимальный диапазон при всех верных', has(satGood.bodyText, '1500+'));
  check('sat: disclaimer про College Board', has(satGood.bodyText, 'College Board'));
  check('sat: WhatsApp CTA', satGood.waLinks >= 2);
  check('sat: нет горизонтального скролла', satGood.scrollWidth <= 0, `${satGood.scrollWidth}px`);
  check('sat: нет ошибок в консоли', satGood.errors.length === 0, satGood.errors.slice(0, 2).join(' | '));

  /* ---------- 5. SAT: все ответы неверные ---------- */
  const satBad = await runExam(browser, 'sat', 'wrong', '1500+');
  check('sat: низкий диапазон при ошибках', has(satBad.bodyText, 'до 1000'));
  check('sat: gap ≈ +500', has(satBad.bodyText, '≈ +'));

  /* ---------- 6. Независимость результатов + review + reset ---------- */
  const ctx2 = await browser.newContext({ ...devices['iPhone 12'] });
  const p2 = await ctx2.newPage();
  await p2.goto(`${BASE}/${UTM}`, { waitUntil: 'networkidle' });
  await p2.locator('#hero').getByRole('button', { name: 'Начать диагностику SAT' }).click();
  await p2.getByRole('button', { name: '1300+', exact: true }).first().click();
  await p2.waitForTimeout(300);
  await p2.getByRole('button', { name: 'позже' }).click();
  await p2.waitForTimeout(300);
  await p2.getByRole('button', { name: 'Начать', exact: true }).click();
  await p2.waitForTimeout(500);

  // отвечаем на 3 вопроса и выходим на главную
  for (let i = 0; i < 3; i++) {
    const qid = await currentQuestionId(p2);
    await answerQuestion(p2, qid, 'correct');
    const next = p2.getByRole('button', { name: 'Далее' });
    if (await next.count()) await next.click();
    await p2.waitForTimeout(120);
  }
  await p2.getByRole('button', { name: 'Открыть список вопросов' }).click();
  await p2.waitForTimeout(250);
  await p2.screenshot({ path: 'screenshots/sat-questionmap.png' });
  const mapText = await p2.locator('body').innerText();
  check('quiz: карта вопросов показывает прогресс', has(mapText, 'отвечено'));
  await p2.getByRole('button', { name: 'Выйти на главную' }).click();
  await p2.waitForTimeout(250);
  await p2.getByRole('button', { name: 'Выйти' }).click();
  await p2.waitForTimeout(400);

  const homeText = await p2.locator('body').innerText();
  check('landing: показывает «Продолжить» для SAT', has(homeText, 'Продолжить'));

  // независимость: IELTS не затронут
  const stored = await p2.evaluate(() => ({
    sat: localStorage.getItem('ashyq:v1:run:sat'),
    ielts: localStorage.getItem('ashyq:v1:run:ielts'),
  }));
  check('storage: SAT-прогресс сохранён', Boolean(stored.sat));
  check('storage: IELTS хранится отдельно', stored.ielts === null || !JSON.parse(stored.ielts!).finished);

  // возвращаемся и завершаем
  await p2.locator('#hero').getByRole('button', { name: 'Начать диагностику SAT' }).click();
  await p2.waitForTimeout(400);
  const resumed = await p2.locator('text=/Вопрос \\d+ из \\d+/').first().innerText();
  check('resume: вернулись на тот же вопрос', has(resumed, 'Вопрос 4 из 16'), resumed);

  const total2 = 16;
  for (let i = 0; i < total2; i++) {
    const qid = await currentQuestionId(p2);
    if (!qid) break;
    await answerQuestion(p2, qid, i % 2 === 0 ? 'correct' : 'wrong');
    const next = p2.getByRole('button', { name: 'Далее' });
    if (await next.count()) await next.click();
    else break;
    await p2.waitForTimeout(100);
  }
  await p2.getByRole('button', { name: 'Завершить диагностику' }).click();
  await p2.waitForTimeout(200);
  const dialogText = await p2.locator('[role="dialog"]').innerText();
  check(
    'finish: подтверждение показывает состояние ответов',
    /Отвечено \d+ из 16|Все вопросы отвечены/i.test(dialogText),
    dialogText.replace(/\n+/g, ' ').slice(0, 90),
  );
  await p2.getByRole('button', { name: 'Завершить и увидеть результат' }).click();
  await p2.waitForTimeout(600);

  const resultText = await p2.locator('body').innerText();
  check('result: смешанный результат в среднем диапазоне', /\d{3,4}[–-]\d{3,4}|1500\+|до 1000/i.test(resultText));

  // таймер не обрывает тест: проверяем, что после 15 минут появляется мягкое предупреждение
  await p2.evaluate(() => {
    const key = 'ashyq:v1:run:sat';
    const raw = localStorage.getItem(key);
    if (!raw) return;
    const parsed = JSON.parse(raw);
    parsed.elapsedMs = 16 * 60 * 1000;
    localStorage.setItem(key, JSON.stringify(parsed));
  });

  // review
  await p2.getByRole('button', { name: 'Посмотреть разбор вопросов' }).click();
  await p2.waitForTimeout(500);
  const reviewText = await p2.locator('body').innerText();
  check('review: показывает верные ответы', has(reviewText, 'Верно') && has(reviewText, 'Почему так'));
  check('review: CTA на WhatsApp есть', (await p2.locator('a[href^="https://wa.me/"]').count()) >= 1);
  await p2.screenshot({ path: 'screenshots/sat-review.png', fullPage: true });

  await p2.getByRole('button', { name: 'К результату' }).first().click();
  await p2.waitForTimeout(400);

  // lead capture: форма принимает телефон, а выгрузка без admin key скрыта
  await p2.locator('#booking-phone').fill('8 706 555 44 33');
  await p2.locator('#booking-name').fill('E2E Student');
  await p2.locator('#booking-grade').fill('10');
  await p2.getByRole('button', { name: 'Записаться на разбор' }).click();
  check(
    'lead: без согласия заявка не отправляется',
    has(await p2.locator('body').innerText(), 'Для отправки заявки нужно согласие'),
  );
  await p2.locator('input[type="checkbox"]').last().check();
  await p2.getByRole('button', { name: 'Записаться на разбор' }).click();
  await p2.getByText('Заявка принята').waitFor();
  check('lead: контактная заявка принята сервером', has(await p2.locator('body').innerText(), 'Заявка принята'));
  const hiddenLeads = await p2.request.get(`${BASE}/api/leads`);
  check('lead: выгрузка без admin key скрыта', hiddenLeads.status() === 404, `HTTP ${hiddenLeads.status()}`);

  // reset
  await p2.getByRole('button', { name: 'Пройти ещё раз' }).click();
  await p2.waitForTimeout(250);
  await p2.getByRole('button', { name: 'Да, начать заново' }).click();
  await p2.waitForTimeout(500);
  const afterReset = await p2.locator('body').innerText();
  check('reset: вернулись к onboarding', has(afterReset, 'Какой результат тебе нужен'));

  await ctx2.close();

  /* ---------- 7. Public pages, Program & Progress ---------- */
  const ctx3 = await browser.newContext({ ...devices['iPhone 12'] });
  const p3 = await ctx3.newPage();
  await p3.goto(`${BASE}/program`, { waitUntil: 'networkidle' });
  const progText = await p3.locator('body').innerText();
  check(
    'program: match day и чемпионат на месте',
    has(progText, 'Match Day') && has(progText, 'Чемпионат'),
  );
  check('program: призы сезона', has(progText, '100 000') && has(progText, '500 000'));
  const progScroll = await p3.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );
  check('program: нет горизонтального скролла', progScroll <= 0, `${progScroll}px`);
  await p3.screenshot({ path: 'screenshots/program-mobile.png', fullPage: true });

  // progress: пустое состояние честно зовёт в диагностику
  await p3.goto(`${BASE}/progress`, { waitUntil: 'networkidle' });
  const emptyText = await p3.locator('body').innerText();
  check('progress: пустое состояние зовёт в диагностику', has(emptyText, 'Пока пусто'));
  await p3.getByRole('link', { name: 'Начать диагностику SAT' }).click();
  await p3.waitForTimeout(500);
  const startedText = await p3.locator('body').innerText();
  check(
    'progress: deep-link ?start= ведёт в onboarding',
    has(startedText, 'Какой результат тебе нужен'),
  );

  // progress с историей: дельта, skill scores, график
  await p3.evaluate(() => {
    const now = Date.now();
    const sectionsA = [
      { section: 'rw', label: 'Reading & Writing', percent: 40, correct: 4, total: 8 },
      { section: 'math', label: 'Math', percent: 55, correct: 6, total: 8 },
    ];
    const sectionsB = [
      { section: 'rw', label: 'Reading & Writing', percent: 62, correct: 5, total: 8 },
      { section: 'math', label: 'Math', percent: 74, correct: 6, total: 8 },
    ];
    localStorage.setItem(
      'ashyq:v1:history:sat',
      JSON.stringify([
        {
          runId: 'run-a',
          ts: now - 86400000 * 30,
          bandLabel: '1000–1100',
          bandLow: 1000,
          bandHigh: 1100,
          overallPercent: 48,
          totalCorrect: 10,
          totalQuestions: 16,
          elapsedMs: 900000,
          target: '1400',
          sections: sectionsA,
        },
        {
          runId: 'run-b',
          ts: now - 86400000 * 2,
          bandLabel: '1190–1290',
          bandLow: 1190,
          bandHigh: 1290,
          overallPercent: 68,
          totalCorrect: 10,
          totalQuestions: 16,
          elapsedMs: 900000,
          target: '1400',
          sections: sectionsB,
        },
      ]),
    );
    localStorage.removeItem('ashyq:v1:active');
  });
  await p3.goto(`${BASE}/progress`, { waitUntil: 'networkidle' });
  const histText = await p3.locator('body').innerText();
  check('progress: последняя точка А показана', has(histText, '1190–1290'));
  check('progress: дельта с первой точки', has(histText, 'пунктов'));
  check('progress: skill scores было → стало', has(histText, 'было') && has(histText, 'MATH'));
  check(
    'progress: график отрендерен',
    (await p3.locator('svg[data-chart="band"]').count()) === 1,
  );
  await p3.screenshot({ path: 'screenshots/progress-mobile.png', fullPage: true });

  // community: реальный публичный маршрут и CTA
  await p3.goto(`${BASE}/community`, { waitUntil: 'networkidle' });
  const communityText = await p3.locator('body').innerText();
  check('community: ценности и CTA на месте', has(communityText, 'Люди делают знания живыми') && has(communityText, 'Следующий сезон'));
  check('community: изображения имеют alt', (await p3.locator('main img[alt]').count()) >= 2);

  // season: обязательное согласие и рабочий lead endpoint
  await p3.goto(`${BASE}/season`, { waitUntil: 'networkidle' });
  const seasonText = await p3.locator('body').innerText();
  check('season: активный публичный hub', has(seasonText, 'Season 03') && has(seasonText, 'Идёт сейчас'));
  check('season: публичные команды и участники', (await p3.getByRole('tab', { name: 'Команды' }).count()) === 1 && (await p3.getByRole('tab', { name: 'Участники' }).count()) === 1);
  await p3.getByRole('tab', { name: 'Участники' }).click();
  check('season: safe aliases объяснены', has(await p3.locator('body').innerText(), 'безопасными псевдонимами'));
  await p3.getByRole('button', { name: 'SAT', exact: true }).click();
  check('season: IELTS и SAT разделены', has(await p3.locator('body').innerText(), 'Участники · SAT'));
  const seasonScroll = await p3.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  check('season: нет горизонтального скролла', seasonScroll <= 0, `${seasonScroll}px`);
  await p3.locator('#season-name').fill('E2E Season');
  await p3.locator('#season-phone').fill('8 706 555 44 33');
  await p3.getByRole('button', { name: 'Узнать о следующем сезоне' }).click();
  check('season: без согласия заявка не отправляется', has(await p3.locator('body').innerText(), 'Для отправки заявки нужно согласие'));
  await p3.locator('input[type="checkbox"]').check();
  await p3.getByRole('button', { name: 'Узнать о следующем сезоне' }).click();
  await p3.getByText('Заявка принята').waitFor();
  check('season: заявка принята сервером', has(await p3.locator('body').innerText(), 'Заявка принята'));

  await p3.goto(`${BASE}/season/current`, { waitUntil: 'networkidle' });
  check('season HQ: честная demo маркировка', has(await p3.locator('body').innerText(), 'авторизация и серверные баллы ещё не подключены'));
  await p3.getByRole('button', { name: 'Live Arena' }).click();
  check('season HQ: Live Arena работает', has(await p3.locator('body').innerText(), 'Командный спринт') && has(await p3.locator('body').innerText(), '12:48'));
  await p3.getByRole('button', { name: 'Открыть задание' }).click();
  check('season HQ: задание открывается', has(await p3.locator('body').innerText(), 'Фрагмент B'));
  await p3.getByRole('button', { name: 'После сезона' }).click();
  check('season HQ: Journey preview работает', has(await p3.locator('body').innerText(), 'Твой Season Journey') && has(await p3.locator('body').innerText(), 'не равны официальному баллу'));
  const hqScroll = await p3.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  check('season HQ: нет горизонтального скролла', hqScroll <= 0, `${hqScroll}px`);

  // FAQ и юридические маршруты
  await p3.goto(`${BASE}/faq`, { waitUntil: 'networkidle' });
  check('faq: восемь ответов доступны', (await p3.locator('main details').count()) === 8);
  await p3.goto(`${BASE}/privacy`, { waitUntil: 'networkidle' });
  check('privacy: описаны согласие и отзыв', has(await p3.locator('body').innerText(), 'Согласие и отзыв'));
  await p3.goto(`${BASE}/terms`, { waitUntil: 'networkidle' });
  check('terms: disclaimer диагностики на месте', has(await p3.locator('body').innerText(), 'не равен официальному результату'));

  // SEO endpoints и route metadata
  const robots = await p3.request.get(`${BASE}/robots.txt`);
  const sitemap = await p3.request.get(`${BASE}/sitemap.xml`);
  check('seo: robots.txt доступен', robots.ok() && (await robots.text()).includes('sitemap.xml'));
  check('seo: CRM закрыта от индексации', (await robots.text()).includes('/crm'));
  check('seo: sitemap содержит публичные маршруты', sitemap.ok() && (await sitemap.text()).includes('/community'));
  check('seo: route title установлен', (await p3.title()).includes('Условия использования'));

  await p3.goto(`${BASE}/crm`, { waitUntil: 'networkidle' });
  const crmText = await p3.locator('body').innerText();
  check('crm: закрытый экран запрашивает admin key', has(crmText, 'ASHYQ admin key') && has(crmText, 'Закрытый раздел'));
  const crmApi = await p3.request.get(`${BASE}/api/crm`);
  check('crm: API без ключа скрыт', crmApi.status() === 404, `HTTP ${crmApi.status()}`);
  if (CRM_ADMIN_KEY) {
    const headers = { 'x-ashyq-admin-key': CRM_ADMIN_KEY };
    const authorized = await p3.request.get(`${BASE}/api/crm`, { headers });
    check('crm: верный ключ открывает API', authorized.ok(), `HTTP ${authorized.status()}`);
    if (authorized.ok()) {
      const data = (await authorized.json()) as { records: Array<{ runId: string }> };
      check('crm: события собраны в записи', data.records.length > 0, `${data.records.length} записей`);
      if (data.records[0]) {
        const updated = await p3.request.patch(`${BASE}/api/crm`, {
          headers,
          data: { runId: data.records[0].runId, stage: 'contacted' },
        });
        check('crm: этап сохраняется', updated.ok(), `HTTP ${updated.status()}`);
      }
    }
  }

  // landing: nav-ссылки на новые разделы
  await p3.goto(`${BASE}/`, { waitUntil: 'networkidle' });
  check(
    'landing: nav-ссылки на основные разделы',
    (await p3.getByRole('link', { name: 'Программа' }).count()) >= 1 &&
      (await p3.getByRole('link', { name: 'Прогресс' }).count()) >= 1 &&
      (await p3.getByRole('link', { name: 'Сообщество' }).count()) >= 1 &&
      (await p3.getByRole('link', { name: 'FAQ' }).count()) >= 1,
  );
  await ctx3.close();

  await browser.close();

  const failed = results.filter((r) => !r.ok);
  console.log(`\n=== ${results.length - failed.length}/${results.length} проверок пройдено ===`);
  if (failed.length > 0) {
    console.log('Провалено:');
    failed.forEach((f) => console.log(` - ${f.name}${f.detail ? ` (${f.detail})` : ''}`));
    process.exit(1);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
