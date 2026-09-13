import type { Metadata } from 'next';
import { SiteFooter, SiteHeader } from '@/components/ui/SiteChrome';
import { MicroLabel } from '@/components/ui/CleanUi';
import SearchV3, { type SearchEntry } from '@/components/SearchV3';
import { COURSES } from '@/data/courses';
import { BLOG_IS_DEMO, BLOG_POSTS } from '@/data/blog';
import { FAQ } from '@/data/faq';

export const metadata: Metadata = {
  title: 'Поиск по сайту — ASHYQ',
  description: 'Поиск по страницам, курсам, вопросам FAQ и материалам блога ASHYQ.',
  robots: { index: false, follow: true },
};

/** Служебная страница: служебные страницы поиска принято закрывать от индексации. */

const PAGES: Array<{ title: string; text: string; href: string }> = [
  { title: 'Главная', text: 'Диагностика IELTS и SAT, направления клуба и статистика подготовки.', href: '/' },
  { title: 'Диагностика', text: 'Предварительная оценка IELTS или SAT: 12–20 минут, без регистрации, не официальный балл.', href: '/diagnostic' },
  { title: 'Курсы', text: 'Каталог подготовки: IELTS, SAT, сезон и Match Days, бесплатная диагностика.', href: '/courses' },
  { title: 'О нас', text: 'Миссия ASHYQ, подтверждённые метрики и ценности клуба.', href: '/about' },
  { title: 'Контакты', text: 'WhatsApp, Telegram, соцсети @ashyqedu и форма обращения.', href: '/contacts' },
  { title: 'Программа', text: 'Как устроена подготовка: диагностика, план, практика, Match Days.', href: '/program' },
  { title: 'Прогресс', text: 'История диагностик и рост навыков на вашем устройстве.', href: '/progress' },
  { title: 'Сообщество', text: 'Клуб ASHYQ: люди, события и поддержка.', href: '/community' },
  { title: 'Сезон', text: 'Активный сезон: рейтинг команд и участников, IELTS и SAT раздельно.', href: '/season' },
  { title: 'FAQ', text: 'Ответы о диагностике, сезонах, прогрессе, формате и заявках.', href: '/faq' },
  { title: 'Блог', text: 'Разборы и материалы для подготовки. Пока — демо-темы.', href: '/blog' },
  { title: 'Конфиденциальность', text: 'Как ASHYQ обращается с данными: согласие, телефон, localStorage.', href: '/privacy' },
  { title: 'Условия использования', text: 'Правила пользования сайтом и диагностикой.', href: '/terms' },
];

function buildEntries(): SearchEntry[] {
  return [
    ...PAGES.map((page) => ({ section: 'Страницы' as const, ...page })),
    ...COURSES.map((course) => ({
      section: 'Курсы' as const,
      title: course.title,
      text: `${course.text} ${course.meta}`,
      href: course.href,
    })),
    ...FAQ.map(([question, answer]) => ({
      section: 'FAQ' as const,
      title: question,
      text: answer,
      href: '/faq',
    })),
    ...BLOG_POSTS.map((post) => ({
      section: 'Статьи' as const,
      title: post.title,
      text: post.excerpt,
      href: '/blog',
      demo: BLOG_IS_DEMO,
    })),
  ];
}

export default function SearchPage() {
  return (
    <div className="v3 min-h-dvh">
      <SiteHeader />
      <main className="shell-wide py-10 sm:py-14">
        <MicroLabel>Поиск</MicroLabel>
        <h1 className="display mt-5 max-w-[16ch] text-display text-red">Найти на сайте ASHYQ</h1>
        <SearchV3 entries={buildEntries()} />
      </main>
      <SiteFooter />
    </div>
  );
}
