/**
 * Данные блога.
 *
 * ДЕМО: настоящих статей пока нет (решение пользователя 2026-09-13) —
 * ниже примеры тем, а не опубликованные материалы. Когда статьи придут:
 * заменить BLOG_POSTS, поставить BLOG_IS_DEMO = false (noindex и демо-плашка
 * снимутся сами), добавить '/blog' в SITE_ROUTES и при необходимости
 * страницы статей /blog/[slug].
 */

export type BlogCategory = 'ielts' | 'sat' | 'season';

export const BLOG_CATEGORIES: Record<BlogCategory, string> = {
  ielts: 'IELTS',
  sat: 'SAT',
  season: 'Сезон',
};

export type BlogPost = {
  slug: string;
  category: BlogCategory;
  title: string;
  excerpt: string;
  photo: string;
};

export const BLOG_IS_DEMO = true;

export const BLOG_POSTS: BlogPost[] = [
  {
    slug: 'ielts-true-false-not-given',
    category: 'ielts',
    title: 'True / False / Not Given: как не путать «нет» и «не сказано»',
    excerpt: 'Почему вариант Not Given чаще всего стоит баллов в IELTS Reading и как проверять утверждение по тексту.',
    photo: '/brand/lesson-grid.jpg',
  },
  {
    slug: 'sat-math-module-time',
    category: 'sat',
    title: 'SAT Math: как распределять время внутри модуля',
    excerpt: 'Когда пропустить задачу и вернуться к ней позже, чтобы не терять лёгкие баллы в конце модуля.',
    photo: '/brand/hero-students.jpg',
  },
  {
    slug: 'ielts-listening-form-completion',
    category: 'ielts',
    title: 'Listening: как не терять ответы на Form completion',
    excerpt: 'Орфография, числа и лимит слов — где чаще всего ошибаются в первой части Listening.',
    photo: '/brand/lesson-grid.jpg',
  },
  {
    slug: 'match-day-inside',
    category: 'season',
    title: 'Match Day изнутри: зачем тренироваться под давлением',
    excerpt: 'Speaking Battle, Reading Sprint и SAT Math Race — как устроены командные задания сезона.',
    photo: '/brand/hero-students.jpg',
  },
];
