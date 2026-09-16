'use client';

import { useCallback, useState } from 'react';
import Link from 'next/link';
import { CAREER_PROFESSION_COUNT } from '@/data/career/professions';
import { CAREER_CODES } from '@/data/career/profiles';
import type { CareerProfile } from '@/data/career/profiles';
import { track } from '@/lib/analytics';
import { CAREER_AXIS_LABELS, CAREER_STATEMENT_COUNT, MIN_DECISIVE_ANSWERS, getCareerProfile, type CareerMatches } from '@/lib/career';
import type { CareerResult } from '@/lib/career-types';
import { ArrowIcon, IconChip, LineIcon, MicroLabel } from '@/components/ui/CleanUi';
import { Reveal } from '@/components/ui/Reveal';
import home from '@/components/HomeV3.module.css';
import styles from '@/components/CareerV3.module.css';

/**
 * Разбор профиля «Компаса». Один и тот же экран обслуживает два случая:
 *
 *  - `own` — человек только что прошёл тест: показываем шкалы, соседний
 *    профиль и предупреждение о размытом результате;
 *  - `profile` — статическая страница `/career/<код>`, открытая по ссылке
 *    или из поиска: шкал нет (это чужие ответы), зато есть приглашение
 *    пройти тест самому.
 */

export function careerProfileHref(code: string): string {
  return `/career/${code.toLowerCase()}`;
}

