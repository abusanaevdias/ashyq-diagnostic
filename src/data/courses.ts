/**
 * Карточки каталога /courses.
 * Единственный источник данных: страница курсов и поиск по сайту (/search)
 * читают этот массив, чтобы описания не расходились.
 * ponytail: фото повторяются — в public/brand только два снимка; заменить,
 * когда появятся съёмки курсов.
 */

import { PHOTOS } from './media';

export type CourseFilter = 'all' | 'ielts' | 'sat' | 'team';

export type CourseSlug = 'ielts' | 'sat';

export type CourseDetail = {
  slug: CourseSlug;
  exam: 'IELTS' | 'SAT';
  title: string;
  lead: string;
  photo: string;
  alt: string;
  /** provisional: true — ещё не подтверждено; такие факты не показываются, вместо них — «узнать в WhatsApp». */
  facts: Array<{ label: string; value: string; provisional?: boolean }>;
  curriculum: Array<{ title: string; description: string }>;
  steps: Array<{ title: string; description: string }>;
  included: string[];
  faq: Array<{ question: string; answer: string }>;
  /** Программа уроков /courses/[slug]/lessons: модули по порядку прохождения. */
  modules: Array<{ title: string; lessons: CourseLesson[] }>;
  diagnosticHref: string;
  diagnosticAriaLabel: string;
};

export type CourseLesson = {
  slug: string;
  title: string;
  summary: string;
  /**
   * Только у бесплатных уроков: они открыты всем на /courses/[slug]/lessons/[lesson].
   * У остальных здесь лишь анонс — сами уроки учитель публикует в классе, куда пускает код после записи (RLS).
   */
  free?: { minutes: number; intro: string; points: string[]; practice: string };
};

export type FreeLesson = CourseLesson & { free: NonNullable<CourseLesson['free']> };

