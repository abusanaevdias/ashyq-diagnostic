import type { ReactNode } from 'react';

/** Native practice entries establish a document boundary for Back/unload guards and media policy. */
export default function TrainerPracticeLink({ href, children,className }: { href: string; children: ReactNode;className?:string }) {
  return <a href={href} className={className}>{children}</a>;
}
