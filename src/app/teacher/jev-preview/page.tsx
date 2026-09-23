import type { Metadata } from 'next';
import LmsShell from '@/components/lms/LmsShell';
import JevErrorPreview from '@/components/lms/JevErrorPreview';

export const metadata: Metadata = {
  title: 'Подсказка об ошибке — ASHYQ',
  robots: { index: false, follow: false },
};

export default function JevPreviewPage() {
  return (
    <LmsShell>
      <JevErrorPreview />
    </LmsShell>
  );
}
