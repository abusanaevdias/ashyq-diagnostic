import type { Metadata } from 'next';
import SatDistractor from '@/components/trainers/SatDistractor';
import { Footer, NavBar } from '@/components/ui/CleanUi';

export const metadata: Metadata = {
  title: 'SAT Distractor Autopsy — ASHYQ',
  description: 'Выбери лучший ответ, объясни ошибки альтернатив и проверь рассуждение на новом авторском SAT-style вопросе.',
  robots: { index: false, follow: false },
};

export default function SatDistractorPage() {
  return <><NavBar /><SatDistractor /><Footer /></>;
}
