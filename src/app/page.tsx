import type { Metadata } from 'next';
import DiagnosticApp from '@/components/DiagnosticApp';
import JsonLd from '@/components/JsonLd';
import { WEBSITE_SCHEMA } from '@/lib/schema';
import { SITE_NAME } from '@/lib/site';

const title = 'ASHYQ — образовательный клуб IELTS и SAT в Казахстане';
const description = 'ASHYQ — онлайн-подготовка к IELTS и SAT в Казахстане. Бесплатная диагностика, библиотека и практика без регистрации; курсы и менторство с преподавателем.';

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: '/' },
  openGraph: { title, description, url: '/', siteName: SITE_NAME, type: 'website', locale: 'ru_RU' },
  twitter: { card: 'summary_large_image', title, description },
};

/**
 * Public brand home: WebSite identity is rendered on the canonical root only.
 * Diagnostic state and the direct ?start=ielts|sat flow remain unchanged.
 */
export default function HomePage() {
  return <><JsonLd data={WEBSITE_SCHEMA} /><DiagnosticApp /></>;
}
