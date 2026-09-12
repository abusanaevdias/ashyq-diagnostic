'use client';

import { useEffect, useRef } from 'react';

export function Meter({
  value,
  ink = false,
  className = '',
}: {
  /** 0..1 */
  value: number;
  ink?: boolean;
  className?: string;
}) {
  const pct = Math.max(0, Math.min(1, value)) * 100;
  return (
    <div
      className={`meter ${className}`}
      role="progressbar"
      aria-valuenow={Math.round(pct)}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <span
        className={`meter-fill ${ink ? 'meter-fill-ink' : ''}`}
        style={{ width: `${pct}%`, transition: 'width 320ms cubic-bezier(0.2,0.7,0.2,1)' }}
      />
    </div>
  );
}

export function Kicker({
  children,
  className = '',
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <p className={`label text-ink-faint ${className}`}>{children}</p>
  );
}

/**
 * Доступный диалог подтверждения.
 * Используется перед Finish и Reset — тест нельзя закончить случайно.
 */
export function ConfirmDialog({
  open,
  title,
  body,
  confirmLabel,
  cancelLabel = 'Отмена',
  onConfirm,
  onCancel,
  danger = false,
}: {
  open: boolean;
  title: string;
  body?: string;
  confirmLabel: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
  danger?: boolean;
}) {
  const confirmRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    confirmRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onCancel();
      }
    };
    document.addEventListener('keydown', onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [open, onCancel]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-ink/60 p-0 sm:items-center sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-title"
    >
      <button
        type="button"
        aria-label="Закрыть"
        className="absolute inset-0 h-full w-full cursor-default"
        onClick={onCancel}
        tabIndex={-1}
      />
      <div className="animate-pop relative w-full max-w-md rounded-lg border border-line bg-paper-card p-5 shadow-card sm:p-6">
        <p className="label flex items-center gap-2 text-red">
          <span aria-hidden="true" className="inline-block h-1.5 w-1.5 bg-red" />
          Подтверждение
        </p>
        <h2 id="confirm-title" className="display mt-2 text-h3">
          {title}
        </h2>
        {body ? <p className="mt-3 text-[0.98rem] text-ink-soft">{body}</p> : null}
        <div className="mt-6 flex flex-col gap-2.5 sm:flex-row-reverse">
          <button
            ref={confirmRef}
            type="button"
            className={`btn ${danger ? 'btn-primary' : 'btn-ink'}`}
            onClick={onConfirm}
          >
            {confirmLabel}
          </button>
          <button type="button" className="btn btn-quiet" onClick={onCancel}>
            {cancelLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
