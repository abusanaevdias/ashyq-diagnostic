'use client';

import type { LibrarySection } from '@/lib/free-library';
import { checkPracticeAnswer, type PracticeSet } from '@/lib/library-practice';
import { practiceFields, progressSource, readProgress } from '@/lib/library-progress';
import { useDeviceProgress } from './useDeviceProgress';
import styles from './Library.module.css';

function PracticeStageLink({section,set}: {section: LibrarySection;set: PracticeSet}) {
  const saved=useDeviceProgress(set.code);
  const progress=readProgress(saved.raw,progressSource(set),practiceFields(set));
  const filled=Object.values(progress?.values ?? {}).filter(v=>v.trim()).length;
  const checked=set.questions.filter(q=>progress?.checked[q.id]);
  const correct=checked.filter(q=>checkPracticeAnswer(q,progress!.values[q.id]??'')===true).length;
  const wrong=checked.filter(q=>checkPracticeAnswer(q,progress!.values[q.id]??'')===false).length;
  const compared=checked.length-correct-wrong;
  return <a href={`#${section.code.toLowerCase()}`}><span>{section.code}</span>{section.title}<span className={styles.stageProgress}>Ответов: {filled}/{set.questions.length}{correct?` · ✓ ${correct}`:''}{wrong?` · × ${wrong}`:''}{compared?` · ○ ${compared} без оценки`:''}{!progress?' · сохранённые ответы требуют восстановления':''}{saved.problem?' · есть изменения в другой вкладке или сбой сохранения':''}</span></a>;
}

/** Source-preserving stage links; the workspace opens one selected stage. */
export default function LessonGuide({ sections, practice = [] }: { sections: LibrarySection[]; practice?: PracticeSet[] }) {
  const examples = sections.filter((section) => /^(E0[1-6]-[AC]|U0[1-4]-[ABC]|T1[ABC]-[AC])$/.test(section.code));
  const groups = [
    { title: 'Примеры', text: 'Полные версии, которые можно сравнить.', items: examples },
    { title: 'Практика', text: 'Задания и поле для своей попытки.', items: sections.filter((section) => section.exercise && !section.answer) },
    { title: 'Разборы и материал', text: 'Объяснения, критерии и исходные данные.', items: sections.filter((section) => !section.exercise && !section.answer && !examples.includes(section)) },
    { title: 'Ответы', text: 'Раскрывайте после собственной попытки.', items: sections.filter((section) => section.answer) },
  ].filter((group) => group.items.length);
  return <section className={styles.lessonGuide} id="lesson-stages" aria-labelledby="lesson-stages-title">
    <h2 id="lesson-stages-title">Выберите этап занятия</h2>
    <p>Выберите пример, разбор или практику. Каждый этап откроется отдельно. После примера можно перейти к его разбору, следующей версии или заданиям.</p>
    <nav className={styles.stageGrid} aria-label="Этапы занятия">{groups.map((group) => <div key={group.title}>
      <h3>{group.title}</h3><p>{group.text}</p>
      {group.items.map((section) => {const set=practice.find(p=>p.code===section.code);return set?<PracticeStageLink key={section.code} section={section} set={set}/>:<a key={section.code} href={`#${section.code.toLowerCase()}`}>
        <span>{section.code}</span>{examples.includes(section) ? section.subtitle.split(' / ')[0] : section.title}
      </a>;})}
    </div>)}</nav>
  </section>;
}
