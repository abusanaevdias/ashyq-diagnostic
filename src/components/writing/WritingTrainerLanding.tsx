import Link from 'next/link';
import styles from './WritingTrainerLanding.module.css';

const steps = [
  {
    number: '01',
    title: 'Открой одно из двух эссе',
    description: 'Нажми «Попробовать тренажёр» и выбери тему: городской транспорт или обучение. Прочитай вопрос Task 2 и эссе целиком — ошибки пока скрыты.',
    outcome: 'Твоя задача: сначала самому заметить слабые места.',
    illustration: 'choose',
  },
  {
    number: '02',
    title: 'Перепиши подозрительное предложение',
    description: 'Нажми на предложение в эссе, напиши свой вариант в поле «Твоя правка» и выбери «Проверить мои правки». Можно исправить несколько предложений.',
    outcome: 'Подсказки появятся только после твоей попытки.',
    illustration: 'edit',
  },
  {
    number: '03',
    title: 'Сравни и реши, что применить',
    description: 'Посмотри, что нашёл и что пропустил. Прочитай объяснение, сравни свой вариант с примером и сам выбери, какую проверенную правку применить к рабочему эссе.',
    outcome: 'Затем так же пройди ответ на вопрос, связность и лексику.',
    illustration: 'feedback',
  },
] as const;

function StepIllustration({ kind }: { kind: (typeof steps)[number]['illustration'] }) {
  return <div className={styles.illustration} aria-hidden="true">
    <span className={styles.illustrationLabel}>УПРОЩЁННАЯ СХЕМА</span>
    {kind === 'choose' && <div className={styles.illustrationCard}>
      <span className={styles.miniLabel}>ШАГ 1 · ВЫБЕРИ ТЕМУ</span>
      <div className={styles.topicRow}><span className={styles.topicActive}>Городской транспорт <b>✓</b></span><span>Обучение в школе</span></div>
      <div className={styles.illustrationPrompt}><span>ЗАДАНИЕ IELTS TASK 2</span><strong>Should public transport be free for everyone?</strong></div>
      <p className={styles.illustrationFoot}>Сначала прочитай вопрос и эссе целиком.</p>
    </div>}
    {kind === 'edit' && <div className={styles.illustrationCard}>
      <span className={styles.miniLabel}>ШАГ 2 · ТВОЯ ПОПЫТКА</span>
      <div className={styles.selectedSentence}>The bus go every ten minutes.<span className={styles.pointer}>← нажми на предложение</span></div>
      <div className={styles.illustrationArrow}>↓</div>
      <div className={styles.editExample}><span>ТВОЯ ПРАВКА</span><strong>The bus goes every ten minutes.</strong></div>
      <span className={styles.fakeAction}>Проверить мои правки →</span>
    </div>}
    {kind === 'feedback' && <div className={styles.illustrationCard}>
      <span className={styles.miniLabel}>ШАГ 3 · РАЗБОР ПОСЛЕ ПРОВЕРКИ</span>
      <div className={styles.resultExample}><span className={styles.resultBadge}>ПРОПУЩЕНО</span><p>The bus <mark>go</mark> every ten minutes.</p></div>
      <div className={styles.illustrationArrow}>↓</div>
      <div className={styles.fixExample}><span>ПРИМЕР ИСПРАВЛЕНИЯ</span><strong>The bus <u>goes</u> every ten minutes.</strong></div>
      <p className={styles.illustrationFoot}>Увидишь ошибку, объяснение и вариант правки.</p>
    </div>}
  </div>;
}

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
          <p>Сначала работаешь сам. Разбор открывается после твоей попытки. На схемах увеличены важные элементы; пример фразы на них не взят из учебных эссе.</p>
        </div>
        <div className={styles.steps}>
          {steps.map((step) => (
            <article className={styles.step} key={step.number}>
              <StepIllustration kind={step.illustration} />
              <div className={styles.stepCopy}>
                <span className={styles.number}>{step.number}</span>
                <h3>{step.title}</h3>
                <p>{step.description}</p>
                <p className={styles.outcome}>{step.outcome}</p>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className={styles.drills} aria-labelledby="drills-title">
        <div>
          <p className={styles.eyebrow}>КОРОТКИЕ УПРАЖНЕНИЯ</p>
          <h2 id="drills-title">Потренируй один навык перед целым эссе</h2>
          <p>Соединяй мысли, исправляй грамматику и усиливай аргументы. В каждом задании сначала напиши свой вариант, а затем сравни решения и прочитай объяснение.</p>
          <p className={styles.drillsNote}>Три вида упражнений по два задания · вымышленные примеры · без регистрации</p>
        </div>
        <Link href="/writing/trainer/drills" className={styles.drillsLink}>Открыть упражнения <span aria-hidden="true">→</span></Link>
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
