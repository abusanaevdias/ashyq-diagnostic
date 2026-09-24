import type { Metadata } from 'next';
import BlogV3 from '@/components/BlogV3';
import { BLOG_IS_DEMO } from '@/data/blog';

export const metadata: Metadata = {
  title: 'Блог ASHYQ',
  description: 'Практические разборы IELTS и Digital SAT: структура заданий, критерии оценки, планы подготовки и типичные ошибки.',
  alternates: { canonical: '/blog' },
  // В демо-режиме закрываем тестовый список от индексации.
  robots: BLOG_IS_DEMO ? { index: false, follow: false } : undefined,
};

export default function BlogPage() {
  return <BlogV3 />;
}
