import type { Metadata } from 'next';
import { cache } from 'react';
import BlogPostView, { type BlogPostPageData } from '@/components/lms/BlogPostView';
import JsonLd from '@/components/JsonLd';
import { BLOG_IS_DEMO, BLOG_POSTS } from '@/data/blog';
import { postCover } from '@/lib/lms/format';
import { defaultPosts } from '@/lib/lms/local-repos';
import { getRepos } from '@/lib/lms/repos';
import { SITE_NAME, SITE_URL } from '@/lib/site';

const publishedPageData = cache(async (slug: string): Promise<BlogPostPageData | null> => {
  const defaults = defaultPosts();
  const defaultPost = defaults.find((item) => item.slug === slug);
  if (defaultPost) {
    return { post: defaultPost, author: null, more: defaults.filter((item) => item.id !== defaultPost.id).slice(0, 3) };
  }

  try {
    const repos = getRepos();
    const post = await repos.blog.getPublishedBySlug(slug);
    if (!post) return null;
    const [author, all] = await Promise.all([repos.users.get(post.authorId), repos.blog.listPublished()]);
    return { post, author, more: all.filter((item) => item.id !== post.id).slice(0, 3) };
  } catch {
    return null;
  }
});

export function generateStaticParams() {
  return BLOG_POSTS.map((post) => ({ slug: post.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const data = await publishedPageData(slug);
  if (!data) {
    return {
      title: 'Статья не найдена — Блог ASHYQ',
      robots: { index: false, follow: true },
    };
  }

  const editorial = BLOG_POSTS.find((post) => post.slug === slug);
  const title = editorial?.seoTitle ?? data.post.title;
  const description = editorial?.metaDescription ?? data.post.excerpt;
  const url = `${SITE_URL}/blog/${slug}`;
  const coverUrl = data.post.coverUrl ? new URL(postCover(data.post.coverUrl), SITE_URL).toString() : undefined;
  const modifiedTime = editorial?.updatedAt ?? data.post.updatedAt ?? data.post.publishedAt;

  return {
    title,
    description,
    alternates: { canonical: `/blog/${slug}` },
    robots: BLOG_IS_DEMO ? { index: false, follow: false } : undefined,
    openGraph: {
      type: 'article',
      title,
      description,
      url,
      siteName: SITE_NAME,
      locale: 'ru_RU',
      ...(coverUrl ? { images: [{ url: coverUrl, alt: data.post.coverAlt ?? data.post.title }] } : {}),
      ...(data.post.publishedAt ? { publishedTime: data.post.publishedAt } : {}),
      ...(modifiedTime ? { modifiedTime } : {}),
    },
  };
}

export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const data = await publishedPageData(slug);
  const editorial = BLOG_POSTS.find((post) => post.slug === slug);
  const articleUrl = `${SITE_URL}/blog/${slug}`;
  const coverUrl = data?.post.coverUrl ? new URL(postCover(data.post.coverUrl), SITE_URL).toString() : undefined;
  const modifiedTime = editorial?.updatedAt ?? data?.post.updatedAt ?? data?.post.publishedAt;

  return (
    <>
      {data ? (
        <JsonLd data={{
          '@context': 'https://schema.org',
          '@type': 'BlogPosting',
          '@id': `${articleUrl}#article`,
          headline: data.post.title,
          description: editorial?.metaDescription ?? data.post.excerpt,
          mainEntityOfPage: { '@type': 'WebPage', '@id': articleUrl },
          ...(coverUrl ? { image: [coverUrl] } : {}),
          ...(data.post.publishedAt ? { datePublished: data.post.publishedAt } : {}),
          ...(modifiedTime ? { dateModified: modifiedTime } : {}),
          inLanguage: 'ru',
          publisher: { '@type': 'EducationalOrganization', '@id': `${SITE_URL}/#organization`, name: SITE_NAME, url: SITE_URL },
          ...(data.author?.name ? { author: { '@type': 'Person', name: data.author.name } } : {}),
        }} />
      ) : null}
      <BlogPostView slug={slug} initialData={data ?? undefined} />
    </>
  );
}
