'use client';
import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from '@/lib/lms/hooks';
import { prepareDiagnostic } from '@/lib/diagnostic-profile/client';
import { diagnosticRecommendations, freezeDiagnostic } from '@/lib/diagnostic-profile/model';
import type { RunState } from '@/lib/types';
import styles from './DiagnosticProfile.module.css';

export default function SaveDiagnostic({ run }: { run: RunState }) {
  const { session, ready } = useSession();
  const router = useRouter();
  const [error, setError] = useState('');
  let snapshot;
  try { snapshot = run.finished ? freezeDiagnostic(run) : null; } catch { snapshot = null; }
  const recommendations = snapshot ? diagnosticRecommendations(snapshot) : [];
  return <section id="save-my-diagnostic" className={styles.panel} aria-labelledby="save-diagnostic-title">
    <p className={styles.label}>После диагностики</p>
    <h2 id="save-diagnostic-title">От результата — к нужной практике</h2>
    {recommendations[0] ? <><p>Начни с «{recommendations[0].label}». Ошибки: {recommendations[0].wrong}. Пропуски: {recommendations[0].skipped}. Всего заданий по теме: {recommendations[0].total}. {recommendations[0].why}</p><p className={styles.note}>Это наблюдение по короткой попытке, а не устойчивый диагноз. Пропуск сам по себе не доказывает, что навык слабый.</p></> : <p>Сохрани исходную попытку и свои ответы в профиле. Рекомендации появятся только там, где есть подходящее упражнение и основания в ответах.</p>}
    <p className={styles.note}>После входа ты увидишь эту попытку и подтвердишь, в какой аккаунт её сохранить. Телефон, заявка и рекламные метки в учебный профиль не переносятся.</p>
    <div className={styles.actions}>
      <button className={styles.action} disabled={!ready || !snapshot} onClick={() => {
        try { prepareDiagnostic(run); router.push(session ? '/me#my-diagnostics' : '/login?next=%2Fme%23my-diagnostics'); }
        catch (e) { setError(e instanceof Error ? e.message : 'Браузер не разрешил сохранение.'); }
      }}>Сохранить результат в моём профиле →</button>
      {recommendations[0] && <Link className={styles.secondary} href={recommendations[0].item.href}>Попробовать без регистрации →</Link>}
    </div>
    {!snapshot && <p className={styles.note}>Эту старую попытку пока нельзя перенести. Её ответы доступны в текущем разборе.</p>}
    {error && <p className={styles.error} role="alert">{error}</p>}
  </section>;
}
