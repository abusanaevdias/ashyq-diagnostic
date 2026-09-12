import ProgressScreen from '@/components/ProgressScreen';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Мой прогресс — ASHYQ',
  description: 'Локальная история диагностик IELTS и SAT и динамика точки А.',
};

/**
 * /progress — личный прогресс: история диагностик, динамика точки А,
 * skill scores «было → стало». Всё локально, без PII и бэкенда.
 */
export default function ProgressPage() {
  return <ProgressScreen />;
}
