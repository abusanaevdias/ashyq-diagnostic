'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { CAREER_ANSWERS, CAREER_STATEMENTS } from '@/data/career/questions';
import { CAREER_PROFESSION_COUNT } from '@/data/career/professions';
import { CAREER_CODES, CAREER_PROFILES } from '@/data/career/profiles';
import { track } from '@/lib/analytics';
import {
  CAREER_AXIS_LABELS,
  CAREER_STATEMENT_COUNT,
  getCareerProfile,
  isCareerCode,
  matchProfessions,
  scoreCareer,
  type CareerAnswers,
} from '@/lib/career';
import type { CareerCode, CareerResult } from '@/lib/career-types';
import { STORAGE_KEYS } from '@/lib/config';
import { safeGet, safeRemove, safeSet } from '@/lib/storage';
import CareerResultView, { careerProfileHref } from './career/CareerResultView';
import { ArrowIcon, Footer, IconChip, MicroLabel, NavBar } from './ui/CleanUi';
import { Reveal } from './ui/Reveal';
import home from './HomeV3.module.css';
import styles from './CareerV3.module.css';

/**
 * «Компас» — профориентационный тест на /career.
 *
 * Экраны: intro → test → result. Интро рендерится и без JS (это обычный
 * серверный рендер клиентского компонента), поэтому страница остаётся
 * индексируемой и не зависит от гидратации.
 *
 * Состояние живёт в отдельном ключе localStorage (`STORAGE_KEYS.career`):
 * воронка Quick Diagnostic, её ключи и state machine здесь не участвуют.
 *
 * Готовый профиль живёт на отдельной статической странице `/career/<код>`:
 * ссылкой делятся именно ею, поэтому чужой результат открывается сразу,
 * без мигания интро и без JS.
 */

const STORAGE_VERSION = 1;

interface CareerSave {
  v: number;
  answers: CareerAnswers;
  index: number;
  code: CareerCode | null;
}

function loadSave(): CareerSave | null {
  const raw = safeGet(STORAGE_KEYS.career);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as CareerSave;
    if (parsed?.v !== STORAGE_VERSION || typeof parsed.answers !== 'object' || parsed.answers === null) return null;
    return {
      v: STORAGE_VERSION,
      answers: parsed.answers,
      index: typeof parsed.index === 'number' ? parsed.index : 0,
      code: isCareerCode(parsed.code) ? parsed.code : null,
    };
  } catch {
    return null;
  }
}

const GAINS = [
  {
    icon: 'compass',
    title: 'Профиль',
    text: 'Как вы думаете, решаете и восстанавливаете силы — словами, которые пригодятся и в мотивационном письме, и на собеседовании.',
  },
  {
    icon: 'target',
    title: 'Направления',
    text: `Три профессии прямого попадания и десятки близких: ${CAREER_PROFESSION_COUNT} направлений разложены по шести сферам.`,
  },
  {
    icon: 'book',
    title: 'Экзамен',
    text: 'Что именно усиливать под выбранное направление и какой экзамен — IELTS или SAT — ведёт туда, куда вы собрались.',
  },
  {
    icon: 'chart',
    title: 'Режим подготовки',
    text: 'Формат, в котором вы дойдёте до конца, а не бросите на третьей неделе: группа, индивидуально или соревнование.',
  },
] as const;

const CHAIN = [
  { number: '01', title: 'Компас', text: 'Куда идти: профиль, направления и требования к ним. 6 минут.' },
  { number: '02', title: 'Диагностика', text: 'Где вы сейчас: предварительный диапазон IELTS или SAT и слабые навыки. 20 минут.' },
  { number: '03', title: 'Подготовка', text: 'Как дойти: курс, Match Days и сезон под ваш темп и вашу цель.' },
];

