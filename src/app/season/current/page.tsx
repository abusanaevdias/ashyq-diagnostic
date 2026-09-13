import type { Metadata } from 'next';
import SeasonHome from '@/components/season/SeasonHome';
import { Footer, NavBar } from '@/components/ui/CleanUi';

export const metadata: Metadata = {
  title: 'Season HQ — ASHYQ',
  description: 'Кабинет участника сезона ASHYQ: команда, баллы недели и Match Day.',
  alternates: { canonical: '/season/current' },
  robots: { index: false, follow: false },
};

export default function CurrentSeasonPage() {
  return <div><NavBar /><SeasonHome /><Footer /></div>;
}
