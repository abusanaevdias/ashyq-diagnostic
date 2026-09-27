import type { Metadata } from 'next';
import LmsShell from '@/components/lms/LmsShell';
import OwnEssayTrainer from '@/components/writing/OwnEssayTrainer';

export const metadata: Metadata = {
  title: 'Моё эссе IELTS Writing Task 2 — ASHYQ',
  description: 'Личное пространство ученика ASHYQ для самостоятельной правки IELTS Academic Task 2.',
  robots: { index: false, follow: false },
};

export default function OwnEssayPage() {
  return <LmsShell><OwnEssayTrainer /></LmsShell>;
}
