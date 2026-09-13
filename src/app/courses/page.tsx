import type { Metadata } from 'next';
import CoursesV3 from '@/components/CoursesV3';

export const metadata: Metadata = {
  title: 'Курсы ASHYQ',
  description: 'Подготовка к IELTS и SAT, сезон с Match Days и бесплатная диагностика ASHYQ.',
  alternates: { canonical: '/courses' },
};

export default function CoursesPage() {
  return <CoursesV3 />;
}
