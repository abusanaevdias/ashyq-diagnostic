import type { MetadataRoute } from 'next';
import { COURSE_DETAILS, COURSE_SLUGS, freeLessons } from '@/data/courses';
import { CAREER_CODES } from '@/data/career/profiles';
import { BLOG_POSTS } from '@/data/blog';
import { SITE_ROUTES, SITE_URL } from '@/lib/site';

// программа курса и бесплатные уроки; закрытые уроки своих страниц не имеют
const LESSON_ROUTES = COURSE_SLUGS.flatMap((slug) => [
  `/courses/${slug}/lessons`,
  ...freeLessons(COURSE_DETAILS[slug]).map((lesson) => `/courses/${slug}/lessons/${lesson.slug}`),
]);

// 16 профилей «Компаса» — статические страницы результата
const CAREER_ROUTES = CAREER_CODES.map((code) => `/career/${code.toLowerCase()}`);

export default function sitemap(): MetadataRoute.Sitemap {
  const routes: MetadataRoute.Sitemap = [...SITE_ROUTES, ...LESSON_ROUTES, ...CAREER_ROUTES].map((route) => ({
    url: `${SITE_URL}${route}`,
    lastModified: new Date(),
    changeFrequency: route === '/' || route === '/season' ? 'weekly' : 'monthly',
    priority: route === '/' ? 1 : route === '/season' ? 0.9 : 0.7,
  }));
  const articles = BLOG_POSTS.map((post) => ({
    url: `${SITE_URL}/blog/${post.slug}`,
    lastModified: new Date(post.updatedAt),
    changeFrequency: 'yearly' as const,
    priority: 0.65,
  }));
  return [...routes, ...articles];
}
