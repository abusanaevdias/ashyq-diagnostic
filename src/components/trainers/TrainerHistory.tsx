'use client';

import Link from 'next/link';
import { useState } from 'react';
import type { TrainerRecord } from '@/lib/trainers/checkpoints';
import type { trainerCatalog } from '@/lib/trainers/catalog';
import { practiceOutcome } from '@/lib/trainers/outcomes';
import { downloadTrainerRecord, useCheckpointLibrary } from './TrainerCheckpoint';
import PracticeOutcomeView from './PracticeOutcomeView';
import TrainerPracticeLink from './TrainerPracticeLink';
import styles from './TrainerCheckpoint.module.css';

function HistoryCard({ item, record, raw }: { item: typeof trainerCatalog[number]; record: TrainerRecord | null; raw: string | null }) {
  const [error, setError] = useState('');
  const current = record?.checkpoint ? practiceOutcome(item.id, record.checkpoint.data) : null;
  const last = current?.complete ? record!.checkpoint : record?.history.find(entry => practiceOutcome(item.id, entry.data)?.complete);
  const outcome = last ? practiceOutcome(item.id, last.data) : null;
  return <article className={styles.panel}>
    <p>{item.exam} · {item.skill}</p><h2>{item.title}</h2>
    {record?.checkpoint ? <><p>Последнее сохранение: {new Date(record.checkpoint.savedAt).toLocaleString('ru-RU')}</p><p>Занятий в истории: {record.history.length}. Это записи выполненной работы, не оценка уровня.</p>
      {outcome && <><p>Последний сохранённый результат: {new Date(last!.savedAt).toLocaleString('ru-RU')}{!current?.complete ? '. Текущая попытка ещё не завершена.' : '.'}</p><PracticeOutcomeView outcome={outcome}/></>}
      <div className={styles.actions}><TrainerPracticeLink href={item.href}>Продолжить занятие →</TrainerPracticeLink><button type="button" onClick={() => { try { downloadTrainerRecord(record); } catch { setError('Не удалось подготовить файл. Открой тренажёр и скопируй нужные записи.'); } }}>Скачать сохранённые попытки</button></div></> : <><p>{raw ? 'Запись недоступна для восстановления. Открой тренажёр, чтобы скачать текущую работу или начать новую.' : 'Сохранённых попыток пока нет. Включи сохранение внутри тренажёра.'}</p><div className={styles.actions}><TrainerPracticeLink href={item.href}>Начать практику →</TrainerPracticeLink></div></>}
    {error && <p role="alert">{error}</p>}
  </article>;
}

export default function TrainerHistory() {
  const { entries, ready } = useCheckpointLibrary();
  const [exam, setExam] = useState('all');
  const [savedOnly, setSavedOnly] = useState(true);
  const selected = entries.filter(entry => (exam === 'all' || entry.item.exam === exam) && (!savedOnly || Boolean(entry.raw)));
  const queue = entries.filter(({ item, record }) => {
    const current = record?.checkpoint && practiceOutcome(item.id, record.checkpoint.data);
    const latest = current?.complete ? current : record?.history.map(entry => practiceOutcome(item.id, entry.data)).find(outcome => outcome?.complete);
    return latest?.repeat === true && (exam === 'all' || item.exam === exam);
  });
  return <><p>Здесь видны сохранения текущего аккаунта или гостевого режима в этом браузере. Автоматической синхронизации нет; перенос возможен через файл. История не является экзаменационным результатом; аудио в неё не входит.</p>
    <fieldset className={styles.filters}><legend>Показать занятия</legend><div className={styles.actions}>{[['all','Все'],['IELTS','IELTS'],['SAT','SAT']].map(([value,label]) => <button type="button" key={value} aria-pressed={exam === value} onClick={() => setExam(value)}>{label}</button>)}</div><label><input type="checkbox" checked={savedOnly} onChange={event => setSavedOnly(event.target.checked)}/> Только с локальными записями</label></fieldset>
    {queue.length > 0 && <section className={styles.panel} aria-labelledby="review-queue"><h2 id="review-queue">Что повторить</h2><p>В последнем сохранённом результате этих тренажёров есть несовпадения с разбором. Это подсказка для следующего занятия, а не диагноз навыка.</p><ul>{queue.map(({ item }) => <li key={item.id}><TrainerPracticeLink href={item.href}>{item.title} →</TrainerPracticeLink></li>)}</ul></section>}
    {!ready ? <p role="status">Загружаем записи…</p> : selected.length ? <div>{selected.map(entry => <HistoryCard key={entry.item.id} {...entry}/>)}</div> : <section className={styles.panel}><h2>Здесь пока нет сохранённых занятий</h2><p>Открой тренажёр и включи сохранение. Можно также показать все тренажёры с помощью фильтра выше.</p><div className={styles.actions}><Link href="/trainers">Выбрать тренажёр →</Link></div></section>}
  </>;
}
