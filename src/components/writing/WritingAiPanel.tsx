'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { getAuth } from '@/lib/lms/auth';
import { awaitWritingRequest, sanitizeFeedback, type FeedbackCriterion } from '@/lib/writing-trainer/ai-feedback';
import styles from './OwnEssayTrainer.module.css';
import type { OwnSavedFeedback } from '@/lib/writing-trainer/own-draft';

export type SavedFeedback = OwnSavedFeedback;

type Props = {
  criterion: FeedbackCriterion;
  prompt: string;
  original: string;
  working: string;
  saved?: SavedFeedback;
  onSave: (value: SavedFeedback) => void;
};

export default function WritingAiPanel(props: Props) {
  // A changed task, criterion or text requires fresh consent and cancels the old request.
  return <WritingAiRequest key={JSON.stringify([props.criterion, props.prompt, props.original, props.working, props.saved])} {...props} />;
}

function WritingAiRequest({ criterion, prompt, original, working, saved, onSave }: Props) {
  const [consent, setConsent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const request = useRef<AbortController | null>(null);
  const active = useRef(true);
  useEffect(() => { active.current = true; return () => { active.current = false; request.current?.abort(); }; }, []);
  const current = saved?.source === working && saved.context?.prompt === prompt && saved.context.original === original;

  async function requestFeedback() {
    if (!consent || request.current || !working.trim()) return;
    const controller = new AbortController();
    request.current = controller;
    const timer = window.setTimeout(() => controller.abort(new DOMException('Время ожидания истекло. Текст остаётся на экране; повтори запрос позже.', 'TimeoutError')), 40_000);
    setBusy(true);
    setError('');
    setConsent(false);
    try {
      const token = await awaitWritingRequest(getAuth().accessToken?.() ?? Promise.resolve(null), controller.signal);
      if (controller.signal.aborted) return;
      if (!token) throw new Error('Войди в учебный кабинет снова.');
      const response = await fetch('/api/writing/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ consent: true, criterion, prompt, original, working }),
        cache: 'no-store',
        signal: controller.signal,
      });
      const result: unknown = await response.json();
      const record = result && typeof result === 'object' ? result as Record<string, unknown> : {};
      if (!response.ok) throw new Error(typeof record.error === 'string' ? record.error : 'AI-разбор временно недоступен.');
      const feedback = sanitizeFeedback(record.feedback, working);
      if (!feedback) throw new Error('Получен неполный разбор. Попробуй позже.');
      if (!controller.signal.aborted) onSave({ source: working, feedback, context: { prompt, original } });
    } catch (cause) {
      if (active.current) setError(cause instanceof Error ? cause.message : 'AI-разбор временно недоступен.');
    } finally {
      window.clearTimeout(timer);
      if (request.current === controller) request.current = null;
      if (active.current) setBusy(false);
    }
  }

  return <section className={styles.aiPanel} aria-labelledby="ai-panel-title">
    <p className={styles.eyebrow}>ПОСЛЕ ТВОЕЙ ПРАВКИ</p>
    <h3 id="ai-panel-title">Проверь, что ты мог пропустить</h3>
    <p>AI подскажет возможные недочёты по этому критерию. Проверь каждую подсказку сам: модель может ошибаться. Оценку IELTS этот разбор не ставит.</p>
    {saved && !current ? <p className={styles.aiStale}>Ниже сохранена прежняя подсказка. Её текст или задание отличаются либо контекст старой записи неизвестен. Для текущей работы нужен отдельный запрос.</p> : null}
    {saved ? <div className={styles.aiResult} aria-live="polite">
      <h4>{current ? 'Разбор этой версии' : saved.context ? 'Сохранённая подсказка — контекст не совпадает' : 'Старая подсказка — задание неизвестно'}</h4><p>{saved.feedback.summary}</p>
      <details><summary>Для какого текста сохранена подсказка</summary>{saved.context ? <><h5>Задание</h5><p lang="en">{saved.context.prompt}</p><h5>Исходное эссе</h5><p lang="en">{saved.context.original}</p></> : <p>В старой записи задание и исходное эссе не сохранены.</p>}<h5>Версия на момент запроса</h5><p lang="en">{saved.source}</p></details>
      {saved.feedback.strengths.length ? <><h5>Что получилось</h5><ul>{saved.feedback.strengths.map((item, index) => <li key={index}>{item}</li>)}</ul></> : null}
      <h5>Что стоит проверить</h5>
      {saved.feedback.issues.length ? <ol>{saved.feedback.issues.map((issue, index) => <li key={index}><blockquote lang="en">{issue.quote}</blockquote><p>{issue.why}</p><p><strong>Вариант:</strong> {issue.suggestion}</p></li>)}</ol> : <p>В этом критерии модель не нашла замечаний, привязанных к тексту. Это не означает, что ошибок нет.</p>}
      <p><strong>Следующий шаг:</strong> {saved.feedback.nextAction}</p>
    </div> : null}
    <label className={styles.aiConsent}><input type="checkbox" checked={consent} onChange={(event) => setConsent(event.target.checked)} disabled={busy} /><span>Я согласен отправить задание, исходное эссе и текущую версию в OpenAI для одного разбора. <Link href="/privacy">Как обрабатывается текст</Link></span></label>
    <button type="button" className={styles.secondary} onClick={requestFeedback} disabled={!consent || busy || !working.trim()}>{busy ? 'Проверяем…' : current ? 'Проверить ещё раз' : 'Получить AI-подсказки'}</button>
    {error ? <p className={styles.error} role="alert">{error}</p> : null}
  </section>;
}
