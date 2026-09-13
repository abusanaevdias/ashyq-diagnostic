import type { Metadata } from 'next';
import LmsShell from '@/components/lms/LmsShell';
import MeView from '@/components/lms/MeView';

export const metadata: Metadata = {
  title: 'Кабинет — ASHYQ',
  robots: { index: false, follow: false },
};

export default function MePage() {
  return (
    <LmsShell>
      <MeView />
    </LmsShell>
  );
}
