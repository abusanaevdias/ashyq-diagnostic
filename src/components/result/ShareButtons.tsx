'use client';

import { useState } from 'react';
import { track } from '@/lib/analytics';
import { downloadCardPng, type CardData } from '@/lib/card-image';
import type { DiagnosticResult } from '@/lib/types';

/**
 * Web Share API -> fallback на копирование текста.
 * Плюс сохранение карточки в PNG (SVG -> canvas, без библиотек).
 */
export default function ShareButtons({
  result,
  cardData,
}: {
  result: DiagnosticResult;
  cardData: CardData;
}) {
  const [copied, setCopied] = useState(false);
  const [saved, setSaved] = useState<'idle' | 'ok' | 'fail'>('idle');
  const [busy, setBusy] = useState(false);

  const shareText = buildShareText(result);

  const onShare = async () => {
    track('share_clicked', { exam: result.exam, method: 'share-sheet' });
    const nav = typeof navigator !== 'undefined' ? navigator : undefined;
    if (nav?.share) {
      try {
        await nav.share({ title: 'ASHYQ Quick Diagnostic', text: shareText });
        return;
      } catch (err) {
        if ((err as DOMException)?.name === 'AbortError') return;
        // если share отклонён — падаем в clipboard
      }
    }
    await copyToClipboard(shareText);
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      track('share_clicked', { exam: result.exam, method: 'clipboard' });
      window.setTimeout(() => setCopied(false), 2500);
    } catch {
      setCopied(false);
    }
  };

  const onSave = async () => {
    setBusy(true);
    const ok = await downloadCardPng(cardData, `ashyq-diagnostic-${result.exam}.png`);
    setSaved(ok ? 'ok' : 'fail');
    setBusy(false);
    track('share_clicked', { exam: result.exam, method: ok ? 'png' : 'png-failed' });
    window.setTimeout(() => setSaved('idle'), 4000);
  };

  return (
    <div className="no-print">
      <div className="flex flex-wrap gap-2.5">
        <button type="button" className="btn btn-quiet btn-small" onClick={onShare}>
          Поделиться результатом
        </button>
        <button
          type="button"
          className="btn btn-quiet btn-small"
          onClick={onSave}
          disabled={busy}
        >
          {busy ? 'Сохраняем…' : 'Сохранить карточку'}
        </button>
      </div>

      <p className="mt-2 min-h-[1.2rem] text-[0.78rem] text-ink-faint" aria-live="polite">
        {copied ? 'Скопировано — можно вставить в чат.' : null}
        {saved === 'ok' ? 'Карточка сохранена в загрузки.' : null}
        {saved === 'fail'
          ? 'Браузер не дал сохранить файл — просто сделай скриншот карточки.'
          : null}
      </p>
    </div>
  );
}

function buildShareText(result: DiagnosticResult): string {
  const examName = result.exam === 'sat' ? 'SAT' : 'IELTS';
  const readiness =
    result.exam === 'sat'
      ? `SAT Readiness: ${result.band.level} (${result.band.rangeLabel})`
      : `IELTS Readiness: ${result.band.level} (${result.band.rangeLabel})`;
  const strongest = result.strongest[0]?.domain;
  const url = typeof window !== 'undefined' ? window.location.origin : '';

  const lines = [
    'Мой Ashyq Diagnostic:',
    readiness,
    strongest ? `Сильная сторона: ${strongest}` : null,
    '',
    'А сколько наберёшь ты?',
    url,
  ].filter((l): l is string => l !== null);

  void examName;
  return lines.join('\n');
}
