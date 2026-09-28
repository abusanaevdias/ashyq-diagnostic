import type { LibrarySection } from '@/lib/free-library';
import styles from './Library.module.css';

/** Native anchor navigation: no copied content, registration or client state. */
export default function LessonGuide({ sections }: { sections: LibrarySection[] }) {
  const examples = sections.filter((section) => /^(E0[1-6]-[AC]|U0[1-4]-[ABC]|T1[ABC]-[AC])$/.test(section.code));
  const groups = [
    { title: 'Практика', text: 'Задания и поле для своей попытки.', items: sections.filter((section) => section.exercise && !section.answer) },
    { title: 'Примеры', text: 'Полные версии, которые можно сравнить.', items: examples },
    { title: 'Разборы и материал', text: 'Объяснения, критерии и исходные данные.', items: sections.filter((section) => !section.exercise && !section.answer && !examples.includes(section)) },
    { title: 'Ответы', text: 'Раскрывайте после собственной попытки.', items: sections.filter((section) => section.answer) },
  ].filter((group) => group.items.length);
  return <section className={styles.lessonGuide} id="lesson-stages" aria-labelledby="lesson-stages-title">
    <h2 id="lesson-stages-title">Выберите этап занятия</h2>
    <p>Перейдите прямо к нужному блоку. Все материалы ниже — на этой странице.</p>
    <nav className={styles.stageGrid} aria-label="Этапы занятия">{groups.map((group) => <div key={group.title}>
      <h3>{group.title}</h3><p>{group.text}</p>
      {group.items.map((section) => <a key={section.code} href={`#${section.code.toLowerCase()}`}>
        <span>{section.code}</span>{examples.includes(section) ? section.subtitle.split(' / ')[0] : section.title}
      </a>)}
    </div>)}</nav>
  </section>;
}
