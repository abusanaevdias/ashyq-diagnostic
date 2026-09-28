import type { Metadata } from 'next';
import SatOptionless from '@/components/trainers/SatOptionless';
import { Footer, NavBar } from '@/components/ui/CleanUi';

export const metadata: Metadata = {
  title: 'SAT R&W Optionless — ASHYQ',
  description: 'Запиши прогноз до появления вариантов, сравни выбранный ответ и реши новый авторский SAT-style вопрос.',
  robots: { index: false, follow: false },
};

export default function SatOptionlessPage() {
  return <><NavBar /><SatOptionless /><Footer /></>;
}
