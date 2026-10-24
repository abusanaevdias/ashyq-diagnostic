'use client';

import Link from 'next/link';
import type { ExamId, RunState } from '@/lib/types';
import { ArrowIcon, Footer, IconChip, MicroLabel, NavBar } from './ui/CleanUi';
import { Reveal } from './ui/Reveal';
import home from './HomeV3.module.css';
import styles from './DiagnosticV3.module.css';
import HeroScene from './public-design/HeroScene';
import DiagnosticDoors from './DiagnosticDoors';
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
    <div className={`${home.page} ${home.applePage} ${styles.entryPage}`}>
      <ApprovedMotion />
      <NavBar onStart={() => onSelect('ielts')} />

      <main>
        <section id="hero" className={`${home.container} ${styles.intro}`}>
          <div className={styles.introGrid}>
            <div className={styles.introCopy}>
              <p className={styles.introEyebrow}>Бесплатная диагностика</p>
              <h1 className={styles.introTitle}>С чего начать подготовку?</h1>
            </div>
            <p className={styles.introLead}>Узнай примерный уровень. Пойми, какие навыки требуют практики и с чего начать.</p>
          </div>
          <DiagnosticDoors runs={runs} onSelect={onSelect} />
          <p className={styles.asideLink}>Ещё не решили, какой экзамен вам нужен? Начните с <Link href="/career">Компаса</Link> — ориентир по интересам поможет выбрать направление.</p>
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
    </div>
  );
}
