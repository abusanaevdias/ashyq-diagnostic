import type { Metadata } from 'next';
import { Suspense } from 'react';
import AssignmentView from '@/components/lms/AssignmentView';
import LmsShell from '@/components/lms/LmsShell';

export const metadata: Metadata = {
  title: 'Задание — ASHYQ',
  robots: { index: false, follow: false },
};

export default function AssignmentPage() {
  return (
    <LmsShell>
      <Suspense fallback={null}>
        <AssignmentView />
      </Suspense>
    </LmsShell>
  );
}
