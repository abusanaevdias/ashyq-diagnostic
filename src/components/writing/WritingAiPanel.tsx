'use client';

import { useState } from 'react';
import Link from 'next/link';
import { getAuth } from '@/lib/lms/auth';
import { sanitizeFeedback, type FeedbackCriterion, type WritingFeedback } from '@/lib/writing-trainer/ai-feedback';
import styles from './OwnEssayTrainer.module.css';

export type SavedFeedback = { source: string; feedback: WritingFeedback };

export default function WritingAiPanel({ criterion, prompt, original, working, saved, onSave }: {
  criterion: FeedbackCriterion;
  prompt: string;
  original: string;
  working: string;
  saved?: SavedFeedback;
  onSave: (value: SavedFeedback) => void;
}) {
  const [consent, setConsent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const current = saved?.source === working;

  async function requestFeedback() {
    if (!consent || busy || !working.trim()) return;
    setBusy(true);
    setError('');
    setConsent(false);
    try {
      const token = await getAuth().accessToken?.();
      if (!token) throw new Error('Войди в учебный кабинет снова.');
      const response = await fetch('/api/writing/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ consent: true, criterion, prompt, original, working }),
        cache: 'no-store',
      });
      const result: unknown = await response.json();
      const record = result && typeof result === 'object' ? result as Record<string, unknown> : {};
      if (!response.ok) throw new Error(typeof record.error === 'string' ? record.error : 'AI-разбор временно недоступен.');
      const feedback = sanitizeFeedback(record.feedback, working);
      if (!feedback) throw new Error('Получен неполный разбор. Попробуй позже.');
      onSave({ source: working, feedback });
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'AI-разбор временно недоступен.');
    } finally { setBusy(false); }
  }

  return <section className={styles.aiPanel} aria-labelledby="ai-panel-title">
    <p className={styles.eyebrow}>ПОСЛЕ ТВОЕЙ ПРАВКИ</p>
    <h3 id="ai-panel-title">Проверь, что ты мог пропустить</h3>
    <p>AI подскажет возможные недочёты по этому критерию. Проверь каждую подсказку сам: модель может ошибаться. Оценку IELTS этот разбор не ставит.</p>
    {saved && !current ? <p className={styles.aiStale}>Ниже сохранён разбор предыдущей версии этого этапа. Текст изменился; для нового разбора нужен отдельный запрос.</p> : null}
    {saved ? <div className={styles.aiResult} aria-live="polite">
      <h4>{current ? 'Разбор этой версии' : 'Разбор предыдущей версии'}</h4><p>{saved.feedback.summary}</p>
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
