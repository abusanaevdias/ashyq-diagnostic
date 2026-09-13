import type { Metadata } from 'next';
import { Suspense } from 'react';
import BlogPostView from '@/components/lms/BlogPostView';
import { BLOG_IS_DEMO } from '@/data/blog';

export const metadata: Metadata = {
  title: 'Статья — Блог ASHYQ',
  // посты демо-режима живут на устройстве автора — не индексируем, как и /blog
  robots: BLOG_IS_DEMO ? { index: false, follow: false } : undefined,
};

export default function BlogPostPage() {
  return (
    // slug читается через useParams — по доке Next 16 под Suspense
    <Suspense fallback={null}>
      <BlogPostView />
    </Suspense>
  );
}
