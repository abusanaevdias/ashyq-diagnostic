export const SITE_NAME = 'ASHYQ';

export const SITE_DESCRIPTION =
  'Онлайн-подготовка к IELTS и Digital SAT для школьников и абитуриентов в Казахстане. ASHYQ помогает определить стартовый уровень и план подготовки.';

export const SITE_URL = (
  // || а не ??: пустая строка из панели хостинга ломает new URL() при сборке
  process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
).replace(/\/$/, '');

export const SITE_ROUTES = [
  '/',
  '/courses',
  '/courses/ielts',
  '/courses/sat',
  '/about',
  '/contacts',
  '/diagnostic',
  '/blog',
  '/career',
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
