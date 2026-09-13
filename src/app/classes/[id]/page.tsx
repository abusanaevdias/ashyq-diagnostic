import type { Metadata } from 'next';
import { Suspense } from 'react';
import ClassView from '@/components/lms/ClassView';
import LmsShell from '@/components/lms/LmsShell';

export const metadata: Metadata = {
  title: 'Класс — ASHYQ',
  robots: { index: false, follow: false },
};

export default function ClassPage() {
  return (
    <LmsShell>
      {/* id — runtime-параметр (useParams), по доке Next 16 под Suspense */}
      <Suspense fallback={null}>
        <ClassView />
      </Suspense>
    </LmsShell>
  );
}
