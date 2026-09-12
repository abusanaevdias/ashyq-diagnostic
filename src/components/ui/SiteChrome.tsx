import Link from 'next/link';
import { BRAND } from '@/lib/config';
import { Wordmark } from './Brand';

const LINKS = [
  { href: '/program', label: 'Программа' },
  { href: '/community', label: 'Сообщество' },
  { href: '/season', label: 'Сезон' },
  { href: '/faq', label: 'FAQ' },
] as const;

export function SiteHeader({ action = true }: { action?: boolean }) {
  return (
    <header className="shell-wide flex items-center justify-between gap-4 py-5">
      <Link href="/" aria-label="ASHYQ — на главную" className="shrink-0">
        <Wordmark size="md" />
      </Link>
      <nav aria-label="Основные разделы" className="hidden items-center gap-5 md:flex">
        {LINKS.map((link) => (
          <Link key={link.href} className="label text-ink-soft transition-colors hover:text-red" href={link.href}>
            {link.label}
          </Link>
        ))}
      </nav>
      {action ? (
        <Link href="/?start=ielts" className="btn btn-primary btn-small shrink-0">
          Диагностика
        </Link>
      ) : null}
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="border-t border-line bg-paper">
      <div className="shell-wide grid gap-7 py-8 md:grid-cols-[1fr_auto] md:items-end">
        <div>
          <Wordmark size="md" />
          <p className="mt-3 max-w-xs text-[0.85rem] leading-snug text-ink-faint">
            {BRAND.line1}<br />{BRAND.line3}
          </p>
        </div>
        <div className="max-w-xl">
          <nav aria-label="Разделы сайта" className="flex flex-wrap gap-x-5 gap-y-3">
            {LINKS.map((link) => (
              <Link key={link.href} className="label link-underline text-ink-soft hover:text-ink" href={link.href}>
                {link.label}
              </Link>
            ))}
            <Link className="label link-underline text-ink-soft hover:text-ink" href="/privacy">Конфиденциальность</Link>
            <Link className="label link-underline text-ink-soft hover:text-ink" href="/terms">Условия</Link>
          </nav>
          <p className="mt-4 text-[0.75rem] leading-snug text-ink-faint">
            Диагностика ASHYQ даёт предварительную оценку и не является официальным экзаменом IELTS или SAT.
          </p>
        </div>
      </div>
    </footer>
  );
}
