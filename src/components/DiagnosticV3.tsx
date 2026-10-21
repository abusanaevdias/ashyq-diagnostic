'use client';

import Link from 'next/link';
import { EXAMS } from '@/lib/config';
import type { ExamId, RunState } from '@/lib/types';
import { continueLabel } from './Landing';
import { ArrowIcon, Footer, IconChip, MicroLabel, NavBar } from './ui/CleanUi';
import { Reveal } from './ui/Reveal';
import home from './HomeV3.module.css';
import styles from './DiagnosticV3.module.css';
import HeroScene from './public-design/HeroScene';
import ServiceArtwork from './public-design/ServiceArtwork';
import ApprovedMotion from './public-design/ApprovedMotion';

/**
 * Интро /diagnostic по DESIGN_V3 §6.3. Только оболочка: запуск идёт через
 * тот же onSelect → state machine useDiagnostic, localStorage не трогаем.
 */

const GAINS = [
  { icon: 'target', text: 'Предварительный диапазон балла IELTS или SAT' },
  { icon: 'chart', text: 'Сильные и слабые навыки по секциям' },
  { icon: 'book', text: 'Разбор каждого ответа после теста' },
  { icon: 'compass', text: 'Один конкретный следующий шаг' },
  { icon: 'spark', text: 'Результат сохраняется на этом устройстве' },
] as const;

const STEPS = [
  { number: '01', title: 'Выберите экзамен и цель', text: 'IELTS или SAT, желаемый балл и срок — полминуты.' },
  { number: '02', title: 'Ответьте на вопросы', text: 'IELTS: 12 вопросов Reading и Listening. SAT: 16 вопросов Reading & Writing и Math.' },
  { number: '03', title: 'Получите результат', text: 'Диапазон, навыки и план сразу, без регистрации.' },
];

export default function DiagnosticV3({ runs, onSelect }: { runs: Record<ExamId, RunState | null>; onSelect: (exam: ExamId) => void }) {
  return (
    <div className={`${home.page} ${home.applePage}`}>
      <NavBar onStart={() => onSelect('ielts')} />

      <main>
        <section id="hero" className={`${home.container} ${styles.intro}`}>
          <div className={styles.introGrid}>
            <div className={styles.introCopy}>
              <MicroLabel>Quick Diagnostic</MicroLabel>
              <h1 className={styles.introTitle}>Узнайте свой уровень до старта</h1>
              <p className={styles.introLead}>Короткий тест поможет определить стартовый фокус подготовки. Около 20 минут, бесплатно, без регистрации. Результат — предварительная оценка по выбранным заданиям, не прогноз официального экзаменационного балла.</p>
              <p className={styles.choiceHint}>Выберите IELTS или SAT. Если вы уже начинали, продолжите сохранённую попытку на этом устройстве.</p>
              <p className={styles.asideLink}>Ещё не решили, какой экзамен вам нужен? Начните с <Link href="/career">Компаса</Link> — ориентир по интересам поможет выбрать направление.</p>
            </div>
            <div className={styles.examChoices} aria-label="Выберите диагностику">
              {(['ielts', 'sat'] as const).map((exam) => {
                const saved = runs[exam];
                const continuation = saved ? continueLabel(saved) : null;
                return <article className={styles.examChoice} key={exam}>
                  <ServiceArtwork kind={exam} caption={exam === 'ielts' ? 'Reading + Listening' : undefined} />
                  <div className={styles.examChoiceBody}>
                    <h2>{EXAMS[exam].name}</h2>
                    <p>{exam === 'ielts' ? '12 вопросов · Reading и Listening' : '16 вопросов · Reading & Writing и Math'}</p>
                    <button type="button" className={exam === 'ielts' ? home.heroButtonRed : home.heroButtonOutline} onClick={() => onSelect(exam)} aria-label={`Начать диагностику ${EXAMS[exam].name}`}>
                      {continuation ? 'Продолжить' : 'Начать'}<ArrowIcon />
                    </button>
                    {continuation ? <span className={home.continue}>{continuation}</span> : null}
                  </div>
                </article>;
              })}
            </div>
          </div>
        </section>

        <Reveal>
          <section className={`${home.container} ${home.section}`}>
            <div className={styles.gainGrid}>
              <div className={styles.gainCopy}>
                <MicroLabel>Результат</MicroLabel>
                <h2 className={home.heading}>Что вы получите?</h2>
                <ul className={styles.checklist}>{GAINS.map((gain) => <li key={gain.text}><IconChip name={gain.icon} />{gain.text}</li>)}</ul>
                <div className={styles.gainAction}><button type="button" className={home.heroButtonRed} onClick={() => onSelect('ielts')}>Пройти диагностику<ArrowIcon /></button></div>
              </div>
              <div className={styles.scene}><HeroScene /></div>
            </div>
          </section>
        </Reveal>

        <Reveal>
          <section className={home.stepsSection}>
            <div className={`${home.container} ${home.section}`}>
              <div className={home.sectionHead}>
                <div><MicroLabel>Три шага</MicroLabel><h2 className={home.heading}>Как проходит диагностика?</h2></div>
                <p className={home.sectionIntro}>Прогресс сохраняется автоматически: можно закрыть вкладку и продолжить с того же вопроса.</p>
              </div>
              <ol className={`${home.steps} ${styles.steps}`}>{STEPS.map((step) => <li className={home.step} key={step.number}><span className={home.stepNumber}>{step.number}</span><h3 className={home.stepTitle}>{step.title}</h3><p className={home.stepText}>{step.text}</p></li>)}</ol>
            </div>
          </section>
        </Reveal>

        <Reveal>
          <section className={`${home.container} ${home.section}`}>
            <div className={styles.proof}>
              <div className={styles.card}><p className={styles.statValue}>Разбор</p><p className={styles.statText}>ответов и следующий шаг после диагностики — без обещания экзаменационного балла</p></div>
              <figure className={styles.card}>
                <blockquote className={styles.quote}>«Мы показываем честную точку А: без официального балла, но с понятным планом, что делать дальше.»</blockquote>
                <figcaption className={styles.caption}>Команда ASHYQ</figcaption>
              </figure>
            </div>
          </section>
        </Reveal>
      </main>

      <Footer />
      <ApprovedMotion />
    </div>
  );
}
