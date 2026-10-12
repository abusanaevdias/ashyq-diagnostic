import Link from 'next/link';
import type { ReactNode } from 'react';

/** A new document applies Speaking's scoped microphone/media response headers. */
export default function TrainerPracticeLink({ href, children }: { href: string; children: ReactNode }) {
  return href === '/trainers/speaking-second-take' ? <a href={href}>{children}</a> : <Link href={href}>{children}</Link>;
}
