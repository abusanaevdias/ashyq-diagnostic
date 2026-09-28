import Link from 'next/link';
import { FREE_STARTERS } from '@/data/free-starters';
import styles from './FreeStarters.module.css';

export default function FreeStarters({ compact = false }: { compact?: boolean }) {
  const entries = compact ? FREE_STARTERS.filter((entry) => entry.home) : FREE_STARTERS;
  return <nav className={compact ? styles.compact : styles.full} aria-label="Начать бесплатную практику">
    {entries.map((entry) => <Link href={entry.href} className={styles.card} key={entry.id}><span className={styles.label}>Бесплатно <span aria-hidden="true">↗</span></span><strong>{entry.title}</strong><span className={styles.description}>{entry.text}</span></Link>)}
  </nav>;
}
