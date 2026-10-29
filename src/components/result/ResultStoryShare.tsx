'use client';
import { useEffect, useMemo, useState } from 'react';
import type { DiagnosticResult } from '@/lib/types';
import type { DiagnosticFinale } from '@/lib/diagnostic-profile/finale';
import { createStoryPng } from '@/lib/diagnostic-profile/story-image';
import styles from './ResultFinale.module.css';

export default function ResultStoryShare({ result, finale, onOpen }: { result: DiagnosticResult; finale: DiagnosticFinale; onOpen: () => void }) {
  const [open, setOpen] = useState(false);
  const [imageState, setImage] = useState<{ blob: Blob; url: string; key: string } | null>(null);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [retry, setRetry] = useState(0);
  const [busy, setBusy] = useState(false);
  const payload = useMemo(() => ({ result: { exam: result.exam, totalCorrect: result.totalCorrect, totalQuestions: result.totalQuestions, answeredQuestions: result.answeredQuestions }, finale: { band: finale.band, title: finale.title, tip: finale.tip, caution: finale.caution, noAnswers: finale.noAnswers, noRange: finale.noRange } }), [result.exam, result.totalCorrect, result.totalQuestions, result.answeredQuestions, finale.band, finale.title, finale.tip, finale.caution, finale.noAnswers, finale.noRange]);
  const key = `${JSON.stringify(payload)}:${retry}`;
  const image = imageState?.key === key ? imageState : null;
  const text = `Моя точка А в ASHYQ · ${result.exam.toUpperCase()}: ${finale.band}. ${finale.caution}\nМой следующий шаг: ${finale.tip}\nНе официальный экзаменационный балл.\nhttps://ashyq-diagnostic.vercel.app/diagnostic`;
  useEffect(() => {
    if (!open) return;
    let alive = true; let objectUrl: string | undefined;
    createStoryPng(payload.result, payload.finale).then(blob => {
      if (!alive) return;
      objectUrl = URL.createObjectURL(blob); setImage({ blob, url: objectUrl, key });
    }).catch(e => { if (alive) setError(e instanceof Error ? e.message : 'Не удалось создать карточку.'); });
    return () => { alive = false; if (objectUrl) URL.revokeObjectURL(objectUrl); };
  }, [open, payload, key]);
  const download = () => {
    if (!image) return;
    const link = document.createElement('a'); link.href = image.url; link.download = `ashyq-${result.exam}-my-next-step.png`; document.body.appendChild(link); link.click(); link.remove();
    setNotice('PNG передан браузеру. Проверь загрузки или меню сохранения изображения.');
  };
  return <section className={styles.share} aria-labelledby="story-share-title">
    <div><p className={styles.eyebrow}>Результат, который можно забрать с собой</p><h2 id="story-share-title">Моя точка А. Мой следующий шаг.</h2><p>Красивая карточка для сторис: твой результат и короткий совет. Сначала посмотри её, потом реши, делиться ли.</p></div>
    <button type="button" className={styles.outline} aria-expanded={open} aria-controls="story-share-preview" onClick={() => { onOpen(); setOpen(v => !v); setImage(null); setError(''); setNotice(''); }}>{open ? 'Закрыть предпросмотр' : 'Посмотреть мою карточку ↗'}</button>
    {open && <div id="story-share-preview" className={styles.shareContent}>
      <div>{image ? <img src={image.url} width={1080} height={1920} alt={`Карточка для публикации: ${result.exam.toUpperCase()}, ${finale.band}, ${result.totalCorrect} из ${result.totalQuestions} верно. Совет: ${finale.tip}. ${finale.caution}`} className={styles.storyImage} /> : <p role="status">{error || 'Готовим карточку 1080 × 1920…'}</p>}</div>
      <div><h3>Ты решаешь, что отправить.</h3><p>На этой карточке — диапазон, число верных ответов и совет. Имени, контактов и самих ответов нет. Кнопка откроет меню телефона, если браузер поддерживает отправку файлов.</p>
        <div className={styles.actions}>
          <button type="button" className={styles.primary} disabled={!image || busy} onClick={async () => {
            if (!image) return;
            const file = new File([image.blob], `ashyq-${result.exam}.png`, { type: 'image/png' });
            setBusy(true); setNotice('');
            try {
              if (navigator.canShare?.({ files: [file] }) && navigator.share) { await navigator.share({ files: [file], title: 'Моя точка А · ASHYQ' }); setNotice('Карточка передана в меню отправки.'); }
              else setNotice('Этот браузер не отправляет файлы напрямую. Скачай PNG и прикрепи его в своём приложении.');
            } catch (e) { if ((e as DOMException).name !== 'AbortError') setNotice('Отправка не удалась. Можно скачать PNG или скопировать текст.'); }
            finally { setBusy(false); }
          }}>Поделиться карточкой</button>
          <button type="button" className={styles.outline} disabled={!image || busy} onClick={download}>Скачать PNG</button>
          <button type="button" className={styles.textButton} onClick={async () => { try { await navigator.clipboard.writeText(text); setNotice('Текст скопирован.'); } catch { setNotice('Копирование недоступно. Текст можно выделить ниже.'); } }}>Скопировать совет</button>
          {error && <button type="button" className={styles.outline} onClick={() => { setImage(null); setError(''); setRetry(v => v + 1); }}>Создать ещё раз</button>}
        </div>
        <p className={styles.note} role="status">{notice}</p><details><summary>Текст для публикации</summary><p className={styles.copyText}>{text}</p></details>
      </div>
    </div>}
  </section>;
}
