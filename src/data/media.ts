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
  homeHero: { src: '/brand/photos/f-01.jpg', width: 1374, height: 1145, alt: 'Студенты ASHYQ на совместном онлайн-занятии' },
  /** F-02 /courses, коллаж — большое · 3:2 */
  coursesCollageMain: { src: '/brand/photos/f-02.jpg', width: 1536, height: 1024, alt: 'Студенты ASHYQ на занятии' },
  /** F-03 /courses, коллаж — малое · 3:2 */
  coursesCollageSide: { src: '/brand/photos/f-03.jpg', width: 1536, height: 1024, alt: 'Онлайн-занятие ASHYQ' },
  /** F-04 карточка IELTS · 16:10 */
  courseCardIelts: { src: '/brand/photos/f-04.jpg', width: 1586, height: 992, alt: 'Онлайн-занятие ASHYQ по IELTS' },
  /** F-05 карточка SAT · 16:10 */
  courseCardSat: { src: '/brand/photos/f-05.jpg', width: 1586, height: 992, alt: 'Студенты ASHYQ готовятся к SAT' },
  /** F-06 карточка «Сезон и Match Days» · 16:10 */
  courseCardSeason: { src: '/brand/photos/f-06.jpg', width: 1586, height: 992, alt: 'Команда ASHYQ на Match Day' },
  /** F-07 карточка Quick Diagnostic · 16:10 */
  courseCardDiagnostic: { src: '/brand/photos/f-07.jpg', width: 1586, height: 992, alt: 'Ученик проходит диагностику ASHYQ' },
  /** F-08 /courses/ielts, первый экран · 1:1 */
  courseHeroIelts: { src: '/brand/photos/f-08.jpg', width: 1584, height: 993, alt: 'Онлайн-занятие ASHYQ по IELTS' },
  /** F-09 /courses/sat, первый экран · 1:1 */
  courseHeroSat: { src: '/brand/photos/f-09.jpg', width: 1254, height: 1254, alt: 'Студенты ASHYQ готовятся к SAT' },
  /** F-10 /diagnostic, «Что вы получите?» · 16:10 */
  diagnostic: { src: '/brand/photos/f-10.jpg', width: 1586, height: 992, alt: 'Онлайн-занятие ASHYQ' },
  /** F-11 /about, первый экран · 1:1 */
  aboutHero: { src: '/brand/photos/f-11.jpg', width: 1254, height: 1254, alt: 'Студенты ASHYQ занимаются вместе' },
  /** F-12 /about, рядом с цитатой · 2:3 (на телефоне режется в горизонталь) */
  aboutQuote: { src: '/brand/photos/f-12.jpg', width: 1254, height: 1254, alt: 'Онлайн-занятие сообщества ASHYQ' },
  /** F-13 /community, первый экран · 3:2, показывается целиком */
  communityMain: { src: '/brand/photos/f-13.jpg', width: 1536, height: 1024, alt: 'Студенты ASHYQ' },
  /** F-14 /community, широкий кадр · 2:1, показывается целиком */
  communityWide: { src: '/brand/photos/f-14.jpg', width: 1774, height: 887, alt: 'Онлайн-занятие ASHYQ' },
  /** F-15 /contacts · 3:2 */
  contacts: { src: '/brand/photos/f-15.jpg', width: 1536, height: 1024, alt: 'Онлайн-занятие ASHYQ' },
  /** F-16 /blog, первый экран · 4:3 */
  blogHero: { src: '/brand/photos/f-16.jpg', width: 1448, height: 1086, alt: 'Студенты ASHYQ на занятии' },
} satisfies Record<string, Photo>;
