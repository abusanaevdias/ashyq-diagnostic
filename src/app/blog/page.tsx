import type { Metadata } from 'next';
import BlogV3 from '@/components/BlogV3';
import { BLOG_IS_DEMO } from '@/data/blog';

export const metadata: Metadata = {
  title: 'Блог ASHYQ',
  description: 'Разборы заданий IELTS и SAT, стратегии подготовки и жизнь сезона ASHYQ.',
  alternates: { canonical: '/blog' },
  // демо-темы не индексируем, пока нет настоящих статей
  robots: BLOG_IS_DEMO ? { index: false, follow: false } : undefined,
};

export default function BlogPage() {
  return <BlogV3 />;
}
