'use client';

import Image from 'next/image';
import { PHOTOS } from '@/data/media';
import { EXAMS } from '@/lib/config';
import type { ExamId, RunState } from '@/lib/types';
import { continueLabel } from './Landing';
import { ArrowIcon, Footer, IconChip, MicroLabel, NavBar } from './ui/CleanUi';
import { Reveal } from './ui/Reveal';
import home from './HomeV3.module.css';
import styles from './DiagnosticV3.module.css';

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
    <div className={home.page}>
      <NavBar onStart={() => onSelect('ielts')} />

      <main>
        <section id="hero" className={`${home.container} ${home.hero}`}>
          <div className={home.heroGrid}>
            <div className={home.heroCopy}>
              <MicroLabel>Quick Diagnostic</MicroLabel>
              <h1 className={home.title}>Узнайте свой уровень до старта</h1>
              <p className={home.lead}>Короткий тест покажет, какой балл вы получили бы сегодня и что тренировать в первую очередь. Около 20 минут, бесплатно, без регистрации.</p>
              <div className={home.actions}>
                {(['ielts', 'sat'] as const).map((exam) => {
                  const saved = runs[exam];
                  const continuation = saved ? continueLabel(saved) : null;
                  return (
                    <div key={exam}>
                      <button type="button" className={exam === 'ielts' ? home.heroButtonRed : home.heroButtonOutline} onClick={() => onSelect(exam)} aria-label={`Начать диагностику ${EXAMS[exam].name}`}>
                        {exam === 'ielts' ? 'Начать с IELTS' : 'Проверить SAT'}<ArrowIcon />
                      </button>
                      {continuation ? <span className={home.continue}>{continuation}</span> : null}
                    </div>
                  );
                })}
              </div>
            </div>
            <aside className={styles.aside}>
              <IconChip name="spark" solid />
              <p className={styles.asideTitle}>Точнее точка А — точнее план</p>
              <p className={styles.asideText}>Диагностика даёт предварительную оценку, а не официальный IELTS Band Score или SAT score. Её задача — показать, с чего начать.</p>
              <p className={styles.script}>20 минут — и план готов</p>
            </aside>
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
              <div className={styles.photo}><Image src={PHOTOS.diagnostic.src} alt={PHOTOS.diagnostic.alt} fill sizes="(max-width: 900px) 100vw, 45vw" /></div>
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
              <div className={styles.card}><p className={styles.statValue}>90%</p><p className={styles.statText}>видят свой следующий шаг после диагностики</p></div>
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
