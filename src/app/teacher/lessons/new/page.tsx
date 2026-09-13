import type { Metadata } from 'next';
import { Suspense } from 'react';
import LmsShell from '@/components/lms/LmsShell';
import { NewLesson } from '@/components/lms/TeacherForms';

export const metadata: Metadata = {
  title: 'Новый урок — ASHYQ',
  robots: { index: false, follow: false },
};

export default function NewLessonPage() {
  return (
    <LmsShell>
      {/* ?class= читается через useSearchParams — по доке Next 16 под Suspense */}
      <Suspense fallback={null}>
        <NewLesson />
      </Suspense>
    </LmsShell>
  );
}
