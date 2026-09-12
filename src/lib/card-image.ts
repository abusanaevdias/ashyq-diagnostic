/**
 * Генерация карточки результата в PNG без внешних библиотек.
 *
 * Рендерим SVG-строку -> Image -> canvas -> blob -> download.
 * Если браузер не поддерживает любой из шагов, функция вернёт false,
 * и UI честно предложит сделать обычный скриншот.
 *
 * Дизайн карточки v2 = «ASHYQ PLAYER CARD»: чёрная бумага кампаний,
 * оригинальный wordmark (embedded PNG), конденсированный гротеск Oswald
 * (embedded woff2), один красный акцент. Так она читается и в ленте, и в Stories.
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

const INK = '#211A16';
const PAPER = '#F7F3EA';
const RED = '#CE1E23';
const FAINT = '#A79C8F';
const TRACK = '#3A3129';
const DISPLAY = "'OswaldBrand','Arial Black','Roboto Black','Helvetica Neue',Helvetica,Arial,sans-serif";
const UI = "'Inter',-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif";
const MONO = "ui-monospace,SFMono-Regular,Menlo,monospace";

interface BrandAssets {
  wordmark: string | null; // data URI официального wordmark (cream)
  fontCss: string; // @font-face с embedded woff2
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

/** Бренд-ассеты для SVG: wordmark PNG + Oswald woff2 (cyrillic+latin). */
function loadBrandAssets(): Promise<BrandAssets> {
  if (!assetsCache) {
    assetsCache = (async () => {
      const [wordmark, cyr, lat] = await Promise.all([
        blobToDataUrl('/brand/wordmark-cream.png').catch(() => null),
        blobToDataUrl('/fonts/oswald-600-cyrillic.woff2').catch(() => null),
        blobToDataUrl('/fonts/oswald-600-latin.woff2').catch(() => null),
      ]);
      const faces: string[] = [];
      if (cyr) {
        faces.push(
          `@font-face{font-family:'OswaldBrand';font-weight:600;src:url(${cyr}) format('woff2');unicode-range:U+0301,U+0400-045F,U+0490-0491,U+04B0-04B1,U+2116;}`,
        );
      }
      if (lat) {
        faces.push(
          `@font-face{font-family:'OswaldBrand';font-weight:600;src:url(${lat}) format('woff2');}`,
        );
      }
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

/** Подгоняем размер крупного текста под доступную ширину */
function fit(text: string, base: number, maxWidth: number, avgCharWidth = 0.62): number {
  const est = text.length * base * avgCharWidth;
  if (est <= maxWidth) return base;
  return Math.max(base * 0.45, (base * maxWidth) / est);
}

export function buildCardSvg(data: CardData, assets: BrandAssets | null = null): string {
  const W = 1080;
  const H = 1080;
  const pad = 76;

  const bandSize = fit(data.bandLabel, 170, W - pad * 2 - 12, 0.5);
  const examSize = fit(data.exam, 92, 560, 0.55);
  const nextStepText = truncate(data.nextStep.toUpperCase(), 26);
  const nextSize = fit(nextStepText, 34, 380, 0.5);

  const sectionRows = data.sections
    .map((s, i) => {
      const y = 706 + i * 100;
      const width = 430;
      const filled = Math.max(0, Math.min(1, s.percent / 100)) * width;
      return `
      <text x="${pad}" y="${y}" font-family="${MONO}" font-size="26" letter-spacing="4" fill="${PAPER}">${esc(truncate(s.label.toUpperCase(), 18))}</text>
      <text x="${W - pad}" y="${y}" text-anchor="end" font-family="${MONO}" font-size="26" letter-spacing="4" fill="${FAINT}">${s.percent}% · ${esc(truncate(s.level.toUpperCase(), 12))}</text>
      <rect x="${pad}" y="${y + 18}" width="${width}" height="14" rx="7" fill="${TRACK}"/>
      <rect x="${pad}" y="${y + 18}" width="${filled}" height="14" rx="7" fill="${RED}"/>`;
    })
    .join('');

  const wordmarkHeader = assets?.wordmark
    ? `<image href="${assets.wordmark}" x="${pad}" y="${pad - 4}" width="168" height="45" />`
    : `<text x="${pad}" y="${pad + 26}" font-family="${DISPLAY}" font-size="44" letter-spacing="6" fill="${PAPER}">ASHYQ</text>`;

  const sparkX = assets?.wordmark ? pad + 186 : pad + 250;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <defs>
    <filter id="grain">
      <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="3" stitchTiles="stitch"/>
      <feColorMatrix type="saturate" values="0"/>
    </filter>
    <style>${assets?.fontCss ?? ''}
      text { font-kerning: normal; }
      .disp { font-family: ${DISPLAY}; font-weight: 600; }
    </style>
  </defs>

  <rect width="${W}" height="${H}" fill="${INK}"/>
  <rect width="${W}" height="${H}" filter="url(#grain)" opacity="0.07"/>
  <rect x="2" y="2" width="${W - 4}" height="${H - 4}" fill="none" stroke="${PAPER}" stroke-width="2" opacity="0.22"/>

  <!-- header -->
  ${wordmarkHeader}
  <path d="M ${sparkX} ${pad + 2} c 2.2 17.6 4.4 21 8.3 23.5 5.4 3.2 12.2 4.9 21 5.9 -8.8 1 -15.6 2.7 -21 5.9 -3.9 2.5 -6.1 5.9 -8.3 23.5 -2.2 -17.6 -4.4 -21 -8.3 -23.5 -5.4 -3.2 -12.2 -4.9 -21 -5.9 8.8 -1 15.6 -2.7 21 -5.9 3.9 -2.5 6.1 -5.9 8.3 -23.5 Z" fill="${RED}"/>
  <text x="${W - pad}" y="${pad + 26}" text-anchor="end" font-family="${MONO}" font-size="22" letter-spacing="4" fill="${FAINT}">QUICK DIAGNOSTIC 001</text>
  <line x1="${pad}" y1="${pad + 66}" x2="${W - pad}" y2="${pad + 66}" stroke="${PAPER}" stroke-width="2" opacity="0.25"/>

  <!-- exam -->
  <text class="disp" x="${pad}" y="${pad + 176}" font-size="${examSize}" letter-spacing="2" fill="${PAPER}">${esc(data.exam)}</text>
  <text x="${pad}" y="${pad + 220}" font-family="${MONO}" font-size="23" letter-spacing="5" fill="${FAINT}">${esc(truncate(data.headline, 40).toUpperCase())}</text>

  <!-- band -->
  <text x="${pad}" y="486" font-family="${MONO}" font-size="26" letter-spacing="6" fill="${RED}">ТВОЯ ТОЧКА А · ПРЕДВАРИТЕЛЬНО</text>
  <text class="disp" x="${pad - 6}" y="${486 + bandSize}" font-size="${bandSize}" letter-spacing="-2" fill="${PAPER}">${esc(data.bandLabel)}</text>
  <text x="${pad}" y="${486 + bandSize + 54}" font-family="${UI}" font-size="28" fill="${FAINT}">${esc(truncate(data.level, 60))}</text>

  <!-- sections -->
  ${sectionRows}

  <!-- target / gap / next step -->
  <line x1="${pad}" y1="916" x2="${W - pad}" y2="916" stroke="${PAPER}" stroke-width="2" opacity="0.25"/>
  <text x="${pad}" y="960" font-family="${MONO}" font-size="22" letter-spacing="4" fill="${FAINT}">ЦЕЛЬ</text>
  <text class="disp" x="${pad}" y="1002" font-size="42" fill="${PAPER}">${esc(truncate(data.target, 12))}</text>
  <text x="${pad + 300}" y="960" font-family="${MONO}" font-size="22" letter-spacing="4" fill="${FAINT}">GAP</text>
  <text class="disp" x="${pad + 300}" y="1002" font-size="42" fill="${RED}">${esc(truncate(data.gapLabel, 16))}</text>

  <rect x="${W - pad - 430}" y="926" width="430" height="104" fill="${PAPER}"/>
  <text x="${W - pad - 406}" y="962" font-family="${MONO}" font-size="19" letter-spacing="4" fill="${INK}" opacity="0.6">СЛЕДУЮЩИЙ ШАГ</text>
  <text class="disp" x="${W - pad - 406}" y="1004" font-size="${nextSize}" fill="${INK}">${esc(nextStepText)}</text>

  <text x="${pad}" y="1046" font-family="${UI}" font-size="18" fill="${FAINT}">Предварительная оценка по короткой диагностике Ashyq · не официальный результат IELTS / SAT</text>
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
          ctx.fillStyle = INK;
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
