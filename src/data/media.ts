/**
 * Все фото сайта по слотам (PHOTO-SLOTS-001). Новое фото: положить файл в
 * public/brand/photos/ и заменить src, width и height у слота здесь — компоненты
 * трогать не нужно. Что снимать и в каких пропорциях — docs/PHOTO_BRIEF.md (коды F-xx).
 * ponytail: своих съёмок пока нет — все слоты указывают на два общих снимка.
 */

export type Photo = { src: string; alt: string; width: number; height: number };

const LESSON_GRID = { src: '/brand/lesson-grid.jpg', width: 1000, height: 390 };
const STUDENTS = { src: '/brand/hero-students.jpg', width: 900, height: 489 };

export const PHOTOS = {
  /** F-01 главная, первый экран · 6:5 */
  homeHero: { ...LESSON_GRID, alt: 'Студенты ASHYQ на совместном онлайн-занятии' },
  /** F-02 /courses, коллаж — большое · 3:2 */
  coursesCollageMain: { ...STUDENTS, alt: 'Студенты ASHYQ на занятии' },
  /** F-03 /courses, коллаж — малое · 3:2 */
  coursesCollageSide: { ...LESSON_GRID, alt: 'Онлайн-занятие ASHYQ' },
  /** F-04 карточка IELTS · 16:10 */
  courseCardIelts: { ...LESSON_GRID, alt: 'Онлайн-занятие ASHYQ по IELTS' },
  /** F-05 карточка SAT · 16:10 */
  courseCardSat: { ...STUDENTS, alt: 'Студенты ASHYQ готовятся к SAT' },
  /** F-06 карточка «Сезон и Match Days» · 16:10 */
  courseCardSeason: { ...STUDENTS, alt: 'Команда ASHYQ на Match Day' },
  /** F-07 карточка Quick Diagnostic · 16:10 */
  courseCardDiagnostic: { ...LESSON_GRID, alt: 'Ученик проходит диагностику ASHYQ' },
  /** F-08 /courses/ielts, первый экран · 1:1 */
  courseHeroIelts: { ...LESSON_GRID, alt: 'Онлайн-занятие ASHYQ по IELTS' },
  /** F-09 /courses/sat, первый экран · 1:1 */
  courseHeroSat: { ...STUDENTS, alt: 'Студенты ASHYQ готовятся к SAT' },
  /** F-10 /diagnostic, «Что вы получите?» · 16:10 */
  diagnostic: { ...LESSON_GRID, alt: 'Онлайн-занятие ASHYQ' },
  /** F-11 /about, первый экран · 1:1 */
  aboutHero: { ...STUDENTS, alt: 'Студенты ASHYQ занимаются вместе' },
  /** F-12 /about, рядом с цитатой · 2:3 (на телефоне режется в горизонталь) */
  aboutQuote: { ...LESSON_GRID, alt: 'Онлайн-занятие сообщества ASHYQ' },
  /** F-13 /community, первый экран · 3:2, показывается целиком */
  communityMain: { ...STUDENTS, alt: 'Студенты ASHYQ' },
  /** F-14 /community, широкий кадр · 2:1, показывается целиком */
  communityWide: { ...LESSON_GRID, alt: 'Онлайн-занятие ASHYQ' },
  /** F-15 /contacts · 3:2 */
  contacts: { ...LESSON_GRID, alt: 'Онлайн-занятие ASHYQ' },
  /** F-16 /blog, первый экран · 4:3 */
  blogHero: { ...STUDENTS, alt: 'Студенты ASHYQ на занятии' },
} satisfies Record<string, Photo>;
