import type { Metadata } from 'next';
import LmsShell from '@/components/lms/LmsShell';
import JevSyntheticPreview from '@/components/lms/JevSyntheticPreview';

export const metadata: Metadata = {
  title: 'Подсказка об ошибке — ASHYQ',
  robots: { index: false, follow: false },
};

export default function JevPreviewPage() {
  return (
    <LmsShell>
      <JevSyntheticPreview />
    </LmsShell>
  );
}
