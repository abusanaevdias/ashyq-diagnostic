import type { Metadata } from 'next';
import WritingTrainer from '@/components/writing/WritingTrainer';
import { Footer, NavBar } from '@/components/ui/CleanUi';

export const metadata: Metadata = {
  title: 'Тренажёр IELTS Writing Task 2 — ASHYQ',
  description: 'Учебный тренажёр самостоятельной правки вымышленных эссе IELTS Academic Task 2.',
  robots: { index: false, follow: false },
};

export default function WritingTrainerPage() {
  return <>
    <NavBar />
    <WritingTrainer />
    <Footer />
  </>;
}
