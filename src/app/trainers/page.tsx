import type { Metadata } from 'next';
import Link from 'next/link';
import { Footer, NavBar } from '@/components/ui/CleanUi';
import styles from './trainers.module.css';
import TrainerStaffLinks from '@/components/trainers/TrainerStaffLinks';

import {publishedBankSources} from '@/lib/trainers/bank-publication';
import TrainerCatalog from '@/components/trainers/TrainerCatalog';
import LearningNext from '@/components/trainers/LearningNext';
import PracticeGuide from '@/components/trainers/PracticeGuide';

export const metadata: Metadata = {
  title: 'Тренажёры IELTS и SAT — ASHYQ',
  description: 'Короткие учебные тренажёры ASHYQ: сначала своя попытка, затем разбор и новый пример.',
  robots: { index: false, follow: false },
};

export default function TrainersPage() {
  return <><NavBar study /><main className={styles.page}>
    <p className={styles.eyebrow}>ASHYQ · УЧЕБНЫЕ ТРЕНАЖЁРЫ</p>
    <h1>Учись на своей первой попытке</h1>
    <p className={styles.intro}>Здесь важен не только ответ. Сначала попробуй сам, затем сравни ход мысли с разбором и примени навык к новому примеру. Все открытые задания вымышлены.</p>
    <p><Link href="/trainers/history">Мои занятия и сохранённые попытки →</Link></p>
    <LearningNext />
    <PracticeGuide />
    <TrainerStaffLinks/>
    <TrainerCatalog/>
    {publishedBankSources.length>0&&<section className={styles.card}><h2>Больше заданий для практики</h2><p>Выбери навык и задание из опубликованного банка.</p><a href="/trainers/bank">Открыть банк заданий →</a></section>}
    <p className={styles.note}>Тренажёры не выдают официальный балл IELTS или SAT. Ответы в открытых упражнениях не отправляются на внешний AI.</p>
  </main><Footer /></>;
}
