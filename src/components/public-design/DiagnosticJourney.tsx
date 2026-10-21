import styles from './DiagnosticExperience.module.css';

export default function DiagnosticJourney({ stage }: { stage: 'setup' | 'result' | 'review' }) {
  const steps = [['setup', 'Настройка'], ['quiz', 'Диагностика'], ['result', 'Результат'], ['review', 'Разбор']] as const;
  return <ol className={styles.stage} aria-label="Этапы диагностики">
    {steps.map(([id, label]) => <li key={id} aria-current={stage === id ? 'step' : undefined}>{label}</li>)}
  </ol>;
}
