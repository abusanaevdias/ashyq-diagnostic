import type { Metadata } from 'next';
import LmsShell from '@/components/lms/LmsShell';
import { WriteHome } from '@/components/lms/WriteViews';

export const metadata: Metadata = {
  title: 'Редактору — ASHYQ',
  robots: { index: false, follow: false },
};

export default function WritePage() {
  return (
    <LmsShell>
      <WriteHome />
    </LmsShell>
  );
}
