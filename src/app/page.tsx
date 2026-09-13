import type { Metadata } from 'next';
import DiagnosticApp from '@/components/DiagnosticApp';

export const metadata: Metadata = {
  alternates: { canonical: '/' },
};

/**
 * Лендинг = вход в диагностику. Никакой длинной страницы перед тестом:
 * человек пришёл из WhatsApp и должен сразу попасть в выбор экзамена.
 */
export default function HomePage() {
  return <DiagnosticApp />;
}
