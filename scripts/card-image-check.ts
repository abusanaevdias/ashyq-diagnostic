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
  const svg = buildCardSvg(fixture, {
    wordmark: `data:image/png;base64,${wordmark}`,
    fontCss: [
      fontFace('ManropeCard', 700, manropeCyr),
      fontFace('ManropeCard', 700, manropeLat),
      fontFace('InterCard', 400, interCyr),
      fontFace('InterCard', 400, interLat),
      fontFace('InterCard', 600, interCyr600),
      fontFace('InterCard', 600, interLat600),
    ].join(''),
  });

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
  await page.setContent(`<style>html,body{margin:0}</style>${svg}`);
  await page.screenshot({ path: 'screenshots/v3-result-card.png' });
  await browser.close();

  console.log('PASS result card: v3 tokens, legacy-style exclusion, disclaimer, 1080x1080 render');
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
