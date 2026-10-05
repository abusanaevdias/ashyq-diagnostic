import type { Metadata } from 'next';
import SatTranslation from '@/components/trainers/SatTranslation';
import { Footer, NavBar } from '@/components/ui/CleanUi';
export const metadata: Metadata = { title: 'От текста к уравнению — ASHYQ SAT Math', description: 'Собери модель задачи перед расчётом и проверь себя на новом примере.', robots: { index: false, follow: false } };
export default function Page() { return <><NavBar/><SatTranslation/><Footer/></>; }