export const COURSES: Array<{ title: string; text: string; meta: string; href: string; photo: string; alt: string; tags: Array<Exclude<CourseFilter, 'all'>>; badge?: string }> = [
  { title: 'Подготовка к IELTS', text: 'Reading, Listening, Writing и Speaking по плану из диагностики. Пробные тесты, домашние задания и Speaking Battles.', meta: '4 секции · онлайн и в Астане', href: '/courses/ielts', photo: PHOTOS.courseCardIelts.src, alt: PHOTOS.courseCardIelts.alt, tags: ['ielts'] },
  { title: 'Подготовка к SAT', text: 'Reading & Writing и Math: навыки, стратегия времени и регулярные пробные тесты с разбором.', meta: '2 секции · онлайн и в Астане', href: '/courses/sat', photo: PHOTOS.courseCardSat.src, alt: PHOTOS.courseCardSat.alt, tags: ['sat'] },
  { title: 'Сезон и Match Days', text: 'Командные задания, рейтинг и Championship сезона. IELTS и SAT считаются раздельно.', meta: 'команды и участники · финал в Астане', href: '/season', photo: PHOTOS.courseCardSeason.src, alt: PHOTOS.courseCardSeason.alt, tags: ['team', 'ielts', 'sat'] },
  { title: 'Quick Diagnostic', text: 'Предварительная оценка IELTS или SAT и понятный следующий шаг. Это не официальный балл.', meta: '12–20 минут · без регистрации', href: '/?start=ielts', photo: PHOTOS.courseCardDiagnostic.src, alt: PHOTOS.courseCardDiagnostic.alt, tags: ['ielts', 'sat'], badge: 'Бесплатно' },
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
    photo: PHOTOS.courseHeroIelts.src,
    alt: PHOTOS.courseHeroIelts.alt,
    facts: [
      { label: 'Формат', value: 'Онлайн и в Астане' },
      ...provisionalFacts,
    ],
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
    modules: [
      {
        title: 'Введение',
        lessons: [
          {
            slug: 'how-ielts-works',
            title: 'Как устроен IELTS',
            summary: 'Секции, время, шкала баллов и чем Academic отличается от General Training.',
            free: {
              minutes: 10,
              intro: 'IELTS проверяет английский по четырём навыкам. Прежде чем готовиться, важно понять формат: от него зависит, как распределять время и на чём набирать баллы.',
              points: [
                'Четыре секции: Listening (около 30 минут, 40 вопросов), Reading (60 минут, 40 вопросов), Writing (60 минут, 2 задания) и Speaking (11–14 минут, 3 части).',
                'Academic сдают для поступления в вузы, General Training — для работы и переезда. Listening и Speaking в них одинаковые.',
                'Каждая секция оценивается по шкале от 0 до 9 с шагом 0.5, итоговый балл — среднее по четырём секциям.',
                'Speaking проходит отдельно, иногда в другой день.',
              ],
              practice: 'Выясните, какой вариант экзамена нужен вам — Academic или General Training, — и какой минимальный балл требует ваш вуз или программа. От этой цифры и строится план подготовки.',
            },
          },
        ],
      },
      {
        title: 'Reading',
        lessons: [
          {
            slug: 'reading-time',
            title: 'Reading: как не терять время',
            summary: 'Как уложить 3 текста и 40 вопросов в 60 минут.',
            free: {
              minutes: 12,
              intro: 'Главная трудность Reading — не сложность текстов, а время. Большинство теряет баллы на последних вопросах, до которых просто не доходит.',
              points: [
                'На 3 текста и 40 вопросов — 60 минут, отдельного времени на перенос ответов нет.',
                'Сначала прочитайте вопросы, затем ищите ответ по ключевым словам и их синонимам.',
                'True / False / Not Given: Not Given — когда текст не подтверждает и не опровергает утверждение.',
                'Держите темп около 20 минут на текст: трудный вопрос пропустите и вернитесь к нему в конце.',
              ],
              practice: 'Возьмите один текст Reading, засеките 20 минут и ответьте на все вопросы. Отметьте вопросы, на которых задержались дольше двух минут, — это ваш первый фокус.',
            },
          },
          { slug: 'true-false-not-given', title: 'Reading: True / False / Not Given', summary: 'Как отличать False от Not Given и не додумывать за автора.' },
        ],
      },
      {
        title: 'Listening',
        lessons: [
          { slug: 'listening-form-completion', title: 'Listening: Form completion и ловушки в цифрах', summary: 'Имена, даты и числа, которые диктуют с поправками.' },
        ],
      },
      {
        title: 'Writing',
        lessons: [
          { slug: 'writing-task-1', title: 'Writing Task 1: графики и процессы', summary: 'Обзор, группировка данных и сравнения без пересказа цифр.' },
          { slug: 'writing-task-2', title: 'Writing Task 2: эссе на 7+', summary: 'Структура, аргументация и связность под критерии оценки.' },
        ],
      },
      {
        title: 'Speaking',
        lessons: [
          { slug: 'speaking-part-2', title: 'Speaking Part 2: монолог за 2 минуты', summary: 'Как за минуту подготовки собрать план ответа по карточке.' },
        ],
      },
      {
        title: 'Пробный тест',
        lessons: [
          { slug: 'mock-test', title: 'Пробный тест с разбором', summary: 'Полный формат экзамена на время и разбор ошибок с тренером.' },
        ],
      },
    ],
    diagnosticHref: '/?start=ielts',
    diagnosticAriaLabel: 'Начать диагностику IELTS',
  },
  sat: {
    slug: 'sat',
    exam: 'SAT',
    title: 'Подготовка к SAT',
    lead: 'Reading & Writing и Math: навыки, стратегия времени и регулярная практика с разбором.',
    photo: PHOTOS.courseHeroSat.src,
    alt: PHOTOS.courseHeroSat.alt,
    facts: [
      { label: 'Формат', value: 'Онлайн и в Астане' },
      ...provisionalFacts,
    ],
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
    modules: [
      {
        title: 'Введение',
        lessons: [
          {
            slug: 'how-digital-sat-works',
            title: 'Как устроен Digital SAT',
            summary: 'Модули, адаптивность, шкала 400–1600 и калькулятор Desmos.',
            free: {
              minutes: 10,
              intro: 'Digital SAT сдают на компьютере или планшете в приложении Bluebook. Экзамен адаптивный, и его устройство прямо влияет на стратегию.',
              points: [
                'Две секции: Reading and Writing (64 минуты, 54 вопроса) и Math (70 минут, 44 вопроса) — вместе около 2 часов 14 минут.',
                'Каждая секция состоит из двух модулей: сложность второго зависит от результата первого.',
                'Итоговый балл — от 400 до 1600, по 200–800 за каждую секцию.',
                'Встроенный калькулятор Desmos доступен во всей секции Math.',
              ],
              practice: 'Установите Bluebook и откройте бесплатный полный пробный тест от College Board: так вы увидите интерфейс, таймер и калькулятор ещё до экзамена.',
            },
          },
        ],
      },
      {
        title: 'Reading and Writing',
        lessons: [
          { slug: 'words-in-context', title: 'Reading and Writing: Words in Context', summary: 'Как выбрать точное слово по смыслу короткого текста.' },
          { slug: 'standard-english-conventions', title: 'Standard English Conventions', summary: 'Пунктуация, согласование и границы предложений.' },
        ],
      },
      {
        title: 'Math',
        lessons: [
          {
            slug: 'math-time',
            title: 'Math: как распределять время',
            summary: 'Темп, порядок решения и проверка ответов в Desmos.',
            free: {
              minutes: 12,
              intro: 'В секции Math два модуля по 35 минут. Время легко потерять на одной трудной задаче и не успеть решить три простых.',
              points: [
                'На модуль из 22 вопросов — 35 минут, то есть около полутора минут на вопрос.',
                'Сначала решайте то, в чём уверены, трудные вопросы отмечайте и возвращайтесь к ним.',
                'Графики и системы уравнений удобно проверять в Desmos.',
                'За неверный ответ баллы не снимают, поэтому не оставляйте вопросы без ответа.',
              ],
              practice: 'Решите 11 задач из пробного теста за 17 минут. Сколько осталось нерешёнными и на какой задаче вы потеряли больше всего времени?',
            },
          },
          { slug: 'linear-equations', title: 'Math: линейные уравнения и системы', summary: 'Базовая алгебра, на которой держится большая часть секции.' },
          { slug: 'problem-solving-data', title: 'Math: Problem-Solving and Data Analysis', summary: 'Проценты, пропорции, таблицы и графики.' },
        ],
      },
      {
        title: 'Пробный тест',
        lessons: [
          { slug: 'mock-test', title: 'Пробный тест с разбором', summary: 'Оба модуля на время и разбор ошибок с тренером.' },
        ],
      },
    ],
    diagnosticHref: '/?start=sat',
    diagnosticAriaLabel: 'Начать диагностику SAT',
  },
};

export const COURSE_SLUGS = Object.keys(COURSE_DETAILS) as CourseSlug[];

export function isCourseSlug(slug: string): slug is CourseSlug {
  return Object.prototype.hasOwnProperty.call(COURSE_DETAILS, slug);
}

export const courseLessons = (course: CourseDetail): CourseLesson[] => course.modules.flatMap((module) => module.lessons);

export const freeLessons = (course: CourseDetail): FreeLesson[] => courseLessons(course).filter((lesson): lesson is FreeLesson => Boolean(lesson.free));

/** 1 урок, 2 урока, 5 уроков, 21 урок. */
export function lessonsWord(count: number): string {
  const mod10 = count % 10;
  const mod100 = count % 100;
  if (mod10 === 1 && mod100 !== 11) return `${count} урок`;
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return `${count} урока`;
  return `${count} уроков`;
}
