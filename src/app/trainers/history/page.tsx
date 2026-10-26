import type { Metadata } from 'next';
import Link from 'next/link';
import { Footer, NavBar } from '@/components/ui/CleanUi';
import TrainerHistory from '@/components/trainers/TrainerHistory';
import styles from '../trainers.module.css';
import history from '@/components/trainers/TrainerHistory.module.css';

export const metadata: Metadata = { title: 'Мои занятия — тренажёры ASHYQ', robots: { index: false, follow: false } };
export default function TrainerHistoryPage() {
  return <><NavBar study/><main className={`${styles.page} ${history.page}`}><Link href="/trainers">← Все тренажёры</Link><h1>Мои занятия</h1><TrainerHistory/></main><Footer/></>;
}
