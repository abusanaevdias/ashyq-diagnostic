'use client';

import styles from './Reveal.module.css';

/**
 * Explicit public-section motion hook. SiteMotion owns viewport animation;
 * SSR, slow hydration, reduced motion and unavailable JS always keep content visible.
 */
export function Reveal({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div data-motion-reveal className={className ? `${styles.reveal} ${className}` : styles.reveal}>
      {children}
    </div>
  );
}
