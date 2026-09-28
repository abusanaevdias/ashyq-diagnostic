import type { Metadata } from 'next';
import ReadingEvidence from '@/components/trainers/ReadingEvidence';
import { Footer, NavBar } from '@/components/ui/CleanUi';

export const metadata: Metadata = {
  title: 'Reading Evidence Lab — IELTS Academic | ASHYQ',
  description: 'Учебный тренажёр IELTS Reading: ответь, найди опору в тексте, исправь логику и реши новый пример.',
  robots: { index: false, follow: false },
};

export default function ReadingEvidencePage() {
  return <><NavBar /><ReadingEvidence /><Footer /></>;
}
