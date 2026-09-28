'use client';

import { Analytics, type BeforeSendEvent } from '@vercel/analytics/next';

const publicPages = new Set([
  '/', '/about', '/contacts', '/courses', '/courses/ielts', '/courses/sat',
  '/blog', '/writing/trainer', '/writing/trainer/practice', '/diagnostic',
  '/privacy', '/terms', '/career', '/community', '/search', '/season',
  '/program', '/faq',
]);

function publicPageView(event: BeforeSendEvent): BeforeSendEvent | null {
  try {
    const url = new URL(event.url);
    const path = url.pathname.replace(/\/$/, '') || '/';
    if (!publicPages.has(path) && !/^\/blog\/[a-z0-9-]+$/.test(path)) return null;
    // No query parameters, fragments, account pages, class IDs or essays in Vercel Analytics.
    return { ...event, url: `${url.origin}${path}` };
  } catch { return null; }
}

export default function PublicAnalytics() {
  return <Analytics beforeSend={publicPageView} />;
}
