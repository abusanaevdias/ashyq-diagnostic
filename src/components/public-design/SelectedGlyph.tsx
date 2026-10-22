import BrandIcon, { type BrandIconName } from './BrandIcon';
import { Glyph as OriginalGlyph, type GlyphName } from '../ui/Glyphs';
import styles from './SelectedGlyph.module.css';

const names: Record<Exclude<GlyphName, 'arrow' | 'spark'>, BrandIconName> = {
  doc: 'file-text', house: 'home', people: 'people', chart: 'chart-histogram-two',
  mic: 'microphone-one', calendar: 'calendar', flag: 'flag', target: 'target-one',
  trophy: 'trophy', medal: 'gold-medal', monitor: 'monitor', bulb: 'tips',
  book: 'book-open', speech: 'message', crown: 'crown',
};

export function Glyph({ name, className = 'h-6 w-6' }: { name: GlyphName; className?: string }) {
  if (name === 'arrow' || name === 'spark') return <OriginalGlyph name={name} className={className} />;
  return <span className={`${styles.icon} ${className}`}><BrandIcon name={names[name]} /></span>;
}

export function GlyphBadge({ name, className = 'h-14 w-14' }: { name: GlyphName; className?: string }) {
  return <span className={`${styles.badge} ${className}`}><Glyph name={name} className={styles.badgeIcon} /></span>;
}

export type { GlyphName };
