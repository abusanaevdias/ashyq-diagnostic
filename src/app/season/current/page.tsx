import type { Metadata } from 'next';
import SeasonHQ from '@/components/season/SeasonHQ';
import { Footer, NavBar } from '@/components/ui/CleanUi';

export const metadata: Metadata = {
  title: 'Season HQ — интерактивный прототип',
  description: 'Демо кабинета участника активного сезона ASHYQ.',
  alternates: { canonical: '/season/current' },
  robots: { index: false, follow: false },
};

export default function CurrentSeasonPage() {
  return <div><NavBar /><SeasonHQ /><Footer /></div>;
}
