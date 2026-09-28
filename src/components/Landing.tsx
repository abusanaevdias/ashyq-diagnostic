'use client';

import type { CSSProperties } from 'react';
import Link from 'next/link';
import { EXAMS } from '@/lib/config';
import { CLUB_FACTS } from '@/lib/site';
import type { ExamId, RunState } from '@/lib/types';
import { ButtonLink, DirectionCard, Footer, IconChip, MicroLabel, NavBar, StatsRow } from './ui/CleanUi';
import { Reveal } from './ui/Reveal';
import styles from './HomeV3.module.css';
import FreeStarters from './library/FreeStarters';
import ClubOffer from './ClubOffer';
import CohortResults from './CohortResults';

type ValueStyle = CSSProperties & { '--value': string };

export function continueLabel(run: RunState): string | null {
  if (run.stage === 'quiz' && !run.finished) {
    const index = Math.min(run.currentIndex + 1, run.questionIds.length);
    return `Продолжить · вопрос ${index} из ${run.questionIds.length}`;
  }
  if (run.finished) return 'Посмотреть результат';
  if (run.stage === 'onboarding' && (run.target || run.plannedWhen)) return 'Продолжить настройку';
  return null;
}

const STEPS = [
  { number: '01', title: 'Проверяем точку А', text: 'Короткая диагностика показывает текущий диапазон и сильные навыки.' },
  { number: '02', title: 'Собираем маршрут', text: 'Цель превращается в понятный план по Reading, Math и другим секциям.' },
  { number: '03', title: 'Тренируемся в деле', text: 'Занятия, практика и Match Days помогают применять знания под давлением.' },
  { number: '04', title: 'Показываем рост', text: 'Прогресс виден в цифрах, навыках и задачах на следующий период.' },
];

const SKILLS = [
  { label: 'Reading', value: '86%' },
  { label: 'Math', value: '74%' },
  { label: 'Фокус', value: '68%' },
];

const BARS = ['38%', '54%', '48%', '72%', '66%', '88%'];

function HeroArrow() {
  return <svg className={styles.buttonArrow} width="17" height="17" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M3.5 9h11M10 4.5 14.5 9 10 13.5" /></svg>;
}

