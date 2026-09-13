'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState, type ReactNode } from 'react';
import { track } from '@/lib/analytics';
import { isHttpUrl } from '@/lib/lms/format';
import { useLmsData } from '@/lib/lms/hooks';
import { canManageClass, ROUTE_ROLES } from '@/lib/lms/permissions';
import { getRepos } from '@/lib/lms/repos';
import { newId } from '@/lib/lms/store';
import type { ClassRoom, MaterialRef, User } from '@/lib/lms/types';
import ui from '@/components/ui/CleanUi.module.css';
import FilePicker from './FilePicker';
import RequireRole from './RequireRole';
import { Loading, Unavailable } from './States';
import styles from './Lms.module.css';

/** Формы открываются только для класса из ?class=, который ведёт этот учитель. */
function ManagedClass({ children }: { children: (cls: ClassRoom, user: User) => ReactNode }) {
  const classId = useSearchParams().get('class') ?? '';
  return (
    <RequireRole roles={ROUTE_ROLES.teacher}>
      {(user) => <ClassGate classId={classId} user={user} render={children} />}
    </RequireRole>
  );
}

function ClassGate({ classId, user, render }: { classId: string; user: User; render: (cls: ClassRoom, user: User) => ReactNode }) {
  const { data, loading } = useLmsData(() => getRepos().classes.get(classId), `class:${classId}`);
  if (loading) return <Loading />;
  if (!data || !canManageClass(user, data)) {
    return <Unavailable title="Класс недоступен" text="Откройте форму из класса, который вы ведёте." href="/teacher" label="К классам" />;
  }
  return <>{render(data, user)}</>;
}

function FormHead({ cls, title }: { cls: ClassRoom; title: string }) {
  return (
    <>
      <Link href={`/teacher/classes/${cls.id}`} className={styles.backLink}>← {cls.title}</Link>
      <h1 className={styles.title}>{title}</h1>
    </>
  );
}

export function NewLesson() {
  return <ManagedClass>{(cls) => <LessonForm cls={cls} />}</ManagedClass>;
}

export function NewAssignment() {
  return <ManagedClass>{(cls, user) => <AssignmentForm cls={cls} user={user} />}</ManagedClass>;
}

/* ---------- урок: тема, текст markdown-lite, материалы (ссылка / заметка / файл) ---------- */

