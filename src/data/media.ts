/**
 * Все фото сайта по слотам (PHOTO-SLOTS-001). Новое фото: положить файл в
 * public/brand/photos/ и заменить src, width и height у слота здесь — компоненты
 * трогать не нужно. Что снимать и в каких пропорциях — docs/PHOTO_BRIEF.md (коды F-xx).
 * Сейчас это ИИ-иллюстрации (PHOTO-AI-001): по Закону РК «Об ИИ» у них видимая пометка
 * <AiBadge /> в компонентах, метка IPTC trainedAlgorithmicMedia в XMP файла и alt «создано ИИ».
 * Заменили на настоящее фото — уберите <AiBadge /> у слота и «создано ИИ» из alt.
 */

export type Photo = { src: string; alt: string; width: number; height: number };

export const PHOTOS = {
  /** F-01 главная, первый экран · 6:5 */
  homeHero: { src: '/brand/photos/f-01.jpg', width: 1374, height: 1145, alt: 'Иллюстрация, создано ИИ: тренер помогает двум ученикам с заданием за столом у окна' },
  /** F-02 /courses, коллаж — большое · 3:2 */
  coursesCollageMain: { src: '/brand/photos/f-02.jpg', width: 1536, height: 1024, alt: 'Иллюстрация, создано ИИ: группа учеников слушает объяснение у доски' },
  /** F-03 /courses, коллаж — малое · 3:2 */
  coursesCollageSide: { src: '/brand/photos/f-03.jpg', width: 1536, height: 1024, alt: 'Иллюстрация, создано ИИ: руки над пробным тестом по математике и ноутбук с заданием' },
  /** F-04 карточка IELTS · 16:10 */
  courseCardIelts: { src: '/brand/photos/f-04.jpg', width: 1586, height: 992, alt: 'Иллюстрация, создано ИИ: ученик отвечает на Speaking, преподаватель слушает' },
  /** F-05 карточка SAT · 16:10 */
  courseCardSat: { src: '/brand/photos/f-05.jpg', width: 1586, height: 992, alt: 'Иллюстрация, создано ИИ: ученица решает задачу по геометрии, рядом ноутбук и калькулятор' },
  /** F-06 карточка «Сезон и Match Days» · 16:10 */
  courseCardSeason: { src: '/brand/photos/f-06.jpg', width: 1586, height: 992, alt: 'Иллюстрация, создано ИИ: команда учеников радуется результату на планшете' },
  /** F-07 карточка Quick Diagnostic · 16:10 */
  courseCardDiagnostic: { src: '/brand/photos/f-07.jpg', width: 1586, height: 992, alt: 'Иллюстрация, создано ИИ: ученик дома проходит диагностику на ноутбуке' },
  /** F-08 /courses/ielts, первый экран · 1:1 */
  courseHeroIelts: { src: '/brand/photos/f-08-online.jpg', width: 1254, height: 1254, alt: 'Иллюстрация, создано ИИ: ученица готовится к IELTS дома с преподавателем по видеосвязи' },
  /** F-09 /courses/sat, первый экран · 1:1 */
  courseHeroSat: { src: '/brand/photos/f-09-online.jpg', width: 1254, height: 1254, alt: 'Иллюстрация, создано ИИ: ученик готовится к Digital SAT дома с преподавателем по видеосвязи' },
  /** F-10 /diagnostic, «Что вы получите?» · 16:10 */
  diagnostic: { src: '/brand/photos/f-10.jpg', width: 1586, height: 992, alt: 'Иллюстрация, создано ИИ: ученик с мамой смотрят результат диагностики на ноутбуке' },
  /** F-11 /about, первый экран · 1:1 */
  aboutHero: { src: '/brand/photos/f-11.jpg', width: 1254, height: 1254, alt: 'Иллюстрация, создано ИИ: преподаватель разбирает задачу вместе с учеником' },
  /** F-12 /about, рядом с цитатой · 2:3 (на телефоне режется в горизонталь) */
  aboutQuote: { src: '/brand/photos/f-12.jpg', width: 1254, height: 1254, alt: 'Иллюстрация, создано ИИ: ученик за столом смотрит в окно на здания университета' },
  /** F-13 /community, первый экран · 3:2, показывается целиком */
  communityMain: { src: '/brand/photos/f-13.jpg', width: 1536, height: 1024, alt: 'Иллюстрация, создано ИИ: ученица выступает, группа её поддерживает' },
  /** F-14 /community, широкий кадр · 2:1, показывается целиком */
  communityWide: { src: '/brand/photos/f-14.jpg', width: 1774, height: 887, alt: 'Иллюстрация, создано ИИ: финал сезона: команда с кубком на сцене, зал аплодирует' },
  /** F-15 /contacts · 3:2 */
  contacts: { src: '/brand/photos/f-15.jpg', width: 1536, height: 1024, alt: 'Иллюстрация, создано ИИ: менеджер встречает ученика у стойки' },
  /** F-16 /blog, первый экран · 4:3 */
  blogHero: { src: '/brand/photos/f-16.jpg', width: 1448, height: 1086, alt: 'Иллюстрация, создано ИИ: ученик пишет конспект за столом' },
} satisfies Record<string, Photo>;
