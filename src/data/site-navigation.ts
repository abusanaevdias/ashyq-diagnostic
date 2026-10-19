/** Public destinations; individual lessons, articles and exercises live in their catalogues. */
export const SITE_NAVIGATION = [
  { title: 'Подготовка и поступление', links: [
    { href: '/', label: 'Главная' },
    { href: '/courses', label: 'Все курсы' },
    { href: '/courses/ielts', label: 'Подготовка к IELTS' },
    { href: '/courses/sat', label: 'Подготовка к SAT' },
    { href: '/mentoring', label: 'Поступление за рубеж' },
    { href: '/program', label: 'Программа обучения' },
    { href: '/courses/ielts/lessons', label: 'Уроки IELTS' },
    { href: '/courses/sat/lessons', label: 'Уроки SAT' },
  ] },
  { title: 'Самостоятельная практика', links: [
    { href: '/trainers', label: 'Все тренажёры' },
    { href: '/writing/trainer', label: 'Writing: работа с эссе' },
    { href: '/trainers/bank', label: 'Банк заданий' },
    { href: '/trainers/history', label: 'История тренировок' },
    { href: '/library', label: 'Бесплатная библиотека' },
    { href: '/diagnostic', label: 'Диагностика IELTS / SAT' },
    { href: '/career', label: 'Компас: выбор направления' },
    { href: '/progress', label: 'Как отслеживаем прогресс' },
  ] },
  { title: 'Об ASHYQ', links: [
    { href: '/about', label: 'О нас' },
    { href: '/blog', label: 'Блог' },
    { href: '/community', label: 'Сообщество' },
    { href: '/season', label: 'Чемпионат' },
    { href: '/press', label: 'ASHYQ в медиа' },
    { href: '/faq', label: 'Вопросы и ответы' },
    { href: '/contacts', label: 'Контакты' },
  ] },
] as const;
