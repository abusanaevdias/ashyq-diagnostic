import styles from './EditorialPoster.module.css';

/** Literal HTML typography: no invented learner results or substitute product screenshots. */
export default function EditorialPoster({ label, lines, footnote }: { label: string; lines: string[]; footnote: string }) {
  return <div className={styles.poster}>
    <p className={styles.label}>{label}</p>
    <div className={styles.sheets} aria-hidden="true"><i /><i /></div>
    <p className={styles.title}>{lines.map(line => <span key={line}>{line}</span>)}</p>
    <p className={styles.footnote}>{footnote}</p>
  </div>;
}
