import type { Metadata } from 'next';
import DiagnosticApp from '@/components/DiagnosticApp';

export const metadata: Metadata = {
  title: 'Диагностика IELTS и SAT',
  description: 'Бесплатная предварительная оценка IELTS или SAT за 20 минут: диапазон балла, навыки и следующий шаг.',
};

/**
 * /diagnostic — отдельная точка входа для WhatsApp-рассылок с UTM:
 * /diagnostic?utm_source=whatsapp&utm_campaign=cold01&utm_content=hook_a
 */
export default function DiagnosticPage() {
  return <DiagnosticApp intro="diagnostic" />;
}
