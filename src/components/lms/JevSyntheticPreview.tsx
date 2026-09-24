'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { MicroLabel } from '@/components/ui/CleanUi';
import ui from '@/components/ui/CleanUi.module.css';
import { JEV_SYNTHETIC_FIXTURES, syntheticFixture } from '@/lib/jev/fixtures';
import { isJevLabelCode, JEV_LABELS, JEV_TAXONOMY_VERSION, labelTitle, type JevLabelCode } from '@/lib/jev/taxonomy';
import { getAuth } from '@/lib/lms/auth';
import { ROUTE_ROLES } from '@/lib/lms/permissions';
import RequireRole from './RequireRole';
import styles from './JevErrorPreview.module.css';

type Decision = 'confirmed' | 'changed' | 'unclear' | null;
type Suggestion = { fixtureId: string; code: JevLabelCode; source: 'jev' | 'rule' };
const localPreview = process.env.NODE_ENV === 'development'
  && process.env.NEXT_PUBLIC_JEV_LOCAL_PREVIEW === '1'
  && process.env.NEXT_PUBLIC_AUTH_PROVIDER !== 'supabase';

export function JevPreviewContent({ classContext }: { classContext?: { id: string; title: string } }) {
  const [fixtureId, setFixtureId] = useState(JEV_SYNTHETIC_FIXTURES[0].id);
  const [suggestion, setSuggestion] = useState<Suggestion | null>(null);
  const [showIllustration, setShowIllustration] = useState(false);
  const [requesting, setRequesting] = useState(false);
  const [requestMessage, setRequestMessage] = useState('');
  const [decision, setDecision] = useState<Decision>(null);
  const [editing, setEditing] = useState(false);
  const [alternative, setAlternative] = useState<JevLabelCode | ''>('');
  const requestSequence = useRef(0);
  const selectRef = useRef<HTMLSelectElement>(null);
  const editButtonRef = useRef<HTMLButtonElement>(null);
  const confirmButtonRef = useRef<HTMLButtonElement>(null);
  const decisionRef = useRef<HTMLDivElement>(null);
  const previousState = useRef<{ decision: Decision; editing: boolean }>({ decision: null, editing: false });

  const fixture = syntheticFixture(fixtureId) ?? JEV_SYNTHETIC_FIXTURES[0];
  const activeSuggestion = suggestion?.fixtureId === fixtureId ? suggestion : null;
  const canRequest = process.env.NEXT_PUBLIC_AUTH_PROVIDER === 'supabase' || localPreview;
  const suggestedCode = activeSuggestion?.code ?? (showIllustration ? fixture.illustrativeLabel : null);
  const sourceTag = activeSuggestion?.source === 'jev'
    ? 'Ответ Jev · без оценки уверенности'
    : activeSuggestion?.source === 'rule'
      ? 'Проверка правил · без Jev'
      : 'Ручной макет · без Jev';
  const alternatives = JEV_LABELS.filter((label) => label.code !== 'no_supported_label' && label.code !== suggestedCode);

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

  const chooseFixture = (id: string) => {
    requestSequence.current += 1;
    setFixtureId(id);
    setSuggestion(null);
    setShowIllustration(false);
    setRequesting(false);
    setRequestMessage('');
    setDecision(null);
    setEditing(false);
    setAlternative('');
  };

  const askJev = async () => {
    const sequence = ++requestSequence.current;
    setRequesting(true);
    setSuggestion(null);
    setShowIllustration(false);
    setRequestMessage('');
    try {
      const token = localPreview ? null : await getAuth().accessToken?.();
      if (!localPreview && !token) throw new Error('auth');
      const route = localPreview ? '/api/jev/local-preview' : '/api/jev/synthetic';
      const response = await fetch(`${route}?fixture=${encodeURIComponent(fixtureId)}`, {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        cache: 'no-store',
      });
      if (!response.ok) throw new Error(response.status === 403 ? 'access' : response.status === 429 ? 'limit' : 'unavailable');
      const data: unknown = await response.json();
      if (typeof data !== 'object' || data === null || !('code' in data) || !isJevLabelCode(data.code)
        || !('source' in data) || (data.source !== 'jev' && data.source !== 'rule')
        || !('taxonomyVersion' in data) || data.taxonomyVersion !== JEV_TAXONOMY_VERSION) {
        throw new Error('unavailable');
      }
      if (sequence !== requestSequence.current) return;
      setSuggestion({ fixtureId, code: data.code, source: data.source });
      setDecision(null);
      setEditing(false);
      setAlternative('');
      setRequestMessage(data.code === 'no_supported_label'
        ? 'Jev не предложил определённый тип. Учитель может указать его вручную.'
        : 'Получено предложение. Сверьте его с ответом и критерием.');
    } catch (error) {
      if (sequence !== requestSequence.current) return;
      setRequestMessage(error instanceof Error && error.message === 'access'
        ? localPreview ? 'Локальный запрос отклонён. Откройте страницу через 127.0.0.1 на этом компьютере.' : 'Этот аккаунт учителя не включён в закрытый пилот.'
        : error instanceof Error && error.message === 'limit'
          ? 'Дневной лимит запросов Jev для пилота исчерпан. Продолжите разбор вручную.'
        : error instanceof Error && error.message === 'auth'
          ? 'Для запроса нужен вход учителя через Supabase.'
        : 'Проверка сейчас недоступна. Можно открыть учебную подсказку.');
    } finally {
      if (sequence === requestSequence.current) setRequesting(false);
    }
  };

  return (
    <div className={styles.page}>
      <Link href={classContext ? `/teacher/classes/${classContext.id}` : '/teacher'} className={styles.backLink}>
        ← {classContext ? `К классу «${classContext.title}»` : 'К классам'}
      </Link>
      <MicroLabel>ПРОТОТИП · ВЫМЫШЛЕННЫЕ ПРИМЕРЫ</MicroLabel>
      <h1 className={styles.title}>Подсказка о типе ошибки</h1>
      <p className={styles.lead}>
        {classContext ? `Тренировка для учителя класса «${classContext.title}». ` : ''}
        Попробуйте короткий разбор на придуманном ответе ученика.
      </p>

      <div className={styles.fixturePicker}>
        <label className={styles.fieldLabel} htmlFor="jev-fixture">Выберите вымышленный ответ</label>
        <select
          id="jev-fixture"
          className={styles.select}
          value={fixtureId}
          onChange={(event) => chooseFixture(event.target.value)}
        >
          {JEV_SYNTHETIC_FIXTURES.map((item, index) => <option key={item.id} value={item.id}>Пример {index + 1}: {item.title}</option>)}
        </select>
        <span className={styles.version}>Первый пример уже выбран. Здесь меняется ситуация, а не тип ошибки.</span>
      </div>

      <ol className={styles.steps} aria-label="Как пользоваться проверкой">
        <li><strong>Выберите пример</strong><span>Прочитайте задание и ответ.</span></li>
        <li><strong>Нажмите «Проверить ответ»</strong><span>Увидите предложение Jev или результат простого правила.</span></li>
        <li><strong>Примите решение</strong><span>Подтвердите тип, исправьте его или укажите, что данных мало.</span></li>
      </ol>

      <aside className={styles.demoNotice} aria-label="Ограничения примера">
        <strong>Все ответы придуманы.</strong> Исходные предложения на странице заданы вручную.
        {localPreview
          ? ' Jev можно запросить только из локального режима на этом компьютере. '
          : ' Вызов Jev доступен только учителям закрытого Supabase-пилота после настройки серверного ключа. '}
        {classContext
          ? ' Ответы учеников этого класса не загружаются на эту страницу и не отправляются Jev.'
          : ' Здесь нет работ настоящих учеников.'}
      </aside>

      <div className={styles.grid}>
        <section className={styles.card} aria-labelledby="task-title">
          <div className={styles.cardHead}>
            <MicroLabel>ЗАДАНИЕ · ЧТЕНИЕ</MicroLabel>
            <span className={styles.fixtureTag}>Придуманный пример</span>
          </div>
          <h2 id="task-title" className={styles.cardTitle}>{fixture.title}</h2>
          <blockquote className={styles.quote}>“{fixture.source}”</blockquote>
          <p className={styles.question}>{fixture.question}</p>
          <p className={styles.rubric}><strong>Критерий:</strong> {fixture.rubric}</p>
          <div className={styles.answerBlock}>
            <span className={styles.answerLabel}>Ответ ученика · вымышленный</span>
            <p className={styles.answer}>{fixture.answer || 'Ответ не отправлен.'}</p>
          </div>
        </section>

        <section className={[styles.card, suggestedCode ? styles.suggestion : ''].filter(Boolean).join(' ')} aria-labelledby="suggestion-title">
          <div className={styles.cardHead}>
            <MicroLabel>РЕЗУЛЬТАТ ПРОВЕРКИ</MicroLabel>
            {suggestedCode ? <span className={styles.fixtureTag}>{sourceTag}</span> : null}
          </div>
          {suggestedCode ? (
            <>
              <h2 id="suggestion-title" className={styles.suggestedType}>{labelTitle(suggestedCode)}</h2>
              <p className={styles.explanation}>
                {activeSuggestion?.source === 'jev'
                  ? 'Это категория из чернового справочника, а не объяснение модели. Сверьте её с ответом и критерием.'
                  : fixture.illustrativeNote}
              </p>
              <p className={styles.teacherControl}>Решение принимает учитель. Подсказка не меняет оценку и не отправляется ученику.</p>
            </>
          ) : (
            <>
              <h2 id="suggestion-title" className={styles.suggestedType}>Пока нет предложения</h2>
              <p className={styles.explanation}>Нажмите кнопку ниже, чтобы проверить выбранный ответ.</p>
            </>
          )}

          {!suggestedCode ? (
            <div className={styles.pilotPanel}>
              {canRequest ? (
                <button type="button" className={ui.buttonBlack} disabled={requesting} onClick={() => void askJev()}>
                  {requesting ? 'Проверяем ответ…' : 'Проверить ответ'}
                </button>
              ) : null}
              {!canRequest || (requestMessage && !requesting) ? (
                <button type="button" className={ui.buttonOutline} onClick={() => { setShowIllustration(true); setRequestMessage(''); }}>
                  Показать учебную подсказку
                </button>
              ) : null}
              {canRequest ? <span>Сервер отправит Jev только этот придуманный материал. Простые случаи проверяются правилом.</span> : null}
            </div>
          ) : null}
          {requestMessage ? <p className={styles.requestMessage} role="status">{requestMessage}</p> : null}

          {decision ? (
            <div ref={decisionRef} className={styles.decision} role="status" aria-live="polite" tabIndex={-1}>
              <strong>
                {decision === 'confirmed'
                  ? suggestedCode === 'no_supported_label' ? 'Учитель подтвердил: ошибку не удалось определить.' : 'Предположение подтверждено в макете.'
                  : decision === 'changed'
                    ? `В макете выбран тип: ${labelTitle(alternative as JevLabelCode)}.`
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
                onChange={(event) => setAlternative(event.target.value as JevLabelCode)}
              >
                <option value="" disabled>Выберите тип</option>
                {alternatives.map((item) => <option key={item.code} value={item.code}>{item.title}</option>)}
              </select>
              <div className={styles.actions}>
                <button type="button" className={ui.buttonBlack} disabled={!alternative} onClick={() => { setDecision('changed'); setEditing(false); }}>
                  Подтвердить выбор
                </button>
                <button type="button" className={ui.buttonOutline} onClick={() => setEditing(false)}>Назад</button>
              </div>
            </div>
          ) : null}

          {suggestedCode && !decision && !editing ? (
            <div className={styles.actions} role="group" aria-label="Оценка предположения учителем">
              <button ref={confirmButtonRef} type="button" className={ui.buttonRed} disabled={requesting} onClick={() => setDecision('confirmed')}>
                {suggestedCode === 'no_supported_label' ? 'Подтвердить без типа ошибки' : 'Да, верно'}
              </button>
              <button ref={editButtonRef} type="button" className={ui.buttonOutline} disabled={requesting} onClick={() => { setAlternative(''); setEditing(true); }}>Нет, изменить</button>
              {suggestedCode !== 'no_supported_label' ? (
                <button type="button" className={styles.unclearButton} disabled={requesting} onClick={() => setDecision('unclear')}>Недостаточно данных</button>
              ) : null}
            </div>
          ) : null}

          {decision ? <button type="button" className={styles.resetButton} onClick={() => { setDecision(null); setEditing(false); setAlternative(''); }}>Изменить решение</button> : null}
        </section>
      </div>

      <p className={styles.footerNote}>
        Страница не читает сдачи и не сохраняет решения. Учительская классификация причин в mock-тестах остаётся отдельным действием.
      </p>
    </div>
  );
}

export default function JevSyntheticPreview() {
  return <RequireRole roles={ROUTE_ROLES.teacher}>{() => <JevPreviewContent />}</RequireRole>;
}
