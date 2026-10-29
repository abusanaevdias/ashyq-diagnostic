import { COLOR } from '@/lib/design-tokens';
import { loadBrandAssets, type BrandAssets } from '@/lib/card-image';
import type { DiagnosticResult } from '@/lib/types';
import type { DiagnosticFinale } from './finale';
export type StoryResult = Pick<DiagnosticResult, 'exam' | 'totalCorrect' | 'totalQuestions' | 'answeredQuestions'>;
export type StoryFinale = Pick<DiagnosticFinale, 'title' | 'tip' | 'band' | 'caution' | 'noAnswers' | 'noRange'>;

const esc = (v: string) => v.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
function lines(text: string, max: number): string[] {
  const output: string[] = []; let line = '';
  for (const word of text.split(/\s+/)) { if (line && `${line} ${word}`.length > max) { output.push(line); line = word; } else line = line ? `${line} ${word}` : word; }
  if (line) output.push(line);
  return output;
}

/** Explicit public export whitelist: no run/account IDs, answers, contacts or tracking parameters. */
export function buildStorySvg(result: StoryResult, finale: StoryFinale, assets: BrandAssets): string {
  const title = lines(finale.title, 25);
  const tip = lines(finale.tip, 35);
  const textLines = (rows: string[], y: number, size: number, gap: number, fill: string) => rows.map((text, i) => `<text x="84" y="${y + i * gap}" font-family="InterCard, sans-serif" font-size="${size}" fill="${fill}">${esc(text)}</text>`).join('');
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1920" viewBox="0 0 1080 1920"><defs><style>${assets.fontCss}</style></defs>
    <rect width="1080" height="1920" fill="${COLOR.bg}"/><rect x="32" y="32" width="1016" height="1856" rx="32" fill="${COLOR.surface}" stroke="${COLOR.hairline}"/>
    ${assets.wordmark ? `<image href="${assets.wordmark}" x="84" y="94" width="206" height="66" preserveAspectRatio="xMinYMid meet"/>` : `<text x="84" y="155" font-family="ManropeCard,sans-serif" font-size="64" font-weight="700" fill="${COLOR.red}">ASHYQ.</text>`}
    <text x="84" y="250" font-family="InterCard,sans-serif" font-size="32" letter-spacing="4" fill="${COLOR.inkSoft}">${result.exam.toUpperCase()} · QUICK DIAGNOSTIC</text>
    <text x="84" y="350" font-family="ManropeCard,sans-serif" font-size="70" font-weight="700" fill="${COLOR.ink}">Моя точка А.</text>
    <text x="76" y="530" font-family="ManropeCard,sans-serif" font-size="${finale.band.length > 9 ? 112 : 142}" font-weight="700" letter-spacing="-8" fill="${COLOR.ink}">${esc(finale.noRange ? `${result.answeredQuestions} / ${result.totalQuestions}` : finale.band)}</text>
    ${textLines([finale.noRange ? 'Заданий отвечено · пока без диапазона' : 'Предварительный диапазон', finale.caution], 596, 30, 46, COLOR.inkSoft)}
    <path d="M84 710H996" stroke="${COLOR.hairline}"/><circle cx="107" cy="782" r="16" fill="${COLOR.red}"/>
    <text x="150" y="797" font-family="InterCard,sans-serif" font-size="40" fill="${COLOR.ink}">${result.totalCorrect} из ${result.totalQuestions} верно · отвечено ${result.answeredQuestions}</text>
    <path d="M102 854H365Q405 854 427 875T490 896H934" fill="none" stroke="${COLOR.red}" stroke-width="5"/><circle cx="102" cy="854" r="12" fill="${COLOR.red}"/><circle cx="470" cy="891" r="10" fill="${COLOR.surface}" stroke="${COLOR.red}" stroke-width="4"/><path d="M914 880l20 16-20 16" fill="none" stroke="${COLOR.red}" stroke-width="5"/>
    <g font-family="InterCard,sans-serif" font-size="23" fill="${COLOR.inkSoft}"><text x="84" y="920">ПОПРОБУЙ</text><text x="420" y="937">РАЗБЕРИ</text><text x="825" y="937">ПРИМЕНИ</text></g>
    <text x="84" y="990" font-family="InterCard,sans-serif" font-size="30" letter-spacing="4" fill="${COLOR.redDeep}">МОЙ СЛЕДУЮЩИЙ ШАГ</text>
    ${textLines(title, 1050, 60, 78, COLOR.ink)}
    ${textLines(tip, 1050 + title.length * 78 + 44, 42, 61, COLOR.inkSoft)}
    <path d="M84 1560H996" stroke="${COLOR.hairline}"/>
    <text x="84" y="1640" font-family="ManropeCard,sans-serif" font-size="48" font-weight="700" fill="${COLOR.ink}">Знаю, с чего продолжить.</text>
    ${textLines(['Не официальный балл IELTS / SAT.', result.exam === 'ielts' ? 'Проверены Reading и Listening.' : 'Проверены Reading & Writing и Math.'], 1715, 28, 42, COLOR.inkSoft)}
    <text x="84" y="1830" font-family="InterCard,sans-serif" font-size="32" fill="${COLOR.redDeep}">ashyq-diagnostic.vercel.app/diagnostic ↗</text>
  </svg>`;
}

export function createStoryPng(result: StoryResult, finale: StoryFinale): Promise<Blob> {
  return new Promise((resolve, reject) => {
    let source: string | undefined;
    const img = new Image(); let finished = false;
    const finish = (blob?: Blob | null) => { if (finished) return; finished = true; clearTimeout(timeout); if (source) URL.revokeObjectURL(source); if (blob) resolve(blob); else reject(new Error('Карточка не создалась. Попробуй ещё раз или скопируй текст.')); };
    const timeout = window.setTimeout(() => finish(), 15000);
    img.onload = () => { try { const canvas = document.createElement('canvas'); canvas.width = 1080; canvas.height = 1920; const ctx = canvas.getContext('2d'); if (!ctx) return finish(); ctx.drawImage(img, 0, 0); canvas.toBlob(blob => finish(blob), 'image/png'); } catch { finish(); } };
    img.onerror = () => finish();
    void loadBrandAssets().then(assets => { if (finished) return; source = URL.createObjectURL(new Blob([buildStorySvg(result, finale, assets)], { type: 'image/svg+xml;charset=utf-8' })); img.src = source; }).catch(() => finish());
  });
}
