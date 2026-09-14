/**
 * Карточки каталога /courses.
 * Единственный источник данных: страница курсов и поиск по сайту (/search)
 * читают этот массив, чтобы описания не расходились.
 * ponytail: фото повторяются — в public/brand только два снимка; заменить,
 * когда появятся съёмки курсов.
 */

export type CourseFilter = 'all' | 'ielts' | 'sat' | 'team';

export type CourseSlug = 'ielts' | 'sat';

export type CourseDetail = {
  slug: CourseSlug;
  exam: 'IELTS' | 'SAT';
  title: string;
  lead: string;
  photo: string;
  alt: string;
  facts: Array<{ label: string; value: string; provisional?: boolean }>;
  provisionalNote: string;
  curriculum: Array<{ title: string; description: string }>;
  steps: Array<{ title: string; description: string }>;
  included: string[];
  faq: Array<{ question: string; answer: string }>;
  diagnosticHref: string;
  diagnosticAriaLabel: string;
};

export const COURSES: Array<{ title: string; text: string; meta: string; href: string; photo: string; alt: string; tags: Array<Exclude<CourseFilter, 'all'>>; badge?: string }> = [
  { title: 'Подготовка к IELTS', text: 'Reading, Listening, Writing и Speaking по плану из диагностики. Пробные тесты, домашние задания и Speaking Battles.', meta: '4 секции · онлайн и в Астане', href: '/courses/ielts', photo: '/brand/lesson-grid.jpg', alt: 'Онлайн-занятие ASHYQ по IELTS', tags: ['ielts'] },
  { title: 'Подготовка к SAT', text: 'Reading & Writing и Math: навыки, стратегия времени и регулярные пробные тесты с разбором.', meta: '2 секции · онлайн и в Астане', href: '/courses/sat', photo: '/brand/hero-students.jpg', alt: 'Студенты ASHYQ готовятся к SAT', tags: ['sat'] },
  { title: 'Сезон и Match Days', text: 'Командные задания, рейтинг и Championship сезона. IELTS и SAT считаются раздельно.', meta: 'команды и участники · финал в Астане', href: '/season', photo: '/brand/hero-students.jpg', alt: 'Команда ASHYQ на Match Day', tags: ['team', 'ielts', 'sat'] },
  { title: 'Quick Diagnostic', text: 'Предварительная оценка IELTS или SAT и понятный следующий шаг. Это не официальный балл.', meta: '12–20 минут · без регистрации', href: '/?start=ielts', photo: '/brand/lesson-grid.jpg', alt: 'Ученик проходит диагностику ASHYQ', tags: ['ielts', 'sat'], badge: 'Бесплатно' },
];

const provisionalFacts = [
  { label: 'Длительность', value: 'Уточняется', provisional: true },
  { label: 'Расписание', value: 'Уточняется', provisional: true },
  { label: 'Стоимость', value: 'Уточняется', provisional: true },
  { label: 'Преподаватель', value: 'Уточняется', provisional: true },
  { label: 'Статус набора', value: 'Уточняется', provisional: true },
] satisfies CourseDetail['facts'];

