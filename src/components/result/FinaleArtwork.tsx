import type { DiagnosticResult } from '@/lib/types';
import styles from './ResultFinale.module.css';

export default function FinaleArtwork({ result, compact = false, route = false, focusIds }: { result: DiagnosticResult; compact?: boolean; route?: boolean; focusIds?: string[] }) {
  return <div className={`${styles.artwork} ${compact ? styles.artworkCompact : ''}`} aria-hidden="true">
    <svg className={styles.openThread} viewBox="0 0 640 300" fill="none"><g data-thread>
      <path className={styles.threadShadow} d="M-80 235C75 395 155-50 332 90S465 360 750 65" />
      <path className={styles.threadBody} d="M-80 215C75 375 155-70 332 70S465 340 750 45" />
      <path className={styles.threadEdge} d="M-80 205C75 365 155-80 332 60S465 330 750 35" />
      <path data-thread-light className={styles.threadLight} d="M-80 205C75 365 155-80 332 60S465 330 750 35" />
    </g></svg>
    {(!compact || focusIds) && <div className={styles.answerRail}>{result.perQuestion.filter(q => !focusIds || focusIds.includes(q.questionId)).map(q => <span key={q.questionId} className={styles.answerSlip} data-paper data-answer={q.answered ? q.correct ? 'correct' : 'wrong' : 'skipped'}><small>{String(result.perQuestion.findIndex(item => item.questionId === q.questionId) + 1).padStart(2, '0')}</small><b>{q.answered ? q.correct ? '✓' : '×' : '—'}</b></span>)}</div>}
    {route && <div className={styles.routeNodes}>{['Своя попытка', 'Разбор', 'Новый пример'].map((label, i) => <span key={label} data-paper><b>0{i + 1}</b>{label}</span>)}</div>}
  </div>;
}
