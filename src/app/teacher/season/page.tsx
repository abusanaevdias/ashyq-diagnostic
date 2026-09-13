import type { Metadata } from 'next';
import LmsShell from '@/components/lms/LmsShell';
import SeasonOrganizer from '@/components/season/SeasonOrganizer';

export const metadata: Metadata = {
  title: 'Чемпионат — организатору — ASHYQ',
  robots: { index: false, follow: false },
};

export default function TeacherSeasonPage() {
  return (
    <LmsShell>
      <SeasonOrganizer />
    </LmsShell>
  );
}