function LessonForm({ cls }: { cls: ClassRoom }) {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [materials, setMaterials] = useState<MaterialRef[]>([]);
  const [kind, setKind] = useState<'link' | 'text'>('link');
  const [materialTitle, setMaterialTitle] = useState('');
  const [materialValue, setMaterialValue] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const files = materials.filter((m) => m.kind === 'file');
  const others = materials.filter((m) => m.kind !== 'file');

  const addMaterial = () => {
    const name = materialTitle.trim();
    const value = materialValue.trim();
    if (!name || !value) return setError(kind === 'link' ? 'Укажите название и адрес ссылки' : 'Укажите название и текст заметки');
    if (kind === 'link' && !isHttpUrl(value)) return setError('Ссылка должна начинаться с http:// или https://');
    setError('');
    setMaterials([...materials, kind === 'link' ? { id: newId(), kind, title: name, url: value } : { id: newId(), kind, title: name, body: value }]);
    setMaterialTitle('');
    setMaterialValue('');
  };

  const save = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setBusy(true);
    setError('');
    try {
      await getRepos().lessons.create({ classId: cls.id, title, body, materials });
      router.push(`/teacher/classes/${cls.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Урок не сохранён');
      setBusy(false);
    }
  };

  return (
    <>
      <FormHead cls={cls} title="Новый урок" />
      <form className={`${styles.card} ${styles.section} ${styles.form}`} onSubmit={save} aria-busy={busy}>
        <label className={styles.fieldLabel}>
          Тема урока
          <input className={styles.field} value={title} onChange={(e) => setTitle(e.target.value)} required maxLength={120} />
        </label>
        <label className={styles.fieldLabel}>
          Текст урока
          <textarea className={styles.field} value={body} onChange={(e) => setBody(e.target.value)} maxLength={20000} aria-describedby="lesson-md-hint" />
        </label>
        <p id="lesson-md-hint" className={styles.hint}>Разметка: «## » — подзаголовок, «- » — пункт списка, пустая строка — новый абзац.</p>

        <fieldset className={styles.fieldset}>
          <legend className={styles.legend}>Материалы</legend>
          {others.length ? (
            <ul className={styles.fileList} aria-label="Материалы урока">
              {others.map((m) => (
                <li key={m.id} className={styles.fileRow}>
                  <span>{m.kind === 'link' ? 'Ссылка' : 'Заметка'}: {m.title}</span>
                  <button type="button" className={styles.textButton} onClick={() => setMaterials(materials.filter((x) => x.id !== m.id))} aria-label={`Убрать материал ${m.title}`}>
                    Убрать
                  </button>
                </li>
              ))}
            </ul>
          ) : null}
          <div className={styles.fieldRow}>
            <label className={styles.fieldLabel}>
              Тип материала
              <select className={styles.field} value={kind} onChange={(e) => setKind(e.target.value as 'link' | 'text')}>
                <option value="link">Ссылка</option>
                <option value="text">Заметка</option>
              </select>
            </label>
            <label className={styles.fieldLabel}>
              Название материала
              <input className={styles.field} value={materialTitle} onChange={(e) => setMaterialTitle(e.target.value)} maxLength={120} />
            </label>
          </div>
          <label className={styles.fieldLabel}>
            {kind === 'link' ? 'Адрес ссылки' : 'Текст заметки'}
            {kind === 'link' ? (
              <input className={styles.field} value={materialValue} onChange={(e) => setMaterialValue(e.target.value)} inputMode="url" placeholder="https://" maxLength={500} />
            ) : (
              <textarea className={styles.field} value={materialValue} onChange={(e) => setMaterialValue(e.target.value)} maxLength={4000} />
            )}
          </label>
          <div>
            <button type="button" className={ui.buttonOutline} onClick={addMaterial}>Добавить материал</button>
          </div>
          <FilePicker files={files} onChange={(next) => setMaterials([...others, ...next])} disabled={busy} />
        </fieldset>

        {error ? <p className={styles.error} role="alert">{error}</p> : null}
        <div className={styles.actions}>
          <button type="submit" className={ui.buttonBlack} disabled={busy}>Опубликовать урок</button>
          <Link href={`/teacher/classes/${cls.id}`} className={ui.buttonOutline}>Отмена</Link>
        </div>
      </form>
    </>
  );
}

/* ---------- задание: название, условие, дедлайн, максимум баллов ---------- */

function AssignmentForm({ cls, user }: { cls: ClassRoom; user: User }) {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [brief, setBrief] = useState('');
  const [dueAt, setDueAt] = useState('');
  const [maxPoints, setMaxPoints] = useState('10');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const save = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setBusy(true);
    setError('');
    try {
      const assignment = await getRepos().assignments.create({ classId: cls.id, teacherId: user.id, title, brief, dueAt, maxPoints: Number(maxPoints) });
      track('lms_assignment_created', { maxPoints: assignment.maxPoints });
      router.push(`/teacher/classes/${cls.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Задание не сохранено');
      setBusy(false);
    }
  };

  return (
    <>
      <FormHead cls={cls} title="Новое задание" />
      <form className={`${styles.card} ${styles.section} ${styles.form}`} onSubmit={save} aria-busy={busy}>
        <label className={styles.fieldLabel}>
          Название задания
          <input className={styles.field} value={title} onChange={(e) => setTitle(e.target.value)} required maxLength={120} />
        </label>
        <label className={styles.fieldLabel}>
          Условие
          <textarea className={styles.field} value={brief} onChange={(e) => setBrief(e.target.value)} maxLength={10000} />
        </label>
        <div className={styles.fieldRow}>
          <label className={styles.fieldLabel}>
            Дедлайн
            <input className={styles.field} type="datetime-local" value={dueAt} onChange={(e) => setDueAt(e.target.value)} required />
          </label>
          <label className={styles.fieldLabel}>
            Максимум баллов
            <input className={styles.field} type="number" inputMode="numeric" min={1} max={1000} step={1} value={maxPoints} onChange={(e) => setMaxPoints(e.target.value)} required />
          </label>
        </div>
        {error ? <p className={styles.error} role="alert">{error}</p> : null}
        <div className={styles.actions}>
          <button type="submit" className={ui.buttonBlack} disabled={busy}>Выдать задание</button>
          <Link href={`/teacher/classes/${cls.id}`} className={ui.buttonOutline}>Отмена</Link>
        </div>
      </form>
    </>
  );
}
