'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { MicroLabel } from '@/components/ui/CleanUi';
import ui from '@/components/ui/CleanUi.module.css';
import { ROUTE_ROLES } from '@/lib/lms/permissions';
import RequireRole from './RequireRole';
import styles from './JevErrorPreview.module.css';

type Decision = 'confirmed' | 'changed' | 'unclear' | null;

const ALTERNATIVES = [
  'Неполный ответ',
  'Ответ противоречит тексту',
] as const;

function PreviewCard() {
  const [decision, setDecision] = useState<Decision>(null);
  const [editing, setEditing] = useState(false);
  const [alternative, setAlternative] = useState('');
  const selectRef = useRef<HTMLSelectElement>(null);
  const editButtonRef = useRef<HTMLButtonElement>(null);
  const confirmButtonRef = useRef<HTMLButtonElement>(null);
  const decisionRef = useRef<HTMLDivElement>(null);
  const previousState = useRef<{ decision: Decision; editing: boolean }>({ decision: null, editing: false });

  useEffect(() => {
    const previous = previousState.current;
    if (decision && !previous.decision) {
      decisionRef.current?.focus();
    } else if (!decision && previous.decision) {
      confirmButtonRef.current?.focus();
    } else if (editing && !previous.editing) {
      selectRef.current?.focus();
    } else if (!editing && previous.editing && !decision) {
      editButtonRef.current?.focus();
    }
    previousState.current = { decision, editing };
  }, [decision, editing]);

  const reset = () => {
    setDecision(null);
    setEditing(false);
    setAlternative('');
  };

  return (
    <div className={styles.page}>
      <Link href="/teacher" className={styles.backLink}>← К классам</Link>
      <MicroLabel>ПРОТОТИП · РУЧНОЙ ПРИМЕР</MicroLabel>
      <h1 className={styles.title}>Подсказка о типе ошибки</h1>
      <p className={styles.lead}>
        Система предлагает наблюдаемый тип ошибки. Учитель подтверждает его,
        меняет или отмечает, что данных недостаточно.
      </p>

      <aside className={styles.demoNotice} aria-label="Ограничения примера">
        <strong>Синтетический пример.</strong> Текст и предположение заданы вручную.
        Jev не вызывался; работа реального ученика не загружалась.
      </aside>

      <div className={styles.grid}>
        <section className={styles.card} aria-labelledby="task-title">
          <div className={styles.cardHead}>
            <MicroLabel>ЗАДАНИЕ · АНГЛИЙСКИЙ</MicroLabel>
            <span className={styles.fixtureTag}>Придуманный пример</span>
          </div>
          <h2 id="task-title" className={styles.cardTitle}>Прочитайте предложение</h2>
          <blockquote className={styles.quote}>
            “The museum stayed open, although the power had failed.”
          </blockquote>
          <p className={styles.question}>
            Что здесь показывает слово <strong>although</strong>?
          </p>
          <div className={styles.answerBlock}>
            <span className={styles.answerLabel}>Ответ ученика · вымышленный</span>
            <p className={styles.answer}>
              «Музей закрылся из-за отключения электричества».
            </p>
          </div>
        </section>

        <section className={[styles.card, styles.suggestion].join(' ')} aria-labelledby="suggestion-title">
          <div className={styles.cardHead}>
            <MicroLabel>ПРЕДПОЛОЖЕНИЕ СИСТЕМЫ</MicroLabel>
          <span className={styles.fixtureTag}>Макет, не ответ модели</span>
          </div>
          <h2 id="suggestion-title" className={styles.suggestedType}>
            В ответе противопоставление заменено причинной связью
          </h2>
          <p className={styles.explanation}>
            В предложении музей продолжил работу вопреки отключению электричества;
            ответ меняет это на «закрылся из-за отключения».
          </p>
          <p className={styles.teacherControl}>
            Учитель принимает решение. Подсказка не меняет оценку и не отправляется ученику.
          </p>

          {decision ? (
            <div ref={decisionRef} className={styles.decision} role="status" aria-live="polite" tabIndex={-1}>
              <strong>
                {decision === 'confirmed'
                  ? 'Предположение подтверждено в макете.'
                  : decision === 'changed'
                    ? 'В макете выбран тип: ' + alternative + '.'
                    : 'В макете отмечено: данных недостаточно.'}
              </strong>
              <span>Решение осталось только в состоянии этой страницы и нигде не сохранено.</span>
            </div>
          ) : null}

          {editing && !decision ? (
            <div className={styles.editPanel}>
              <label className={styles.fieldLabel} htmlFor="alternative-type">Выберите другой тип</label>
              <select
                ref={selectRef}
                id="alternative-type"
                className={styles.select}
                value={alternative}
                onChange={(event) => setAlternative(event.target.value)}
              >
                <option value="" disabled>Выберите тип</option>
                {ALTERNATIVES.map((item) => <option key={item} value={item}>{item}</option>)}
              </select>
              <div className={styles.actions}>
                <button type="button" className={ui.buttonBlack} disabled={!alternative} onClick={() => { setDecision('changed'); setEditing(false); }}>
                  Подтвердить выбор
                </button>
                <button type="button" className={ui.buttonOutline} onClick={() => setEditing(false)}>
                  Назад
                </button>
              </div>
            </div>
          ) : null}

          {!decision && !editing ? (
            <div className={styles.actions} role="group" aria-label="Оценка предположения учителем">
              <button ref={confirmButtonRef} type="button" className={ui.buttonRed} onClick={() => setDecision('confirmed')}>
                Да, верно
              </button>
              <button ref={editButtonRef} type="button" className={ui.buttonOutline} onClick={() => { setAlternative(''); setEditing(true); }}>
                Нет, изменить
              </button>
              <button type="button" className={styles.unclearButton} onClick={() => setDecision('unclear')}>
                Недостаточно данных
              </button>
            </div>
          ) : null}

          {decision ? (
            <button type="button" className={styles.resetButton} onClick={reset}>
              Сбросить пример
            </button>
          ) : null}
        </section>
      </div>

      <p className={styles.footerNote}>
        Это отдельный preview интерфейса учителя: он не читает сдачи, не пишет в базу и не вызывает внешние API.
      </p>
    </div>
  );
}

export default function JevErrorPreview() {
  return <RequireRole roles={ROUTE_ROLES.teacher}>{() => <PreviewCard />}</RequireRole>;
}
