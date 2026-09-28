import Image from 'next/image';
import { CLUB_OFFER } from '@/data/club-offer';
import { MicroLabel } from './ui/CleanUi';
import styles from './CohortResults.module.css';

const RESULTS = [
  { id: 1, overall: '7.5', scores: ['8.0', '8.0', '7.5', '7.0'] },
  { id: 2, overall: '7.0', scores: ['7.5', '7.5', '6.5', '7.0'] },
  { id: 3, overall: '7.5', scores: ['8.0', '7.5', '6.5', '7.5'] },
  { id: 5, overall: '8.0', scores: ['8.5', '8.0', '7.0', '8.0'] },
];
const SECTIONS = ['Listening', 'Reading', 'Writing', 'Speaking'];

export default function CohortResults() {
  return <section aria-labelledby="cohort-results-title" className={styles.section}>
    <MicroLabel>Последний завершённый поток · {CLUB_OFFER.previousCohort.months}</MicroLabel>
    <h2 id="cohort-results-title" className={styles.title}>Результаты, за которыми стоит работа.</h2>
    <div className={styles.stats}><div><strong>{CLUB_OFFER.previousCohort.average}</strong><span>Средний балл — по данным ASHYQ</span></div><div><strong>{CLUB_OFFER.previousCohort.students}</strong><span>Учеников в прошлом потоке</span></div><div><strong>7.0–8.0</strong><span>В предоставленных примерах IELTS</span></div></div>
    <p className={styles.context}>Команда ASHYQ сообщает средний балл 7.0 для потока из 112 учеников, занимавшегося в июле, августе и сентябре. Ниже — обезличенные скриншоты отдельных результатов, предоставленные командой.</p>
    <div className={styles.grid}>{RESULTS.map((result, index) => <article key={result.id} className={styles.card}>
      <div className={styles.cardHead}><h3>Пример {index + 1}</h3><span>IELTS {result.overall}</span></div>
      <dl className={styles.scores}>{SECTIONS.map((section, i) => <div key={section}><dt>{section}</dt><dd>{result.scores[i]}</dd></div>)}</dl>
      <details className={styles.proof}><summary>Посмотреть скриншот результата</summary><a href={`/images/results/cohort-result-${result.id}.jpg`} target="_blank" rel="noopener noreferrer" aria-label={`Открыть полный скриншот примера ${index + 1}`}><Image src={`/images/results/cohort-result-${result.id}.jpg`} alt={`Скриншот результата IELTS ${result.overall}, пример ${index + 1}`} width={720} height={1280} sizes="(max-width: 700px) 90vw, 42vw" /></a></details>
    </article>)}</div>
    <p className={styles.note}>Источник: команда ASHYQ, 28 сентября 2026; независимый аудит статистики не проведён. Число учеников потока не означает, что предоставлены официальные результаты экзамена всех 112 участников. Скриншоты не подтверждают среднее по всему потоку; состав выборки и метод расчёта ещё не опубликованы. Баллы отдельных учеников не гарантируют такой же результат другим.</p>
  </section>;
}
