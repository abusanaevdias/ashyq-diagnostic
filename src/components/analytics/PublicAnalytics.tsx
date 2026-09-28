'use client';

import { useEffect, useState } from 'react';
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
  const [enabled, setEnabled] = useState(false);
  useEffect(() => {
    const host = window.location.hostname;
    const configured = process.env.NEXT_PUBLIC_SITE_URL;
    let canonicalHost = '';
    try { if (configured?.startsWith('https://')) canonicalHost = new URL(configured).hostname; }
    catch { /* Invalid site URL must not load the script on an arbitrary host. */ }
    setEnabled(host === 'ashyq-diagnostic.vercel.app' || /^ashyq-diagnostic-[a-z0-9-]+\.vercel\.app$/.test(host) || Boolean(canonicalHost && host === canonicalHost));
  }, []);
  return enabled ? <Analytics beforeSend={publicPageView} /> : null;
}
