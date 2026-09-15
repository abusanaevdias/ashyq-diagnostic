import type { MetadataRoute } from 'next';
import { COURSE_DETAILS, COURSE_SLUGS, freeLessons } from '@/data/courses';
import { SITE_ROUTES, SITE_URL } from '@/lib/site';

// программа курса и бесплатные уроки; закрытые уроки своих страниц не имеют
const LESSON_ROUTES = COURSE_SLUGS.flatMap((slug) => [
  `/courses/${slug}/lessons`,
  ...freeLessons(COURSE_DETAILS[slug]).map((lesson) => `/courses/${slug}/lessons/${lesson.slug}`),
]);

export default function sitemap(): MetadataRoute.Sitemap {
  return [...SITE_ROUTES, ...LESSON_ROUTES].map((route) => ({
    url: `${SITE_URL}${route}`,
    lastModified: new Date(),
    changeFrequency: route === '/' || route === '/season' ? 'weekly' : 'monthly',
    priority: route === '/' ? 1 : route === '/season' ? 0.9 : 0.7,
  }));
}
