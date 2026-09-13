import type { Metadata } from 'next';
import LmsShell from '@/components/lms/LmsShell';
import { TeacherHome } from '@/components/lms/TeacherViews';

export const metadata: Metadata = {
  title: 'Учителю — ASHYQ',
  robots: { index: false, follow: false },
};

export default function TeacherPage() {
  return (
    <LmsShell>
      <TeacherHome />
    </LmsShell>
  );
}
