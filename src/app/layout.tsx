import type { Metadata, Viewport } from 'next';
import './fonts.css';
import './globals.css';

export const metadata: Metadata = {
  title: 'ASHYQ — Быстрая диагностика IELTS / SAT',
  description:
    '≈20 минут, чтобы понять свою текущую точку, сильные стороны и что стоит подтянуть дальше. Предварительная оценка уровня IELTS и SAT от Ashyq.',
  applicationName: 'ASHYQ Quick Diagnostic',
  keywords: ['IELTS', 'SAT', 'диагностика', 'Ashyq', 'Казахстан', 'подготовка'],
  openGraph: {
    title: 'ASHYQ Quick Diagnostic — какой балл ты получил бы сегодня?',
    description:
      '≈20 минут. Твоя текущая точка. Твои сильные стороны. Следующий шаг.',
    type: 'website',
    locale: 'ru_RU',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  themeColor: '#F7F3EA',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ru">
      <head>
        <link rel="icon" type="image/png" href="/brand/logo-icon-96.png" />
        <link rel="apple-touch-icon" href="/brand/logo-icon-192.png" />
      </head>
      <body className="min-h-dvh antialiased">{children}</body>
    </html>
  );
}
