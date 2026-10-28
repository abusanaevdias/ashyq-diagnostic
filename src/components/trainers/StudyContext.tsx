import styles from './TrainerWorkSurface.module.css';

export default function StudyContext({ passage, question }: { passage: string; question: string }) {
  return <details className={styles.context} open>
    <summary>Текст и вопрос</summary>
    <p lang="en">{passage}</p>
    <p lang="en"><strong>{question}</strong></p>
  </details>;
}
