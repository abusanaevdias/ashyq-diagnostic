'use client';

import Script from 'next/script';
import { useEffect, useRef, useState } from 'react';
import { useSession } from '@/lib/lms/hooks';
import { trainerById } from '@/lib/trainers/catalog';
import { practiceNeeds } from '@/lib/trainers/journey';
import { motionPaused, MOTION_PREFERENCE_EVENT } from '@/lib/motion-preference';
import MotionToggle from '../ui/MotionToggle';
import TrainerPracticeLink from './TrainerPracticeLink';
import styles from './PracticeGuide.module.css';

type Timeline = { to(target: object, vars: Record<string, unknown>, position?: number): Timeline; play(): void; pause(): void; kill(): void };
type GuideGsap = { timeline(vars?: Record<string, unknown>): Timeline; fromTo(target: Element, from: Record<string, unknown>, to: Record<string, unknown>): { kill(): void }; set(target: Element, vars: Record<string, unknown>): void };
type GuideWindow = Window & { gsap?: GuideGsap };
type NeedId = typeof practiceNeeds[number]['id'];

// These small invented illustrations introduce the format, never score an attempt.
const examples: Record<NeedId, { label: string; text: string; step: string }> = {
  reading: { label: 'Фраза в тексте', text: 'Only city residents enter free.', step: 'Утверждение: All visitors enter free. Сравни, на кого распространяется правило.' },
  grammar: { label: 'Предложение для правки', text: 'Natural talent make a difference.', step: 'Найди главное слово и проверь форму глагола. Сначала предложи свою правку.' },
  argument: { label: 'Начало аргумента', text: 'Public parks make cities better.', step: 'Объясни почему, затем добавь конкретный пример. Пиши на английском.' },
  essay: { label: 'Работа над учебным эссе', text: 'One paragraph. One clearer idea.', step: 'Найди неточность, предложи правку и сравни её с разбором. Затем переходи к следующему критерию.' },
  listening: { label: 'Иллюстрация ловушки в аудио', text: 'Tuesday… sorry, Thursday.', step: 'В самом упражнении ты услышишь запись и определишь окончательный ответ.' },
  speaking: { label: 'Пример темы для ответа', text: 'Describe a place you enjoy visiting.', step: 'Запиши ответ, прослушай себя и повтори с одним конкретным изменением.' },
  overview: { label: 'Пример поиска главной тенденции', text: 'Bus use rises. Car use falls.', step: 'В упражнении будет график. Выбери ключевое сравнение и подкрепи его данными.' },
  condition: { label: 'Пример условия', text: 'A $12 fee plus $4 per lesson.', step: 'Что платят один раз, а что зависит от числа занятий? Сначала собери уравнение.' },
  options: { label: 'Проверка смысла', text: 'Some students ≠ all students.', step: 'Сравни границы утверждения с текстом. Объясни, почему лишний вывод не подходит.' },
  math: { label: 'Пример чужого решения', text: '3(x + 2) = 3x + 2', step: 'Найди первый неверный переход. Объясни и исправь его до новой задачи.' },
};

