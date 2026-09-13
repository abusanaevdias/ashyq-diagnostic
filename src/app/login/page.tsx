import type { Metadata } from 'next';
import LmsShell from '@/components/lms/LmsShell';
import LoginView from '@/components/lms/LoginView';

export const metadata: Metadata = {
  title: 'Вход — ASHYQ',
  robots: { index: false, follow: false },
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string | string[] }>;
}) {
  const params = await searchParams;
  const nextPath = typeof params.next === 'string' ? params.next : undefined;

  return (
    <LmsShell>
      <LoginView nextPath={nextPath} />
    </LmsShell>
  );
}
