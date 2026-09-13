import type { Metadata } from 'next';
import { Suspense } from 'react';
import LmsShell from '@/components/lms/LmsShell';
import { NewAssignment } from '@/components/lms/TeacherForms';

export const metadata: Metadata = {
  title: 'Новое задание — ASHYQ',
  robots: { index: false, follow: false },
};

export default function NewAssignmentPage() {
  return (
    <LmsShell>
      <Suspense fallback={null}>
        <NewAssignment />
      </Suspense>
    </LmsShell>
  );
}
