import type { Metadata } from 'next';
import LmsShell from '@/components/lms/LmsShell';
import JevClassPreview from '@/components/lms/JevClassPreview';

export const metadata: Metadata = {
  title: 'Тренировка Jev для учителя — ASHYQ',
  robots: { index: false, follow: false },
};

export default function TeacherClassJevPreviewPage() {
  return (
    <LmsShell>
      <JevClassPreview />
    </LmsShell>
  );
}
