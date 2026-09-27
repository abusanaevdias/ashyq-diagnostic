import Image from 'next/image';
import Link from 'next/link';
import styles from './WritingTrainerLanding.module.css';

const steps = [
  {
    number: '01',
    title: 'Выбери готовое эссе',
    description: 'Прочитай задание и один из двух учебных текстов. Ошибки заранее не подсвечены.',
    image: '/writing/step-choose.png',
    alt: 'Экран выбора учебного эссе и задание IELTS Writing Task 2',
  },
  {
    number: '02',
    title: 'Исправь самостоятельно',
    description: 'Найди подозрительное предложение и запиши свою правку до появления подсказок.',
    image: '/writing/step-edit.png',
    alt: 'Поле, где ученик переписывает выбранное предложение',
  },
  {
    number: '03',
    title: 'Сравни с разбором',
    description: 'Посмотри пропущенные ошибки, объяснения и пример. Затем постепенно улучши эссе по другим критериям.',
    image: '/writing/step-feedback.png',
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
        <p className={styles.lead}>Без входа попробуй тренажёр на двух готовых эссе: сначала ищешь слабые места, потом переписываешь текст по шагам. Ученики IELTS-класса ASHYQ могут также работать со своим текстом.</p>
        <a className={styles.jumpLink} href="#how-it-works">Посмотреть три шага ↓</a>
      </header>

      <section id="how-it-works" className={styles.how} aria-labelledby="how-title">
        <div className={styles.sectionHeading}>
          <div>
            <p className={styles.eyebrow}>КАК ЭТО РАБОТАЕТ</p>
            <h2 id="how-title">От своей правки к разбору</h2>
          </div>
          <p>Снимки сделаны внутри действующего тренажёра. Ты увидишь те же экраны после старта.</p>
        </div>
        <div className={styles.steps}>
          {steps.map((step) => (
            <article className={styles.step} key={step.number}>
              <div className={styles.imageFrame}>
                <Image src={step.image} alt={step.alt} fill sizes="(max-width: 850px) 100vw, 33vw" />
              </div>
              <div className={styles.stepCopy}>
                <span className={styles.number}>{step.number}</span>
                <h3>{step.title}</h3>
                <p>{step.description}</p>
                <a className={styles.enlargeLink} href={step.image} target="_blank" rel="noopener noreferrer" aria-label={'Рассмотреть снимок шага ' + step.number + ' в новой вкладке'}>Рассмотреть снимок ↗</a>
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
        <div><p className={styles.eyebrow}>ДЛЯ УЧЕНИКОВ ASHYQ</p><h2 id="own-title">Есть своё эссе?</h2><p>Если ты состоишь в IELTS-классе, добавь задание и текст, а затем перепиши эссе по четырём критериям. Черновик останется в этой вкладке. Автоматический разбор и балл для своего текста пока недоступны.</p></div>
        <Link className={styles.ownLink} href="/writing/trainer/own">Работать со своим эссе →</Link>
      </section>
    </main>
  );
}
