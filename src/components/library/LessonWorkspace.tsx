'use client';

import { useEffect, useRef, useSyncExternalStore } from 'react';
import type { LibrarySection } from '@/lib/free-library';
import type { PracticeSet } from '@/lib/library-practice';
import { exampleReview, isEssay, reviewExample } from '@/lib/library-presentation';
import { progressSource } from '@/lib/library-progress';
import LibraryContent from './LibraryContent';
import LessonGuide from './LessonGuide';
import InteractivePractice from './InteractivePractice';
import StudyPad from './StudyPad';
import EssayStudy, { CriteriaHelp } from './EssayStudy';
import styles from './Library.module.css';

const subscribe = (fn: () => void) => {
  const route = location.pathname + location.search;
  let routeState = history.state;
  const notify = () => {
    if(location.pathname + location.search === route) {
      // Native fragment navigation can create a null-state history entry.
      // Keep this route's existing state so App Router can restore it from another page.
      // Reuse the opaque state unchanged; do not depend on Next's internal field names.
      if(history.state === null && routeState !== null) history.replaceState(routeState, '', location.href);
      else if(history.state !== null) routeState = history.state;
    }
    fn();
  };
  window.addEventListener('hashchange', notify); window.addEventListener('popstate',notify);
  return ()=>{window.removeEventListener('hashchange',notify);window.removeEventListener('popstate',notify);};
};
const hash = () => window.location.hash.slice(1).toLowerCase();
const server = () => '';
export default function LessonWorkspace({sections, practice, pdf}: {sections: LibrarySection[]; practice: PracticeSet[]; pdf: string}) {
  const selected = useSyncExternalStore(subscribe, hash, server);
  const active = sections.find(s => s.code.toLowerCase() === selected);
  const panel = useRef<HTMLDivElement>(null);
  const chooser = useRef<HTMLDetailsElement>(null);
  useEffect(()=>{if(chooser.current) chooser.current.open=!active;if(active){panel.current?.focus({preventScroll:true});panel.current?.scrollIntoView({block:'start',behavior:'instant'});}},[active]);
  const examples = sections.filter(isEssay);
  const firstPractice = sections.find(s => s.exercise && !s.answer);
  const reference = sections.filter(s => !s.exercise && !s.answer && !isEssay(s) && !reviewExample(s, sections) && !/UPGRADE|KEY/.test(s.code));
  return <div className={styles.workspace}>
    <noscript><p>Для выбора этапов, проверки и сохранения ответов включите JavaScript. Полный материал доступен по ссылке на PDF ниже.</p></noscript>
    <details ref={chooser} open={!active} className={styles.stageChooser}><summary>Этапы занятия · {active ? 'выбрать другой' : 'выберите, с чего начать'}</summary><LessonGuide sections={sections} practice={practice}/></details>
    {!active && <p className={styles.small}>{selected && selected!=='lesson-stages' ? 'Этот этап не найден. Выберите доступный этап выше.' : 'Откройте пример или практику. На экране будет только выбранный этап; вернуться к выбору можно в любой момент.'}</p>}
    <div ref={panel} tabIndex={-1} className={styles.activePanel}>
      {sections.map(section => {
        const set = practice.find(p => p.code === section.code);
        const example = reviewExample(section, sections);
        const review = isEssay(section) ? exampleReview(section, sections) : undefined;
        const nextExample = examples[examples.findIndex(e=>e.code===(example?.code??section.code))+1];
        return <section hidden={active?.code!==section.code} id={section.code.toLowerCase()} className={styles.lessonSection} key={section.code} aria-label={`${section.code} · ${section.title}`}>
          <a href="#lesson-stages" className={styles.backToStages}>← Выбрать этап занятия</a>
          <header className={styles.lessonHead}><p className={styles.kicker}>{section.code}{section.answer?' · ответы — после своей попытки':''}</p><h2>{section.title}</h2>{section.subtitle && <p className={styles.small}>{section.subtitle}</p>}</header>
          {example ? <EssayStudy example={example} sections={sections} review={section}/> : isEssay(section) ? <EssayStudy example={section} sections={sections}/> : set ? <>
            {examples.length>0 && <><CriteriaHelp/><details className={styles.quizInstructions}><summary>Задание и примеры A / B / C для этой практики</summary>{examples.map(e=><details key={e.code}><summary>{e.code} · {e.subtitle || e.title}</summary><EssayStudy example={e} sections={sections}/></details>)}</details></>}
            {reference.length>0 && <div className={styles.quizInstructions}><p>Материал для заданий — откройте нужный текст перед ответом.</p>{reference.map(s=><details key={s.code} open={/^R0[1-3]-A$/.test(s.code)}><summary>{s.title}</summary><LibraryContent blocks={s.blocks} title={s.title}/></details>)}</div>}
            <InteractivePractice set={set}/><details className={styles.quizInstructions}><summary>Все задания в исходном виде</summary><LibraryContent blocks={section.blocks} title={section.title}/></details>
          </> : <><LibraryContent blocks={section.blocks} title={section.title}/>{section.exercise && <StudyPad code={section.code} contentSource={progressSource(section.blocks)}/>}</>}
          <nav className={styles.quizActions} aria-label="Продолжить занятие">{review && <a href={`#${review.code.toLowerCase()}`}>Разобрать этот пример →</a>}{firstPractice && firstPractice.code!==section.code && <a href={`#${firstPractice.code.toLowerCase()}`}>Перейти к практике →</a>}{(example || isEssay(section)) && nextExample && <a href={`#${nextExample.code.toLowerCase()}`}>Следующий пример: {nextExample.code} →</a>}{set && practice[practice.indexOf(set)+1] && <a href={`#${practice[practice.indexOf(set)+1].code.toLowerCase()}`}>Следующий блок практики →</a>}</nav>
          <p className={styles.provenance}>Источник: {section.source==='lab'?'Writing Upgrade Lab V3':'Free Library V3, часть V2'}, страница файла {section.page}. Код сохранён из PDF.</p><a className={styles.backToStages} href="#lesson-stages">К этапам занятия ↑</a>
        </section>;
      })}
    </div>
    <a className={styles.inlineLink} href={pdf} download>Этот том в PDF ↓</a>
  </div>;
}
