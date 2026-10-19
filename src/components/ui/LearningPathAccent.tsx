import styles from './LearningPathAccent.module.css';

const stages = [
  { title: 'Своя попытка', detail: 'Сначала подумай сам.', path: 'M4 12s3-6 8-6 8 6 8 6-3 6-8 6-8-6-8-6Zm8-2a2 2 0 1 0 0 4 2 2 0 0 0 0-4Z' },
  { title: 'Понятный разбор', detail: 'Разберись в причине.', path: 'm5 16-1 4 4-1L19 8l-3-3L5 16Zm9-9 3 3M5 20h14' },
  { title: 'Новый пример', detail: 'Примени то, что понял.', path: 'M4 12h15m-6-6 6 6-6 6M4 5v2m0 10v2' },
];

/** An explanation of the method, never a learner's completion/progress display. */
export default function LearningPathAccent() {
  return <section className={styles.ribbon} aria-label="Принцип тренировки" data-motion-ambient="learning-path">
    <p className={styles.caption}>Принцип тренировки</p>
    <svg className={styles.connectors} viewBox="0 0 600 12" preserveAspectRatio="none" aria-hidden="true" focusable="false">
      <path d="M0 6H600" className={styles.track}/>
      <path d="M0 6H600" pathLength="100" className={styles.ink}/>
    </svg>
    <ol className={styles.stages}>{stages.map(stage => <li key={stage.title}>
      <span className={styles.icon} aria-hidden="true"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d={stage.path}/></svg></span>
      <strong>{stage.title}</strong><span className={styles.detail}>{stage.detail}</span>
    </li>)}</ol>
  </section>;
}
