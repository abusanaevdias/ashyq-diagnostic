import type { Metadata } from 'next';
import ClassesView from '@/components/lms/ClassesView';
import LmsShell from '@/components/lms/LmsShell';

export const metadata: Metadata = {
  title: 'Мои классы — ASHYQ',
  robots: { index: false, follow: false },
};

export default function ClassesPage() {
  return (
    <LmsShell>
      <ClassesView />
    </LmsShell>
  );
}