export default function PracticeGuide() {
  const [selected, setSelected] = useState<NeedId | ''>('');
  const [coreReady, setCoreReady] = useState(false);
  const stage = useRef<HTMLElement>(null);
  const { ready } = useSession();
  const need = practiceNeeds.find(item => item.id === selected);
  const trainer = trainerById(need?.trainer ?? 'reading-evidence');
  const example = examples[need?.id ?? 'reading'];

  useEffect(() => {
    if (!ready || !['#choose-practice', '#all-trainers'].includes(window.location.hash)) return;
    const frame = requestAnimationFrame(() => document.getElementById(window.location.hash.slice(1))?.scrollIntoView({ block: 'start', behavior: 'instant' }));
    return () => cancelAnimationFrame(frame);
  }, [ready]);

  useEffect(() => {
    if ((window as GuideWindow).gsap) { setCoreReady(true); return; }
    const script = document.querySelector('script[src="/design/gsap.min.js"]');
    const loaded = () => setCoreReady(true);
    script?.addEventListener('load', loaded, { once: true });
    return () => script?.removeEventListener('load', loaded);
  }, []);

  useEffect(() => {
    const gs = (window as GuideWindow).gsap;
    const node = stage.current;
    if (!gs || !coreReady || !node) return;
    const body = node.querySelector<HTMLElement>('[data-guide-body]');
    const stroke = node.querySelector<HTMLElement>('[data-guide-stroke]');
    if (!body || !stroke) return;
    const reduced = matchMedia('(prefers-reduced-motion: reduce)');
    let visible = false;
    const allowed = () => visible && !motionPaused() && !document.hidden;
    let entrance: { kill(): void } | null = null;
    let entered = false;
    const loop = gs.timeline({ paused: true, repeat: -1, yoyo: true }).to(stroke, { scaleX: .55, transformOrigin: 'left center', duration: 2.2, ease: 'sine.inOut' });
    const sync = () => {
      if (allowed()) {
        loop.play();
        if (!entered) { entered = true; entrance = gs.fromTo(body, { y: 14, opacity: .82 }, { y: 0, opacity: 1, duration: .42, ease: 'power3.out' }); }
      } else {
        loop.pause(); entrance?.kill(); gs.set(body, { clearProps: 'transform,opacity' });
      }
      if (motionPaused()) gs.set(stroke, { clearProps: 'transform' });
    };
    const observer = 'IntersectionObserver' in window ? new IntersectionObserver(entries => { visible = entries[0].isIntersecting; sync(); }, { threshold: .1 }) : null;
    observer?.observe(node);
    reduced.addEventListener('change', sync);
    window.addEventListener(MOTION_PREFERENCE_EVENT, sync);
    document.addEventListener('visibilitychange', sync);
    return () => {
      entrance?.kill(); loop.kill(); observer?.disconnect();
      gs.set(body, { clearProps: 'transform,opacity' }); gs.set(stroke, { clearProps: 'transform' });
      reduced.removeEventListener('change', sync);
      window.removeEventListener(MOTION_PREFERENCE_EVENT, sync);
      document.removeEventListener('visibilitychange', sync);
    };
  }, [coreReady, selected]);

  const choose = (value: string) => setSelected(practiceNeeds.find(item => item.id === value)?.id ?? '');
  return <>
    <Script id="approved-gsap" src="/design/gsap.min.js" strategy="afterInteractive" onReady={() => setCoreReady(true)} />
    <section id="choose-practice" className={styles.guide} aria-labelledby="practice-guide-title">
      <div className={styles.selector}>
        <h2 id="practice-guide-title">Что хочешь улучшить?</h2>
        <p className={styles.explain}>Выбери знакомую трудность. Подберём упражнение, с которого удобно начать.</p>
        <div className={styles.quick} role="group" aria-label="Частые затруднения">
          {(['reading', 'grammar', 'condition'] as const).map(id => { const item = practiceNeeds.find(need => need.id === id)!; return <button type="button" key={id} aria-pressed={selected === id} aria-controls="practice-suggestion" onClick={() => choose(id)}><span className={styles.dot} aria-hidden="true" />{item.label}</button>; })}
        </div>
        <label className={styles.selectLabel} htmlFor="practice-need">Все затруднения</label>
        <select id="practice-need" className={styles.select} value={selected} aria-controls="practice-suggestion" onChange={event => choose(event.target.value)}><option value="">Выбери, что хочешь улучшить</option>{practiceNeeds.map(item => <option key={item.id} value={item.id}>{item.label}</option>)}</select>
        <p className={styles.hint}>Это выбор практики, а не оценка твоего уровня.</p>
        {need && <a className={styles.jump} href="#practice-suggestion">Посмотреть упражнение ↓</a>}
        <p className={styles.announcement} role="status">{need ? `Выбрано: ${need.label}. Упражнение: ${trainer.title}.` : 'Можно выбрать трудность или сразу открыть весь каталог.'}</p>
      </div>
      <article id="practice-suggestion" ref={stage} className={styles.feature} aria-labelledby="practice-feature-title">
        <div data-guide-body>
          <p className={styles.meta}>{need ? 'Твоя отправная точка' : 'Познакомься с форматом'} <span>{trainer.exam} / {trainer.skill}</span></p>
          <h3 id="practice-feature-title">{trainer.title}</h3>
          <p className={styles.why}>{need?.why ?? 'Сначала своя попытка. Затем точная опора в тексте, разбор и новый вопрос.'}</p>
          <div className={styles.example}>
            <p className={styles.exampleLabel}>Демонстрация · отвечать здесь не нужно</p>
            <p className={styles.sourceLabel}>{example.label}</p>
            <p className={styles.sample} lang="en">{example.text}</p>
            <div className={styles.stroke} aria-hidden="true"><span data-guide-stroke /></div>
            <p className={styles.exampleStep}>{example.step}</p>
          </div>
          <TrainerPracticeLink className={styles.start} href={trainer.href}>{need ? `Начать ${trainer.skill}` : 'Попробовать этот формат'}<span aria-hidden="true">→</span></TrainerPracticeLink>
          <p className={styles.method}>Своя попытка <span aria-hidden="true">→</span> разбор <span aria-hidden="true">→</span> новый пример</p>
        </div>
      </article>
    </section>
    <div className={styles.bottom}><a href="/trainers/history">Мои занятия и сохранённые попытки ↗</a><MotionToggle /></div>
  </>;
}
