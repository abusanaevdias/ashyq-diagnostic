'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import RequireRole from '@/components/lms/RequireRole';
import { useLmsData } from '@/lib/lms/hooks';
import { sanitizeFeedback } from '@/lib/writing-trainer/ai-feedback';
import { getRepos } from '@/lib/lms/repos';
import type { User } from '@/lib/lms/types';
import WritingAiPanel, { type SavedFeedback } from './WritingAiPanel';
import styles from './OwnEssayTrainer.module.css';

type Step = 'grammar' | 'task' | 'coherence' | 'lexical';
type Draft = {
  prompt: string;
  original: string;
  working: string;
  step: number;
  notes: Record<Step, string>;
  versions: Record<Step, string>;
  ai: Partial<Record<Step, SavedFeedback>>;
};

const steps: Array<{ id: Step; label: string; instruction: string; questions: string[] }> = [
  { id: 'grammar', label: 'Грамматика', instruction: 'Найди возможные ошибки сам и исправь их в рабочей версии.', questions: ['Согласованы ли подлежащее и сказуемое?', 'Верно ли выбраны время, артикли и предлоги?', 'Понятны ли сложные предложения и пунктуация?'] },
  { id: 'task', label: 'Ответ на вопрос', instruction: 'Проверь, отвечает ли эссе на все части задания и развивает ли аргументы.', questions: ['Ясна ли твоя позиция?', 'Есть ли объяснение и пример для каждого основного тезиса?', 'Нет ли абзаца, который уходит от вопроса?'] },
  { id: 'coherence', label: 'Связность', instruction: 'Проверь порядок идей и связь между предложениями и абзацами.', questions: ['Есть ли одна главная идея у каждого абзаца?', 'Легко ли проследить ход мысли?', 'Не повторяются ли связки механически?'] },
  { id: 'lexical', label: 'Лексика', instruction: 'Уточни слова и выражения, сохраняя собственную мысль.', questions: ['Подходят ли слова по смыслу?', 'Нет ли повторов, которые мешают чтению?', 'Проверены ли написание и сочетаемость слов?'] },
];

const blank = (): Draft => ({ prompt: '', original: '', working: '', step: -1, notes: { grammar: '', task: '', coherence: '', lexical: '' }, versions: { grammar: '', task: '', coherence: '', lexical: '' }, ai: {} });
const words = (value: string) => value.trim() ? value.trim().split(/\s+/).length : 0;
const storageKey = (id: string) => `ashyq:writing-own:v1:${id}`;

function readDraft(id: string): Draft {
  if (typeof window === 'undefined') return blank();
  try {
    const raw = window.sessionStorage.getItem(storageKey(id));
    if (!raw) return blank();
    const value = JSON.parse(raw) as Partial<Draft>;
    if (typeof value.prompt !== 'string' || typeof value.original !== 'string' || typeof value.working !== 'string' || typeof value.step !== 'number') return blank();
    if (value.prompt.length > 1000 || value.original.length > 10000 || value.working.length > 10000 || value.step < -1 || value.step > steps.length) return blank();
    const clean = blank();
    for (const { id: stepId } of steps) {
      clean.notes[stepId] = typeof value.notes?.[stepId] === 'string' ? value.notes[stepId].slice(0, 1000) : '';
      clean.versions[stepId] = typeof value.versions?.[stepId] === 'string' ? value.versions[stepId].slice(0, 10000) : '';
      const saved = value.ai?.[stepId];
      if (saved && typeof saved.source === 'string' && saved.source.length <= 10000) {
        const feedback = sanitizeFeedback(saved.feedback, saved.source);
        if (feedback) clean.ai[stepId] = { source: saved.source, feedback };
      }
    }
    return { ...clean, prompt: value.prompt, original: value.original, working: value.working, step: Math.floor(value.step) };
  } catch { return blank(); }
}

export default function OwnEssayTrainer() {
  if (process.env.NODE_ENV === 'production' && process.env.NEXT_PUBLIC_AUTH_PROVIDER !== 'supabase') {
    return <section className={styles.state} aria-labelledby="own-config-title"><h1 id="own-config-title">Личный режим временно недоступен</h1><p>Для собственного эссе нужен вход через учебный кабинет ASHYQ. Пока можно пройти два готовых примера.</p><div className={styles.links}><Link href="/writing/trainer/practice">Готовые эссе</Link></div></section>;
  }
  return <RequireRole roles={['student', 'teacher']}>{(user) => <EnrolledOwnEssay key={user.id} user={user} />}</RequireRole>;
}

