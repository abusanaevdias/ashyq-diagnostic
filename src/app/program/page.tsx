import ProgramScreen from '@/components/ProgramScreen';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Программа ASHYQ',
  description: 'Система прогресса ASHYQ: Match Days, рейтинг команд и чемпионат сезона.',
  alternates: { canonical: '/program' },
};

/**
 * /program — витрина программы ASHYQ (progress tracking, Match Day,
 * leaderboard, чемпионат). Контент = обещания ученикам из brand-постеров.
 */
export default function ProgramPage() {
  return <ProgramScreen />;
}
