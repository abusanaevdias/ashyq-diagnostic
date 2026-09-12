export const SITE_NAME = 'ASHYQ';

export const SITE_DESCRIPTION =
  'Диагностика IELTS и SAT, система прогресса, Match Days и чемпионаты сезона ASHYQ.';

export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'
).replace(/\/$/, '');

export const SITE_ROUTES = [
  '/',
  '/program',
  '/progress',
  '/community',
  '/season',
  '/faq',
  '/privacy',
  '/terms',
] as const;
