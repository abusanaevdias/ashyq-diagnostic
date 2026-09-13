import type { Metadata } from 'next';
import AboutV3 from '@/components/AboutV3';

export const metadata: Metadata = {
  title: 'О нас — ASHYQ',
  description: 'Миссия и ценности ASHYQ: подготовка к IELTS и SAT, видимый прогресс и сообщество студентов.',
  alternates: { canonical: '/about' },
};

export default function AboutPage() {
  return <AboutV3 />;
}
