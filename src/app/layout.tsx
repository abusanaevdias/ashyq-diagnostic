import type { Metadata, Viewport } from 'next';
import './fonts.css';
import './globals.css';
import '../../design/tokens.css';
import { COLOR } from '@/lib/design-tokens';
import { SITE_DESCRIPTION, SITE_NAME, SITE_URL } from '@/lib/site';
import JsonLd from '@/components/JsonLd';
import { ORGANIZATION } from '@/lib/schema';
import PublicAnalytics from '@/components/analytics/PublicAnalytics';

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  verification: {
    google: [
      'etn7ANJicuDcb9Skg6U127SssWEfIAheuKTozqrAmnI',
      'GEXhZPM9edu9qIcpBE4_T7Ont-TLH2qD8VnYFxdmwfU',
    ],
  },
  title: { default: 'ASHYQ — образовательный клуб IELTS и SAT в Казахстане', template: '%s' },
  description: SITE_DESCRIPTION,
  applicationName: 'ASHYQ Quick Diagnostic',
  keywords: ['IELTS', 'SAT', 'диагностика', 'Ashyq', 'Казахстан', 'подготовка'],
  openGraph: {
    title: 'ASHYQ — онлайн-подготовка к IELTS и Digital SAT',
    description: SITE_DESCRIPTION,
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
        <PublicAnalytics />
      </body>
    </html>
  );
}
