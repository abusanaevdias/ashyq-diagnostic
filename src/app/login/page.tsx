import type { Metadata } from 'next';
import { Suspense } from 'react';
import LmsShell from '@/components/lms/LmsShell';
import LoginView from '@/components/lms/LoginView';

export const metadata: Metadata = {
  title: 'Вход — ASHYQ',
  robots: { index: false, follow: false },
};

export default function LoginPage() {
  return (
    <LmsShell>
      {/* useSearchParams (?next=) — клиентская часть под Suspense */}
      <Suspense fallback={null}>
        <LoginView />
      </Suspense>
    </LmsShell>
  );
}
