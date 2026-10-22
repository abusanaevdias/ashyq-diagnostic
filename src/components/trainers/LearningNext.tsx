'use client';

import Link from 'next/link';
import { useCheckpointLibrary } from './checkpoint-hooks';
import { checkpointStage, practiceJourney } from '@/lib/trainers/journey';
import TrainerPracticeLink from './TrainerPracticeLink';
import styles from './LearnerJourney.module.css';

export default function LearningNext({ compact = false }: { compact?: boolean }) {
  const { entries, ready } = useCheckpointLibrary();
  const { latest, repeat } = practiceJourney(entries);
  if (!ready || !latest) return null;
  return <section className={`${styles.panel} ${compact ? styles.compact : ''}`} aria-labelledby="learning-next-title">
    <p className={styles.label}>ТВОЯ ПРАКТИКА НА ЭТОМ УСТРОЙСТВЕ</p><h2 id="learning-next-title">Продолжай с нужного места</h2>
    <div className={styles.columns}><div><h3>{latest.item.title}</h3>
      <p>{latest.outcome?.complete ? 'Занятие завершено. Можно открыть сохранённый разбор.' : `Остановился на шаге: ${checkpointStage(latest.entry.data)}.`}</p>
      <TrainerPracticeLink className={styles.action} href={`${latest.item.href}#saved-work`}>{latest.outcome?.complete ? 'Открыть сохранённый разбор' : 'Продолжить сохранённое занятие'} →</TrainerPracticeLink>
      <p className={styles.note}>В тренажёре нажми «Продолжить сохранённую». Текущая работа не заменяется без твоего действия.</p>
    </div><div>{(!compact || repeat.length > 0) && <h3>{repeat.length ? `Что повторить · ${repeat.length}` : 'Следующий шаг'}</h3>}
      {repeat.length ? <><p>В последних завершённых сохранениях есть несовпадения с разбором.</p>{!compact && <ul className={styles.queue}>{repeat.slice(0, 3).map(row => <li key={row.item.id}><TrainerPracticeLink href={`${row.item.href}#saved-work`}>{row.item.title}<span aria-hidden="true">→</span></TrainerPracticeLink></li>)}</ul>}</> : !compact && <p>Продолжи текущую попытку или выбери другой навык в каталоге. Завершение занятия само по себе не означает, что навык освоен.</p>}
      <Link className={styles.secondary} href="/trainers/history">Все мои занятия и результаты →</Link>
    </div></div>
    <details className={styles.note}><summary>Где хранятся мои ответы?</summary><p>Видны только сохранения текущего аккаунта или гостевого режима в этом браузере. Очистка данных браузера может удалить их; скачай файл для переноса. Аудио сюда не входит.</p></details>
  </section>;
}
