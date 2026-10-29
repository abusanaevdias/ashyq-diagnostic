import Link from 'next/link';
import TrainerPracticeLink from '../trainers/TrainerPracticeLink';
import WritingRevisionProof from './WritingRevisionProof';
import styles from './WritingTrainerLanding.module.css';

const steps = [
  { number: '01', title: 'Найди', text: 'Выбери эссе о транспорте или обучении. Прочитай задание и текст целиком. Ошибки пока не подсвечены.' },
  { number: '02', title: 'Перепиши', text: 'Нажми на предложение и напиши свой вариант в поле «Твоя правка». Затем нажми «Проверить мои правки».' },
  { number: '03', title: 'Разбери', text: 'Сравни свою попытку с объяснением. Посмотри, что пропустил, и сам выбери, какую проверенную правку применить.' },
];
const criteria = [
  ['Грамматика', 'Найди ошибки и исправь форму предложения.'],
  ['Ответ на вопрос', 'Проверь позицию, аргументы и их развитие.'],
  ['Связность', 'Свяжи мысли и выстрой переходы между ними.'],
  ['Лексика', 'Выбери точные слова и уместные сочетания.'],
];

export default function WritingTrainerLanding() {
  return <main className={styles.page}>
    <div className={styles.hero}>
      <header className={styles.intro}>
        <p className={styles.eyebrow}>IELTS WRITING · TASK 2</p>
        <h1>Сильное эссе.<br />По одной правке.</h1>
        <p className={styles.lead}>Найди слабое место, перепиши сам и сравни с разбором.</p>
        <TrainerPracticeLink className={styles.primary} href="/writing/trainer/practice">Выбрать эссе<span aria-hidden="true">→</span></TrainerPracticeLink>
        <p className={styles.note}>2 учебных текста · без регистрации</p>
        <a href="#how-it-works" className={styles.textLink}>Как проходит занятие ↓</a>
      </header>
      <WritingRevisionProof />
    </div>

    <section id="how-it-works" className={styles.how} aria-labelledby="how-title">
      <p className={styles.eyebrow}>СВОЯ ПОПЫТКА → ПОНЯТНЫЙ РАЗБОР</p>
      <h2 id="how-title">Три действия в тренажёре</h2>
      <p className={styles.sectionLead}>Сначала работаешь сам. Разбор открывается после твоей попытки.</p>
      <ol className={styles.steps}>{steps.map(step => <li key={step.number}><span className={styles.number} aria-hidden="true">{step.number}</span><div><h3>{step.title}</h3><p>{step.text}</p></div></li>)}</ol>
    </section>

    <section className={styles.criteria} aria-labelledby="criteria-title">
      <div><p className={styles.eyebrow}>ПО ОДНОМУ АСПЕКТУ ЗА РАЗ</p><h2 id="criteria-title">От предложения<br />к целому эссе.</h2><p className={styles.sectionLead}>После грамматики пройди ещё три критерия. Ты решаешь, какие правки войдут в рабочий текст.</p></div>
      <dl>{criteria.map(([name, text]) => <div key={name}><dt>{name}</dt><dd>{text}</dd></div>)}</dl>
    </section>

    <section className={styles.start} aria-labelledby="start-title">
      <div><p className={styles.eyebrow}>ОТКРЫТАЯ УЧЕБНАЯ ПРАКТИКА</p><h2 id="start-title">Попробуй на двух готовых эссе</h2><p>Городской транспорт или обучение — выбери тему и начни с грамматики.</p><p className={styles.limit}>Числа в разборе — учебные ориентиры для готовых примеров, не оценка твоего текста или официальный балл IELTS.</p></div>
      <TrainerPracticeLink href="/writing/trainer/practice" className={styles.primary}>Попробовать тренажёр<span aria-hidden="true">→</span></TrainerPracticeLink>
    </section>

    <section className={styles.drills} aria-labelledby="drills-title">
      <div><p className={styles.eyebrow}>КОРОТКИЕ УПРАЖНЕНИЯ</p><h2 id="drills-title">Потренируй один навык перед целым эссе</h2><p>Соединяй мысли, исправляй грамматику и усиливай аргументы. Сначала свой вариант, затем сравнение и объяснение.</p><p className={styles.note}>Три вида упражнений по два задания · вымышленные примеры · без регистрации</p></div>
      <TrainerPracticeLink className={styles.textLink} href="/writing/trainer/drills">Открыть упражнения<span aria-hidden="true">→</span></TrainerPracticeLink>
    </section>
    <section className={styles.own} aria-labelledby="own-title">
      <div><p className={styles.eyebrow}>ДЛЯ УЧЕНИКОВ И УЧИТЕЛЕЙ ASHYQ</p><h2 id="own-title">Есть своё эссе?</h2><p>Если ты учишься в IELTS-классе или ведёшь его, добавь задание и текст, а затем перепиши эссе по четырём критериям. Черновик останется в этой вкладке. {process.env.NEXT_PUBLIC_WRITING_AI_ENABLED === '1' ? 'В закрытом пилоте можно запросить AI-подсказки после своей правки, по отдельному согласию. Оценка IELTS пока недоступна.' : 'AI-разбор и оценка для своего текста пока недоступны.'}</p></div>
      <TrainerPracticeLink className={styles.textLink} href="/writing/trainer/own">Работать со своим эссе<span aria-hidden="true">→</span></TrainerPracticeLink>
    </section>
    <Link className={styles.more} href="/trainers">Смотреть тренажёры IELTS и SAT →</Link>
  </main>;
}
