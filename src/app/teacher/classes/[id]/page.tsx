import type { Metadata } from 'next';
import { Suspense } from 'react';
import LmsShell from '@/components/lms/LmsShell';
import { TeacherClass } from '@/components/lms/TeacherViews';

export const metadata: Metadata = {
  title: 'Класс — учителю — ASHYQ',
  robots: { index: false, follow: false },
};

export default function TeacherClassPage() {
  return (
    <LmsShell>
      <Suspense fallback={null}>
        <TeacherClass />
      </Suspense>
    </LmsShell>
  );
}
