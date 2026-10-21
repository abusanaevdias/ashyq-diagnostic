'use client';

import { useEffect, useRef } from 'react';
import styles from './DiagnosticExperience.module.css';

export default function DiagnosticJourney({ stage, entryKey = stage }: { stage: 'setup' | 'result' | 'review'; entryKey?: string | number }) {
  const journey = useRef<HTMLOListElement>(null);
  useEffect(() => {
    const heading = journey.current?.closest('main')?.querySelector('h1');
    if (!heading) return;
    heading.focus({ preventScroll: true });
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [entryKey]);
  const steps = [['setup', 'Настройка'], ['quiz', 'Диагностика'], ['result', 'Результат'], ['review', 'Разбор']] as const;
  return <ol ref={journey} className={styles.stage} aria-label="Этапы диагностики">
    {steps.map(([id, label]) => <li key={id} aria-current={stage === id ? 'step' : undefined}>{label}</li>)}
  </ol>;
}
