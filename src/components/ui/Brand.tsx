/**
 * Компактные бренд-примитивы ASHYQ для интерфейса v3.
 *
 * Главное правило: wordmark и icon — только оригинальные ассеты
 * (public/brand/*, извлечены из brand-постеров без перерисовки).
 * Никакого «ASHYQ» набранного шрифтом вместо логотипа.
 * Искра и рукописные акценты используются дозированно.
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
      className={`select-none rounded-[var(--r-xs)] ${className}`}
      style={{ width: size, height: size }}
      decoding="async"
    />
  );
}

/**
 * Микро-лейбл над заголовком — v3 MicroLabel: uppercase, приглушённый.
 * Без нумерации: номера в v3 только у шагов (StepRow), не у разделов.
 */
export function EditorialLabel({
  children,
  tone = 'faint',
  className = '',
}: {
  children: React.ReactNode;
  tone?: 'red' | 'faint' | 'cream';
  className?: string;
}) {
  const color =
    tone === 'red' ? 'text-red' : tone === 'cream' ? 'text-paper/70' : 'text-ink-faint';
  return <p className={`label ${color} ${className}`}>{children}</p>;
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
      strokeWidth="1.6"
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
