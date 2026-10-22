import Image from 'next/image';
import { CLUB_OFFER } from '@/data/club-offer';
import { ButtonLink, MicroLabel } from './ui/CleanUi';
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
    <div className={styles.spotlight}><div className={styles.spotlightCopy}>
      <MicroLabel>{CLUB_OFFER.previousCohort.number}-й поток · {CLUB_OFFER.previousCohort.months}</MicroLabel>
      <h2 id="cohort-results-title" className={styles.title} data-motion-piece="heading" data-motion-ambient="piece">Рекордный {CLUB_OFFER.previousCohort.number}-й поток</h2>
      <p className={styles.ratio}><strong data-motion-piece="number" data-motion-ambient="piece">{CLUB_OFFER.previousCohort.achievedTarget}</strong><span data-motion-piece="denominator" data-motion-ambient="piece">из {CLUB_OFFER.previousCohort.students}</span></p>
      <p className={styles.statement} data-motion-piece="statement" data-motion-ambient="piece">Сдали IELTS на <strong data-motion-accent="score" data-motion-ambient="accent">{CLUB_OFFER.previousCohort.targetBand}</strong></p>
      <p className={styles.facts} data-motion-facts data-motion-ambient="facts"><span><b>{CLUB_OFFER.previousCohort.students}</b> учеников</span><span aria-hidden="true">→</span><span><b>{CLUB_OFFER.previousCohort.achievedTarget}</b> результатов <b>{CLUB_OFFER.previousCohort.targetBand}</b></span></p>
      <div className={styles.actions} data-motion-piece="cta" data-motion-ambient="piece"><ButtonLink href="#cohort-examples" tone="black">Посмотреть результаты</ButtonLink></div>
      <p className={styles.attribution}>По данным команды ASHYQ</p>
      </div><div className={styles.dotFigure}><svg viewBox="0 0 392 224" aria-hidden="true">{Array.from({length:CLUB_OFFER.previousCohort.students},(_,i)=><circle key={i} cx={14+(i%14)*28} cy={14+Math.floor(i/14)*28} r="8" fill={i<CLUB_OFFER.previousCohort.achievedTarget?'var(--red)':'none'} stroke={i<CLUB_OFFER.previousCohort.achievedTarget?'var(--red)':'var(--ink-soft)'} strokeWidth="1" />)}</svg><p><span aria-hidden="true">●</span> {CLUB_OFFER.previousCohort.achievedTarget} — результат {CLUB_OFFER.previousCohort.targetBand}</p><p>Каждый кружок — один ученик потока.</p></div>
    </div>
    <div id="cohort-examples" className={styles.examples}>
    <h3 className={styles.examplesTitle}>Примеры результатов IELTS</h3>
    <p className={styles.context}>Отдельные результаты учеников, предоставленные командой ASHYQ.</p>
    <div className={styles.grid}>{RESULTS.map((result, index) => <article key={result.id} className={styles.card} data-motion-reveal data-motion-card>
      <div className={styles.cardHead}><h3>Пример {index + 1}</h3><span>IELTS {result.overall}</span></div>
      <dl className={styles.scores}>{SECTIONS.map((section, i) => <div key={section}><dt>{section}</dt><dd>{result.scores[i]}</dd></div>)}</dl>
      <details className={styles.proof}><summary>Посмотреть скриншот результата</summary><a href={`/images/results/cohort-result-${result.id}.jpg`} target="_blank" rel="noopener noreferrer" aria-label={`Открыть полный скриншот примера ${index + 1}`}><Image src={`/images/results/cohort-result-${result.id}.jpg`} alt={`Скриншот результата IELTS ${result.overall}, пример ${index + 1}`} width={720} height={1280} sizes="(max-width: 700px) 90vw, 42vw" /></a></details>
    </article>)}</div>
    </div>
    <p className={styles.note}>Источник: команда ASHYQ, {CLUB_OFFER.previousCohort.updated}. Скриншоты показывают отдельные результаты; независимый аудит статистики потока не проводился. Результаты прошлых учеников не гарантируют такой же балл другим.</p>
  </section>;
}
