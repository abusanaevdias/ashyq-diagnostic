import type { Metadata } from 'next';
import WritingDrills from '@/components/writing/WritingDrills';
import { Footer, NavBar } from '@/components/ui/CleanUi';

export const metadata: Metadata = {
  title: 'Короткие упражнения IELTS Writing Task 2 — ASHYQ',
  description: 'Практика связности, грамматики и развития аргумента на вымышленных примерах IELTS Task 2.',
  robots: { index: false, follow: false },
};

export default function WritingDrillsPage() {
  return <><NavBar /><WritingDrills /><Footer /></>;
}
