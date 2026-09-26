import type { Metadata, Viewport } from 'next';
import './fonts.css';
import './globals.css';
import '../../design/tokens.css';
import { COLOR } from '@/lib/design-tokens';
import { SITE_DESCRIPTION, SITE_NAME, SITE_URL } from '@/lib/site';
import JsonLd from '@/components/JsonLd';
import { ORGANIZATION } from '@/lib/schema';

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  verification: {
    google: [
      'etn7ANJicuDcb9Skg6U127SssWEfIAheuKTozqrAmnI',
      'GEXhZPM9edu9qIcpBE4_T7Ont-TLH2qD8VnYFxdmwfU',
    ],
  },
  title: { default: 'ASHYQ — Быстрая диагностика IELTS / SAT', template: '%s' },
  description: SITE_DESCRIPTION,
  applicationName: 'ASHYQ Quick Diagnostic',
  keywords: ['IELTS', 'SAT', 'диагностика', 'Ashyq', 'Казахстан', 'подготовка'],
  openGraph: {
    title: 'ASHYQ Quick Diagnostic — какой балл вы получили бы сегодня?',
    description:
      '≈20 минут. Ваша текущая точка. Ваши сильные стороны. Следующий шаг.',
    type: 'website',
    locale: 'ru_RU',
    siteName: SITE_NAME,
  },
  twitter: { card: 'summary_large_image', title: 'ASHYQ — диагностика IELTS и SAT', description: SITE_DESCRIPTION },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  themeColor: COLOR.bg,
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
        {/* Шрифты первого экрана (заголовки и текст) грузятся вместе с CSS, а не после него: меньше поздних подмен (FONT-CLS-001) */}
        {['manrope-800-cyrillic', 'manrope-800-latin', 'inter-400-cyrillic', 'inter-400-latin'].map((font) => (
          <link key={font} rel="preload" href={`/fonts/${font}.woff2`} as="font" type="font/woff2" crossOrigin="" />
        ))}
      </head>
      <body className="min-h-dvh antialiased">
        <JsonLd data={ORGANIZATION} />
        {children}
      </body>
    </html>
  );
}
