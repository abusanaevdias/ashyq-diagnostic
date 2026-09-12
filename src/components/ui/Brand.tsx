import { DIAGNOSTIC_NUMBER } from '@/lib/config';

/**
 * Бренд-примитивы ASHYQ v2.
 *
 * Главное правило: wordmark и icon — только оригинальные ассеты
 * (public/brand/*, извлечены из brand-постеров без перерисовки).
 * Никакого «ASHYQ» набранного шрифтом вместо логотипа.
 * Всё остальное (spark, tape, torn edge, hand-note) — дозированно.
 */

/** Четырёхлучевая искра из логотипа (звезда внутри «q»). */
export function RedStar({ className = 'h-3 w-3' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={className} fill="currentColor">
      <path d="M12 0c.9 7.2 1.8 8.6 3.4 9.6 2.2 1.3 5 2 8.6 2.4-3.6.4-6.4 1.1-8.6 2.4-1.6 1-2.5 2.4-3.4 9.6-.9-7.2-1.8-8.6-3.4-9.6-2.2-1.3-5-2-8.6-2.4 3.6-.4 6.4-1.1 8.6-2.4C10.2 8.6 11.1 7.2 12 0Z" />
    </svg>
  );
}

/** Оригинальный wordmark (извлечён из постера, без перерисовки). */
export function Wordmark({
  size = 'md',
  tone = 'red',
  className = '',
}: {
  size?: 'sm' | 'md' | 'lg';
  tone?: 'red' | 'cream' | 'ink';
  className?: string;
}) {
  const heights = { sm: 16, md: 22, lg: 30 } as const;
  const h = heights[size];
  return (
    <img
      src={`/brand/wordmark-${tone}.png`}
      alt="ASHYQ"
      width={Math.round(h * 3.73)}
      height={h}
      className={`inline-block w-auto select-none ${className}`}
      style={{ height: h }}
      decoding="async"
    />
  );
}

/** Оригинальная иконка-плашка (red rounded square). */
export function BrandIcon({
  size = 28,
  className = '',
}: {
  size?: number;
  className?: string;
}) {
  return (
    <img
      src={size > 120 ? '/brand/logo-icon.png' : '/brand/logo-icon-96.png'}
      alt=""
      aria-hidden="true"
      width={size}
      height={size}
      className={`select-none rounded-[22%] ${className}`}
      style={{ width: size, height: size }}
      decoding="async"
    />
  );
}

export function DiagnosticStamp({ invert = false }: { invert?: boolean }) {
  return (
    <span className={`label ${invert ? 'text-paper/70' : 'text-ink-faint'}`}>
      Quick diagnostic&nbsp;{DIAGNOSTIC_NUMBER}
    </span>
  );
}

/** Микро-лейбл секции: 01 / ЧТО ТЫ УЗНАЕШЬ + линия. */
export function EditorialLabel({
  num,
  children,
  tone = 'red',
  className = '',
}: {
  num?: string;
  children: React.ReactNode;
  tone?: 'red' | 'faint' | 'cream';
  className?: string;
}) {
  const color =
    tone === 'red' ? 'text-red' : tone === 'cream' ? 'text-paper/70' : 'text-ink-faint';
  return (
    <p className={`label flex items-center gap-3 ${color} ${className}`}>
      {num ? <span aria-hidden="true">{num}</span> : null}
      {num ? <span aria-hidden="true" className="h-px w-6 bg-current opacity-60" /> : null}
      <span>{children}</span>
    </p>
  );
}

/** Красный скотч поверх карточек-коллажей. */
export function Tape({ className = '' }: { className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={`pointer-events-none absolute h-6 w-24 bg-red/85 ${className}`}
      style={{
        clipPath:
          'polygon(2% 0, 98% 6%, 100% 30%, 97% 100%, 3% 94%, 0 65%)',
      }}
    />
  );
}

/** Рваный край бумаги между секциями. */
export function TornEdge({
  fill = 'var(--paper)',
  flip = false,
  className = '',
}: {
  fill?: string;
  flip?: boolean;
  className?: string;
}) {
  return (
    <div aria-hidden="true" className={`relative h-4 w-full overflow-hidden ${className}`}>
      <svg
        viewBox="0 0 1200 24"
        preserveAspectRatio="none"
        className={`absolute inset-0 h-full w-full ${flip ? 'rotate-180' : ''}`}
      >
        <path
          d="M0 24V9l28 3 22-6 31 5 26-8 30 7 24-4 29 6 27-7 30 5 25-6 31 8 26-5 28 4 30-7 27 6 29-4 26 7 30-6 28 5 25-7 31 6 27-4 29 7 26-6 30 5 28-7 27 6 29-4 26 6 30-5 28 6 25-7 31 5 27-4 29 6 26-6 30 7 24-5 28 4V24Z"
          fill={fill}
        />
      </svg>
    </div>
  );
}

/** Рукописная пометка + стрелка. Только короткие ноты. */
export function HandNote({
  children,
  arrow = 'none',
  className = '',
}: {
  children: React.ReactNode;
  arrow?: 'none' | 'down-right' | 'up-right' | 'down-left';
  className?: string;
}) {
  return (
    <span className={`hand inline-flex items-end gap-1.5 text-red ${className}`}>
      {arrow === 'down-left' ? <ArrowSvg flip /> : null}
      <span className="rotate-[-2deg] text-[1.15rem] leading-tight sm:text-[1.3rem]">{children}</span>
      {arrow === 'down-right' ? <ArrowSvg /> : null}
      {arrow === 'up-right' ? <ArrowSvg up /> : null}
    </span>
  );
}

function ArrowSvg({ up = false, flip = false }: { up?: boolean; flip?: boolean }) {
  return (
    <svg
      viewBox="0 0 48 32"
      aria-hidden="true"
      className={`h-6 w-9 shrink-0 ${up ? '-scale-y-100' : ''} ${flip ? '-scale-x-100' : ''}`}
      fill="none"
      stroke="currentColor"
      strokeWidth="2.4"
      strokeLinecap="round"
    >
      <path d="M3 4c14 2 26 8 34 20" />
      <path d="M30 22l7.5 2.5L39 17" />
    </svg>
  );
}

/** Бумажная карточка-поверхность. */
export function PaperCard({
  children,
  className = '',
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`card shadow-paper ${className}`}>{children}</div>
  );
}

export function TopBar({ invert = false }: { invert?: boolean }) {
  return (
    <div
      className={`flex items-center justify-between gap-3 border-b px-4 py-3 sm:px-6 ${
        invert ? 'border-paper/20' : 'border-line'
      }`}
    >
      <Wordmark size="sm" tone={invert ? 'cream' : 'red'} />
      <DiagnosticStamp invert={invert} />
    </div>
  );
}
