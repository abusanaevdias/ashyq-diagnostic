import type { Metadata } from 'next';
import { SiteFooter, SiteHeader } from '@/components/ui/SiteChrome';
import { MicroLabel } from '@/components/ui/CleanUi';

export const metadata: Metadata = {
  title: 'ASHYQ developer documentation — IELTS/SAT diagnostic on Vercel',
  description: 'ASHYQ developer and agent resources: Markdown content negotiation, IELTS/SAT diagnostic entry points, authentication boundaries and consent.',
  alternates: { canonical: '/docs', types: { 'text/markdown': '/docs/index.md' } },
};

export default function DocsPage() {
  return <div className="v3 min-h-dvh">
    <SiteHeader />
    <main className="shell-wide py-16 sm:py-24">
      <MicroLabel>Документация ASHYQ</MicroLabel>
      <h1 className="display mt-5 break-words text-h2 sm:text-display">ASHYQ developer documentation</h1>
      <p className="mt-5 max-w-xl text-lg text-ink-soft">IELTS и Digital SAT: ресурсы для разработчиков и агентов на сайте ASHYQ, размещённом на Vercel.</p>
      <ul className="mt-8 space-y-4 text-lg">
        <li><a href="/docs/index.md" className="underline">HTTP interface, content negotiation and authentication</a></li>
        <li><a href="/docs/agent-instructions.md" className="underline">When to use ASHYQ — agent instructions</a></li>
        <li><a href="/llms.txt" className="underline">llms.txt — resource index</a></li>
        <li><a href="/index.md" className="underline">ASHYQ IELTS/SAT — Markdown overview</a></li>
      </ul>
      <p className="mt-8 max-w-xl text-lg text-ink-soft">Публичного API оценки, SDK или MCP-сервера нет. Диагностику проходит сам ученик в браузере. Отправка контактов требует его явного согласия.</p>
    </main>
    <SiteFooter />
  </div>;
}