export const COURSE_DETAILS: Record<CourseSlug, CourseDetail> = {
  ielts: {
    slug: 'ielts',
    exam: 'IELTS',
    title: 'Подготовка к IELTS',
    lead: 'Четыре секции экзамена, практика по плану из диагностики и понятный трекинг прогресса.',
    photo: '/brand/lesson-grid.jpg',
    alt: 'Онлайн-занятие ASHYQ по IELTS',
    facts: [
      { label: 'Формат', value: 'Онлайн и в Астане' },
      ...provisionalFacts,
    ],
    provisionalNote: 'Длительность, расписание, стоимость, преподаватель и статус набора пока уточняются. Обновим страницу после подтверждения.',
    curriculum: [
      { title: 'Reading', description: 'Работа с академическими текстами, типами заданий и временем.' },
      { title: 'Listening', description: 'Практика понимания речи, деталей и структуры аудиозаписи.' },
      { title: 'Writing', description: 'Структура ответа, аргументация и последовательная работа над текстом.' },
      { title: 'Speaking', description: 'Устная практика, обратная связь и Speaking Battles.' },
    ],
    steps: [
      { title: 'Диагностика', description: 'Определяем текущий уровень и ближайший учебный фокус.' },
      { title: 'План', description: 'Собираем последовательность тем и практики по результату.' },
      { title: 'Практика', description: 'Разбираем задания, тренируем навыки и формат экзамена.' },
      { title: 'Прогресс', description: 'Следим за динамикой и корректируем следующий шаг.' },
    ],
    included: [
      'Работа по четырём секциям IELTS',
      'Домашние задания и разборы',
      'Пробные задания и тренировка времени',
      'Speaking Battles и трекинг прогресса',
    ],
    faq: [
      { question: 'С какого уровня можно начать?', answer: 'Начните с бесплатной диагностики. Она даст предварительную оценку Reading и Listening и подскажет ближайший фокус.' },
      { question: 'Входит ли Speaking и Writing в диагностику?', answer: 'Нет. Автоматическая диагностика проверяет Reading и Listening. Writing и Speaking требуют отдельной проверки с тренером.' },
      { question: 'Где проходят занятия?', answer: 'Формат курса — онлайн и в Астане. Конкретное расписание пока уточняется.' },
    ],
    diagnosticHref: '/?start=ielts',
    diagnosticAriaLabel: 'Начать диагностику IELTS',
  },
  sat: {
    slug: 'sat',
    exam: 'SAT',
    title: 'Подготовка к SAT',
    lead: 'Reading & Writing и Math: навыки, стратегия времени и регулярная практика с разбором.',
    photo: '/brand/hero-students.jpg',
    alt: 'Студенты ASHYQ готовятся к SAT',
    facts: [
      { label: 'Формат', value: 'Онлайн и в Астане' },
      ...provisionalFacts,
    ],
    provisionalNote: 'Длительность, расписание, стоимость, преподаватель и статус набора пока уточняются. Обновим страницу после подтверждения.',
    curriculum: [
      { title: 'Reading & Writing', description: 'Работа с короткими текстами, языковыми правилами, аргументацией и данными.' },
      { title: 'Math', description: 'Алгебра, решение задач, анализ данных и практика в формате Digital SAT.' },
    ],
    steps: [
      { title: 'Диагностика', description: 'Определяем текущий уровень по Reading & Writing и Math.' },
      { title: 'План', description: 'Расставляем темы по приоритету и фиксируем ближайший фокус.' },
      { title: 'Практика', description: 'Разбираем задания и тренируем стратегию времени.' },
      { title: 'Прогресс', description: 'Сверяем результаты и обновляем учебный план.' },
    ],
    included: [
      'Подготовка по Reading & Writing и Math',
      'Домашние задания и разборы',
      'Пробные задания и стратегия времени',
      'Трекинг прогресса по двум секциям',
    ],
    faq: [
      { question: 'С какого уровня можно начать?', answer: 'Начните с бесплатной диагностики. Она даст предварительную оценку и покажет ближайший учебный фокус.' },
      { question: 'Какие секции проверяет диагностика?', answer: 'Диагностика проверяет Reading & Writing и Math. Результат предварительный и не является официальным баллом SAT.' },
      { question: 'Где проходят занятия?', answer: 'Формат курса — онлайн и в Астане. Конкретное расписание пока уточняется.' },
    ],
    diagnosticHref: '/?start=sat',
    diagnosticAriaLabel: 'Начать диагностику SAT',
  },
};

export const COURSE_SLUGS = Object.keys(COURSE_DETAILS) as CourseSlug[];

export function isCourseSlug(slug: string): slug is CourseSlug {
  return Object.prototype.hasOwnProperty.call(COURSE_DETAILS, slug);
}
