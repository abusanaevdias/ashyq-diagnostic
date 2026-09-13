import type { Metadata } from 'next';
import CrmDashboard from '@/components/CrmDashboard';

export const metadata: Metadata = {
  title: 'ASHYQ CRM',
  robots: { index: false, follow: false, nocache: true },
};

export default function CrmPage() {
  return <CrmDashboard />;
}
