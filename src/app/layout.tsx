import type { Metadata, Viewport } from 'next';
import '@fontsource/manrope/cyrillic-700.css';
import '@fontsource/manrope/cyrillic-800.css';
import '@fontsource/manrope/latin-700.css';
import '@fontsource/manrope/latin-800.css';
import './fonts.css';
import './globals.css';
import '../../design/tokens.css';
import { SITE_DESCRIPTION, SITE_NAME, SITE_URL } from '@/lib/site';

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: 'ASHYQ — Быстрая диагностика IELTS / SAT', template: '%s' },
  description: SITE_DESCRIPTION,
  applicationName: 'ASHYQ Quick Diagnostic',
  keywords: ['IELTS', 'SAT', 'диагностика', 'Ashyq', 'Казахстан', 'подготовка'],
  openGraph: {
    title: 'ASHYQ Quick Diagnostic — какой балл ты получил бы сегодня?',
    description:
      '≈20 минут. Твоя текущая точка. Твои сильные стороны. Следующий шаг.',
    type: 'website',
    locale: 'ru_RU',
    siteName: SITE_NAME,
  },
  twitter: { card: 'summary_large_image', title: 'ASHYQ — диагностика IELTS и SAT', description: SITE_DESCRIPTION },
  alternates: { canonical: '/' },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  themeColor: '#F8F7F3',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ru" data-scroll-behavior="smooth">
      <head>
        <link rel="icon" type="image/png" href="/brand/logo-icon-96.png" />
        <link rel="apple-touch-icon" href="/brand/logo-icon-192.png" />
      </head>
      <body className="min-h-dvh antialiased">{children}</body>
    </html>
  );
}
