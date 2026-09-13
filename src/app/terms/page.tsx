import type { Metadata } from 'next';
import Link from 'next/link';
import { SiteFooter, SiteHeader } from '@/components/ui/SiteChrome';

export const metadata: Metadata = {
  title: 'Условия использования — ASHYQ',
  alternates: { canonical: '/terms' },
};

export default function TermsPage() {
  return (
    <div className="v3 min-h-dvh">
      <SiteHeader />
      <main className="shell py-10 sm:py-14">
        <p className="label text-red">Документы · версия 13.09.2026</p>
        <h1 className="display mt-4 text-h1">Условия использования</h1>
        <div className="mt-8 space-y-7 text-[0.98rem] leading-relaxed text-ink-soft">
          <section><h2 className="display text-h3 text-ink">Диагностика</h2><p className="mt-2">Результат является предварительной оценкой по короткому набору заданий. Он не равен официальному результату IELTS или SAT и не гарантирует балл на экзамене.</p></section>
          <section><h2 className="display text-h3 text-ink">Материалы</h2><p className="mt-2">Задания, дизайн и материалы сайта предназначены для личного ознакомления. Нельзя выдавать их за официальный продукт экзаменационных организаций.</p></section>
          <section><h2 className="display text-h3 text-ink">Условия сезона</h2><p className="mt-2">Актуальные даты, расписание, стоимость и правила участия подтверждаются командой отдельно до оплаты или зачисления. Информация на странице сезона не является публичной офертой.</p></section>
          <section><h2 className="display text-h3 text-ink">Данные</h2><p className="mt-2">Порядок работы с заявками описан в <Link className="link-underline text-ink" href="/privacy">политике конфиденциальности</Link>.</p></section>
          <p className="border-l-2 border-red pl-4 text-[0.88rem]">До публичного запуска документ необходимо дополнить реквизитами юридического лица или ИП, принимающего оплату и оказывающего услуги.</p>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