export default function CareerV3() {
  const [stage, setStage] = useState<'intro' | 'test' | 'result'>('intro');
  const [answers, setAnswers] = useState<CareerAnswers>({});
  const [index, setIndex] = useState(0);
  const [result, setResult] = useState<CareerResult | null>(null);
  const questionRef = useRef<HTMLDivElement | null>(null);
  const hydrated = useRef(false);

  /* Гидратация: продолжаем сохранённый прогресс или показываем готовый результат. */
  useEffect(() => {
    if (hydrated.current) return;
    hydrated.current = true;

    const saved = loadSave();
    if (!saved) return;
    setAnswers(saved.answers);
    if (saved.code) {
      setResult(scoreCareer(saved.answers));
      setStage('result');
    } else if (Object.keys(saved.answers).length > 0) {
      setIndex(Math.min(saved.index, CAREER_STATEMENT_COUNT - 1));
      setStage('test');
    }
  }, []);

  const persist = useCallback((next: CareerAnswers, nextIndex: number, code: CareerCode | null) => {
    safeSet(STORAGE_KEYS.career, JSON.stringify({ v: STORAGE_VERSION, answers: next, index: nextIndex, code } satisfies CareerSave));
  }, []);

  const start = useCallback(() => {
    setAnswers({});
    setIndex(0);
    setResult(null);
    setStage('test');
    safeRemove(STORAGE_KEYS.career);
    track('career_test_started', { statements: CAREER_STATEMENT_COUNT });
  }, []);

  const answer = useCallback(
    (value: number) => {
      const statement = CAREER_STATEMENTS[index];
      const next = { ...answers, [statement.id]: value };
      setAnswers(next);

      if (index + 1 >= CAREER_STATEMENT_COUNT) {
        const scored = scoreCareer(next);
        setResult(scored);
        setStage('result');
        persist(next, index, scored.code);
        track('career_test_completed', {
          code: scored.code,
          decisiveAnswers: scored.decisiveAnswers,
          neighbour: scored.neighbourCode,
        });
        return;
      }

      setIndex(index + 1);
      persist(next, index + 1, null);
    },
    [answers, index, persist],
  );

  const back = useCallback(() => {
    if (index === 0) {
      setStage('intro');
      return;
    }
    setIndex(index - 1);
    persist(answers, index - 1, null);
  }, [answers, index, persist]);

  /* Фокус на новом утверждении: без него скринридер остаётся на прошлом вопросе. */
  useEffect(() => {
    if (stage === 'test') questionRef.current?.focus();
  }, [stage, index]);

  const shownCode = result?.code ?? null;
  const profile = shownCode ? getCareerProfile(shownCode) : null;
  const matches = useMemo(() => (shownCode ? matchProfessions(shownCode) : null), [shownCode]);

  /* ───────────────────────── тест ───────────────────────── */

  if (stage === 'test') {
    const statement = CAREER_STATEMENTS[index];
    const current = answers[statement.id];
    const percent = Math.round((index / CAREER_STATEMENT_COUNT) * 100);

    return (
      <div className={home.page}>
        <NavBar />
        <main className={`${home.container} ${styles.testWrap}`}>
          <div className={styles.testHead}>
            <MicroLabel>Компас · {CAREER_AXIS_LABELS[statement.axis].title}</MicroLabel>
            <p className={styles.counter} aria-live="polite">
              {index + 1} / {CAREER_STATEMENT_COUNT}
            </p>
          </div>

          <div
            className={styles.track}
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={CAREER_STATEMENT_COUNT}
            aria-valuenow={index}
            aria-label="Прогресс теста"
          >
            <span className={styles.fill} style={{ width: `${percent}%` }} />
          </div>

          <div className={styles.statementCard} tabIndex={-1} ref={questionRef} data-statement-id={statement.id}>
            <p className={styles.statement}>{statement.text}</p>
            <div className={styles.scale} role="group" aria-label="Насколько это про вас">
              {CAREER_ANSWERS.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  className={styles.scaleButton}
                  aria-pressed={current === option.value}
                  data-selected={current === option.value}
                  onClick={() => answer(option.value)}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          <div className={styles.testFoot}>
            <button type="button" className={styles.ghostButton} onClick={back}>
              {index === 0 ? 'Выйти' : 'Назад'}
            </button>
            <p className={styles.autosave}>Ответы сохраняются на этом устройстве — можно закрыть вкладку и вернуться.</p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  /* ──────────────────────── результат ──────────────────────── */

  if (stage === 'result' && profile && matches) {
    return (
      <div className={home.page}>
        <NavBar />
        <CareerResultView profile={profile} matches={matches} result={result} variant="own" onRestart={start} />
        <Footer />
      </div>
    );
  }

  /* ───────────────────────── интро ───────────────────────── */

  return (
    <div className={home.page}>
      <NavBar />
      <main>
        <section className={`${home.container} ${home.hero}`}>
          <div className={home.heroGrid}>
            <div className={home.heroCopy}>
              <MicroLabel>Компас · профориентация</MicroLabel>
              <h1 className={home.title}>
                Сначала «куда», <span className={home.titleAccent}>потом «как»</span>
              </h1>
              <p className={home.lead}>
                Год подготовки к экзамену, который был не нужен, — самая дорогая ошибка абитуриента. {CAREER_STATEMENT_COUNT}{' '}
                утверждений и шесть минут покажут ваш профиль, направления рядом с ним и экзамен, который к ним ведёт.
                Бесплатно, без регистрации, результат сразу.
              </p>
              <div className={home.actions}>
                <button type="button" className={home.heroButtonRed} onClick={start}>
                  Пройти Компас<ArrowIcon />
                </button>
                <Link className={home.heroButtonOutline} href="/diagnostic">
                  Уже знаю направление<ArrowIcon />
                </Link>
              </div>
              <div className={styles.introStats}>
                <span>{CAREER_STATEMENT_COUNT} утверждений</span>
                <span>≈ 6 минут</span>
                <span>{CAREER_PROFESSION_COUNT} профессий</span>
              </div>
            </div>
            <aside className={styles.introAside}>
              <IconChip name="compass" solid />
              <p className={styles.introAsideTitle}>Зачем это перед диагностикой</p>
              <p className={styles.introAsideText}>
                Диагностика отвечает на вопрос «где я сейчас». Но она бесполезна, пока непонятно, куда вы идёте.
                Компас закрывает именно этот пробел: он не ставит балл, а показывает направление и требования к нему.
              </p>
              <p className={styles.script}>шесть минут — и цель ясна</p>
            </aside>
          </div>
        </section>

        <Reveal>
          <section className={`${home.container} ${home.section}`}>
            <div className={home.sectionHead}>
              <div>
                <MicroLabel>Результат</MicroLabel>
                <h2 className={home.heading}>Что вы получите</h2>
              </div>
              <p className={home.sectionIntro}>
                Не «вы интроверт» и не список из интернета: каждый блок заканчивается конкретным следующим шагом.
              </p>
            </div>
            <div className={styles.gainGrid}>
              {GAINS.map((gain) => (
                <article className={styles.gain} key={gain.title}>
                  <IconChip name={gain.icon} />
                  <h3 className={styles.gainTitle}>{gain.title}</h3>
                  <p className={styles.gainText}>{gain.text}</p>
                </article>
              ))}
            </div>
          </section>
        </Reveal>

        <Reveal>
          <section className={home.stepsSection}>
            <div className={`${home.container} ${home.section}`}>
              <div className={home.sectionHead}>
                <div>
                  <MicroLabel>Маршрут</MicroLabel>
                  <h2 className={home.heading}>Где Компас стоит в подготовке</h2>
                </div>
                <p className={home.sectionIntro}>
                  Три шага, каждый отвечает на свой вопрос. Пропустить первый можно, если ответ на него уже есть.
                </p>
              </div>
              <ol className={home.steps}>
                {CHAIN.map((step) => (
                  <li className={home.step} key={step.number}>
                    <span className={home.stepNumber}>{step.number}</span>
                    <h3 className={home.stepTitle}>{step.title}</h3>
                    <p className={home.stepText}>{step.text}</p>
                  </li>
                ))}
              </ol>
            </div>
          </section>
        </Reveal>

        <Reveal>
          <section className={`${home.container} ${home.section}`}>
            <div className={home.sectionHead}>
              <div>
                <MicroLabel>16 профилей</MicroLabel>
                <h2 className={home.heading}>Куда может привести тест</h2>
              </div>
              <p className={home.sectionIntro}>
                Каждый профиль — отдельный разбор: сильные стороны, направления и что это значит для экзамена. Свой
                узнаете за шесть минут, а заглянуть можно в любой.
              </p>
            </div>
            <div className={styles.profileGrid}>
              {CAREER_CODES.map((code) => (
                <Link className={styles.profileLink} href={careerProfileHref(code)} key={code}>
                  <span className={styles.profileCode}>{code}</span>
                  <span className={styles.profileName}>{CAREER_PROFILES[code].name}</span>
                </Link>
              ))}
            </div>
          </section>
        </Reveal>

        <Reveal>
          <section className={`${home.container} ${home.section}`}>
            <div className={styles.honesty}>
              <div>
                <MicroLabel>Честно о методе</MicroLabel>
                <h2 className={home.heading}>Что Компас не делает</h2>
              </div>
              <div className={styles.honestyText}>
                <p>
                  Компас построен на четырёх шкалах предпочтений: где вы берёте энергию, на что опираетесь в информации,
                  как принимаете решения и в каком темпе работаете. Это ориентир, а не психологический диагноз и не
                  официальный тест MBTI®.
                </p>
                <p>
                  Он не измеряет способности и не закрывает вам ни одну профессию. Результат стоит читать как рабочую
                  гипотезу: «скорее всего, мне будет комфортно вот здесь» — и проверять её практикой, а уровень
                  языка и математики проверять диагностикой.
                </p>
                <div className={styles.honestyAction}>
                  <button type="button" className={home.heroButtonRed} onClick={start}>
                    Начать тест<ArrowIcon />
                  </button>
                </div>
              </div>
            </div>
          </section>
        </Reveal>
      </main>
      <Footer />
    </div>
  );
}
