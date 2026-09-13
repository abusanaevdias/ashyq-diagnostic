import tokens from '../../design/tokens.json';

/**
 * Значения токенов v3 там, где CSS-переменные недоступны: OG-картинка (next/og),
 * SVG → PNG карточки результата, viewport.themeColor. Источник — design/tokens.json;
 * scripts/token-audit.ts сверяет его с design/tokens.css.
 */

const values = <K extends string>(group: Record<K, { $value: string }>) =>
  Object.fromEntries(Object.entries<{ $value: string }>(group).map(([name, token]) => [name, token.$value])) as Record<K, string>;

export const COLOR = values(tokens.color);
export const RADIUS = values(tokens.radius);
