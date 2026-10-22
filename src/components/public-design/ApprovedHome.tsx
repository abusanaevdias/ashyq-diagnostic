'use client';

import Link from 'next/link';
import type { ExamId, RunState } from '@/lib/types';
import { EXAMS } from '@/lib/config';
import { NavBar, Footer } from '@/components/ui/CleanUi';
import { continueLabel } from '@/lib/landing-continuation';
import FreeStarters from '@/components/library/FreeStarters';
import CohortResults from '@/components/CohortResults';
import HeroScene from './HeroScene';
import ApprovedPractice from './ApprovedPractice';
import ApprovedServices from './ApprovedServices';
import styles from './ApprovedHome.module.css';
import ApprovedMotion from './ApprovedMotion';

export default function ApprovedHome({ runs, onSelect }: { runs: Record<ExamId, RunState | null>; onSelect: (exam: ExamId) => void }) {
  return <div className={styles.page}>
    <a className={styles.skip} href="#main">Перейти к содержанию</a>
    <NavBar onStart={() => onSelect('ielts')} />
    <main id="main">
      <section id="hero" className={styles.hero}>
        <div className={styles.heroCopy}>
          <p className={styles.eyebrow}><span aria-hidden="true">●</span> ASHYQ · образовательный клуб Казахстана</p>
          <h1><span>ASHYQ.</span> IELTS и SAT. <span>Начните бесплатно.</span></h1>
          <p className={styles.lead}>Онлайн-подготовка к IELTS и SAT в Казахстане. Библиотека, практика и диагностика — бесплатно, без регистрации.</p>
          <nav className={styles.entryChoices} aria-label="Первые шаги: диагностика и библиотека"><Link href="/diagnostic"><strong>Бесплатная диагностика <span aria-hidden="true">→</span></strong><small>IELTS или SAT · узнайте свой уровень</small></Link><Link href="/library"><strong>Бесплатная библиотека <span aria-hidden="true">→</span></strong><small>Материалы, задания и разборы · 0 ₸</small></Link></nav>
          <div className={styles.heroActions}><Link href="#practice" className={styles.primary}>Решить пример <span aria-hidden="true">↗</span></Link><Link href="/courses" className={styles.textLink}>Программы <span aria-hidden="true">↗</span></Link></div>
          <div className={styles.examActions}>{(['ielts', 'sat'] as const).map(exam => { const saved = runs[exam], continuation = saved ? continueLabel(saved) : null; return <div key={exam}><button type="button" onClick={() => onSelect(exam)} aria-label={`${exam === 'ielts' ? 'Начать с IELTS' : 'Проверить SAT'}. Начать диагностику ${EXAMS[exam].name}`}>{exam === 'ielts' ? 'Начать с IELTS' : 'Проверить SAT'} <span aria-hidden="true">→</span></button>{continuation && <small>{continuation}</small>}</div>; })}</div>
          <p className={styles.fine}>Диагностика: ≈20 минут. Предварительная оценка навыков, не официальный балл IELTS или SAT.</p>
        </div><HeroScene />
      </section>
      <ApprovedPractice />
      <div className={styles.results}><CohortResults /></div>
      <ApprovedServices />
      <section className={styles.resources} aria-labelledby="approved-free-title"><div className={styles.sectionHeading}><div><p className={styles.eyebrow}>ПОПРОБУЙ ДО ЗАПИСИ</p><h2 id="approved-free-title">Что вы узнаете<br />на практике.</h2></div><p>Выбери навык и начни с учебного примера. Полные материалы — в бесплатной библиотеке.</p></div><FreeStarters compact /><Link className={styles.textLink} href="/library">Все материалы: Listening, грамматика, SAT и 42 раздела IELTS <span aria-hidden="true">→</span></Link></section>
      <section className={styles.finalCta}><div><p className={styles.eyebrow}>ОТКРЫВАЙ БОЛЬШЕ</p><h2>Твои экзамены.<br />Твои университеты.</h2><p>И команда, которая рядом.</p></div><div><Link href="/courses" className={styles.primary}>Выбрать программу <span aria-hidden="true">↗</span></Link><Link href="/contacts" className={styles.textLink}>Обсудить подготовку <span aria-hidden="true">→</span></Link></div></section>
    </main><Footer /><ApprovedMotion />
  </div>;
}