export default function Landing({ runs, onSelect }: { runs: Record<ExamId, RunState | null>; onSelect: (exam: ExamId) => void }) {
  return (
    <div className={styles.page}>
      <NavBar onStart={() => onSelect('ielts')} />

      <main>
        <section id="hero" className={`${styles.container} ${styles.hero}`}>
          <div className={styles.heroGrid}>
            <div className={styles.heroCopy}>
              <MicroLabel>ASHYQ · образовательный клуб Казахстана</MicroLabel>
              <h1 className={styles.title}>IELTS и SAT.<span className={styles.titleAccent}>Начните бесплатно.</span></h1>
              <p className={styles.lead}>Открытые материалы, практика и диагностика — без регистрации. Занятия с преподавателем и менторство — отдельные платные программы.</p>
              <div className={styles.actions}>
                {(['ielts', 'sat'] as const).map((exam) => {
                  const saved = runs[exam];
                  const continuation = saved ? continueLabel(saved) : null;
                  return (
                    <div key={exam}>
                      <button type="button" className={exam === 'ielts' ? styles.heroButtonRed : styles.heroButtonOutline} onClick={() => onSelect(exam)} aria-label={`${exam === 'ielts' ? 'Начать с IELTS' : 'Проверить SAT'}. Начать диагностику ${EXAMS[exam].name}`}>
                        {exam === 'ielts' ? 'Начать с IELTS' : 'Проверить SAT'}<HeroArrow />
                      </button>
                      {continuation ? <span className={styles.continue}>{continuation}</span> : null}
                    </div>
                  );
                })}
              </div>
              <p className={styles.diagnosticNote}>Диагностика: ≈20 минут. Предварительная оценка навыков, не официальный балл IELTS или SAT.</p>
              <div className={styles.statsWrap}><StatsRow items={[CLUB_FACTS[0], CLUB_FACTS[2], CLUB_FACTS[3]]} /></div>
            </div>

            <aside className={styles.heroResources} aria-labelledby="home-free-title">
              <MicroLabel>0 ₸ · без регистрации</MicroLabel>
              <h2 id="home-free-title">Бесплатные материалы</h2>
              <p>Выберите навык — начните сразу.</p>
              <FreeStarters compact />
              <Link className={styles.allResources} href="/library">Все материалы: Listening, грамматика, SAT и 42 раздела IELTS <HeroArrow /></Link>
            </aside>
          </div>
        </section>

        <Reveal>
          <section id="directions" className={`${styles.container} ${styles.section}`}>
            <div className={styles.sectionHead}>
              <div><MicroLabel>Четыре точки входа</MicroLabel><h2 className={styles.heading}>Выберите свой следующий шаг</h2></div>
              <p className={styles.sectionIntro}>Можно сразу проверить уровень, а можно начать с вопроса «куда я вообще иду». В каждом направлении остаётся понятный следующий шаг.</p>
            </div>
            <div className={styles.directionGrid}>
              <DirectionCard href="/?start=ielts" icon="book" eyebrow="12 вопросов" title="IELTS">Reading и Listening в коротком формате. Результат — предварительная оценка, не официальный Band Score.</DirectionCard>
              <DirectionCard href="/?start=sat" icon="target" eyebrow="16 вопросов" title="SAT">Reading &amp; Writing и Math. Диапазон, разбор навыков и ближайший фокус.</DirectionCard>
              <DirectionCard href="/career" icon="compass" eyebrow="6 минут" title="Компас">Профориентация: профиль, подходящие профессии и экзамен, который к ним ведёт. Для тех, кто ещё выбирает.</DirectionCard>
              <DirectionCard href="/program" icon="chart" eyebrow="Система ASHYQ" title="Подготовка">План, тренировки, Match Days и прогресс-трекинг в одном учебном маршруте.</DirectionCard>
            </div>
          </section>
        </Reveal>

        <section className={`${styles.container} ${styles.section}`}><ClubOffer enrolmentHref="/courses#enrolment" /></section>
        <div className={`${styles.container} ${styles.section}`}><CohortResults /></div>

        <Reveal>
          <section id="process" className={styles.stepsSection}>
            <div className={`${styles.container} ${styles.section}`}>
              <div className={styles.sectionHead}>
                <div><MicroLabel>Путь ученика</MicroLabel><h2 className={styles.heading}>Как это работает</h2></div>
                <p className={styles.sectionIntro}>Что вы узнаете на каждом этапе: от честной точки А до навыков, которые остаются после экзамена.</p>
              </div>
              <ol className={styles.steps}>{STEPS.map((step) => <li className={styles.step} key={step.number}><span className={styles.stepNumber}>{step.number}</span><h3 className={styles.stepTitle}>{step.title}</h3><p className={styles.stepText}>{step.text}</p></li>)}</ol>
            </div>
          </section>
        </Reveal>

        <Reveal>
          <section className={`${styles.container} ${styles.section}`}>
            <div className={styles.progressGrid}>
              <div className={styles.progressCopy}>
                <MicroLabel>Прогресс без догадок</MicroLabel>
                <h2 className={styles.heading}>Ваш рост в цифрах</h2>
                <p className={styles.progressText}>Видно не только итоговый балл. Навыки, регулярность и динамика помогают понять, куда направить следующую неделю.</p>
                <div className={styles.progressList}>
                  <p className={styles.progressListItem}><IconChip name="chart" />Динамика по попыткам</p>
                  <p className={styles.progressListItem}><IconChip name="target" />Фокус по навыкам</p>
                  <p className={styles.progressListItem}><IconChip name="spark" />Один конкретный следующий шаг</p>
                </div>
                <p className={styles.handNote}>видимый прогресс</p>
              </div>

              <div className={styles.progressCard} role="group" aria-label="Пример карточки прогресса">
                <MicroLabel>Иллюстративный пример, не результат ученика</MicroLabel>
                <div className={styles.progressTop}><div><MicroLabel>Общий прогресс</MicroLabel><p className={styles.progressStat}>78%</p></div><span className={styles.delta}>↗ +12% за 4 месяца</span></div>
                <svg className={styles.graph} viewBox="0 0 560 150" role="img" aria-label="Линейный график показывает устойчивый рост">
                  <path d="M12 126H548M12 78H548M12 30H548" stroke="var(--hairline)" strokeWidth="1" />
                  <path d="M18 122C88 116 120 102 168 106s88-51 142-43 86-34 128-27 64-16 104-21" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                  {[['18','122'],['168','106'],['310','63'],['438','36'],['542','15']].map(([x, y]) => <circle key={x} cx={x} cy={y} r="4" fill="var(--surface)" stroke="currentColor" strokeWidth="2" />)}
                </svg>
                <div className={styles.skillGrid}>
                  <div className={styles.skills}>{SKILLS.map((skill) => <div key={skill.label}><div className={styles.skillTop}><span>{skill.label}</span><span>{skill.value}</span></div><div className={styles.track}><div className={styles.fill} style={{ '--value': skill.value } as ValueStyle} /></div></div>)}</div>
                  <div className={styles.bars} role="img" aria-label="Активность по неделям">{BARS.map((value, index) => <span className={styles.bar} style={{ '--value': value } as ValueStyle} key={`${value}-${index}`} />)}</div>
                </div>
              </div>
            </div>
          </section>
        </Reveal>

        <Reveal>
          <section className={`${styles.container} ${styles.section}`}>
            <div className={styles.band}>
              <div className={styles.bandContent}><MicroLabel>Первая точка маршрута</MicroLabel><h2 className={styles.bandHeading}>Узнайте свой уровень и заберите понятный план действий.</h2><p className={styles.bandMeta}>12–20 минут · без регистрации · результат сразу</p></div>
              <div className={styles.bandAction}><ButtonLink href="/?start=ielts">Начать диагностику</ButtonLink></div>
            </div>
          </section>
        </Reveal>
      </main>

      <Footer />
    </div>
  );
}
