import type { Metadata } from 'next';
import SeasonPublicHub from '@/components/season/SeasonPublicHub';
import { Footer, NavBar } from '@/components/ui/CleanUi';

export const metadata: Metadata = {
  title: 'ASHYQ Championship — активный сезон',
  description: 'Рейтинг команд и участников, Match Days и путь к финалу сезона ASHYQ.',
};

export default function SeasonPage() {
  return (
    <div>
      <NavBar />
      <SeasonPublicHub />
      <Footer />
    </div>
  );
}
