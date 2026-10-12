'use client';

import Link from 'next/link';
import { useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { useSession } from '@/lib/lms/hooks';
import { trainerById, type TrainerId } from '@/lib/trainers/catalog';
import { archiveEntry, checkpointKey, createEntry, emptyRecord, MAX_RECORD_BYTES, parseRecord, utf8Bytes, validSnapshot, type Snapshot, type TrainerRecord } from '@/lib/trainers/checkpoints';
import styles from './TrainerCheckpoint.module.css';

const changed = 'ashyq:trainer-checkpoint-change';
function failureMessage(error: unknown, fallback: string) {
  if (error instanceof DOMException && ['QuotaExceededError', 'SecurityError'].includes(error.name)) return 'Браузер не разрешил сохранить работу или место закончилось. Работа остаётся на экране: скачай файл перед закрытием.';
  return error instanceof Error ? error.message : fallback;
}
export function useCheckpointRecord(trainer: TrainerId) {
  const { session, ready } = useSession();
  const scope = session?.user.id ?? 'guest';
  const key = checkpointKey(trainer, scope);
  function subscribe(callback: () => void) {
    window.addEventListener('storage', callback);
    window.addEventListener(changed, callback);
    return () => { window.removeEventListener('storage', callback); window.removeEventListener(changed, callback); };
  }
  const raw = useSyncExternalStore(subscribe, () => {
    if (!ready) return null;
    try { return localStorage.getItem(key); } catch { return '!storage-unavailable'; }
  }, () => null);
  return { raw, key, ready, scope, record: parseRecord(raw, trainer) };
}

export function downloadTrainerRecord(record: TrainerRecord) {
  const url = URL.createObjectURL(new Blob([JSON.stringify({ format: 'ashyq-trainer-export-v1', exportedAt: new Date().toISOString(), limitations: 'Local self-study records, not an official score or verified achievement. Audio excluded.', ...record }, null, 2)], { type: 'application/json;charset=utf-8' }));
  const a = document.createElement('a');
  a.href = url; a.download = `ASHYQ-${record.trainer}-${new Date().toISOString().slice(0, 10)}.json`;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export default function TrainerCheckpoint<T extends Snapshot>({ trainer, data, onRestore, completed, busy = false }: {
  trainer: TrainerId; data: T; onRestore: (data: T) => void; completed: boolean; busy?: boolean;
}) {
  const { raw, record, key, ready, scope } = useCheckpointRecord(trainer);
  const [activeKey, setActiveKey] = useState('');
  const [message, setMessage] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [imported, setImported] = useState<TrainerRecord | null>(null);
  const revision = useRef('');
  const pendingWrites = useRef(0);
  const enabled = activeKey === key;
  const serialized = JSON.stringify(data);
  const item = trainerById(trainer);
  const saved = enabled && JSON.stringify(record?.checkpoint?.data) === serialized;
  useEffect(() => {
    const warn = (event: BeforeUnloadEvent) => {
      if (pendingWrites.current > 0) { event.preventDefault(); event.returnValue = ''; }
    };
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, []);
  async function locked(action: () => void) {
    if (!navigator.locks) throw new Error('Этот браузер не поддерживает безопасное сохранение между вкладками. Скачай работу в файл.');
    await navigator.locks.request(`ashyq-trainer:${key}`, action);
  }

  function write(next: TrainerRecord) {
    const body = JSON.stringify(next);
    if (utf8Bytes(body) > MAX_RECORD_BYTES) throw new Error('Слишком много текста. Скачай работу и сохрани новую попытку отдельно.');
    localStorage.setItem(key, body);
    revision.current = next.revision;
    window.dispatchEvent(new Event(changed));
  }
  async function saveNow() {
    if (!validSnapshot(trainer, data)) throw new Error('Этот промежуточный шаг пока нельзя сохранить. Заверши текущее действие и попробуй снова.');
    await locked(() => {
      const current = parseRecord(localStorage.getItem(key), trainer) ?? emptyRecord(trainer);
      if (current.revision !== revision.current) throw new Error('Запись изменилась в другой вкладке. Автосохранение остановлено: сначала скачай текущую работу или продолжи сохранённую.');
      const entry = createEntry(data);
      write({ ...current, revision: entry.id, checkpoint: entry });
    });
  }
  useEffect(() => {
    if (!enabled || !ready) return;
    pendingWrites.current++;
    const save = async () => { try {
      const value: unknown = JSON.parse(serialized);
      if (!validSnapshot(trainer, value)) return;
      if (!navigator.locks) throw new Error('Браузер не поддерживает безопасное сохранение между вкладками. Скачай работу.');
      await navigator.locks.request(`ashyq-trainer:${key}`, () => {
      const current = parseRecord(localStorage.getItem(key), trainer) ?? emptyRecord(trainer);
      if (current.revision !== revision.current) throw new Error('Сохранение изменилось в другой вкладке. Текущая работа остаётся на экране; скачай её перед продолжением сохранённой.');
      if (JSON.stringify(current.checkpoint?.data) === serialized) return;
      const entry = createEntry(value);
      const next = { ...current, revision: entry.id, checkpoint: entry };
      if (utf8Bytes(JSON.stringify(next)) > MAX_RECORD_BYTES) throw new Error('Хранилище заполнено. Скачай работу перед закрытием.');
      localStorage.setItem(key, JSON.stringify(next));
      revision.current = next.revision;
      window.dispatchEvent(new Event(changed));
      });
    } catch (error) {
      // Storage is an external system: surface failure and stop further writes.
      setMessage(failureMessage(error, 'Не удалось сохранить работу. Скачай её перед закрытием.'));
      setActiveKey('');
    } finally { pendingWrites.current--; } };
    void save();
  }, [serialized, enabled, ready, key, trainer]);

  async function enable() {
    try { revision.current = record?.revision ?? ''; await saveNow(); setActiveKey(key); setMessage('Сохранение включено. Ответы и заметки останутся в этом браузере.'); }
    catch (error) { setMessage(failureMessage(error, 'Сохранение недоступно. Используй скачивание.')); }
  }
  function restore(value: Snapshot) {
    if (!validSnapshot(trainer, value)) { setMessage('Эта запись не подходит текущей версии тренажёра.'); return; }
    onRestore(value as T);
    revision.current = record?.revision ?? '';
    setActiveKey(key);
    setMessage(trainer === 'speaking-second-take' ? 'Заметки восстановлены. Аудиозаписи не сохранялись; незавершённый ответ можно записать заново.' : trainer === 'math-method-switch' ? 'Попытка восстановлена. Таймер текущего решения начат заново; его длительность нельзя сравнивать с непрерывной попыткой.' : 'Сохранённая попытка восстановлена. Продолжай с её текущего шага.');
  }
  function exportCurrent() {
    try {
      if (!validSnapshot(trainer, data)) throw new Error('Заверши текущее действие перед скачиванием.');
      const entry = createEntry(data);
      downloadTrainerRecord({ ...(record ?? emptyRecord(trainer)), checkpoint: entry });
      setMessage('Файл подготовлен. Проверь загрузки браузера. Он содержит текущую попытку и сохранённую историю; аудио в него не входит.');
    } catch (error) { setMessage(error instanceof Error ? error.message : 'Не удалось подготовить файл. Скопируй нужные записи вручную.'); }
  }
  async function archive() {
    try {
      await saveNow();
      await locked(() => {
        const current = parseRecord(localStorage.getItem(key), trainer)!;
        if (current.revision !== revision.current) throw new Error('Запись изменилась в другой вкладке. Скачай текущую работу перед продолжением.');
        write(archiveEntry(current, current.checkpoint!));
      });
      setMessage('Занятие добавлено в историю. Это запись работы, а не подтверждение освоения навыка. Повторное нажатие не увеличивает счётчик.');
    } catch (error) { setMessage(failureMessage(error, 'Не удалось сохранить историю. Скачай работу.')); }
  }
  async function readImport(file: File | undefined) {
    setImported(null);
    if (!file) return;
    try {
      if (file.size > MAX_RECORD_BYTES + 1000) throw new Error('Файл слишком большой. Выбери экспорт одного тренажёра ASHYQ.');
      const body = await file.text();
      const parsed: unknown = JSON.parse(body);
      if (!parsed || typeof parsed !== 'object' || !('format' in parsed) || parsed.format !== 'ashyq-trainer-export-v1') throw new Error('Нужен JSON-файл, скачанный из тренажёра ASHYQ.');
      const candidate = parseRecord(body, trainer);
      if (!candidate?.checkpoint) throw new Error('Файл повреждён, относится к другому тренажёру или несовместимой версии.');
      setImported(candidate);
      setMessage('Файл проверен локально. Подтверди восстановление ниже; пока работа и сохранение не изменены.');
    } catch (error) { setMessage(error instanceof Error ? error.message : 'Не удалось прочитать файл.'); }
  }
  async function confirmImport() {
    if (!imported?.checkpoint || busy) return;
    try {
      // Explicit confirmation replaces the local record. No file leaves the browser.
      await locked(() => write({ ...imported, revision: crypto.randomUUID() }));
      onRestore(imported.checkpoint.data as T);
      setActiveKey(key); setImported(null);
      setMessage('Работа из файла восстановлена; локальное сохранение заменено. Аудио в экспорт не входит.');
    } catch (error) { setMessage(failureMessage(error, 'Не удалось восстановить файл. Текущая работа не изменена.')); }
  }

  return <section className={styles.panel} aria-label={`Сохранение: ${item.title}`}>
    <div className={styles.heading}><div><h2>Продолжи с того же места</h2><p>{enabled ? 'Автосохранение включено для этого тренажёра.' : 'Сохранение выключено. Можно скачать текущую работу без включения.'}</p></div><Link href="/trainers/history">Мои занятия →</Link></div>
    <p className={styles.note}>Текст сохраняется только в этом браузере {scope === 'guest' ? 'в гостевом режиме' : 'для текущего аккаунта'}. На общем устройстве записи могут быть доступны другим людям с этим браузером. Синхронизации между устройствами нет.{trainer === 'speaking-second-take' ? ' Аудио не сохраняется; сохраняются заметки и самопроверка.' : ''}</p>
    {enabled && <p role="status">{saved ? 'Сохранено на этом устройстве.' : 'Сохраняем изменения… Дождись сообщения «Сохранено» перед закрытием.'}</p>}
    {raw && !record && <p className={styles.warning} role="status">{raw === '!storage-unavailable' ? 'Браузер запретил сохранение. Текущая работа доступна для скачивания.' : 'Сохранённая запись повреждена или относится к другой версии. Она не восстановлена и не будет перезаписана автоматически.'}</p>}
    {record?.checkpoint && !enabled && <p className={styles.resume}>Есть попытка от {new Date(record.checkpoint.savedAt).toLocaleString('ru-RU')}. Продолжи её или явно замени текущей работой.</p>}
    <div className={styles.actions}>
      {record?.checkpoint && !enabled && <button type="button" disabled={!ready || busy} onClick={() => restore(record.checkpoint!.data)}>Продолжить сохранённую</button>}
      {!enabled ? <button type="button" disabled={!ready || busy || raw === '!storage-unavailable'} onClick={enable}>{record?.checkpoint || raw ? 'Заменить сохранение текущей работой' : 'Сохранять на этом устройстве'}</button> : <button type="button" onClick={() => { setActiveKey(''); setMessage('Автосохранение выключено. Предыдущая запись остаётся в браузере.'); }}>Выключить автосохранение</button>}
      <button type="button" disabled={busy} onClick={exportCurrent}>Скачать текущую работу</button>
      {completed && enabled && <button type="button" disabled={busy} onClick={archive}>Добавить занятие в историю</button>}
    </div>
    <details className={styles.history}><summary>Перенести работу с другого устройства</summary><p>Выбери JSON-файл, скачанный из этого тренажёра. Он будет проверен в браузере. После подтверждения файл заменит текущее сохранение и работу на экране; сначала скачай их, если они нужны.</p><label>Файл работы ASHYQ <input type="file" accept=".json,application/json" disabled={busy || !ready} onChange={event => { void readImport(event.target.files?.[0]); event.target.value = ''; }}/></label></details>
    {imported?.checkpoint && <div className={styles.warning}><p>Восстановить работу от {new Date(imported.checkpoint.savedAt).toLocaleString('ru-RU')} и {imported.history.length} записей истории? Текущая работа и локальное сохранение будут заменены.</p><div className={styles.actions}><button type="button" disabled={busy || !ready || raw === '!storage-unavailable'} onClick={confirmImport}>Восстановить из файла и заменить сохранение</button><button type="button" onClick={() => setImported(null)}>Отмена импорта</button></div></div>}
    {record && <details className={styles.history}><summary>История этого тренажёра · {record.history.length}</summary><p>Хранятся последние 20 разных завершённых занятий. Одобрение учителя и экзаменационные баллы не присваиваются.</p><ul>{record.history.map(entry => <li key={entry.id}><span>{new Date(entry.savedAt).toLocaleString('ru-RU')}</span><button disabled={busy} type="button" onClick={() => restore(entry.data)}>Открыть эту попытку</button></li>)}</ul><button type="button" onClick={() => setDeleting(true)}>Удалить сохранение и историю этого тренажёра</button></details>}
    {deleting && <div className={styles.warning}><p>Удалить локальную запись и историю «{item.title}»? Текущая работа останется на экране. Сначала можно скачать файл.</p><div className={styles.actions}><button type="button" onClick={() => { try { localStorage.removeItem(key); setActiveKey(''); revision.current = ''; setDeleting(false); window.dispatchEvent(new Event(changed)); setMessage('Локальная запись удалена. Работа на экране не изменена.'); } catch { setMessage('Браузер не разрешил удалить запись.'); } }}>Подтвердить удаление</button><button type="button" onClick={() => setDeleting(false)}>Отмена</button></div></div>}
    {busy && <p className={styles.note}>Управление сохранением доступно после окончания записи или воспроизведения.</p>}
    {message && <p className={styles.status} role="status">{message}</p>}
  </section>;
}
