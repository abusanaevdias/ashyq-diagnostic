import type { Metadata } from 'next';
import { SiteFooter, SiteHeader } from '@/components/ui/SiteChrome';
import { ButtonLink, MicroLabel } from '@/components/ui/CleanUi';

export const metadata: Metadata = {
  title: 'Страница не найдена — ASHYQ',
  description:
    'Такой страницы на сайте ASHYQ нет. Вернитесь на главную или сразу начните диагностику IELTS или SAT.',
};

export default function NotFound() {
  return (
    <div className="v3 min-h-dvh">
      <SiteHeader />
      <main className="shell-wide flex min-h-[60vh] flex-col justify-center py-16 sm:py-24">
        <MicroLabel>Ошибка 404</MicroLabel>
        <h1 className="display mt-5 max-w-[9.4em] text-display text-red">Такой страницы нет</h1>
        <p className="mt-5 max-w-xl text-[1.05rem] leading-relaxed text-ink-soft">
          Возможно, ссылка устарела или в адресе опечатка. Начните с главной или
          сразу перейдите к диагностике IELTS и SAT.
        </p>
        <div className="mt-8 flex flex-wrap items-center gap-4">
          <ButtonLink href="/" ariaLabel="Вернуться на главную ASHYQ">На главную</ButtonLink>
          <ButtonLink href="/diagnostic" tone="outline" ariaLabel="Пройти диагностику IELTS или SAT">
            Пройти диагностику
          </ButtonLink>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