export default function CareerResultView({
  profile,
  matches,
  result = null,
  variant,
  onRestart,
}: {
  profile: CareerProfile;
  matches: CareerMatches;
  result?: CareerResult | null;
  variant: 'own' | 'profile';
  onRestart?: () => void;
}) {
  const [copied, setCopied] = useState(false);
  const neighbourProfile = result?.neighbourCode ? getCareerProfile(result.neighbourCode) : null;
  const vague = result !== null && result.decisiveAnswers < MIN_DECISIVE_ANSWERS;
  const balancedAxes = result?.axes.filter((axis) => axis.balanced).length ?? 0;
  /* Все четыре шкалы в равновесии — обычно это сплошное согласие: банк
     сбалансирован, и такие ответы гасят друг друга. Код в этом случае почти
     произволен, и молчать об этом нельзя. */
  const undecided = result !== null && balancedAxes === result.axes.length;

  const share = useCallback(async () => {
    const url = `${window.location.origin}${careerProfileHref(profile.code)}`;
    track('career_result_shared', { code: profile.code });
    try {
      if (navigator.share) {
        await navigator.share({ title: `Мой профиль ASHYQ — ${profile.code} «${profile.name}»`, url });
        return;
      }
      await navigator.clipboard.writeText(url);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2400);
    } catch {
      /* диалог закрыли или буфер недоступен — молча ничего не делаем */
    }
  }, [profile.code, profile.name]);

  return (
    <main>
      <section className={`${home.container} ${styles.resultHero}`}>
        <MicroLabel>{variant === 'own' ? 'Ваш профиль' : 'Профиль Компаса'}</MicroLabel>
        <p className={styles.code}>{profile.code}</p>
        <h1 className={styles.resultTitle}>{profile.name}</h1>
        <p className={styles.archetype}>{profile.archetype}</p>
        <p className={styles.resultSummary}>{profile.summary}</p>

        {variant === 'profile' ? (
          <div className={styles.sharedNote}>
            <p>
              Это один из {CAREER_CODES.length} профилей «Компаса». Свой — {CAREER_STATEMENT_COUNT} утверждений и шесть минут.
            </p>
            <Link className={home.heroButtonRed} href="/career">
              Пройти Компас<ArrowIcon />
            </Link>
          </div>
        ) : null}

        {vague ? (
          <p className={styles.warning}>
            Вы выбрали «как когда» почти везде — осознанных ответов всего {result?.decisiveAnswers} из{' '}
            {CAREER_STATEMENT_COUNT}. Профиль ниже стоит читать как черновик: пройдите тест ещё раз, отвечая решительнее.
          </p>
        ) : undecided ? (
          <p className={styles.warning}>
            Все четыре шкалы у вас вышли в равновесие: противоположные утверждения набрали поровну. Так бывает, когда
            соглашаешься почти со всем подряд. Код {profile.code} в этом случае — почти монетка, поэтому читайте
            профиль как один из нескольких близких и при случае пройдите тест ещё раз, отвечая по-разному.
          </p>
        ) : null}
      </section>

      {result ? (
        <Reveal>
          <section className={`${home.container} ${home.section}`}>
            <MicroLabel>Четыре шкалы</MicroLabel>
            <h2 className={home.heading}>Как распределились ответы</h2>
            <ul className={styles.axes}>
              {result.axes.map((axis) => {
                const labels = CAREER_AXIS_LABELS[axis.axis];
                const leadsPositive = axis.pole === axis.axis[0];
                return (
                  <li className={styles.axis} key={axis.axis}>
                    <div className={styles.axisTop}>
                      <span className={styles.axisTitle}>{labels.title}</span>
                      <span className={styles.axisValue}>
                        {leadsPositive ? labels.positive : labels.negative} · {axis.strength}%
                      </span>
                    </div>
                    <div
                      className={styles.axisTrack}
                      role="img"
                      aria-label={`${labels.title}: ${leadsPositive ? labels.positive : labels.negative}, перевес ${axis.strength} процентов`}
                    >
                      <span className={styles.axisFill} data-side={leadsPositive ? 'left' : 'right'} style={{ width: `${axis.strength}%` }} />
                    </div>
                    <div className={styles.axisEnds}>
                      <span>{labels.positive}</span>
                      <span>{labels.negative}</span>
                    </div>
                    {axis.balanced ? <p className={styles.axisNote}>Почти поровну: обе стороны у вас рабочие.</p> : null}
                  </li>
                );
              })}
            </ul>
            {neighbourProfile ? (
              <p className={styles.neighbour}>
                {balancedAxes > 1 ? 'Несколько шкал у вас почти в равновесии' : 'Одна шкала у вас почти в равновесии'},
                поэтому загляните и в соседний профиль —{' '}
                <Link className={styles.inlineLink} href={careerProfileHref(neighbourProfile.code)}>
                  {neighbourProfile.code} «{neighbourProfile.name}»
                </Link>
                . Скорее всего, правда где-то между.
              </p>
            ) : null}
          </section>
        </Reveal>
      ) : null}

      <Reveal>
        <section className={`${home.container} ${home.section}`}>
          <div className={styles.twoUp}>
            <div className={styles.card}>
              <IconChip name="spark" solid />
              <h2 className={styles.cardTitle}>Сильные стороны</h2>
              <ul className={styles.list}>
                {profile.strengths.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
            <div className={styles.card}>
              <IconChip name="compass" />
              <h2 className={styles.cardTitle}>Зоны роста</h2>
              <ul className={styles.list}>
                {profile.growth.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
              <p className={styles.cardNote}>
                <strong>Как вы решаете.</strong> {profile.decisions}
              </p>
            </div>
          </div>
        </section>
      </Reveal>

      <Reveal>
        <section className={`${home.container} ${home.section}`}>
          <div className={home.sectionHead}>
            <div>
              <MicroLabel>Прямое попадание</MicroLabel>
              <h2 className={home.heading}>Топ-3 направления</h2>
            </div>
            <p className={home.sectionIntro}>
              Отобраны из {CAREER_PROFESSION_COUNT} профессий: это те, где профиль {profile.code} стоит первым в списке
              подходящих. Совпадений всего — {matches.total}.
            </p>
          </div>
          <ol className={styles.topList}>
            {matches.top.map((profession, i) => (
              <li className={styles.topItem} key={profession.id}>
                <span className={styles.topNumber}>{String(i + 1).padStart(2, '0')}</span>
                <h3 className={styles.topTitle}>{profession.title}</h3>
                <p className={styles.topWhy}>{profession.why}</p>
              </li>
            ))}
          </ol>

          {matches.bySphere.length > 0 ? (
            <div className={styles.spheres}>
              <h3 className={styles.spheresTitle}>Ещё направления по сферам</h3>
              {matches.bySphere.map((group) => (
                <details className={styles.sphere} key={group.sphere.id}>
                  <summary className={styles.sphereSummary}>
                    <span className={styles.sphereIcon}>
                      <LineIcon name={group.sphere.icon} size={20} />
                    </span>
                    <span className={styles.sphereLabel}>{group.sphere.label}</span>
                    <span className={styles.sphereCount}>{group.items.length}</span>
                  </summary>
                  <p className={styles.sphereFocus}>{group.sphere.focus}</p>
                  <ul className={styles.sphereList}>
                    {group.items.map((profession) => (
                      <li key={profession.id}>
                        <span className={styles.sphereItemTitle}>{profession.title}</span>
                        <span className={styles.sphereItemWhy}>{profession.why}</span>
                      </li>
                    ))}
                  </ul>
                </details>
              ))}
            </div>
          ) : null}
        </section>
      </Reveal>

      <Reveal>
        <section className={home.stepsSection}>
          <div className={`${home.container} ${home.section}`}>
            <MicroLabel>Следующий шаг</MicroLabel>
            <h2 className={home.heading}>Что это значит для экзамена</h2>
            <div className={styles.examGrid}>
              <div className={styles.examCard}>
                <h3 className={styles.cardTitle}>Гипотеза по секциям</h3>
                <p className={styles.examText}>{profile.examHint}</p>
                <p className={styles.examNote}>
                  Это именно гипотеза: Компас измеряет склонности, а не знания. Проверить её можно за 20 минут —
                  диагностика покажет реальный предварительный диапазон.
                </p>
              </div>
              <div className={styles.examCard}>
                <h3 className={styles.cardTitle}>IELTS или SAT</h3>
                <p className={styles.examText}>
                  Экзамен выбирает не профессия, а страна и программа. IELTS подтверждает английский и нужен почти
                  везде, где учат на английском. SAT проверяет математику и чтение и чаще требуется для бакалавриата
                  в США.
                </p>
                <p className={styles.examNote}>
                  Если направление из топа связано со счётом и данными — начните с SAT. Если с людьми, текстами и
                  коммуникацией — с IELTS.
                </p>
              </div>
            </div>
            <div className={styles.examActions}>
              <Link
                className={home.heroButtonRed}
                href="/?start=ielts"
                onClick={() => track('career_diagnostic_cta_clicked', { code: profile.code, exam: 'ielts' })}
              >
                Проверить уровень IELTS<ArrowIcon />
              </Link>
              <Link
                className={home.heroButtonOutline}
                href="/?start=sat"
                onClick={() => track('career_diagnostic_cta_clicked', { code: profile.code, exam: 'sat' })}
              >
                Проверить уровень SAT<ArrowIcon />
              </Link>
            </div>
          </div>
        </section>
      </Reveal>

      <Reveal>
        <section className={`${home.container} ${home.section}`}>
          <div className={styles.twoUp}>
            <div className={styles.card}>
              <IconChip name="book" />
              <h2 className={styles.cardTitle}>Как вам учиться</h2>
              <p className={styles.cardText}>{profile.study}</p>
            </div>
            <div className={styles.card}>
              <IconChip name="target" solid />
              <h2 className={styles.cardTitle}>Формат, который подойдёт</h2>
              <p className={styles.cardText}>{profile.format}</p>
              <div className={styles.cardLinks}>
                <Link className={styles.inlineLink} href="/courses">
                  Курсы ASHYQ
                </Link>
                <Link className={styles.inlineLink} href="/season">
                  Чемпионат сезона
                </Link>
              </div>
            </div>
          </div>
        </section>
      </Reveal>

      <section className={`${home.container} ${styles.resultFoot}`}>
        <div className={styles.resultActions}>
          <button type="button" className={home.heroButtonOutline} onClick={share}>
            {copied ? 'Ссылка скопирована' : 'Поделиться профилем'}
          </button>
          {variant === 'own' && onRestart ? (
            <button type="button" className={styles.ghostButton} onClick={onRestart}>
              Пройти заново
            </button>
          ) : (
            <Link className={styles.ghostButton} href="/career">
              Все 16 профилей начинаются здесь
            </Link>
          )}
        </div>
        <p className={styles.disclaimer}>
          Компас — ориентир, а не психологический диагноз и не официальный тест MBTI®. Он описывает предпочтения,
          а не способности: ни одна профессия из списка для вас не закрыта, и ни одна не обещана. Ответы хранятся
          только на этом устройстве.
        </p>
      </section>
    </main>
  );
}
