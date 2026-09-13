export const SITE_NAME = 'ASHYQ';

export const SITE_DESCRIPTION =
  'Диагностика IELTS и SAT, система прогресса, Match Days и чемпионаты сезона ASHYQ.';

export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'
).replace(/\/$/, '');

export const SITE_ROUTES = [
  '/',
  '/courses',
  '/about',
  '/contacts',
  '/program',
  '/progress',
  '/community',
  '/season',
  '/faq',
  '/privacy',
  '/terms',
] as const;

/** Подтверждены пользователем 2026-09-13. Почты и офиса у ASHYQ пока нет. */
export const TELEGRAM_CONTACT = 'ashyqeducation';

export const SOCIAL_LINKS = [
  { label: 'Instagram', handle: '@ashyqedu', href: 'https://www.instagram.com/ashyqedu/' },
  { label: 'Threads', handle: '@ashyqedu', href: 'https://www.threads.net/@ashyqedu' },
  { label: 'Telegram-канал', handle: '@ashyqedu', href: 'https://t.me/ashyqedu' },
] as const;
