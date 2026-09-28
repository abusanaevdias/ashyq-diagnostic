'use client';

import { useRef, useState } from 'react';
import { checkPracticeAnswer, type PracticeSet } from '@/lib/library-practice';
import styles from './Library.module.css';

export default function InteractivePractice({ set }: { set: PracticeSet }) {
  const [current, setCurrent] = useState(0);
  const [values, setValues] = useState<Record<string, string>>({});
  const [checked, setChecked] = useState<Record<string, boolean>>({});
  const [notice, setNotice] = useState('');
  const heading = useRef<HTMLHeadingElement>(null);
  const question = set.questions[current];
  const value = values[question.id] ?? '';
  const result = checked[question.id] ? checkPracticeAnswer(question, value) : null;
  const automatic = set.questions.filter((question) => question.mode === 'auto' && checked[question.id]);
  const correct = automatic.filter((question) => checkPracticeAnswer(question, values[question.id] ?? '') === true).length;
  function change(value: string) { setValues((old) => ({ ...old, [question.id]: value })); setChecked((old) => ({ ...old, [question.id]: false })); setNotice(''); }
  function go(index: number) { setCurrent(index); setNotice(''); requestAnimationFrame(() => heading.current?.focus()); }
  function copy() {
    const text = set.questions.map((q) => `${q.id}: ${values[q.id] ?? ''}`).join('\n\n');
    if (!navigator.clipboard) { setNotice('Выделите ответы вручную перед выходом; копирование недоступно.'); return; }
    navigator.clipboard.writeText(text).then(() => setNotice('Ответы скопированы.'), () => setNotice('Браузер не разрешил копирование. Выделите ответы вручную.'));
  }
  return <section className={styles.quiz} aria-label={`Интерактивная практика ${set.code}`}>
    <div className={styles.quizTop}><strong>Решайте прямо здесь</strong><span>Вопрос {current + 1} / {set.questions.length}</span></div>
    <p className={styles.small}>Выберите или впишите ответ — получите проверку и разбор. Свободные ответы сравниваются с образцом, без автоматического IELTS-балла. Ответы не отправляются и исчезнут при переходе или перезагрузке.</p>
    {set.instructions && <details className={styles.quizInstructions}><summary>Инструкция к заданиям</summary><p>{set.instructions}</p></details>}
    <nav className={styles.quizSteps} aria-label={`Вопросы ${set.code}`}>{set.questions.map((q, i) => <button type="button" key={q.id} aria-label={`Вопрос ${i + 1}${checked[q.id] ? ' — разобран' : values[q.id] ? ' — есть ответ' : ''}`} aria-current={current === i ? 'step' : undefined} onClick={() => go(i)}>{i + 1}{checked[q.id] ? ' ✓' : values[q.id] ? ' ·' : ''}</button>)}</nav>
    <h3 ref={heading} tabIndex={-1} className={styles.quizHeading}>{question.id}</h3>
    <p className={styles.quizPrompt} id={`prompt-${question.id}`}>{question.prompt}</p>
    {question.options.length ? <fieldset className={styles.quizOptions}><legend>Выберите ответ</legend>{question.options.map((option) => <label key={option.value}><input type="radio" name={`answer-${question.id}`} value={option.value} checked={value === option.value} onChange={() => change(option.value)} /><span>{option.value === option.label ? option.label : `${option.value}. ${option.label}`}</span></label>)}</fieldset>
      : question.mode === 'auto' ? <label className={styles.quizInput}>Ваш ответ<input value={value} maxLength={200} aria-describedby={`prompt-${question.id}`} onChange={(event) => change(event.target.value)} autoComplete="off" /></label>
      : <label className={styles.quizInput}>Ваш ответ<textarea aria-label="Ваш ответ" value={value} maxLength={24000} aria-describedby={`prompt-${question.id}`} onChange={(event) => change(event.target.value)} rows={6} /><span>Слов: {value.trim() ? value.trim().split(/\s+/).length : 0}</span></label>}
    <div className={styles.quizActions}><button className={styles.quizCheck} type="button" disabled={!value.trim()} onClick={() => setChecked((old) => ({ ...old, [question.id]: true }))}>{question.mode === 'auto' ? 'Проверить ответ' : 'Сравнить с образцом'}</button></div>
    {checked[question.id] && <div className={styles.quizFeedback} role="status"><strong>{result === true ? 'Верно' : result === false ? 'Пока неверно — разберите отличие' : 'Сравните смысл и критерии'}</strong>
      {question.mode === 'auto' && <p>Ключ: {question.accepted.join(' / ')}</p>}
      {question.model ? <><p>{question.model}</p>{question.explanation !== question.model && <p>{question.explanation}</p>}</> : <p>Отдельного однозначного ключа в материале нет. Сверьтесь с примерами и критериями этого раздела; содержательную оценку даёт преподаватель.</p>}
      {question.mode === 'compare' && <p>Это возможный вариант, а не единственная допустимая формулировка. Автоматически «верно/неверно» не выставляется.</p>}
    </div>}
    <div className={styles.quizActions}><button type="button" disabled={current === 0} onClick={() => go(current - 1)}>← Назад</button><button type="button" disabled={current === set.questions.length - 1} onClick={() => go(current + 1)}>Следующий вопрос →</button></div>
    <p className={styles.small} aria-live="polite">Разобрано: {Object.values(checked).filter(Boolean).length} / {set.questions.length}{automatic.length > 0 ? ` · Автопроверка: ${correct} верных из ${automatic.length} проверенных` : ''}. Это результаты упражнений, не балл экзамена.</p>
    <div className={styles.quizActions}><button type="button" disabled={!Object.values(values).some(Boolean)} onClick={copy}>Скопировать ответы</button><button type="button" onClick={() => { if (confirm('Очистить ответы этого блока? Восстановить их нельзя.')) { setValues({}); setChecked({}); setCurrent(0); setNotice('Ответы очищены.'); } }}>Начать заново</button></div>
    <p role="status" className={styles.small}>{notice}</p>
    <details className={styles.quizInstructions}><summary>Все мои ответы для ручного копирования</summary><pre className={styles.quizExport}>{set.questions.map((q) => `${q.id}: ${values[q.id] ?? ''}`).join('\n\n')}</pre></details>
  </section>;
}
