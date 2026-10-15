import type { Metadata } from 'next';
import { Footer, NavBar } from '@/components/ui/CleanUi';
import DraftMaterialReview from '@/components/trainers/DraftMaterialReview';
import styles from '../trainers.module.css';

export const metadata: Metadata = { title: 'Проверка материалов тренажёров — ASHYQ', robots: { index: false, follow: false } };
export default function MaterialReviewPage() {
  return <><NavBar study/><main className={styles.page}><DraftMaterialReview/></main><Footer/></>;
}
