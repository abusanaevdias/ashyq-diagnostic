import type { Metadata } from 'next';
import LmsShell from '@/components/lms/LmsShell';
import StaffRolesView from '@/components/lms/StaffRolesView';

export const metadata: Metadata = {
  title: 'Роли пользователей — ASHYQ',
  robots: { index: false, follow: false },
};

export default function StaffRolesPage() {
  return (
    <LmsShell>
      <StaffRolesView />
    </LmsShell>
  );
}
