/**
 * Генерация карточки результата в PNG без внешних библиотек.
 *
 * Рендерим SVG-строку -> Image -> canvas -> blob -> download.
 * Если браузер не поддерживает любой из шагов, функция вернёт false,
 * и UI честно предложит сделать обычный скриншот.
 *
 * Дизайн карточки v3 = Clean Premium EdTech: тёплый светлый фон, surface,
 * Manrope/Inter, мягкая геометрия и один красный акцент. Значения ниже —
 * точная копия design/tokens.css; SVG не умеет читать CSS-переменные страницы.
 *
 * Раскладка совпадает с экранной DiagnosticCard.tsx — менять вместе.
 * data-max-x у текстов в блоках = правый край блока: по нему
 * scripts/card-image-check.ts ловит вылезающий текст. Не удалять.
 */

export interface CardSection {
  label: string;
  percent: number;
  level: string;
}

export interface CardData {
  exam: string;
  headline: string;
  bandLabel: string;
  level: string;
  sections: CardSection[];
  target: string;
  gapLabel: string;
  nextStep: string;
  strongest: string;
}

const BG = '#F8F7F3';
const SURFACE = '#FDFDFD';
const BLUSH = '#F9E0DB';
const BLUSH_SOFT = '#FCF3F0';
const RED = '#DE0B1B';
const RED_DEEP = '#B60916';
const INK = '#161311';
const INK_SOFT = '#6E6D6B';
const INK_MUTED = '#8C8B8A';
const HAIRLINE = '#EFEEEA';
const DARK_WARM = '#241D16';
const ON_DARK = '#F8F7F3';
const DISPLAY = "'ManropeCard','Arial Black','Helvetica Neue',Helvetica,Arial,sans-serif";
const UI = "'InterCard','Inter',-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif";

interface BrandAssets {
  wordmark: string | null; // data URI оригинального красного wordmark
  fontCss: string; // Manrope 700 + Inter 400/600, embedded woff2
}

let assetsCache: Promise<BrandAssets> | null = null;

async function blobToDataUrl(url: string): Promise<string> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`asset ${url}: ${res.status}`);
  const buf = new Uint8Array(await res.arrayBuffer());
  let bin = '';
  const chunk = 0x8000;
  for (let i = 0; i < buf.length; i += chunk) {
    bin += String.fromCharCode(...buf.subarray(i, i + chunk));
  }
  return `data:${res.headers.get('content-type') ?? 'application/octet-stream'};base64,${btoa(bin)}`;
}

/** Бренд-ассеты для автономного SVG: wordmark + v3-шрифты. */
function loadBrandAssets(): Promise<BrandAssets> {
  if (!assetsCache) {
    assetsCache = (async () => {
      const [wordmark, manropeCyr, manropeLat, interCyr, interLat, interCyr600, interLat600] = await Promise.all([
        blobToDataUrl('/brand/wordmark-red.png').catch(() => null),
        blobToDataUrl('/fonts/manrope-700-cyrillic.woff2').catch(() => null),
        blobToDataUrl('/fonts/manrope-700-latin.woff2').catch(() => null),
        blobToDataUrl('/fonts/inter-400-cyrillic.woff2').catch(() => null),
        blobToDataUrl('/fonts/inter-400-latin.woff2').catch(() => null),
        blobToDataUrl('/fonts/inter-600-cyrillic.woff2').catch(() => null),
        blobToDataUrl('/fonts/inter-600-latin.woff2').catch(() => null),
      ]);
      const faces: string[] = [];
      if (manropeCyr) faces.push(`@font-face{font-family:'ManropeCard';font-weight:700;font-display:swap;src:url(${manropeCyr}) format('woff2');unicode-range:U+0301,U+0400-045F,U+0490-0491,U+04B0-04B1,U+2116;}`);
      if (manropeLat) faces.push(`@font-face{font-family:'ManropeCard';font-weight:700;font-display:swap;src:url(${manropeLat}) format('woff2');}`);
      if (interCyr) faces.push(`@font-face{font-family:'InterCard';font-weight:400;font-display:swap;src:url(${interCyr}) format('woff2');unicode-range:U+0301,U+0400-045F,U+0490-0491,U+04B0-04B1,U+2116;}`);
      if (interLat) faces.push(`@font-face{font-family:'InterCard';font-weight:400;font-display:swap;src:url(${interLat}) format('woff2');}`);
      if (interCyr600) faces.push(`@font-face{font-family:'InterCard';font-weight:600;font-display:swap;src:url(${interCyr600}) format('woff2');unicode-range:U+0301,U+0400-045F,U+0490-0491,U+04B0-04B1,U+2116;}`);
      if (interLat600) faces.push(`@font-face{font-family:'InterCard';font-weight:600;font-display:swap;src:url(${interLat600}) format('woff2');}`);
      return { wordmark, fontCss: faces.join('') };
    })();
  }
  return assetsCache;
}

