'use client';

import { useEffect, useState } from 'react';
import { SiteFooter, SiteHeader } from '@/components/ui/SiteChrome';
import { ButtonLink, MicroLabel } from '@/components/ui/CleanUi';
import { STORAGE_KEYS } from '@/lib/config';
import styles from './error.module.css';

/**
 * Брендированный fallback для ошибок сегментов. Рендерится внутри root layout,
 * поэтому NavBar/Footer остаются на месте. Прогресс диагностики живёт в
 * localStorage и при ошибке рендеринга не теряется — сообщаем об этом честно.
 */
export default function Error({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  const [hasRun, setHasRun] = useState(false);

  useEffect(() => {
    console.error(error);
  }, [error]);

  useEffect(() => {
    try {
      setHasRun(
        Boolean(window.localStorage.getItem(STORAGE_KEYS.run('ielts'))) ||
          Boolean(window.localStorage.getItem(STORAGE_KEYS.run('sat'))),
      );
    } catch {
      /* storage недоступен — просто не показываем пометку */
    }
  }, []);

  return (
    <div className="v3 min-h-dvh">
      <SiteHeader />
      <main className="shell-wide flex min-h-[60vh] flex-col justify-center py-16 sm:py-24">
        <MicroLabel>Техническая ошибка</MicroLabel>
        <h1 className="display mt-5 max-w-[9.4em] text-display text-red">Что-то пошло не так</h1>
        <p className="mt-5 max-w-xl text-[1.05rem] leading-relaxed text-ink-soft">
          Попробуйте повторить действие. Если ошибка повторяется — напишите нам в
          WhatsApp или Telegram, ссылки есть на странице контактов.
        </p>
        {hasRun && (
          <p className="mt-4 max-w-xl text-[0.98rem] leading-relaxed text-ink">
            Прогресс диагностики сохранён на этом устройстве — вы вернётесь к тому
            же вопросу.
          </p>
        )}
        <div className="mt-8 flex flex-wrap items-center gap-4">
          <button type="button" className={styles.retry} onClick={() => retry()}>
            Попробовать снова
          </button>
          {hasRun && (
            <ButtonLink href="/diagnostic" tone="outline" ariaLabel="Вернуться к диагностике">
              Вернуться к диагностике
            </ButtonLink>
          )}
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
