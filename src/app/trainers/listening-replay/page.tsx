import type { Metadata } from 'next';
import ListeningReplay from '@/components/trainers/ListeningReplay';
import { Footer, NavBar } from '@/components/ui/CleanUi';

export const metadata: Metadata = {
  title: 'Listening: прогноз, попытка и разбор — ASHYQ',
  description: 'Предскажи тип ответа, послушай авторскую запись и восстанови ответ с постепенной помощью.',
  robots: { index: false, follow: false },
};

export default function ListeningReplayPage() {
  return <><NavBar /><ListeningReplay /><Footer /></>;
}
