export const SITE_NAME = 'ASHYQ';
export const SITE_FULL_NAME = 'ASHYQ — образовательный клуб';
/** Provided by the owner in this chat; not a claim about legal registration. */
export const CONTACT_EMAIL = 'ashyqhub@gmail.com';
export const CLUB_MANAGER = 'Алишер Нурсаин';

/** Product facts, not aggregate outcomes, ratings or a founding date. */
export const CLUB_FACTS = [
  { value: '2', label: 'направления: IELTS и SAT' },
  { value: 'Онлайн', label: 'подготовка по Казахстану' },
  { value: 'Тест', label: 'предварительная диагностика' },
  { value: 'План', label: 'разбор и следующий шаг' },
];

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
  '/press',
  '/docs',
  '/contacts',
  '/mentoring',
  '/library',
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

/** Соцсети подтверждены пользователем. Постоянный офис не указан. */
export const TELEGRAM_CONTACT = 'ashyqeducation';

export const SOCIAL_LINKS = [
  { label: 'Instagram', handle: '@ashyqedu', href: 'https://www.instagram.com/ashyqedu/' },
  { label: 'Threads', handle: '@ashyqedu', href: 'https://www.threads.net/@ashyqedu' },
  { label: 'Telegram-канал', handle: '@ashyqedu', href: 'https://t.me/ashyqedu' },
] as const;
