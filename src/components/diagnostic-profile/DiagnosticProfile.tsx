'use client';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import type { User } from '@/lib/lms/types';
import { getAuth } from '@/lib/lms/auth';
import { deleteDiagnostic, forgetPending, listDiagnostics, pendingDiagnostic, profileUsesCloud, saveDiagnostic } from '@/lib/diagnostic-profile/client';
import { diagnosticRecommendations, freezeDiagnostic, type DiagnosticInput, type DiagnosticSnapshot } from '@/lib/diagnostic-profile/model';
import { useCheckpointLibrary } from '@/components/trainers/checkpoint-hooks';
import { latestCompleted } from '@/lib/trainers/journey';
import TrainerPracticeLink from '@/components/trainers/TrainerPracticeLink';
import styles from './DiagnosticProfile.module.css';

const date = (ts: number) => new Date(ts).toLocaleString('ru-RU', { dateStyle: 'medium', timeStyle: 'short' });

export default function DiagnosticProfile({ user }: { user: User }) {
  const [records, setRecords] = useState<DiagnosticSnapshot[]>([]);
  const [pending, setPending] = useState<DiagnosticInput | null>(null);
  const [confirmed, setConfirmed] = useState(false);
  const [selected, setSelected] = useState('');
  const [remove, setRemove] = useState('');
  const [busy, setBusy] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [revision, setRevision] = useState(0);
  const requests = useRef(new Set<AbortController>());
  const { entries } = useCheckpointLibrary();
  useEffect(() => {
    const controllers = requests.current;
    const controller = new AbortController();
    controllers.add(controller);
    listDiagnostics(user.id, controller.signal).then(values => {
      if (!controller.signal.aborted) { setRecords(values); setLoaded(true); }
    }).catch(e => { if (!controller.signal.aborted) { setError(e instanceof Error ? e.message : 'Не удалось загрузить результаты.'); setLoaded(true); } });
    // Deliberately only the result explicitly selected by the visitor; no scan/import of guest runs.
    Promise.resolve().then(() => {
      if (controller.signal.aborted) return;
      try { setPending(pendingDiagnostic()); setConfirmed(false); }
      catch { setError('Не удалось прочитать выбранную гостевую попытку. Открой её результат и нажми «Сохранить» ещё раз.'); }
    });
    return () => { controllers.forEach(c => c.abort()); controllers.clear(); };
  }, [user.id, revision]);

  const action = async (operation: (signal: AbortSignal) => Promise<unknown>, success: string) => {
    const controller = new AbortController();
    requests.current.add(controller);
    setBusy(true); setError(''); setNotice('');
    try {
      await operation(controller.signal);
      if (controller.signal.aborted || getAuth().getSession()?.user.id !== user.id) return;
      const values = await listDiagnostics(user.id, controller.signal);
      if (controller.signal.aborted) return;
      setRecords(values); setNotice(success); setLoaded(true);
    } catch (e) { if (!controller.signal.aborted) setError(e instanceof Error ? e.message : 'Действие не завершено. Повтори позже.'); }
    finally { requests.current.delete(controller); if (!controller.signal.aborted) setBusy(false); }
  };
  const current = records.find(row => row.runId === selected) ?? records[0];
  const preview = pending ? freezeDiagnostic(pending) : null;
  const recommendations = current ? diagnosticRecommendations(current) : [];
  const covered = new Set(recommendations.flatMap(row => row.evidence));
  const uncovered = current?.questions.filter(q => q.answered && !q.correct && !covered.has(q.id)).length ?? 0;
  return <section id="my-diagnostics" className={styles.panel} aria-labelledby="my-diagnostics-title">
    <p className={styles.label}>Моя точка А</p><h2 id="my-diagnostics-title">Диагностика и следующий шаг</h2>
    <p className={styles.note}>{profileUsesCloud ? 'Подтверждённое сохранение доступно в этом аккаунте с других устройств.' : 'Демо-режим: профиль и диагностика хранятся только в этом браузере. Облачной синхронизации здесь нет.'} Исходная попытка не меняется после практики. Это короткая самостоятельная диагностика, не официальный экзамен.</p>
    {preview && <div className={styles.pending}>
      <h3>Перенести выбранный результат?</h3>
      <p>{preview.exam.toUpperCase()} · {date(preview.finishedAt)} · верно {preview.correct} из {preview.total}.</p>
      <label className={styles.confirm}><input type="checkbox" checked={confirmed} disabled={busy} onChange={e => setConfirmed(e.target.checked)} /><span>Это моя попытка. Сохранить её в аккаунт <strong>{user.email}</strong>, вместе с ответами и рекомендациями.</span></label>
      <div className={styles.actions}><button className={styles.action} disabled={busy || !confirmed} onClick={() => {
        const input = pending!;
        void action(async signal => { await saveDiagnostic(user.id, input, signal); if (!signal.aborted && getAuth().getSession()?.user.id === user.id) { forgetPending(input.runId); setPending(null); setConfirmed(false); setSelected(input.runId); } }, profileUsesCloud ? 'Результат сохранён в облачном профиле.' : 'Результат сохранён в демо-профиле этого браузера.');
      }}>{busy ? 'Сохраняем…' : 'Подтвердить сохранение'}</button>
      <button className={styles.secondary} disabled={busy} onClick={() => { try { forgetPending(pending!.runId); setPending(null); setConfirmed(false); } catch { setError('Не удалось убрать запрос. Проверь настройки хранения браузера.'); } }}>Не переносить</button></div>
      <p className={styles.note}>Исходная диагностика в браузере не удаляется. Если подтверждаешь почту в другом браузере, вернись к этому результату на исходном устройстве и войди в аккаунт.</p>
    </div>}
    {error && <div className={styles.error} role="alert"><p>{error}</p><button className={styles.secondary} disabled={busy} onClick={() => { setError(''); setRevision(v => v + 1); }}>Обновить список</button></div>}
    {notice && <p className={styles.status} role="status">{notice}</p>}
    {!loaded && !error && <p role="status">Загружаем твои результаты…</p>}
    {loaded && !records.length && !error && <p>Сохранённых диагностик пока нет. Пройди диагностику и на экране результата выбери «Сохранить результат в моём профиле».</p>}
    {current && <>
      <label className={styles.field}>Исходная попытка{profileUsesCloud ? ' · до 50 последних сохранений' : ''}<select value={current.runId} onChange={e => { setSelected(e.target.value); setRemove(''); }}>{records.map(row => <option value={row.runId} key={row.runId}>{row.exam.toUpperCase()} · {date(row.finishedAt)} · {row.correct}/{row.total}</option>)}</select></label>
      <h3>{current.exam.toUpperCase()} · {current.correct} из {current.total} верно</h3><p>{current.questions.filter(q => q.answered).length >= Math.ceil(current.total / 2) ? `Предварительный диапазон: ${current.band}.` : 'Для диапазона пока недостаточно ответов.'} Пропущено: {current.questions.filter(q => !q.answered).length}.</p>
      {current.exam === 'ielts' && <p className={styles.note}>Проверены Reading и Listening. По этой попытке нельзя оценить Writing и Speaking.</p>}
      <div className={styles.queue}>{recommendations.map((row, index) => {
        const record = entries.find(entry => entry.item.id === row.trainer)?.record;
        const completed = latestCompleted(row.trainer, record ?? null);
        const after = completed && Date.parse(completed.entry.savedAt) >= current.finishedAt ? completed : null;
        const checks = after?.outcome.checks.filter(check => check.stage === 'transfer' && check.matches !== null) ?? [];
        const started = record?.checkpoint && Date.parse(record.checkpoint.savedAt) >= current.finishedAt;
        return <article className={styles.recommendation} key={row.id}>
          <p className={styles.label}>{index === 0 ? 'Начни здесь' : 'Затем'} · {row.label}</p><h3>{row.item.title}</h3>
          <p>В этой диагностике: <strong>ошибки — {row.wrong}</strong>, пропуски — {row.skipped}. Всего заданий по теме: {row.total}.</p>
          <p>{row.why}</p><p className={styles.note}>{row.limited ? 'Вопросов мало: это повод проверить тему, а не устойчивый диагноз.' : 'Это наблюдение по этой попытке; причина ошибки может быть другой.'} {row.wrong === 0 ? 'По пропуску нельзя судить о владении навыком.' : ''}</p>
          <details><summary>На каких ответах основана рекомендация?</summary><p>{row.evidence.join(', ')}. Ответы показаны ниже.</p></details>
          <p className={styles.status}>{after ? checks.length ? `После диагностики: в новом учебном примере совпали ${checks.filter(c => c.matches).length} из ${checks.length} проверок. ${checks.some(c => !c.matches) ? 'Есть что повторить.' : 'Попробуй ещё другой пример без разбора.'}` : 'После диагностики есть завершённая учебная попытка. Автоматического подтверждения навыка нет.' : started ? 'Практика после диагностики начата. Продолжи сохранённую попытку.' : 'Практика после диагностики пока не сохранена на этом устройстве.'}</p>
          <TrainerPracticeLink className={styles.action} href={started ? `${row.item.href}#saved-work` : row.item.href}>{started ? 'Открыть сохранённую практику' : 'Начать целевое упражнение'} →</TrainerPracticeLink>
        </article>;
      })}</div>
      {!recommendations.length && <p>В этой попытке нет ошибок, для которых сейчас есть точное соответствие опубликованному тренажёру. Это не означает, что все навыки освоены.</p>}
      {uncovered > 0 && <p className={styles.note}>Ошибок вне выбранных рекомендаций: {uncovered}. Они остаются в ответах ниже. Выбранные направления не заменяют разбор всей диагностики; для некоторых тем подходящего тренажёра пока нет.</p>}
      <p className={styles.note}>Статусы практики — только по сохранениям текущего аккаунта на этом устройстве. Они не меняют исходный балл и пока не синхронизируются с другими устройствами. Сохранение могло быть сделано после разбора.</p>
      <details><summary>Мои ответы · ✓ верно / × ошибка / — пропуск</summary>{current.questions.map((q, index) => <div className={styles.answer} data-status={q.correct ? 'correct' : q.answered ? 'wrong' : 'skipped'} key={q.id}><strong>{index + 1}. {q.correct ? '✓ Верно' : q.answered ? '× Ошибка' : '— Нет ответа'}</strong><p>{q.prompt}</p><p>Твой ответ: {q.answerLabel}</p>{!q.correct && <p>Ключ: {q.expectedLabel}</p>}<p className={styles.note}>{q.id} · {q.skill}</p></div>)}</details>
      <details><summary>Удалить эту диагностику из профиля</summary><p>Удалятся исходный результат и рекомендации по нему. Локальная диагностика, история тренажёров и скачанные файлы удаляются отдельно.</p>
        {remove !== current.runId ? <button className={styles.secondary} onClick={() => setRemove(current.runId)}>Выбрать для удаления</button> : <div className={styles.actions}><button className={styles.secondary} disabled={busy} onClick={() => void action(async signal => { await deleteDiagnostic(user.id, current.runId, signal); }, 'Диагностика удалена из профиля.')}>Да, удалить эту попытку</button><button className={styles.secondary} disabled={busy} onClick={() => setRemove('')}>Отмена</button></div>}
      </details>
    </>}
    <div className={styles.actions}><Link className={styles.secondary} href="/diagnostic">Пройти диагностику →</Link><Link className={styles.secondary} href="/trainers">Все тренажёры →</Link><Link className={styles.secondary} href="/trainers/history">Моя практика на устройстве →</Link></div>
  </section>;
}
