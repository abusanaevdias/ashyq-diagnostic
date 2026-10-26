'use client';

import Link from 'next/link';
import { useState } from 'react';
import type { TrainerRecord } from '@/lib/trainers/checkpoints';
import type { trainerCatalog } from '@/lib/trainers/catalog';
import { practiceOutcome, type PracticeOutcome } from '@/lib/trainers/outcomes';
import { downloadTrainerRecord, useCheckpointLibrary } from './TrainerCheckpoint';
import PracticeOutcomeView from './PracticeOutcomeView';
import TrainerPracticeLink from './TrainerPracticeLink';
import HistoryResume, { savedStage } from './HistoryResume';
import styles from './TrainerHistory.module.css';
import { latestCompleted, practiceJourney } from '@/lib/trainers/journey';

type Row = { item: typeof trainerCatalog[number]; record: TrainerRecord | null; raw: string | null };
function latestTime(record: TrainerRecord | null) {
  return Math.max(0, ...[record?.checkpoint, ...(record?.history ?? [])].flatMap(entry => entry ? [Date.parse(entry.savedAt)] : []));
}
function verdict(outcome: PracticeOutcome | null | undefined) {
  if (!outcome?.complete) return { text: 'Занятие ещё не завершено', kind: 'neutral' };
  if (outcome.checks.some(check => check.matches === false)) return { text: 'Есть ответы для повторного разбора', kind: 'review' };
  if (outcome.checks.length && outcome.checks.every(check => check.matches === true)) return { text: 'Проверяемые ответы совпали с разбором', kind: 'good' };
  return { text: 'Есть итог · нужна самопроверка', kind: 'neutral' };
}
function HistoryCard({ item, record, raw }: Row) {
  const [error, setError] = useState('');
  const current = record?.checkpoint ? practiceOutcome(item.id, record.checkpoint.data) : null;
  const latest = latestCompleted(item.id, record);
  const outcome = latest?.outcome;
  const hasData = Boolean(record?.checkpoint || record?.history.length);
  const summary = current && !current.complete ? verdict(current) : verdict(outcome);
  const date = latestTime(record);
  return <article className={styles.historyCard}>
    <div className={styles.rowHeading}><div><p className={styles.rowMeta}>{item.exam} / {item.skill}</p><h3>{item.title}</h3></div>{hasData && <p className={styles.verdict} data-kind={summary.kind}>{summary.text}</p>}</div>
    {hasData ? <>
      {date > 0 && <p className={styles.timestamp}>Последняя запись: <time dateTime={new Date(date).toISOString()}>{new Date(date).toLocaleString('ru-RU')}</time></p>}
      {record?.checkpoint && !current?.complete && <p className={styles.rowStage}>Сохранённый этап: {savedStage(record.checkpoint.data)}</p>}
      <div className={styles.rowActions}><TrainerPracticeLink href={item.href}>Продолжить занятие →</TrainerPracticeLink><button type="button" onClick={() => { try { downloadTrainerRecord(record!); } catch { setError('Не удалось подготовить файл. Открой тренажёр и скопируй нужные записи.'); } }}>Скачать сохранённые попытки</button></div>
      <details className={styles.details}><summary>Итог и история сохранений</summary><p>Занятий в истории: {record!.history.length}. Это записи выполненной работы, не оценка уровня.</p>{outcome ? <><p>Последний завершённый результат: {new Date(latest!.entry.savedAt).toLocaleString('ru-RU')}{current && !current.complete ? '. Текущая попытка ещё не завершена.' : '.'}</p><PracticeOutcomeView outcome={outcome}/></> : <p>Завершённого результата пока нет. Продолжи сохранённую попытку.</p>}</details>
    </> : raw && !record ? <><p className={styles.recovery}>Запись недоступна для восстановления. Открой сохранения тренажёра, чтобы скачать исходную запись или продолжить работу. Повреждённые данные не удалены.</p><TrainerPracticeLink className={styles.rowLink} href={`${item.href}#saved-work`}>Открыть сохранения тренажёра →</TrainerPracticeLink></> : <><p className={styles.rowStage}>Сохранённых попыток пока нет. Включи сохранение внутри тренажёра.</p><TrainerPracticeLink className={styles.rowLink} href={item.href}>Начать практику →</TrainerPracticeLink></>}
    {error && <p className={styles.recovery} role="alert">{error}</p>}
  </article>;
}

