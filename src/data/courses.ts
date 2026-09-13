/**
 * Карточки каталога /courses.
 * Единственный источник данных: страница курсов и поиск по сайту (/search)
 * читают этот массив, чтобы описания не расходились.
 * ponytail: фото повторяются — в public/brand только два снимка; заменить,
 * когда появятся съёмки курсов.
 */

export type CourseFilter = 'all' | 'ielts' | 'sat' | 'team';

export const COURSES: Array<{ title: string; text: string; meta: string; href: string; photo: string; alt: string; tags: Array<Exclude<CourseFilter, 'all'>>; badge?: string }> = [
  { title: 'Подготовка к IELTS', text: 'Reading, Listening, Writing и Speaking по плану из диагностики. Пробные тесты, домашние задания и Speaking Battles.', meta: '4 секции · онлайн и в Астане', href: '/?start=ielts', photo: '/brand/lesson-grid.jpg', alt: 'Онлайн-занятие ASHYQ по IELTS', tags: ['ielts'] },
  { title: 'Подготовка к SAT', text: 'Reading & Writing и Math: навыки, стратегия времени и регулярные пробные тесты с разбором.', meta: '2 секции · онлайн и в Астане', href: '/?start=sat', photo: '/brand/hero-students.jpg', alt: 'Студенты ASHYQ готовятся к SAT', tags: ['sat'] },
  { title: 'Сезон и Match Days', text: 'Командные задания, рейтинг и Championship сезона. IELTS и SAT считаются раздельно.', meta: 'команды и участники · финал в Астане', href: '/season', photo: '/brand/hero-students.jpg', alt: 'Команда ASHYQ на Match Day', tags: ['team', 'ielts', 'sat'] },
  { title: 'Quick Diagnostic', text: 'Предварительная оценка IELTS или SAT и понятный следующий шаг. Это не официальный балл.', meta: '12–20 минут · без регистрации', href: '/?start=ielts', photo: '/brand/lesson-grid.jpg', alt: 'Ученик проходит диагностику ASHYQ', tags: ['ielts', 'sat'], badge: 'Бесплатно' },
];
