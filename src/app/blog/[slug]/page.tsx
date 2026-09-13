import type { Metadata } from 'next';
import BlogPostView, { type BlogPostPageData } from '@/components/lms/BlogPostView';
import { BLOG_IS_DEMO } from '@/data/blog';
import { defaultPosts } from '@/lib/lms/local-repos';

export const metadata: Metadata = {
  title: 'Статья — Блог ASHYQ',
  // посты демо-режима живут на устройстве автора — не индексируем, как и /blog
  robots: BLOG_IS_DEMO ? { index: false, follow: false } : undefined,
};

export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const defaults = defaultPosts();
  const post = defaults.find((item) => item.slug === slug);
  const initialData: BlogPostPageData | undefined = post
    ? { post, author: null, more: defaults.filter((item) => item.id !== post.id).slice(0, 3) }
    : undefined;

  return <BlogPostView slug={slug} initialData={initialData} />;
}