function esc(value: string): string {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/** Обрезаем длинный текст, чтобы он не вылезал за карточку */
function truncate(text: string, max: number): string {
  const clean = text.replace(/\s+/g, ' ').trim();
  if (clean.length <= max) return clean;
  return `${clean.slice(0, max - 1).trimEnd()}…`;
}

/** Делим короткую рекомендацию максимум на две строки без разрыва слов. */
function wrapTwoLines(text: string, maxPerLine: number): string[] {
  const clean = text.replace(/\s+/g, ' ').trim();
  if (clean.length <= maxPerLine) return [clean];

  const words = clean.split(' ');
  let first = '';
  while (words.length > 0) {
    const candidate = first ? `${first} ${words[0]}` : words[0];
    if (candidate.length > maxPerLine && first) break;
    first = candidate;
    words.shift();
  }
  return [first, truncate(words.join(' '), maxPerLine)];
}

/** Подгоняем размер крупного текста под доступную ширину */
function fit(text: string, base: number, maxWidth: number, avgCharWidth = 0.62): number {
  const est = text.length * base * avgCharWidth;
  if (est <= maxWidth) return base;
  return Math.max(base * 0.45, (base * maxWidth) / est);
}

export function buildCardSvg(data: CardData, assets: BrandAssets | null = null): string {
  const W = 1080;
  const H = 1080;
  const pad = 68;

  const bandSize = fit(data.bandLabel, 144, 620, 0.54);
  const nextStepLines = wrapTwoLines(data.nextStep, 29);
  const nextSize = Math.min(...nextStepLines.map((line) => fit(line, 27, 410, 0.64)));
  // блоки «Цель»/«Gap» 220px минус отступы: «не выбрана» при 38px не помещалась
  const targetSize = fit(data.target, 38, 180, 0.66);
  const gapSize = fit(data.gapLabel, 38, 180, 0.66);

  const sectionRows = data.sections
    .map((s, i) => {
      const y = 610 + i * 94;
      const width = 520;
      const filled = Math.max(0, Math.min(1, s.percent / 100)) * width;
      return `
      <text x="${pad}" y="${y}" font-family="${UI}" font-size="24" font-weight="600" fill="${INK}">${esc(truncate(s.label, 24))}</text>
      <text x="${W - pad}" y="${y}" text-anchor="end" font-family="${UI}" font-size="22" fill="${INK_SOFT}">${s.percent}% · ${esc(truncate(s.level, 18))}</text>
      <rect x="${pad}" y="${y + 18}" width="${width}" height="12" rx="6" fill="${HAIRLINE}"/>
      <rect x="${pad}" y="${y + 18}" width="${filled}" height="12" rx="6" fill="${RED}"/>`;
    })
    .join('');

  const wordmarkHeader = assets?.wordmark
    ? `<image href="${assets.wordmark}" x="${pad}" y="${pad}" width="168" height="45" />`
    : `<text x="${pad}" y="${pad + 34}" font-family="${DISPLAY}" font-size="42" font-weight="700" fill="${RED}">ASHYQ</text>`;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <defs>
    <filter id="cardShadow" x="-10%" y="-10%" width="120%" height="130%">
      <feDropShadow dx="0" dy="10" stdDeviation="15" flood-color="${INK}" flood-opacity="0.06"/>
    </filter>
    <style>${assets?.fontCss ?? ''}
      text { font-kerning: normal; }
      .disp { font-family: ${DISPLAY}; font-weight: 700; }
    </style>
  </defs>

  <rect width="${W}" height="${H}" fill="${BG}"/>
  <rect x="40" y="40" width="1000" height="1000" rx="24" fill="${SURFACE}" stroke="${HAIRLINE}" filter="url(#cardShadow)"/>

  <!-- header -->
  ${wordmarkHeader}
  <text x="${W - pad}" y="${pad + 30}" text-anchor="end" font-family="${UI}" font-size="18" font-weight="600" letter-spacing="3" fill="${INK_MUTED}">QUICK DIAGNOSTIC</text>
  <line x1="${pad}" y1="${pad + 76}" x2="${W - pad}" y2="${pad + 76}" stroke="${HAIRLINE}"/>

  <!-- exam -->
  <rect x="${pad}" y="174" width="244" height="52" rx="26" fill="${BLUSH}"/>
  <text x="${pad + 24}" y="208" data-max-x="${pad + 232}" font-family="${UI}" font-size="21" font-weight="600" fill="${RED_DEEP}">${esc(truncate(data.exam, 18))}</text>
  <text x="${pad + 278}" y="207" font-family="${UI}" font-size="18" font-weight="600" letter-spacing="3" fill="${INK_MUTED}">${esc(truncate(data.headline, 36).toUpperCase())}</text>

  <!-- band -->
  <text x="${pad}" y="292" font-family="${UI}" font-size="20" font-weight="600" letter-spacing="4" fill="${RED}">ТВОЯ ТОЧКА А</text>
  <text class="disp" x="${pad}" y="${292 + bandSize}" font-size="${bandSize}" letter-spacing="-3" fill="${INK}">${esc(data.bandLabel)}</text>
  <text x="${pad}" y="${292 + bandSize + 48}" font-family="${UI}" font-size="26" fill="${INK_SOFT}">${esc(truncate(data.level, 60))}</text>
  <rect x="${pad}" y="510" width="${W - pad * 2}" height="58" rx="12" fill="${BLUSH_SOFT}"/>
  <text x="${pad + 20}" y="547" font-family="${UI}" font-size="20" font-weight="600" fill="${INK}">Сильная сторона · ${esc(truncate(data.strongest, 52))}</text>

  <!-- sections -->
  ${sectionRows}

  <!-- target / gap / next step -->
  <rect x="${pad}" y="810" width="220" height="126" rx="16" fill="${BLUSH_SOFT}"/>
  <text x="${pad + 20}" y="850" font-family="${UI}" font-size="17" font-weight="600" letter-spacing="3" fill="${INK_MUTED}">ЦЕЛЬ</text>
  <text class="disp" x="${pad + 20}" y="906" data-max-x="${pad + 204}" data-max-y="928" font-size="${targetSize}" fill="${INK}">${esc(truncate(data.target, 12))}</text>

  <rect x="${pad + 236}" y="810" width="220" height="126" rx="16" fill="${BLUSH_SOFT}"/>
  <text x="${pad + 256}" y="850" font-family="${UI}" font-size="17" font-weight="600" letter-spacing="3" fill="${INK_MUTED}">GAP</text>
  <text class="disp" x="${pad + 256}" y="906" data-max-x="${pad + 440}" data-max-y="928" font-size="${gapSize}" fill="${RED}">${esc(truncate(data.gapLabel, 16))}</text>

  <rect x="${pad + 472}" y="810" width="472" height="126" rx="20" fill="${DARK_WARM}"/>
  <text x="${pad + 496}" y="850" font-family="${UI}" font-size="17" font-weight="600" letter-spacing="3" fill="${ON_DARK}" opacity="0.72">СЛЕДУЮЩИЙ ШАГ</text>
  <text class="disp" x="${pad + 496}" y="${nextStepLines.length > 1 ? 884 : 892}" data-max-x="${pad + 928}" data-max-y="928" font-size="${nextSize}" fill="${ON_DARK}">
    ${nextStepLines.map((line, index) => `<tspan x="${pad + 496}" dy="${index === 0 ? 0 : 30}">${esc(line)}</tspan>`).join('')}
  </text>

  <text x="${pad}" y="990" font-family="${UI}" font-size="17" fill="${INK_MUTED}">Предварительная оценка по короткой диагностике ASHYQ · не официальный результат IELTS / SAT</text>
</svg>`;
}

export async function downloadCardPng(data: CardData, filename: string): Promise<boolean> {
  if (typeof window === 'undefined') return false;

  const assets = await loadBrandAssets().catch(() => null);

  return new Promise<boolean>((resolve) => {
    try {
      const svg = buildCardSvg(data, assets);
      const blob = new Blob([svg], { type: 'image/svg+xml;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const img = new Image();
      const cleanup = () => URL.revokeObjectURL(url);

      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          canvas.width = 1080;
          canvas.height = 1080;
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            cleanup();
            resolve(false);
            return;
          }
          ctx.fillStyle = BG;
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          cleanup();

          canvas.toBlob((png) => {
            if (!png) {
              resolve(false);
              return;
            }
            const pngUrl = URL.createObjectURL(png);
            const a = document.createElement('a');
            a.href = pngUrl;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.setTimeout(() => URL.revokeObjectURL(pngUrl), 2000);
            resolve(true);
          }, 'image/png');
        } catch {
          cleanup();
          resolve(false);
        }
      };

      img.onerror = () => {
        cleanup();
        resolve(false);
      };

      img.src = url;
    } catch {
      resolve(false);
    }
  });
}
