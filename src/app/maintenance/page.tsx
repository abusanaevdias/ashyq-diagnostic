import type { Metadata } from 'next';
import { SiteFooter, SiteHeader } from '@/components/ui/SiteChrome';
import { ButtonLink, MicroLabel } from '@/components/ui/CleanUi';
import { TELEGRAM_CONTACT } from '@/lib/site';
import { WHATSAPP_NUMBER } from '@/lib/config';

export const metadata: Metadata = {
  title: 'Технические работы — ASHYQ',
  description: 'Сайт ASHYQ временно недоступен: идут технические работы. Напишите нам в WhatsApp или Telegram.',
  robots: { index: false, follow: false },
};

/**
 * Статическая заглушка для режима обслуживания. Хостинг/балансер может
 * переключать трафик на этот маршрут или копировать её в CDN при деплое.
 * Контактные данные — только подтверждённые из CONTACTS-DATA-001.
 */
export default function MaintenancePage() {
  return (
    <div className="v3 min-h-dvh">
      <SiteHeader />
      <main className="shell-wide flex min-h-[60vh] flex-col justify-center py-16 sm:py-24">
        <MicroLabel>Скоро вернёмся</MicroLabel>
        <h1 className="display mt-5 max-w-[14ch] text-display text-red">Идут технические работы</h1>
        <p className="mt-5 max-w-xl text-[1.05rem] leading-relaxed text-ink-soft">
          Сайт временно недоступен. Напишите нам в WhatsApp или Telegram —
          ответим, как только сможем.
        </p>
        <div className="mt-8 flex flex-wrap items-center gap-4">
          <ButtonLink
            href={`https://wa.me/${WHATSAPP_NUMBER}`}
            ariaLabel="Написать в WhatsApp ASHYQ"
          >
            WhatsApp
          </ButtonLink>
          <ButtonLink
            href={`https://t.me/${TELEGRAM_CONTACT}`}
            tone="outline"
            ariaLabel="Написать в Telegram ASHYQ"
          >
            Telegram
          </ButtonLink>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
