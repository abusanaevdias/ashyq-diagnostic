import type { Metadata } from 'next';
import WritingTrainerLanding from '@/components/writing/WritingTrainerLanding';
import { Footer, NavBar } from '@/components/ui/CleanUi';

export const metadata: Metadata = {
  title: 'Как работает тренажёр IELTS Writing Task 2 — ASHYQ',
  description: 'Посмотрите три шага тренажёра и попробуйте самостоятельно улучшить одно из двух учебных эссе.',
  robots: { index: false, follow: false },
};

export default function WritingTrainerLandingPage() {
  return <>
    <NavBar />
    <WritingTrainerLanding />
    <Footer />
  </>;
}