export default function TrainerHistory() {
  const { entries, ready } = useCheckpointLibrary();
  const [exam, setExam] = useState('all');
  const [savedOnly, setSavedOnly] = useState(true);
  const matching = entries.filter(entry => exam === 'all' || entry.item.exam === exam);
  const selected = matching.filter(entry => !savedOnly || Boolean(entry.raw)).sort((a, b) => latestTime(b.record) - latestTime(a.record));
  const journey = practiceJourney(matching);
  const resume = ready && journey.latest?.outcome && !journey.latest.outcome.complete ? journey.latest : null;
  const queue = journey.repeat;
  const hasAny = entries.some(entry => Boolean(entry.raw));
  const unavailable = ready && entries.every(entry => entry.raw === '!storage-unavailable');
  return <div className={styles.history}>
    <p className={styles.lead}>Твои попытки, разборы и следующий шаг.</p>
    <p className={styles.device}>Сохранения этого браузера · текущий аккаунт или гостевой режим</p>
    <details className={styles.storage}><summary>Как сохранить и перенести ответы</summary><p>Здесь видны сохранения текущего аккаунта или гостевого режима в этом браузере. Автоматической синхронизации нет; перенос возможен через файл. История не является экзаменационным результатом; аудио в неё не входит.</p><p>Включи сохранение внутри нужного тренажёра. Там же можно скачать текущую работу и загрузить файл переноса. Очистка данных браузера может удалить локальные записи.</p><Link href="/trainers">Выбрать тренажёр →</Link></details>
    {ready && !unavailable && resume && <HistoryResume item={resume.item} data={resume.entry.data}/>}
    <div className={styles.historyHeading}><h2>История занятий</h2><fieldset className={styles.filters}><legend>Показать занятия</legend><div className={styles.examChoices}>{[['all','Все'],['IELTS','IELTS'],['SAT','SAT']].map(([value,label]) => <button type="button" key={value} aria-pressed={exam === value} onClick={() => setExam(value)}>{label}</button>)}</div><label><input type="checkbox" checked={savedOnly} onChange={event => setSavedOnly(event.target.checked)}/> Только с локальными записями</label></fieldset></div>
    {!ready ? <section className={styles.empty} role="status"><h3>Загружаем сохранённые занятия…</h3><p>Сначала проверим записи этого браузера.</p></section> : unavailable ? <section className={styles.empty} role="alert"><h3>Не удалось прочитать сохранения</h3><p>Браузер не предоставил доступ к данным. Это не означает, что занятий нет. Разреши доступ к данным сайта в настройках браузера и обнови страницу.</p><button className={styles.lightButton} type="button" onClick={() => window.location.reload()}>Обновить страницу</button></section> : <>
      {queue.length > 0 && <section className={styles.queue} aria-labelledby="review-queue"><h2 id="review-queue">Что повторить</h2><p>В последнем сохранённом результате этих тренажёров есть несовпадения с разбором. Это подсказка для следующего занятия, а не диагноз навыка.</p><ul>{queue.map(({ item }) => <li key={item.id}><TrainerPracticeLink href={`${item.href}#saved-work`}>{item.title}<span aria-hidden="true">→</span></TrainerPracticeLink></li>)}</ul></section>}
      {selected.length ? <div>{selected.map(entry => <HistoryCard key={entry.item.id} {...entry}/>)}</div> : <section className={styles.empty}>{hasAny && <p className={styles.rowMeta}>По выбранному фильтру</p>}<h2>Здесь пока нет сохранённых занятий</h2><p>{hasAny ? 'В этом фильтре записей нет. Выбери другой экзамен или покажи все тренажёры.' : 'Первая попытка начинается с одного упражнения. Открой тренажёр и включи сохранение, чтобы вернуться к своей работе позже.'}</p><div className={styles.emptyActions}>{hasAny && <button type="button" className={styles.lightButton} onClick={() => { setExam('all'); setSavedOnly(false); }}>Показать все тренажёры</button>}<Link className={styles.darkButton} href="/trainers">Выбрать тренажёр →</Link></div></section>}
    </>}
  </div>;
}
