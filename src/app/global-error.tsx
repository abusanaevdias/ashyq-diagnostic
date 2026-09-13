'use client';

import { useEffect } from 'react';
import './globals.css';
import '../../design/tokens.css';

/**
 * Последняя граница ошибок: заменяет root layout, поэтому обязана держать
 * свои html/body и минимум зависимостей — только globals.css с токенами.
 */
export default function GlobalError({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <html lang="ru">
      <body
        style={{
          margin: 0,
          minHeight: '100dvh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 16,
          padding: 24,
          textAlign: 'center',
          background: 'var(--surface)',
          color: 'var(--ink)',
          fontFamily: "var(--font-display), system-ui, sans-serif",
        }}
      >
        <h1 style={{ fontSize: '1.5rem', margin: 0, color: 'var(--red)' }}>
          Что-то пошло не так
        </h1>
        <p style={{ margin: 0, maxWidth: 480, lineHeight: 1.6 }}>
          Приложение не смогло загрузиться целиком. Обновите страницу — прогресс
          диагностики сохранён на этом устройстве.
        </p>
        <button
          type="button"
          onClick={() => retry()}
          style={{
            minHeight: 48,
            padding: '12px 26px',
            borderRadius: 'var(--r-pill)',
            border: 'none',
            background: 'var(--red)',
            color: 'var(--on-red)',
            fontSize: '0.9375rem',
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          Попробовать снова
        </button>
      </body>
    </html>
  );
}
