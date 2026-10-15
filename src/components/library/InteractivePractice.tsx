'use client';

import { useRef, useState } from 'react';
import { checkPracticeAnswer, type PracticeSet } from '@/lib/library-practice';
import { emptyProgress, practiceFields, progressSource, readProgress } from '@/lib/library-progress';
import { useDeviceProgress } from './useDeviceProgress';
import { englishProduction } from '@/lib/library-presentation';
import styles from './Library.module.css';

export default function InteractivePractice({ set }: { set: PracticeSet }) {
  const source = progressSource(set);
  const saved = useDeviceProgress(set.code);
  const parsed = readProgress(saved.raw, source, practiceFields(set));
  const {current, values, checked} = parsed ?? emptyProgress(source);
  function save(patch: Partial<ReturnType<typeof emptyProgress>>) {
    saved.update(JSON.stringify({...parsed, ...patch}));
  }
  const [notice, setNotice] = useState('');
  const heading = useRef<HTMLHeadingElement>(null);
  const question = set.questions[current];
  const value = values[question.id] ?? '';
  const result = checked[question.id] ? checkPracticeAnswer(question, value) : null;
  const automatic = set.questions.filter((question) => question.mode === 'auto' && checked[question.id]);
  const correct = automatic.filter((question) => checkPracticeAnswer(question, values[question.id] ?? '') === true).length;
  function change(value: string) { save({values: {...values, [question.id]: value}, checked: {...checked, [question.id]: false}}); setNotice(''); }
  function go(index: number) { save({current: index}); setNotice(''); requestAnimationFrame(() => heading.current?.focus()); }
  function copy() {
    const text = set.questions.map((q) => `${q.id}: ${values[q.id] ?? ''}`).join('\n\n');
    if (!navigator.clipboard) { setNotice('Выделите ответы вручную перед выходом; копирование недоступно.'); return; }
    navigator.clipboard.writeText(text).then(() => setNotice('Ответы скопированы.'), () => setNotice('Браузер не разрешил копирование. Выделите ответы вручную.'));
  }
  return <section className={styles.quiz} aria-label={`Интерактивная практика ${set.code}`}>
    <div className={styles.quizTop}><strong>Решайте прямо здесь</strong><span>Вопрос {current + 1} / {set.questions.length}</span></div>
    <p className={styles.small}>Выберите или впишите ответ — получите проверку и разбор. Свободные ответы сравниваются с образцом, без автоматического IELTS-балла. Ответы автоматически сохраняются в этом браузере на этом устройстве. Они не отправляются ASHYQ или ИИ. На общем устройстве их увидит следующий пользователь; удалите их кнопкой «Начать заново».</p>
    {set.instructions && <details className={styles.quizInstructions}><summary>Инструкция к заданиям</summary><p>{set.instructions}</p></details>}
    {(!parsed || saved.problem) && <div className={styles.quizFeedback} role="alert"><p>{saved.problem || 'Сохранённый блок повреждён или задания обновились. Старые данные не перезаписаны. Скопируйте их перед очисткой.'}</p><details><summary>Сохранённые данные для копирования</summary><pre className={styles.quizExport}>{saved.raw}</pre></details>{saved.problem && <button type="button" onClick={()=>{if(confirm('Заменить текущие ответы сохранённой версией? Сначала скопируйте несохранённые правки.')) saved.reload();}}>Загрузить сохранённую версию</button>}</div>}
    <fieldset disabled={!saved.ready || !parsed} className={styles.practiceFields} aria-label="Ответ и навигация по заданиям">
    <nav className={styles.quizSteps} aria-label={`Вопросы ${set.code}`}>{set.questions.map((q, i) => {
      const grade = checked[q.id] ? checkPracticeAnswer(q, values[q.id] ?? '') : null;
      const state = checked[q.id] ? grade === true ? 'correct' : grade === false ? 'wrong' : 'reviewed' : values[q.id]?.trim() ? 'draft' : 'empty';
      const label = {correct:'верно',wrong:'неверно',reviewed:'сравнён с образцом, без оценки',draft:'есть ответ',empty:''}[state];
      return <button type="button" key={q.id} data-result={state} aria-label={`Вопрос ${i + 1}${label ? ` — ${label}` : ''}`} aria-current={current === i ? 'step' : undefined} onClick={() => go(i)}>{i + 1}{state === 'correct' ? ' ✓' : state === 'wrong' ? ' ×' : state === 'reviewed' ? ' ○' : state === 'draft' ? ' ·' : ''}</button>;
    })}</nav>
    <p className={styles.small}>✓ Верно · × Неверно · ○ Без оценки. Точка — есть черновик. Обводка — текущий вопрос.</p>
    <h3 ref={heading} tabIndex={-1} className={styles.quizHeading}>{question.id}</h3>
    <p className={styles.quizPrompt} id={`prompt-${question.id}`}>{question.prompt}</p>
    {question.mode==='compare' && <p className={styles.languageHint}>{englishProduction(question) ? question.id.startsWith('SP') ? 'Отвечайте на английском. В поле можно записать ответ или план перед устной попыткой.' : 'Пишите ответ на английском. Инструкция может быть по-русски; сам текст для экзамена — на английском.' : 'Пояснение можно дать по-русски. Цитаты и правки английского текста пишите на английском.'}</p>}
    {question.options.length ? <fieldset className={styles.quizOptions}><legend>Выберите ответ</legend>{question.options.map((option) => <label key={option.value}><input type="radio" name={`answer-${question.id}`} value={option.value} checked={value === option.value} onChange={() => change(option.value)} /><span>{option.value === option.label ? option.label : `${option.value}. ${option.label}`}</span></label>)}</fieldset>
      : question.mode === 'auto' ? <label className={styles.quizInput}>Ваш ответ<input value={value} maxLength={200} aria-describedby={`prompt-${question.id}`} onChange={(event) => change(event.target.value)} autoComplete="off" /></label>
      : <label className={styles.quizInput}>Ваш ответ<textarea aria-label="Ваш ответ" value={value} maxLength={24000} aria-describedby={`prompt-${question.id}`} onChange={(event) => change(event.target.value)} rows={6} /><span>Слов: {value.trim() ? value.trim().split(/\s+/).length : 0}</span></label>}
    <div className={styles.quizActions}><button className={styles.quizCheck} type="button" disabled={!value.trim()} onClick={() => save({checked: {...checked, [question.id]: true}})}>{question.mode === 'auto' ? 'Проверить ответ' : 'Сравнить с образцом'}</button></div>
    {checked[question.id] && <div className={styles.quizFeedback} data-result={result === true ? 'correct' : result === false ? 'wrong' : 'reviewed'} role="status"><strong>{result === true ? 'Верно' : result === false ? 'Пока неверно — разберите отличие' : 'Сравните смысл и критерии'}</strong>
      {question.mode === 'auto' && <p>Ключ: {question.accepted.join(' / ')}</p>}
      {question.model ? <><p>{question.model}</p>{question.explanation !== question.model && <p>{question.explanation}</p>}</> : <p>Отдельного однозначного ключа в материале нет. Сверьтесь с примерами и критериями этого раздела; содержательную оценку даёт преподаватель.</p>}
      {question.mode === 'compare' && <p>Это возможный вариант, а не единственная допустимая формулировка. Автоматически «верно/неверно» не выставляется.</p>}
    </div>}
    <div className={styles.quizActions}><button type="button" disabled={current === 0} onClick={() => go(current - 1)}>← Назад</button><button type="button" disabled={current === set.questions.length - 1} onClick={() => go(current + 1)}>Следующий вопрос →</button></div>
    <p className={styles.small} aria-live="polite">Разобрано: {Object.values(checked).filter(Boolean).length} / {set.questions.length}{automatic.length > 0 ? ` · Автопроверка: ${correct} верных из ${automatic.length} проверенных` : ''}. Это результаты упражнений, не балл экзамена.</p>
    </fieldset>
    <div className={styles.quizActions}><button type="button" disabled={!Object.values(values).some(Boolean)} onClick={copy}>Скопировать ответы</button><button type="button" onClick={() => { if (confirm('Очистить ответы этого блока? Восстановить их нельзя.')) { setNotice(saved.update('', true) ? 'Ответы очищены.' : 'Удаление не выполнено. Смотрите предупреждение выше.'); } }}>Начать заново</button></div>
    <p role="status" className={styles.small}>{notice || (saved.problem ? 'Есть несохранённые изменения — скопируйте ответы.' : saved.ready && parsed ? 'Сохранено на этом устройстве.' : 'Загружаем ответы…')}</p>
    <details className={styles.quizInstructions}><summary>Все мои ответы для ручного копирования</summary><pre className={styles.quizExport}>{set.questions.map((q) => `${q.id}: ${values[q.id] ?? ''}`).join('\n\n')}</pre></details>
  </section>;
}
