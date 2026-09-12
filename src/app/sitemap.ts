import type { MetadataRoute } from 'next';
import { SITE_ROUTES, SITE_URL } from '@/lib/site';

export default function sitemap(): MetadataRoute.Sitemap {
  return SITE_ROUTES.map((route) => ({
    url: `${SITE_URL}${route}`,
    lastModified: new Date(),
    changeFrequency: route === '/' || route === '/season' ? 'weekly' : 'monthly',
    priority: route === '/' ? 1 : route === '/season' ? 0.9 : 0.7,
  }));
}
