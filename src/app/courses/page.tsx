import type { Metadata } from 'next';
import CoursesV3 from '@/components/CoursesV3';

export const metadata: Metadata = {
  title: 'Курсы IELTS и Digital SAT онлайн в Казахстане — ASHYQ',
  description:
    'Онлайн-курсы IELTS и Digital SAT для школьников и абитуриентов в Казахстане. Выберите направление, изучите программу и начните с диагностики ASHYQ.',
  alternates: { canonical: '/courses' },
  openGraph: {
    title: 'Курсы IELTS и Digital SAT онлайн в Казахстане — ASHYQ',
    description:
      'Онлайн-подготовка к IELTS и Digital SAT для учеников из Казахстана. Сравните направления и начните с предварительной диагностики.',
    url: '/courses',
    siteName: 'ASHYQ',
    locale: 'ru_RU',
    type: 'website',
    images: ['/opengraph-image'],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Курсы IELTS и Digital SAT онлайн в Казахстане — ASHYQ',
    description:
      'Онлайн-подготовка к IELTS и Digital SAT для учеников из Казахстана. Сравните направления и начните с предварительной диагностики.',
    images: ['/opengraph-image'],
  },
};

export default function CoursesPage() {
  return <CoursesV3 />;
}
