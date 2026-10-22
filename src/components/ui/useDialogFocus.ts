'use client';

import { useEffect, useRef } from 'react';

/** Keep keyboard focus in the open sheet and restore its actual invoking control. */
export default function useDialogFocus(open: boolean, onClose: () => void) {
  const panel = useRef<HTMLDivElement>(null);
  const close = useRef(onClose);
  useEffect(() => { close.current = onClose; }, [onClose]);
  useEffect(() => {
    if (!open || !panel.current) return;
    const container = panel.current;
    const previous = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const previousOverflow = document.body.style.overflow;
    const targets = () => Array.from(container.querySelectorAll<HTMLElement>('a[href],button,input,select,textarea,[tabindex]'))
      .filter(element => !element.matches(':disabled,[tabindex="-1"]') && element.getClientRects().length > 0);
    (targets()[0] ?? container).focus();
    document.body.style.overflow = 'hidden';
    const keydown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') { event.preventDefault(); close.current(); return; }
      if (event.key !== 'Tab') return;
      const focusable = targets();
      const first = focusable[0], last = focusable[focusable.length - 1];
      if (!first) { event.preventDefault(); container.focus(); return; }
      if (!container.contains(document.activeElement)) { event.preventDefault(); (event.shiftKey ? last : first).focus(); }
      else if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    };
    document.addEventListener('keydown', keydown);
    return () => {
      document.removeEventListener('keydown', keydown);
      document.body.style.overflow = previousOverflow;
      if (previous?.isConnected) previous.focus({ preventScroll: true });
    };
  }, [open]);
  return panel;
}
