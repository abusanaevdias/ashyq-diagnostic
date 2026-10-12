'use client';

import Link from 'next/link';
import { useState } from 'react';
import { trainerCatalog, type TrainerId } from '@/lib/trainers/catalog';
import { downloadTrainerRecord, useCheckpointRecord } from './TrainerCheckpoint';
import styles from './TrainerCheckpoint.module.css';

function HistoryCard({ trainer }: { trainer: TrainerId }) {
  const { record, raw } = useCheckpointRecord(trainer);
  const item = trainerCatalog.find(item => item.id === trainer)!;
  const [error, setError] = useState('');
  return <article className={styles.panel}>
    <p>{item.exam} · {item.skill}</p><h2>{item.title}</h2>
    {record?.checkpoint ? <><p>Последнее сохранение: {new Date(record.checkpoint.savedAt).toLocaleString('ru-RU')}</p><p>Занятий в истории: {record.history.length}. Это записи выполненной работы, не оценка уровня.</p><div className={styles.actions}><Link href={item.href}>Продолжить занятие →</Link><button type="button" onClick={() => { try { downloadTrainerRecord(record); } catch { setError('Не удалось подготовить файл. Открой тренажёр и скопируй нужные записи.'); } }}>Скачать сохранённые попытки</button></div></> : <><p>{raw ? 'Запись недоступна для восстановления. Открой тренажёр, чтобы скачать текущую работу или начать новую.' : 'Сохранённых попыток пока нет. Включи сохранение внутри тренажёра.'}</p><div className={styles.actions}><Link href={item.href}>Начать практику →</Link></div></>}
    {error && <p role="alert">{error}</p>}
  </article>;
}

export default function TrainerHistory() {
  return <><p>Здесь видны сохранения текущего аккаунта или гостевого режима в этом браузере. Они не синхронизируются между устройствами. История не является экзаменационным результатом; аудио в неё не входит.</p><div>{trainerCatalog.map(item => <HistoryCard key={item.id} trainer={item.id}/>)}</div></>;
}
