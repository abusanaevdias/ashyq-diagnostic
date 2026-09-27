import type { Metadata } from 'next';
import WritingTrainer from '@/components/writing/WritingTrainer';
import { Footer, NavBar } from '@/components/ui/CleanUi';

export const metadata: Metadata = {
  title: 'Практика IELTS Writing Task 2 — ASHYQ',
  description: 'Учебный тренажёр самостоятельной правки двух вымышленных эссе IELTS Academic Task 2.',
  robots: { index: false, follow: false },
};

export default function WritingTrainerPracticePage() {
  return <>
    <NavBar />
    <WritingTrainer />
    <Footer />
  </>;
}
