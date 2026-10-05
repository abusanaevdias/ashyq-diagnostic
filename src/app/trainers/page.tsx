import type { Metadata } from 'next';
import Link from 'next/link';
import { Footer, NavBar } from '@/components/ui/CleanUi';
import styles from './trainers.module.css';

export const metadata: Metadata = {
  title: 'Тренажёры IELTS и SAT — ASHYQ',
  description: 'Короткие учебные тренажёры ASHYQ: сначала своя попытка, затем разбор и новый пример.',
  robots: { index: false, follow: false },
};

export default function TrainersPage() {
  return <><NavBar /><main className={styles.page}>
    <p className={styles.eyebrow}>ASHYQ · УЧЕБНЫЕ ТРЕНАЖЁРЫ</p>
    <h1>Учись на своей первой попытке</h1>
    <p className={styles.intro}>Здесь важен не только ответ. Сначала попробуй сам, затем сравни ход мысли с разбором и примени навык к новому примеру. Все открытые задания вымышлены.</p>
    <div className={styles.grid}>
      <article className={styles.card}><span>IELTS ACADEMIC · READING</span><h2>Докажи ответ текстом</h2><p>TRUE / FALSE / NOT GIVEN: выбери ответ и опору, проверь логическую связь и реши новый вопрос.</p><Link href="/trainers/reading-evidence">Попробовать Reading →</Link></article>
      <article className={styles.card}><span>IELTS-STYLE · LISTENING</span><h2>Услышь, где меняется ответ</h2><p>Предскажи тип ответа, послушай один раз и восстанови пропущенное с постепенной помощью.</p><Link href="/trainers/listening-replay">Попробовать Listening →</Link></article>
      <article className={styles.card}><span>SAT · READING & WRITING</span><h2>Реши до вариантов</h2><p>Сначала запиши свой прогноз, затем сравни его с четырьмя вариантами и реши новый вопрос.</p><Link href="/trainers/sat-optionless">Попробовать SAT R&W →</Link></article>
      <article className={styles.card}><span>SAT · MATH</span><h2>Найди первую ошибку</h2><p>Разбери чужое решение, исправь первый неверный переход и реши новую задачу.</p><Link href="/trainers/math-forensics">Попробовать SAT Math →</Link></article>
      <article className={styles.card}><span>SAT · READING & WRITING</span><h2>Разбери ложные варианты</h2><p>Выбери ответ и объясни, почему остальные варианты не подходят. Проверь себя на новом тексте.</p><Link href="/trainers/sat-distractor">Разобрать варианты →</Link></article>
      <article className={styles.card}><span>IELTS ACADEMIC · WRITING TASK 2</span><h2>Улучши эссе сам</h2><p>Найди ошибки в готовом учебном эссе и перепиши его по критериям шаг за шагом.</p><Link href="/writing/trainer">Попробовать Writing →</Link></article>
      <article className={styles.card}><span>IELTS ACADEMIC · WRITING TASK 1</span><h2>Собери overview по графику</h2><p>Выбери главное, проверь опору на данные и убери неточности перед полным ответом.</p><Link href="/trainers/task1-overview">Попробовать Task 1 →</Link></article>
    </div>
    <p className={styles.note}>Тренажёры не выдают официальный балл IELTS или SAT. Ответы в открытых упражнениях не отправляются на внешний AI.</p>
  </main><Footer /></>;
}
