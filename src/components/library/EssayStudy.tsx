'use client';

import { Fragment, useRef, useState } from 'react';
import type { LibrarySection } from '@/lib/free-library';
import { essayParts, highlightedSentences, reviewSteps } from '@/lib/library-presentation';
import LibraryContent from './LibraryContent';
import styles from './Library.module.css';

export function CriteriaHelp() {
  return <details className={styles.quizInstructions}><summary>Как читать разбор и пользоваться критериями</summary>
    <p>Это учебные комментарии ASHYQ к готовому примеру. Числа описывают авторский ориентир для этого текста, а не ваш балл и не официальную оценку экзаменатора.</p>
    <ul><li><strong>TR / TA — ответ на задание.</strong> Проверьте, раскрыты ли все части вопроса. В Task 2: тезис → причина → конкретный пример → связь с позицией. В Task 1: главная картина и точные сравнения данных.</li>
      <li><strong>CC — логика и связность.</strong> У каждого абзаца одна основная мысль; следующее предложение объясняет или развивает предыдущее.</li>
      <li><strong>LR — лексика.</strong> Проверьте точность слов и сочетаний: например, useful advice вместо useful advices. Сложное слово само по себе не улучшает текст.</li>
      <li><strong>GRA — грамматика.</strong> Проверьте согласование, времена, артикли и границы предложений: talent makes, а не talent make.</li></ul>
    <p>Сначала найдите проблему сами. В разборе выберите один комментарий, прочитайте отмеченное место, предложите свою правку и сравните её с улучшенной версией. Затем примените этот приём в практике. Весь нужный текст доступен здесь; читать PDF заранее не требуется.</p>
  </details>;
}
export default function EssayStudy({example, sections, review: explicitReview}: {example: LibrarySection; sections: LibrarySection[]; review?: LibrarySection}) {
  const [step, setStep] = useState(0);
  const [embeddedOpen, setEmbeddedOpen] = useState(false);
  const hasEmbeddedReview = !explicitReview && /^T1[ABC]-C$/.test(example.code) && reviewSteps(example).length>0;
  const review = explicitReview ?? (hasEmbeddedReview && embeddedOpen ? example : undefined);
  const parts = essayParts(example, sections);
  const steps = review ? reviewSteps(review) : [];
  const current = steps[step];
  const comment = current?.blocks.map(b => b.text ?? b.rows?.flat().join(' ') ?? '').join(' ') ?? '';
  const markedIndex = parts.paragraphs.findIndex(b => highlightedSentences(b.text!, comment).some(s => s.marked));
  const frame = useRef<HTMLDivElement>(null);
  function go(index: number) {
    setStep(index);
    requestAnimationFrame(() => {
      if(window.matchMedia('(max-width:900px)').matches) {
        const note = frame.current?.querySelector<HTMLElement>('[data-inline-review]');
        note?.focus({preventScroll:true}); note?.scrollIntoView({block:'center',behavior:'instant'});
      } else frame.current?.querySelector('mark')?.scrollIntoView({block:'center',behavior:'instant'});
    });
  }
  const controls = <div className={styles.quizActions}><button type="button" disabled={step===0} onClick={()=>go(step-1)}>Предыдущий комментарий</button><button type="button" disabled={step===steps.length-1} onClick={()=>go(step+1)}>Следующий комментарий →</button></div>;
  const note = current && <><h4>{current.title}</h4><p className={styles.small}>{markedIndex>=0?'Выделено предложение, связанное с комментарием автора.':'Комментарий к тексту в целом: точная привязка к предложению в источнике не указана.'}</p><LibraryContent blocks={current.blocks} title={current.title}/>{controls}</>;
  return <div ref={frame}>
    <CriteriaHelp />
    <div className={styles.taskCard}><p className={styles.kicker}>Задание экзамена · прочитайте до эссе</p>{parts.prompt && <p lang="en">{parts.prompt.text}</p>}{parts.context.length > 0 && <LibraryContent blocks={parts.context} title="Данные задания" />}</div>
    {review && <p className={styles.small}>Это тот же пример {example.code}. Выбирайте комментарий: связанные с ним предложения будут выделены в тексте. Если дословной привязки в источнике нет, комментарий относится к тексту в целом.</p>}
    {review && steps.length>0 && <nav className={`${styles.quizSteps} ${styles.mobileReviewNav}`} aria-label="Комментарии к эссе">{steps.map((s,i)=><button key={i} type="button" aria-current={step===i?'step':undefined} onClick={()=>go(i)}>{i+1} · {s.title}</button>)}</nav>}
    <div className={review ? styles.annotatedEssay : undefined}>
      <article className={styles.essayText} aria-label={`Текст ${example.code}`}><h3>Текст {example.code.startsWith('T1') ? 'отчёта' : 'эссе'} · версия {example.code.split('-').at(-1)}</h3><p className={styles.kicker}>Начало текста</p>
        {review && current && markedIndex<0 && <div className={`${styles.inlineReview} ${styles.reviewComment}`} data-inline-review tabIndex={-1} key={`whole-${step}`} aria-live="polite">{note}</div>}
        {parts.paragraphs.map((b,i) => <Fragment key={i}><p lang="en">{highlightedSentences(b.text!, comment).map((s,j) => s.marked ? <mark className={styles.sentenceMark} key={j}>{s.text}</mark> : s.text)}</p>{review && current && i===markedIndex && <div className={`${styles.inlineReview} ${styles.reviewComment}`} data-inline-review tabIndex={-1} key={step} aria-live="polite">{note}</div>}</Fragment>)}<p className={styles.kicker}>Конец текста</p></article>
      {review && <aside className={styles.reviewPanel} aria-label="Пошаговый разбор"><h3>Разбор по шагам</h3>{steps.length ? <><nav className={styles.quizSteps} aria-label="Комментарии к эссе">{steps.map((s,i)=><button key={i} type="button" aria-current={step===i?'step':undefined} onClick={()=>go(i)}>{i+1} · {s.title}</button>)}</nav><div key={step} className={styles.reviewComment} aria-live="polite">{note}</div></> : <LibraryContent blocks={review.blocks} title={review.title}/>}</aside>}
    </div>
    {hasEmbeddedReview && <div className={styles.quizActions}><button type="button" aria-expanded={embeddedOpen} onClick={()=>{setEmbeddedOpen(!embeddedOpen);if(!embeddedOpen) go(0);}}>{embeddedOpen?'Закрыть пошаговый разбор отчёта':'Открыть пошаговый разбор отчёта'}</button></div>}
    {!review && parts.notes.length > 0 && <details className={styles.quizInstructions}><summary>Примечания автора к примеру</summary><LibraryContent blocks={parts.notes} title={example.title}/></details>}
    {review && steps.length > 0 && <details className={styles.quizInstructions}><summary>Полный исходный разбор и оговорки автора</summary><LibraryContent blocks={review.blocks} title={review.title}/></details>}
  </div>;
}
