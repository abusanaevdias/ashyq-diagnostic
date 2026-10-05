import type { Metadata } from 'next';
import MathForensics from '@/components/trainers/MathForensics';
import { Footer, NavBar } from '@/components/ui/CleanUi';

export const metadata: Metadata = {
  title: 'SAT Math Error Forensics — ASHYQ',
  description: 'Найди первый неверный шаг в решении SAT Math, исправь его и проверь навык на новой авторской задаче.',
  robots: { index: false, follow: false },
};

export default function MathForensicsPage() {
  return <><NavBar /><MathForensics /><Footer /></>;
}
