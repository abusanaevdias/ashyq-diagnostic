import assert from 'node:assert/strict';
import { mkdir, readFile } from 'node:fs/promises';
import { chromium } from 'playwright';

import { buildCardSvg, type CardData } from '../src/lib/card-image';

const fixture: CardData = {
  exam: 'IELTS Academic',
  headline: 'Предварительный результат',
  bandLabel: 'Band 6.5',
  level: 'Уверенный средний уровень',
  sections: [
    { label: 'Reading', percent: 76, level: 'B2' },
    { label: 'Listening', percent: 68, level: 'B1+' },
  ],
  target: 'Band 7.5',
  gapLabel: '+1.0',
  nextStep: 'Усилить Reading и закрепить тайминг',
  strongest: 'Reading: поиск деталей и логика текста',
};

/** Реальный случай из отчёта пользователя: цель не выбрана — «не выбрана» вылезала из блока. */
const noTarget: CardData = {
  exam: 'SAT',
  headline: 'SAT readiness',
  bandLabel: '1000–1150',
  level: 'Есть на что опереться · 5 из 16 верно',
  sections: [
    { label: 'Reading & Writing', percent: 54, level: 'Developing' },
    { label: 'Math', percent: 17, level: 'Foundation' },
  ],
  target: 'не выбрана',
  gapLabel: '—',
  nextStep: 'Standard English Conventions',
  strongest: 'Information and Ideas',
};

/** Края каждого <text>: свои data-max-x/data-max-y (граница блока) или край карточки (1040). */
const OVERFLOW_PROBE = `[...document.querySelectorAll('text')].flatMap((t) => {
  const box = t.getBBox();
  const maxX = Number(t.getAttribute('data-max-x') || 1040);
  const maxY = Number(t.getAttribute('data-max-y') || 1040);
  const label = t.textContent.replace(/\\s+/g, ' ').trim();
  const out = [];
  if (box.x + box.width > maxX + 0.5) out.push(label + ' → x ' + Math.round(box.x + box.width) + ' > ' + maxX);
  if (box.y + box.height > maxY + 0.5) out.push(label + ' → y ' + Math.round(box.y + box.height) + ' > ' + maxY);
  return out;
})`;

async function main() {
  const [wordmark, manropeCyr, manropeLat, interCyr, interLat, interCyr600, interLat600] = await Promise.all([
    readFile('public/brand/wordmark-red.png', 'base64'),
    readFile('public/fonts/manrope-700-cyrillic.woff2', 'base64'),
    readFile('public/fonts/manrope-700-latin.woff2', 'base64'),
    readFile('public/fonts/inter-400-cyrillic.woff2', 'base64'),
    readFile('public/fonts/inter-400-latin.woff2', 'base64'),
    readFile('public/fonts/inter-600-cyrillic.woff2', 'base64'),
    readFile('public/fonts/inter-600-latin.woff2', 'base64'),
  ]);
  const fontFace = (family: string, weight: number, encoded: string) =>
    `@font-face{font-family:'${family}';font-weight:${weight};src:url(data:font/woff2;base64,${encoded}) format('woff2');}`;
  const assets = {
    wordmark: `data:image/png;base64,${wordmark}`,
    fontCss: [
      fontFace('ManropeCard', 700, manropeCyr),
      fontFace('ManropeCard', 700, manropeLat),
      fontFace('InterCard', 400, interCyr),
      fontFace('InterCard', 400, interLat),
      fontFace('InterCard', 600, interCyr600),
      fontFace('InterCard', 600, interLat600),
    ].join(''),
  };
  const svg = buildCardSvg(fixture, assets);

  for (const token of ['#F8F7F3', '#FDFDFD', '#F9E0DB', '#FCF3F0', '#DE0B1B', '#161311', '#6E6D6B', '#8C8B8A', '#EFEEEA', '#241D16']) {
    assert(svg.includes(token), `Missing v3 token ${token}`);
  }
  for (const legacy of ['#211A16', '#F7F3EA', '#CE1E23', 'OswaldBrand', 'feTurbulence']) {
    assert(!svg.includes(legacy), `Legacy v2 styling remains: ${legacy}`);
  }
  assert(svg.includes('не официальный результат IELTS / SAT'), 'Required disclaimer is missing');

  await mkdir('screenshots', { recursive: true });
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1080, height: 1080 } });
  for (const [name, data] of [['v3-result-card', fixture], ['v3-result-card-no-target', noTarget]] as const) {
    await page.setContent(`<style>html,body{margin:0}</style>${buildCardSvg(data, assets)}`);
    await page.evaluate('document.fonts.ready');
    const overflow = (await page.evaluate(OVERFLOW_PROBE)) as string[];
    assert.deepEqual(overflow, [], `${name}: text overflows its box: ${overflow.join('; ')}`);
    await page.screenshot({ path: `screenshots/${name}.png` });
  }
  await browser.close();

  console.log('PASS result card: v3 tokens, legacy-style exclusion, disclaimer, no text overflow, 1080x1080 render');
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
