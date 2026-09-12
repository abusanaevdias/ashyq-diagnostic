/**
 * Свои filled-глифы в стиле brand-постеров (красные силуэты в бумажных кругах).
 * Не Lucide: геометрия упрощённая, плакатная, под brand-иконки кампаний.
 */
export type GlyphName =
  | 'doc'
  | 'house'
  | 'spark'
  | 'people'
  | 'chart'
  | 'mic'
  | 'calendar'
  | 'flag'
  | 'target'
  | 'trophy'
  | 'medal'
  | 'monitor'
  | 'bulb'
  | 'book'
  | 'speech'
  | 'crown'
  | 'arrow';

const PATHS: Record<GlyphName, string[]> = {
  doc: [
    'M7 3h10a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Zm1 5h8v1.7H8V8Zm0 4h8v1.7H8v-1.7Zm0 4h5v1.7H8v-1.7Z',
  ],
  house: ['M12 3 3 10.2h2.2V21h5.3v-6h3v6h5.3V10.2H21L12 3Z'],
  spark: [
    'M12 0c.9 7.2 1.8 8.6 3.4 9.6 2.2 1.3 5 2 8.6 2.4-3.6.4-6.4 1.1-8.6 2.4-1.6 1-2.5 2.4-3.4 9.6-.9-7.2-1.8-8.6-3.4-9.6-2.2-1.3-5-2-8.6-2.4 3.6-.4 6.4-1.1 8.6-2.4C10.2 8.6 11.1 7.2 12 0Z',
  ],
  people: [
    'M8 11a3.2 3.2 0 1 0 0-6.4A3.2 3.2 0 0 0 8 11Zm8.4 0a3.2 3.2 0 1 0 0-6.4 3.2 3.2 0 0 0 0 6.4ZM1.6 19.4c0-3.2 2.9-5.2 6.4-5.2s6.4 2 6.4 5.2v.6H1.6v-.6Zm14.6-4.9c2.9.4 5.6 2.2 5.6 4.9v.6h-5.6v-.6c0-1.9-.7-3.6-1.9-4.9.6-.1 1.3-.1 1.9 0Z',
  ],
  chart: ['M4 20v-9h3.4v9H4Zm6.3 0V4h3.4v16h-3.4Zm6.3 0v-6H20v6h-3.4Z'],
  mic: [
    'M12 14.2a3.2 3.2 0 0 0 3.2-3.2V6a3.2 3.2 0 1 0-6.4 0v5a3.2 3.2 0 0 0 3.2 3.2Zm6-3.2a6 6 0 0 1-5 5.9V20h3v2H8v-2h3v-3.1a6 6 0 0 1-5-5.9h2a4 4 0 0 0 8 0h2Z',
  ],
  calendar: [
    'M7 2h2v2h6V2h2v2h3a1 1 0 0 1 1 1v16a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1h3V2ZM5 10v10h14V10H5Zm2 2h3v3H7v-3Z',
  ],
  flag: ['M6 2h2.2v20H6V2Zm4.4 1H21l-2.8 4L21 11H10.4V3Z'],
  target: [
    'M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20Zm0 3.4a6.6 6.6 0 1 1 0 13.2 6.6 6.6 0 0 1 0-13.2Zm0 3.6a3 3 0 1 0 0 6 3 3 0 0 0 0-6Z',
  ],
  trophy: [
    'M7 3h10v2h4v3.4c0 2.9-2.3 5.2-5.1 5.2h-.2a5.2 5.2 0 0 1-2.7 2.6V18h3.2v3H7.8v-3H11v-1.8a5.2 5.2 0 0 1-2.7-2.6h-.2C5.3 13.6 3 11.3 3 8.4V5h4V3ZM5 7v1.4c0 1.6 1.2 3 2.8 3.2V7H5Zm14 0h-2.8v4.6A3.2 3.2 0 0 0 19 8.4V7Z',
  ],
  medal: [
    'M7.4 2h3l2 5.2-2.6 1L7.4 2Zm9.2 0h-3l-2 5.2 2.6 1L16.6 2ZM12 10a6 6 0 1 0 0 12 6 6 0 0 0 0-12Zm0 3.2 1.1 2.2 2.4.3-1.7 1.7.4 2.4-2.2-1.2-2.2 1.2.4-2.4-1.7-1.7 2.4-.3L12 13.2Z',
  ],
  monitor: [
    'M3 4h18a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1h-8v2.2h4V20H7v-1.8h4V16H3a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1Z',
  ],
  bulb: [
    'M12 2a7 7 0 0 0-4.2 12.6c.6.5 1 1.2 1.2 2h6c.2-.8.6-1.5 1.2-2A7 7 0 0 0 12 2Zm-3 16.6h6v1.8H9v-1.8Z',
  ],
  book: [
    'M4 4a2 2 0 0 1 2-2h5v18.4H6.4c-1 0-1.9.5-2.4 1.2V4Zm16 0v17.6a3 3 0 0 0-2.4-1.2H13V2h5a2 2 0 0 1 2 2Z',
  ],
  speech: [
    'M4 4h16a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H10l-5.4 4.2V16H4a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1Zm3.4 5.2h1.8v3.6H7.4V9.2Zm3.7 0h1.8v3.6h-1.8V9.2Zm3.7 0h1.8v3.6h-1.8V9.2Z',
  ],
  crown: ['M3 7.4 7.6 11 12 5l4.4 6L21 7.4V18a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V7.4Z'],
  arrow: ['M3 12h15.2l-4.6-4.6L15 6l7 6-7 6-1.4-1.4 4.6-4.6H3v-2Z'],
};

export function Glyph({
  name,
  className = 'h-6 w-6',
}: {
  name: GlyphName;
  className?: string;
}) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={className} fill="currentColor">
      {PATHS[name].map((d, i) => (
        <path key={i} d={d} fillRule="evenodd" />
      ))}
    </svg>
  );
}

/** Бумажный круг с красным глифом — как в постерах программы. */
export function GlyphBadge({
  name,
  className = 'h-14 w-14',
}: {
  name: GlyphName;
  className?: string;
}) {
  return (
    <span
      className={`inline-flex items-center justify-center rounded-full bg-paper-deep text-red ${className}`}
    >
      <Glyph name={name} className="h-[52%] w-[52%]" />
    </span>
  );
}
