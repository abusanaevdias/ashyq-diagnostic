import type { Metadata } from 'next';
import { Suspense } from 'react';
import LmsShell from '@/components/lms/LmsShell';
import SubmissionReview from '@/components/lms/SubmissionReview';

export const metadata: Metadata = {
  title: 'Проверка работы — ASHYQ',
  robots: { index: false, follow: false },
};

export default function SubmissionPage() {
  return (
    <LmsShell>
      <Suspense fallback={null}>
        <SubmissionReview />
      </Suspense>
    </LmsShell>
  );
}
