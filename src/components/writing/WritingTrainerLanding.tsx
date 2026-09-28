import Image from 'next/image';
import Link from 'next/link';
import styles from './WritingTrainerLanding.module.css';

const steps = [
  {
    number: '01',
    title: 'Открой одно из двух эссе',
    description: 'Нажми «Попробовать тренажёр» и выбери тему: городской транспорт или обучение. Прочитай вопрос Task 2 и эссе целиком — ошибки пока скрыты.',
    outcome: 'Твоя задача: сначала самому заметить слабые места.',
    image: '/writing/step-choose.png',
    width: 1068,
    height: 402,
    alt: 'Экран выбора учебного эссе и задание IELTS Writing Task 2',
  },
  {
    number: '02',
    title: 'Перепиши подозрительное предложение',
    description: 'Нажми на предложение в эссе, напиши свой вариант в поле «Твоя правка» и выбери «Проверить мои правки». Можно исправить несколько предложений.',
    outcome: 'Подсказки появятся только после твоей попытки.',
    image: '/writing/step-edit.png',
    width: 975,
    height: 423,
    alt: 'Поле, где ученик переписывает выбранное предложение',
  },
  {
    number: '03',
    title: 'Сравни и реши, что применить',
    description: 'Посмотри, что нашёл и что пропустил. Прочитай объяснение, сравни свой вариант с примером и сам выбери, какую проверенную правку применить к рабочему эссе.',
    outcome: 'Затем так же пройди ответ на вопрос, связность и лексику.',
    image: '/writing/step-feedback.png',
    width: 975,
    height: 470,
    alt: 'Разбор грамматической правки с объяснением и примером',
  },
] as const;

export default function WritingTrainerLanding() {
  return (
    <main className={styles.page}>
      <div className={styles.topline}><span>ASHYQ / WRITING LAB</span><span>IELTS ACADEMIC · TASK 2</span></div>
      <header className={styles.hero}>
        <p className={styles.eyebrow}>ОТКРЫТАЯ УЧЕБНАЯ ПРАКТИКА</p>
        <h1>Сначала попробуй сам. Потом смотри разбор.</h1>
        <p className={styles.lead}>Без входа попробуй тренажёр на двух готовых эссе: сначала ищешь слабые места, потом переписываешь текст по шагам. Ученики и учителя IELTS-класса ASHYQ могут также работать со своим текстом.</p>
        <a className={styles.jumpLink} href="#how-it-works">Посмотреть три шага ↓</a>
      </header>

      <section id="how-it-works" className={styles.how} aria-labelledby="how-title">
        <div className={styles.sectionHeading}>
          <div>
            <p className={styles.eyebrow}>КАК ЭТО РАБОТАЕТ</p>
            <h2 id="how-title">Три действия в тренажёре</h2>
          </div>
          <p>Сначала работаешь сам. Разбор открывается после твоей попытки. Ниже показаны настоящие экраны готового примера.</p>
        </div>
        <div className={styles.steps}>
          {steps.map((step) => (
            <article className={styles.step} key={step.number}>
              <div className={styles.imageFrame}>
                <Image src={step.image} alt={step.alt} width={step.width} height={step.height} sizes="(max-width: 850px) 620px, 56vw" />
              </div>
              <p className={styles.mobileHint}>Листай снимок в сторону →</p>
              <div className={styles.stepCopy}>
                <span className={styles.number}>{step.number}</span>
                <h3>{step.title}</h3>
                <p>{step.description}</p>
                <p className={styles.outcome}>{step.outcome}</p>
                <a className={styles.enlargeLink} href={step.image} target="_blank" rel="noopener noreferrer" aria-label={'Открыть крупно снимок шага ' + step.number + ' в новой вкладке'}>Открыть снимок крупно ↗</a>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className={styles.start} aria-labelledby="start-title">
        <div>
          <p className={styles.startEyebrow}>МОЖНО НАЧАТЬ БЕЗ РЕГИСТРАЦИИ</p>
          <h2 id="start-title">Попробуй на двух готовых эссе</h2>
          <p>Грамматика, ответ на вопрос, связность и лексика — по одному шагу за раз. Правки остаются только в открытой вкладке.</p>
          <p className={styles.limit}>Числа в разборе — учебные ориентиры для готовых примеров, не оценка твоего текста или официальный балл IELTS.</p>
        </div>
        <Link href="/writing/trainer/practice" className={styles.startButton}>Попробовать тренажёр <span aria-hidden="true">→</span></Link>
      </section>
      <section className={styles.own} aria-labelledby="own-title">
        <div><p className={styles.eyebrow}>ДЛЯ УЧЕНИКОВ И УЧИТЕЛЕЙ ASHYQ</p><h2 id="own-title">Есть своё эссе?</h2><p>Если ты учишься в IELTS-классе или ведёшь его, добавь задание и текст, а затем перепиши эссе по четырём критериям. Черновик останется в этой вкладке. {process.env.NEXT_PUBLIC_WRITING_AI_ENABLED === '1' ? 'В закрытом пилоте можно запросить AI-подсказки после своей правки, по отдельному согласию. Оценка IELTS пока недоступна.' : 'AI-разбор и оценка для своего текста пока недоступны.'}</p></div>
        <Link className={styles.ownLink} href="/writing/trainer/own">Работать со своим эссе →</Link>
      </section>
    </main>
  );
}
