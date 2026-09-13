import type { Metadata } from 'next';
import { Suspense } from 'react';
import LmsShell from '@/components/lms/LmsShell';
import { WriteEditor } from '@/components/lms/WriteViews';

export const metadata: Metadata = {
  title: 'Редактор поста — ASHYQ',
  robots: { index: false, follow: false },
};

export default function WriteEditorPage() {
  return (
    <LmsShell>
      <Suspense fallback={null}>
        <WriteEditor />
      </Suspense>
    </LmsShell>
  );
}
