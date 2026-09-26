import type { Metadata } from 'next';
import WritingCalibration from '@/components/writing/WritingCalibration';
import { Footer, NavBar } from '@/components/ui/CleanUi';

export const metadata: Metadata = {
  title: 'Проверка ориентиров IELTS Writing Task 2 — ASHYQ',
  description: 'Лист преподавателя для оценки двух вымышленных эссе IELTS Writing Task 2.',
  robots: { index: false, follow: false },
};

export default function WritingCalibrationPage() {
  return <>
    <NavBar />
    <WritingCalibration />
    <Footer />
  </>;
}
