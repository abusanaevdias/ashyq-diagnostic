import type { Metadata } from 'next';
import { Suspense } from 'react';
import LmsShell from '@/components/lms/LmsShell';
import { EditAssignment } from '@/components/lms/TeacherForms';

export const metadata: Metadata = {
  title: 'Задание — учителю — ASHYQ',
  robots: { index: false, follow: false },
};

export default function EditAssignmentPage() {
  return (
    <LmsShell>
      <Suspense fallback={null}>
        <EditAssignment />
      </Suspense>
    </LmsShell>
  );
}
