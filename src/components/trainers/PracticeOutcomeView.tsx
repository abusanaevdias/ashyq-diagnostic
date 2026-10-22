import TrainerPracticeLink from './TrainerPracticeLink';
import { trainerById } from '@/lib/trainers/catalog';
import { outcomeLabel, nextPracticeHref, type PracticeOutcome } from '@/lib/trainers/outcomes';
import styles from './TrainerCheckpoint.module.css';
import { FeedbackSummary } from '@/components/ui/LearningFeedback';

export default function PracticeOutcomeView({ outcome }: { outcome: PracticeOutcome }) {
  if (!outcome.complete) return <p>{outcome.advice}</p>;
  return <div className={styles.outcome}>
    <FeedbackSummary label="Итог сохранённого занятия" title={outcome.checks.some(item => item.matches === false) ? 'Есть ответы для повторного разбора' : outcome.checks.some(item => item.matches === null) ? 'Сравни результат с разбором' : 'Проверяемые ответы совпали с разбором'} checks={outcome.checks.map(item => ({ label: item.label, state: item.matches === null ? 'review' : item.matches ? 'good' : 'bad', value: outcomeLabel(item) }))} />
    <details><summary>Границы этой проверки</summary><p>{outcome.limitation}</p></details>
    <p>{outcome.advice}</p><div className={styles.actions}><TrainerPracticeLink href={nextPracticeHref(outcome)}>Следующая практика: {trainerById(outcome.next).title} →</TrainerPracticeLink></div>
  </div>;
}
