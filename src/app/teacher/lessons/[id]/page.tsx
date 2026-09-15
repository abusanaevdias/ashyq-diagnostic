import type { Metadata } from 'next';
import { Suspense } from 'react';
import LmsShell from '@/components/lms/LmsShell';
import { EditLesson } from '@/components/lms/TeacherForms';

export const metadata: Metadata = {
  title: 'Урок — учителю — ASHYQ',
  robots: { index: false, follow: false },
};

export default function EditLessonPage() {
  return (
    <LmsShell>
      <Suspense fallback={null}>
        <EditLesson />
      </Suspense>
    </LmsShell>
  );
}
