'use client';

import { useEffect, useRef } from 'react';
import styles from './Reveal.module.css';

/**
 * Появление секций при скролле. Контент видим по умолчанию: пустые зоны при
 * медленной гидрации/без JS недопустимы (SITE-AUDIT-001, P1). Анимируем только
 * то, что на момент гидрации ниже первого экрана — помечаем data-pending и
 * раскрываем по IntersectionObserver. prefers-reduced-motion не скрывает ничего.
 */
export function Reveal({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    // ниже первого экрана с учётом того же отступа, что у observer
    if (node.getBoundingClientRect().top <= window.innerHeight * 0.92) return;

    node.setAttribute('data-pending', '');
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        node.removeAttribute('data-pending');
        node.setAttribute('data-visible', 'true');
        observer.disconnect();
      }
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={ref} className={className ? `${styles.reveal} ${className}` : styles.reveal}>
      {children}
    </div>
  );
}