function EnrolledOwnEssay({ user }: { user: User }) {
  const { data: classes, loading, error } = useLmsData(() => getRepos().classes.listForUser(user), `own-writing-classes:${user.id}`);
  if (loading) return <p className={styles.state} role="status">Проверяем доступ к IELTS-классу…</p>;
  if (error) return <p className={styles.state} role="alert">Не удалось проверить класс: {error}</p>;
  if (!classes?.some((item) => /\bIELTS\b/i.test(item.subject))) {
    return <section className={styles.state} aria-labelledby="own-locked"><h1 id="own-locked">Режим для IELTS-класса</h1><p>Для работы со своим эссе нужно учиться в IELTS-классе ASHYQ или вести его. Два готовых примера можно пройти без класса.</p><div className={styles.links}><Link href={user.role === 'teacher' ? '/teacher' : '/classes'}>Мои классы</Link><Link href="/writing/trainer/practice">Готовые эссе</Link></div></section>;
  }
  return <EssayWorkspace key={user.id} userId={user.id} role={user.role} />;
}

function EssayWorkspace({ userId, role }: { userId: string; role: User['role'] }) {
  const [draft, setDraft] = useState<Draft>(() => readDraft(userId));
  const [storageError, setStorageError] = useState('');
  const [downloadError, setDownloadError] = useState('');
  useEffect(() => {
    try { window.sessionStorage.setItem(storageKey(userId), JSON.stringify(draft)); }
    catch { setStorageError('Автосохранение в этой вкладке недоступно. Скачай черновик перед уходом со страницы.'); }
  }, [draft, userId]);

  const current = draft.step >= 0 && draft.step < steps.length ? steps[draft.step] : null;
  const isReport = draft.step === steps.length;
  const started = draft.step >= 0;

  function start() {
    if (!draft.prompt.trim() || !draft.original.trim()) return;
    setDraft((old) => ({ ...old, prompt: old.prompt.trim(), original: old.original.trim(), working: old.original.trim(), step: 0 }));
  }

  function next() {
    if (!current) return;
    setDraft((old) => ({ ...old, versions: { ...old.versions, [current.id]: old.working }, step: Math.min(old.step + 1, steps.length) }));
  }

  function clear() {
    if (!window.confirm('Удалить задание и все версии эссе из этой вкладки?')) return;
    window.sessionStorage.removeItem(storageKey(userId));
    setDraft(blank());
    setStorageError('');
    setDownloadError('');
  }

  function download() {
    try {
      const content = [`IELTS Academic Writing Task 2 — личная практика`, `Задание: ${draft.prompt}`, ``, `Исходный текст (${words(draft.original)} слов):`, draft.original, ``, `Последняя версия (${words(draft.working)} слов):`, draft.working, ``, ...steps.flatMap(({ id, label }) => [`${label}: ${draft.notes[id] || 'без заметки'}`, `Версия после этапа:`, draft.versions[id] || 'не сохранена', ``])].join('\n');
      const url = URL.createObjectURL(new Blob([content], { type: 'text/plain;charset=utf-8' }));
      const link = document.createElement('a');
      link.href = url;
      link.download = 'ashyq-writing-task-2.txt';
      link.click();
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
      setDownloadError('');
    } catch { setDownloadError('Не удалось скачать файл. Скопируй текст вручную перед закрытием вкладки.'); }
  }

  return <div className={styles.page}>
    <div className={styles.topline}><span>ASHYQ / WRITING LAB</span><span>IELTS ACADEMIC · TASK 2</span></div>
    <header className={styles.hero}><p className={styles.eyebrow}>ЛИЧНАЯ ПРАКТИКА · {role === 'teacher' ? 'УЧИТЕЛЬ' : 'УЧЕНИК'}</p><h1>Работай со своим эссе</h1><p>Добавь задание и свой текст, затем перепиши эссе по четырём критериям. Ты сам решаешь, какие изменения принять.</p><div className={styles.links}><Link href="/writing/trainer">Как устроен тренажёр</Link><Link href="/writing/trainer/practice">Готовые примеры</Link></div></header>
    <div className={styles.notice}><strong>Что доступно сейчас</strong><p>Черновик остаётся в этой вкладке. {process.env.NEXT_PUBLIC_WRITING_AI_ENABLED === '1' ? 'В пилоте после собственной правки можно запросить AI-подсказки: только по отдельному согласию задание и обе версии эссе отправятся в OpenAI.' : 'AI-разбор пока не включён: текст не отправляется внешнему сервису.'} Автоматическая оценка собственного эссе и официальный балл IELTS недоступны.</p></div>
    {!started ? <section className={styles.card} aria-labelledby="start-own-title"><h2 id="start-own-title">1. Добавь своё эссе</h2><label htmlFor="own-prompt">Задание Task 2</label><textarea id="own-prompt" value={draft.prompt} onChange={(event) => setDraft((old) => ({ ...old, prompt: event.target.value }))} maxLength={1000} rows={4} placeholder="Вставь полный вопрос IELTS Task 2" /><label htmlFor="own-original">Твой исходный текст</label><textarea id="own-original" lang="en" value={draft.original} onChange={(event) => setDraft((old) => ({ ...old, original: event.target.value }))} maxLength={10000} rows={15} placeholder="Вставь или напиши своё эссе" /><div className={styles.actions}><button className={styles.primary} type="button" onClick={start} disabled={!draft.prompt.trim() || !draft.original.trim()}>Начать правку</button><span>{words(draft.original)} слов · для Task 2 обычно требуется не менее 250</span></div></section> : <>
      <nav className={styles.progress} aria-label="Этапы правки">{steps.map((item, index) => <span key={item.id} aria-current={draft.step === index ? 'step' : undefined} className={draft.step === index ? styles.activeStep : ''}>{index + 1}. {item.label}</span>)}<span className={isReport ? styles.activeStep : ''} aria-current={isReport ? 'step' : undefined}>5. Итог</span></nav>
      <section className={styles.promptCard}><span className={styles.eyebrow}>ТВОЁ ЗАДАНИЕ</span><p lang="en">{draft.prompt}</p></section>
      {current ? <section className={styles.card} aria-labelledby="own-stage-title"><p className={styles.eyebrow}>ШАГ {draft.step + 1} ИЗ 4</p><h2 id="own-stage-title">{current.label}</h2><p>{current.instruction}</p><ul>{current.questions.map((question) => <li key={question}>{question}</li>)}</ul><div className={styles.columns}><div><h3>Исходный текст</h3><p lang="en" className={styles.essay}>{draft.original}</p></div><div><label htmlFor="own-working">Рабочая версия</label><textarea id="own-working" lang="en" value={draft.working} onChange={(event) => setDraft((old) => ({ ...old, working: event.target.value }))} maxLength={10000} rows={20} /></div></div><label htmlFor="own-notes">Что ты изменил и почему?</label><textarea id="own-notes" value={draft.notes[current.id]} onChange={(event) => setDraft((old) => ({ ...old, notes: { ...old.notes, [current.id]: event.target.value } }))} maxLength={1000} rows={3} placeholder="Короткая заметка для себя" /><div className={styles.actions}>{draft.step > 0 ? <button type="button" className={styles.secondary} onClick={() => setDraft((old) => ({ ...old, step: old.step - 1 }))}>Назад</button> : null}<button type="button" className={styles.primary} onClick={next}>Сохранить шаг и продолжить</button><span>{words(draft.working)} слов</span></div></section> : null}
      {current && process.env.NEXT_PUBLIC_WRITING_AI_ENABLED === '1' ? <WritingAiPanel key={current.id} criterion={current.id} prompt={draft.prompt} original={draft.original} working={draft.working} saved={draft.ai[current.id]} onSave={(value) => setDraft((old) => ({ ...old, ai: { ...old.ai, [current.id]: value } }))} /> : null}
      {isReport ? <section className={styles.card} aria-labelledby="own-report-title"><p className={styles.eyebrow}>ЛИЧНЫЙ ИТОГ</p><h2 id="own-report-title">Что изменилось</h2><p>Сравни исходный текст с последней версией. Правки не проверены учителем; AI-подсказки, если ты их запросил, остаются предварительными. Здесь нет оценки IELTS.</p><div className={styles.columns}><div><h3>Было · {words(draft.original)} слов</h3><p lang="en" className={styles.essay}>{draft.original}</p></div><div><h3>Стало · {words(draft.working)} слов</h3><p lang="en" className={styles.essay}>{draft.working}</p></div></div><div className={styles.notes}>{steps.map(({ id, label }) => <div key={id}><h3>{label}</h3><p>{draft.notes[id] || 'Заметка не добавлена.'}</p><details><summary>Версия после этапа</summary><p lang="en" className={styles.version}>{draft.versions[id] || 'Версия не сохранена.'}</p></details>{draft.ai[id] ? <p className={styles.aiStale}>AI-разбор был сделан для версии на этом этапе. Вернись к этапу, чтобы посмотреть его.</p> : null}</div>)}</div><div className={styles.actions}><button type="button" className={styles.secondary} onClick={() => setDraft((old) => ({ ...old, step: steps.length - 1 }))}>Вернуться к правке</button><button type="button" className={styles.primary} onClick={download}>Скачать результат .txt</button></div></section> : null}
      <div className={styles.bottom}><p>Черновик сохраняется только в текущей вкладке. На общем устройстве удали его после работы.</p><div className={styles.actions}><button type="button" className={styles.secondary} onClick={download}>Скачать черновик</button><button type="button" className={styles.delete} onClick={clear}>Удалить мой черновик</button></div></div>
      {storageError ? <p className={styles.error} role="alert">{storageError}</p> : null}
      {downloadError ? <p className={styles.error} role="alert">{downloadError}</p> : null}
    </>}
  </div>;
}
