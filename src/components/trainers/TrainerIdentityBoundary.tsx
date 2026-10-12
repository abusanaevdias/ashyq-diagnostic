'use client';
import { Fragment, type ReactNode } from 'react';
import { useSession } from '@/lib/lms/hooks';

/** Unmount drafts, recorder and all transient state when identity changes. */
export default function TrainerIdentityBoundary({ children }: { children: ReactNode }) {
  const { session, ready } = useSession();
  if (!ready) return <main className="container" aria-busy="true"><p role="status">Открываем тренажёр…</p></main>;
  return <Fragment key={session?.user.id ?? 'guest'}>{children}</Fragment>;
}
