import type { Metadata } from 'next';
import Link from 'next/link';
import { EditorialLabel } from '@/components/ui/Brand';
import { SiteFooter, SiteHeader } from '@/components/ui/SiteChrome';
import { FAQ } from '@/data/faq';

export const metadata: Metadata = {
  title: 'Вопросы и ответы — ASHYQ',
  description: 'Ответы о диагностике IELTS и SAT, сезонах, прогрессе, формате и заявках ASHYQ.',
  alternates: { canonical: '/faq' },
};



export default function FaqPage() {
  return (
    <div className="v3 min-h-dvh">
      <SiteHeader />
      <main className="shell-wide py-8 sm:py-12">
        <EditorialLabel>FAQ</EditorialLabel>
        <h1 className="display mt-5 max-w-[8.8em] text-display text-red">Коротко и по делу</h1>
        <div className="mt-9 divide-y divide-line border-y border-line-strong">
          {FAQ.map(([question, answer]) => (
            <details key={question} className="group py-3">
              <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-5">
                <span className="display text-h3">{question}</span>
                <span aria-hidden="true" className="text-2xl leading-none text-red transition-transform group-open:rotate-45">+</span>
              </summary>
              <p className="mt-3 max-w-3xl pb-2 text-[0.98rem] leading-relaxed text-ink-soft">{answer}</p>
            </details>
          ))}
        </div>
        <div className="mt-9 flex flex-col gap-3 sm:flex-row">
          <Link href="/season" className="btn btn-primary">Узнать о сезоне</Link>
          <Link href="/?start=ielts" className="btn btn-outline">Пройти диагностику</Link>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
