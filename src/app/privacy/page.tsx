import type { Metadata } from 'next';
import Link from 'next/link';
import { SiteFooter, SiteHeader } from '@/components/ui/SiteChrome';

export const metadata: Metadata = {
  title: 'Политика конфиденциальности — ASHYQ',
  alternates: { canonical: '/privacy' },
};

export default function PrivacyPage() {
  return (
    <div className="v3 min-h-dvh">
      <SiteHeader />
      <main className="shell py-10 sm:py-14">
        <p className="label text-red">Документы · версия 13.09.2026</p>
        <h1 className="display mt-4 text-h1">Политика конфиденциальности</h1>
        <div className="mt-8 space-y-7 text-[0.98rem] leading-relaxed text-ink-soft">
          <section><h2 className="display text-h3 text-ink">1. Какие данные собираются</h2><p className="mt-2">Диагностика работает без регистрации. Результаты и прогресс сохраняются локально в браузере. Сервер получает технические данные о прохождении; имя, телефон и класс передаются только при добровольной отправке заявки.</p></section>
          <section><h2 className="display text-h3 text-ink">2. Зачем нужны данные</h2><p className="mt-2">Чтобы ответить на заявку, провести разбор результата, сообщить подтверждённые условия набора и оценивать работу воронки диагностики. Данные не должны использоваться для несовместимых с этими целями задач.</p></section>
          <section><h2 className="display text-h3 text-ink">3. Согласие и отзыв</h2><p className="mt-2">Перед отправкой формы пользователь явно подтверждает согласие. Согласие можно отозвать, обратившись к ASHYQ через тот же WhatsApp‑канал, по которому велась коммуникация. Запрос должен позволять определить, какие данные относятся к заявителю.</p></section>
          <section><h2 className="display text-h3 text-ink">4. Хранение и передача</h2><p className="mt-2">Заявка может сохраняться в защищённом журнале и передаваться в настроенный ASHYQ канал уведомлений или CRM только для обработки обращения. Срок хранения не должен превышать необходимый для заявленной цели, если закон не требует иного.</p></section>
          <section><h2 className="display text-h3 text-ink">5. Ваши действия</h2><p className="mt-2">Вы можете не отправлять форму, удалить локальную историю через очистку данных сайта и запросить уточнение, исправление либо удаление контактных данных через ASHYQ.</p></section>
          <p className="border-l-2 border-red pl-4 text-[0.88rem]">Эта страница описывает фактическое поведение сайта и не заменяет юридическую консультацию. Перед публичным запуском ASHYQ необходимо дополнить её официальным наименованием оператора и контактами для обращений.</p>
          <p>Основа: <a className="link-underline text-ink" href="https://adilet.zan.kz/rus/docs/Z1300000094" target="_blank" rel="noopener noreferrer">Закон Республики Казахстан «О персональных данных и их защите»</a>.</p>
          <p><Link className="link-underline text-ink" href="/terms">Условия использования</Link></p>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
