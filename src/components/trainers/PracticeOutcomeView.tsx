import TrainerPracticeLink from './TrainerPracticeLink';
import { trainerById } from '@/lib/trainers/catalog';
import { outcomeLabel, nextPracticeHref, type PracticeOutcome } from '@/lib/trainers/outcomes';
import styles from './TrainerCheckpoint.module.css';

export default function PracticeOutcomeView({ outcome }: { outcome: PracticeOutcome }) {
  if (!outcome.complete) return <p>{outcome.advice}</p>;
  return <div className={styles.outcome}>
    <p><strong>{outcome.repeat === true ? 'Стоит повторить: в сохранённой работе есть вопросы для проверки.' : outcome.repeat === false ? 'Проверки нового примера совпали с разбором.' : 'Результат требует самостоятельного сравнения или внешней проверки.'}</strong></p>
    <details><summary>Что именно было проверено</summary><ul>{outcome.checks.map((item, index) => <li key={index}><span>{item.label}</span><strong>{outcomeLabel(item)}</strong></li>)}</ul><p>{outcome.limitation}</p></details>
    <p>{outcome.advice}</p><div className={styles.actions}><TrainerPracticeLink href={nextPracticeHref(outcome)}>Следующая практика: {trainerById(outcome.next).title} →</TrainerPracticeLink></div>
  </div>;
}
