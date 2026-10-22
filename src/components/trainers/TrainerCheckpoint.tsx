'use client';

import Link from 'next/link';
import { useEffect, useLayoutEffect, useRef, useState, useSyncExternalStore } from 'react';
import { useSession } from '@/lib/lms/hooks';
import { trainerById, type TrainerId } from '@/lib/trainers/catalog';
import { archiveEntry, checkpointKey, createEntry, emptyRecord, MAX_RECORD_BYTES, MAX_HISTORY, snapshotByteLimit, parseRecord, utf8Bytes, validSnapshot, type Snapshot, type TrainerRecord } from '@/lib/trainers/checkpoints';
import {pilotReportBlocks} from '@/lib/trainers/pilot-report';
import {buildPlainDocx,DOCX_MIME} from '@/lib/trainers/docx-package';
import styles from './TrainerCheckpoint.module.css';
import '@/components/ui/LearningFeedback.css';
import {replacePublicRecord,clearPublicRecord} from '@/lib/trainers/public-storage';
import { checkpointChanged as changed, subscribeCheckpoints as subscribeChanges } from './checkpoint-hooks';
export { useCheckpointLibrary } from './checkpoint-hooks';

function failureMessage(error: unknown, fallback: string) {
  if (error instanceof DOMException && ['QuotaExceededError', 'SecurityError'].includes(error.name)) return 'Браузер не разрешил сохранить работу или место закончилось. Работа остаётся на экране: скачай файл перед закрытием.';
  return error instanceof Error ? error.message : fallback;
}
export function useCheckpointRecord(trainer: TrainerId) {
  const { session, ready } = useSession();
  const scope = session?.user.id ?? 'guest';
  const key = checkpointKey(trainer, scope);
  const raw = useSyncExternalStore(subscribeChanges, () => {
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

export default function TrainerCheckpoint<T extends Snapshot>({ trainer, data, onRestore, completed, busy = false,ephemeral=false }: {
  trainer: TrainerId; data: T; onRestore: (data: T) => void; completed: boolean; busy?: boolean;ephemeral?:boolean;
}) {
  const { raw, record, key, ready, scope } = useCheckpointRecord(trainer);
  const [activeKey, setActiveKey] = useState('');
  const [message, setMessage] = useState('');const [saveOpen,setSaveOpen]=useState(true);
  const [deleting, setDeleting] = useState(false);
  const deleteExpected=useRef<string|null|undefined>(undefined);
  const [imported, setImported] = useState<TrainerRecord | null>(null);
  const [readingFile,setReadingFile]=useState(false);
  const importTicket=useRef(0),importExpected=useRef<{raw:string|null;screen:string}|null>(null),mounted=useRef(true),screen=useRef('');
  const revision = useRef('');
  const pendingWrites = useRef(0);
  const writeGeneration = useRef(0);
  const enabled = activeKey === key;
  const serialized = JSON.stringify(data);
  useLayoutEffect(()=>{screen.current=serialized;},[serialized]);
  useEffect(()=>{mounted.current=true;const ticket=importTicket;return()=>{mounted.current=false;ticket.current++;};},[]);
  function showMessage(text:string){if(text)setSaveOpen(true);setMessage(text);}const item = trainerById(trainer);
  const saved = enabled && JSON.stringify(record?.checkpoint?.data) === serialized;
  const savePanel = useRef<HTMLElement>(null);
  const resumeAnchored = useRef('');
  const resumeAvailable = Boolean(record?.checkpoint);
  useEffect(() => {
    if (!ready || !resumeAvailable || resumeAnchored.current === key || window.location.hash !== '#saved-work') return;
    const frame = requestAnimationFrame(() => {
      resumeAnchored.current = key;
      savePanel.current?.scrollIntoView({ block: 'start', behavior: 'instant' });
      savePanel.current?.querySelector<HTMLElement>('[data-resume-checkpoint]')?.focus({ preventScroll: true });
    });
    return () => cancelAnimationFrame(frame);
  }, [ready, key, resumeAvailable]);
  const initial=useRef(serialized),allowExit=useRef(false),exitGuard=useRef({dirty:false,busy:false,replaceWork:false});
  const [exitHref,setExitHref]=useState<string|null>(null),exitPanel=useRef<HTMLDivElement>(null),exitLink=useRef<HTMLAnchorElement|null>(null);
  const hasSavedCheckpoint=!!record?.checkpoint,invalidStoredRecord=!!raw&&!record;
  useEffect(()=>{if(exitHref||deleting||imported||hasSavedCheckpoint&&!enabled||invalidStoredRecord)setSaveOpen(true);},[exitHref,deleting,imported,hasSavedCheckpoint,enabled,invalidStoredRecord]);const inRecords=!!record&&[record.checkpoint,...record.history].some(entry=>entry&&JSON.stringify(entry.data)===serialized);
  useLayoutEffect(()=>{exitGuard.current={dirty:ephemeral||!inRecords&&serialized!==initial.current,busy,replaceWork:ephemeral||serialized!==initial.current};},[serialized,inRecords,busy,ephemeral]);
  useEffect(()=>{if(exitHref){exitPanel.current?.focus({preventScroll:true});exitPanel.current?.scrollIntoView({block:'start',behavior:'instant'});}},[exitHref]);
  useEffect(() => {
    const warn = (event: BeforeUnloadEvent) => {
      if(!allowExit.current&&(exitGuard.current.dirty||exitGuard.current.busy||pendingWrites.current>0)){event.preventDefault();event.returnValue='';}
    };
    const link=(event:MouseEvent)=>{
      if(event.defaultPrevented||event.button!==0||event.ctrlKey||event.metaKey||event.shiftKey||event.altKey)return;
      const replacement=event.target instanceof Element?event.target.closest('button[data-trainer-replace]'):null;
      if(replacement?.getAttribute('data-trainer-replace')===trainer){
        if(exitGuard.current.busy||pendingWrites.current){event.preventDefault();event.stopImmediatePropagation();showMessage('Сначала закончи запись или воспроизведение и дождись сохранения. Затем повтори действие.');return;}
        if(exitGuard.current.replaceWork&&!replacement.hasAttribute('data-trainer-own-confirm')&&!window.confirm('Заменить текущую попытку? Сначала скачай её, если хочешь оставить. Если включено автосохранение, оно запишет новую попытку вместо текущего черновика; отдельная история останется.')){event.preventDefault();event.stopImmediatePropagation();showMessage('Текущая попытка оставлена без изменений.');return;}
        setExitHref(null);return;
      }
      const anchor=event.target instanceof Element?event.target.closest('a'):null;if(!anchor||anchor.hasAttribute('download')||anchor.target&&anchor.target!=='_self')return;
      let url:URL;try{url=new URL(anchor.href);}catch{return;}if(!['http:','https:'].includes(url.protocol)||url.origin===location.origin&&url.pathname===location.pathname&&url.search===location.search)return;
      if(!exitGuard.current.dirty&&!exitGuard.current.busy&&!pendingWrites.current)return;
      event.preventDefault();event.stopImmediatePropagation();setSaveOpen(true);exitLink.current=anchor;
      if(exitGuard.current.busy||pendingWrites.current){showMessage('Сначала закончи запись или воспроизведение и дождись сохранения. Затем повтори переход.');return;}
      setExitHref(url.href);
    };
    window.addEventListener('beforeunload', warn);
    document.addEventListener('click',link,true);
    return () => {window.removeEventListener('beforeunload', warn);document.removeEventListener('click',link,true);};
  }, [trainer]);
  useEffect(() => {
    if (!enabled || !ready) return;
    pendingWrites.current++;
    const generation = writeGeneration.current;
    const save = async () => { const abort=new AbortController(),timeout=setTimeout(()=>abort.abort(),10000);try {
      const value: unknown = JSON.parse(serialized);
      if (!validSnapshot(trainer, value)) throw new Error(validSnapshot(trainer,value,MAX_RECORD_BYTES)?`Снимок превышает лимит JSON (${snapshotByteLimit(trainer)/1000} КБ). Скачай отчёт Word перед выходом; он предназначен для чтения.`:'Этот шаг не удалось сохранить. Оставь страницу открытой и скопируй свой текст перед выходом.');
      if (!navigator.locks) throw new Error('Браузер не поддерживает безопасное сохранение между вкладками. Скачай работу.');
      await navigator.locks.request(`ashyq-trainer:${key}`, {signal:abort.signal},() => {
      if (generation !== writeGeneration.current) return;
      const latestRaw=localStorage.getItem(key),current=latestRaw===null?emptyRecord(trainer):parseRecord(latestRaw,trainer);if(!current)throw Error("Сохранённая запись повреждена. Она не заменена; скачай исходные данные перед восстановлением.");
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
      showMessage(failureMessage(error, 'Не удалось сохранить работу. Скачай её перед закрытием.'));
      setActiveKey('');
    } finally {clearTimeout(timeout);pendingWrites.current--; } };
    void save();
  }, [serialized, enabled, ready, key, trainer]);

  async function enable() {
    if(busy||pendingWrites.current){showMessage('Дождись завершения записи перед заменой сохранения.');return;}
    if(raw==='!storage-unavailable')return;
    if(raw&&(!record||record.checkpoint&&JSON.stringify(record.checkpoint.data)!==serialized)&&!window.confirm('Текущая работа заменит прежний черновик. Сначала скачай нужные данные. История совместимой записи останется.'))return;
    pendingWrites.current++;
    try{const next={...(record??emptyRecord(trainer)),checkpoint:createEntry(data)};const written=await replacePublicRecord(scope,trainer,raw,next,()=>{if(screen.current!==serialized)throw Error('Работа изменилась во время ожидания. Сохранение не заменено; повтори действие.');return mounted.current;});revision.current=written.revision;cancelImport();setActiveKey(key);showMessage('Сохранение включено. Ответы и заметки останутся в этом браузере.');}
    catch(error){showMessage(failureMessage(error,'Сохранение недоступно. Используй скачивание.'));}finally{pendingWrites.current--;}
  }
  function restore(value: Snapshot) {
    if(busy||pendingWrites.current){showMessage('Дождись завершения записи перед загрузкой попытки.');return;}
    if (!validSnapshot(trainer, value)) { showMessage('Эта запись не подходит текущей версии тренажёра.'); return; }
    if(serialized!==initial.current&&serialized!==JSON.stringify(value)&&!window.confirm('Выбранная попытка заменит работу на экране и текущий черновик при автосохранении. Сначала скачай нужный текст.'))return;
    try{if(localStorage.getItem(key)!==raw)throw Error('Запись изменилась перед загрузкой. Выбери актуальную попытку заново.');}catch(error){showMessage(failureMessage(error,'Не удалось проверить актуальное сохранение.'));return;}
    cancelImport();
    onRestore(value as T);
    revision.current = record?.revision ?? '';
    setActiveKey(key);
    showMessage(trainer === 'speaking-second-take' ? 'Заметки восстановлены. Аудиозаписи не сохранялись; незавершённый ответ можно записать заново.' : trainer === 'math-method-switch' ? 'Попытка восстановлена. Таймер текущего решения начат заново; его длительность нельзя сравнивать с непрерывной попыткой.' : 'Сохранённая попытка восстановлена. Продолжай с её текущего шага.');
  }
  function exportCurrent() {
    try {
      if (!validSnapshot(trainer, data)) throw new Error(validSnapshot(trainer,data,MAX_RECORD_BYTES)?`Текущая работа превышает лимит снимка JSON (${snapshotByteLimit(trainer)/1000} КБ). Скачай отчёт Word для чтения; он не восстанавливает пробу.`:'Заверши текущее действие перед скачиванием.');
      const entry = createEntry(data);
      downloadTrainerRecord({ ...(record ?? emptyRecord(trainer)), checkpoint: entry });
      showMessage('Файл подготовлен. Проверь загрузки браузера. Он содержит текущую попытку и сохранённую историю; аудио в него не входит.');
    } catch (error) { showMessage(error instanceof Error ? error.message : 'Не удалось подготовить файл. Скопируй нужные записи вручную.'); }
  }
  function exportWord(value:Snapshot,suffix:string,savedAt?:string){
    try{
      const blocks=pilotReportBlocks(trainer,value);if(savedAt)blocks.splice(1,0,{kind:'paragraph',text:`Сохранённое занятие: ${new Date(savedAt).toISOString()}`});
      const bytes=buildPlainDocx(blocks),url=URL.createObjectURL(new Blob([bytes.buffer as ArrayBuffer],{type:DOCX_MIME})),anchor=document.createElement('a');anchor.href=url;anchor.download=`ASHYQ-${trainer}-${suffix}.docx`;document.body.appendChild(anchor);anchor.click();anchor.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);showMessage('Отчёт Word подготовлен. Он содержит ответы и заметки, без экзаменационного балла. Для восстановления скачай JSON.');
    }catch(error){showMessage(failureMessage(error,'Не удалось подготовить Word. Скачай JSON или скопируй ответы.'));}
  }
  async function archive() {
    if(busy||pendingWrites.current){showMessage('Дождись сохранения перед добавлением в историю.');return;}
    if(!record||raw===null||raw==='!storage-unavailable')return;
    if(record.history.some(entry=>JSON.stringify(entry.data)===serialized)){showMessage('Эта работа уже есть в истории. Повторная запись не добавлена.');return;}
    if(record.history.length>=MAX_HISTORY&&!window.confirm('В истории уже 20 разных занятий. Сначала скачай нужные данные. Добавить новое занятие и удалить самую старую запись истории?'))return;
    pendingWrites.current++;
    try {
      const entry=createEntry(data),next=archiveEntry({...record,checkpoint:entry},entry);
      const written=await replacePublicRecord(scope,trainer,raw,next,()=>{if(screen.current!==serialized)throw Error('Работа изменилась во время ожидания. История не заменена; повтори действие.');return mounted.current;});revision.current=written.revision;cancelImport();
      showMessage('Занятие добавлено в историю. Это запись работы, а не подтверждение освоения навыка. Повторное нажатие не увеличивает счётчик.');
    } catch (error) { showMessage(failureMessage(error, 'Не удалось сохранить историю. Скачай работу.')); }finally{pendingWrites.current--;}
  }
  async function readImport(file: File | undefined) {
    const ticket=++importTicket.current;
    setImported(null);
    importExpected.current=null;setReadingFile(false);
    if (!file) return;
    try {
      const expected={raw:localStorage.getItem(key),screen:serialized};setReadingFile(true);
      if(file.type===DOCX_MIME||/\.docx$/i.test(file.name))throw new Error('Word — отчёт для чтения. Для восстановления выбери JSON, скачанный из тренажёра. Работа и сохранение не заменены.');
      if (file.size > MAX_RECORD_BYTES * 2) throw new Error('Файл слишком большой. Выбери экспорт одного тренажёра ASHYQ.');
      const body = await file.text();
      if(ticket!==importTicket.current||!mounted.current)return;
      const parsed: unknown = JSON.parse(body);
      if (!parsed || typeof parsed !== 'object' || !('format' in parsed) || parsed.format !== 'ashyq-trainer-export-v1') throw new Error('Нужен JSON-файл, скачанный из тренажёра ASHYQ.');
      // Export indentation/metadata must not consume the stored-record budget.
      const bundle = parsed as Record<string, unknown>;
      const candidate = parseRecord(JSON.stringify({ version: bundle.version, trainer: bundle.trainer, revision: bundle.revision, checkpoint: bundle.checkpoint, history: bundle.history }), trainer);
      if (!candidate?.checkpoint) throw new Error('Файл повреждён, относится к другому тренажёру или несовместимой версии.');
      setImported(candidate);
      importExpected.current=expected;
      showMessage('Файл проверен локально. Подтверди восстановление ниже; пока работа и сохранение не изменены.');
    } catch (error) { if(ticket===importTicket.current&&mounted.current)showMessage(error instanceof SyntaxError?'Файл не является корректным JSON. Работа и сохранение не заменены.':failureMessage(error,'Не удалось прочитать файл.')); }finally{if(ticket===importTicket.current&&mounted.current)setReadingFile(false);}
  }
  function cancelImport(){importTicket.current++;importExpected.current=null;setReadingFile(false);setImported(null);}
  async function confirmImport() {
    if (!imported?.checkpoint || busy||!importExpected.current) return;
    if(pendingWrites.current){showMessage('Дождись сохранения перед восстановлением файла.');return;}
    const expected=importExpected.current,ticket=importTicket.current;
    try {
      // Explicit confirmation replaces the local record. No file leaves the browser.
      pendingWrites.current++;
      const restored=await replacePublicRecord(scope,trainer,expected.raw,imported,()=>{if(screen.current!==expected.screen)throw Error('Работа на экране изменилась после выбора файла. Ничего не заменено; выбери файл ещё раз после скачивания текущего текста.');return mounted.current&&importTicket.current===ticket;});
      revision.current=restored.revision;
      onRestore(imported.checkpoint.data as T);
      setActiveKey(key);cancelImport();
      showMessage('Работа из файла восстановлена; локальное сохранение заменено. Аудио в экспорт не входит.');
    } catch (error) { showMessage(failureMessage(error, 'Не удалось восстановить файл. Текущая работа не изменена.')); }finally{pendingWrites.current--;}
  }
  async function removeSaved() {
    if(deleteExpected.current===undefined||busy||pendingWrites.current){showMessage('Дождись завершения записи перед удалением.');return;}
    const expected=deleteExpected.current;pendingWrites.current++;
    try {
      const tombstone=await clearPublicRecord(scope,trainer,expected,()=>{if(deleteExpected.current!==expected)throw Error('Очистка отменена. Запись не удалена.');return mounted.current;});
      writeGeneration.current++;revision.current=tombstone.revision;deleteExpected.current=undefined;cancelImport();
      setActiveKey(''); setDeleting(false);
      showMessage('Локальная запись удалена. Работа на экране не изменена.');
    } catch(error) { showMessage(failureMessage(error,'Браузер не разрешил удалить запись.')); }finally{pendingWrites.current--;}
  }
  function askDelete(){if(busy||pendingWrites.current){showMessage('Дождись завершения записи перед очисткой.');return;}deleteExpected.current=raw;setDeleting(true);cancelImport();}
  function cancelDelete(){deleteExpected.current=undefined;setDeleting(false);}
  function downloadRaw(){if(!raw||raw==='!storage-unavailable')return;try{const url=URL.createObjectURL(new Blob([raw],{type:'text/plain;charset=utf-8'})),a=document.createElement('a');a.href=url;a.download=`ASHYQ-${trainer}-recovery.txt`;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);showMessage('Исходная запись скачана без изменения. Это файл восстановления, не проверенная учебная работа.');}catch(error){showMessage(failureMessage(error,'Не удалось скачать исходные данные.'));}}

  return <section id="saved-work" ref={savePanel} className={styles.panel} aria-label={`Сохранение: ${item.title}`}><details open={saveOpen} onToggle={event=>setSaveOpen(event.currentTarget.open)}><summary className="learning-save-summary"><span>Сохранение и файлы</span><small>{enabled ? saved ? "Сохранено на устройстве" : "Сохраняем…" : record?.checkpoint ? "Есть сохранённая попытка" : "Автосохранение выключено"}</small></summary>
    <div className={styles.heading}><div><h2>Продолжи с того же места</h2><p>{enabled ? 'Автосохранение включено для этого тренажёра.' : 'Сохранение выключено. Можно скачать текущую работу без включения.'}</p></div><Link href="/trainers/history">Мои занятия →</Link></div>
    <details className={styles.history}><summary>Хранение ответов и общее устройство</summary><p className={styles.note}>Текст сохраняется только в этом браузере {scope === 'guest' ? 'в гостевом режиме' : 'для текущего аккаунта'}. На общем устройстве записи могут быть доступны другим людям с этим браузером. Автоматической синхронизации между устройствами нет; перенос возможен через файл.{trainer === 'speaking-second-take' ? ' Аудио не сохраняется; сохраняются заметки и самопроверка.' : ''}</p></details>
    {enabled && <p role="status">{saved ? 'Сохранено на этом устройстве.' : 'Сохраняем изменения… Дождись сообщения «Сохранено» перед закрытием.'}</p>}
    {raw && !record && <p className={styles.warning} role="status">{raw === '!storage-unavailable' ? 'Браузер запретил сохранение. Текущая работа доступна для скачивания.' : 'Сохранённая запись повреждена или относится к другой версии. Она не восстановлена и не будет перезаписана автоматически.'}</p>}
    {raw&&raw!=="!storage-unavailable"&&!record&&<div className={styles.actions}><button type="button" disabled={busy} onClick={downloadRaw}>Скачать исходную повреждённую запись</button><button type="button" disabled={busy} onClick={askDelete}>Очистить повреждённую запись</button></div>}
    {record?.checkpoint && !enabled && <p className={styles.resume}>Есть попытка от {new Date(record.checkpoint.savedAt).toLocaleString('ru-RU')}. Продолжи её или явно замени текущей работой.</p>}
    <div className={styles.actions}>
      {record?.checkpoint && !enabled && <button data-resume-checkpoint type="button" disabled={!ready || busy} onClick={() => restore(record.checkpoint!.data)}>Продолжить сохранённую</button>}
      {!enabled ? <button type="button" disabled={!ready || busy || raw === '!storage-unavailable'} onClick={enable}>{record?.checkpoint || raw ? 'Заменить сохранение текущей работой' : 'Сохранять на этом устройстве'}</button> : <button type="button" onClick={() => { setActiveKey(''); showMessage('Автосохранение выключено. Предыдущая запись остаётся в браузере.'); }}>Выключить автосохранение</button>}
      <button type="button" disabled={busy} onClick={exportCurrent}>Скачать текущую работу</button>
      <button type="button" disabled={busy} onClick={()=>exportWord(data,'current')}>Скачать отчёт Word</button>
      {completed && enabled && <button type="button" disabled={busy} onClick={archive}>Добавить занятие в историю</button>}
    </div>
    <p>Word — читаемый отчёт. JSON — файл для восстановления работы и истории. Скачивание Word не включает автосохранение; аудио скачивается отдельно.</p>
    <details className={styles.history}><summary>Перенести работу с другого устройства</summary><p>Выбери JSON-файл, скачанный из этого тренажёра. Он будет проверен в браузере. После подтверждения файл заменит текущее сохранение и работу на экране; сначала скачай их, если они нужны.</p><label>Файл работы ASHYQ <input type="file" accept=".json,application/json" disabled={busy || !ready} onChange={event => { void readImport(event.target.files?.[0]); event.target.value = ''; }}/></label></details>
    {readingFile&&<div className={styles.warning}><p role="status">Читаем выбранный файл… Работа пока не заменена.</p><button type="button" onClick={cancelImport}>Отмена импорта</button></div>}
    {imported?.checkpoint && <div className={styles.warning}><p>Восстановить работу от {new Date(imported.checkpoint.savedAt).toLocaleString('ru-RU')} и {imported.history.length} записей истории? Текущая работа и локальное сохранение будут заменены.</p><div className={styles.actions}><button type="button" disabled={busy || !ready || raw === '!storage-unavailable'} onClick={confirmImport}>Восстановить из файла и заменить сохранение</button><button type="button" onClick={cancelImport}>Отмена импорта</button></div></div>}
    {record && <details className={styles.history}><summary>История этого тренажёра · {record.history.length}</summary><p>Хранятся последние 20 разных занятий. Одобрение учителя и экзаменационные баллы не присваиваются.</p><ul>{record.history.map((entry,index) => <li key={entry.id}><span>{new Date(entry.savedAt).toLocaleString('ru-RU')}</span><button disabled={busy} type="button" onClick={() => restore(entry.data)}>Открыть эту попытку</button><button disabled={busy} type="button" onClick={()=>exportWord(entry.data,`history-${index+1}`,entry.savedAt)}>Скачать Word занятия {index+1}</button></li>)}</ul><button type="button" onClick={askDelete}>Удалить сохранение и историю этого тренажёра</button></details>}
    {deleting && <div className={styles.warning}><p>Удалить локальную запись и историю «{item.title}»? Текущая работа останется на экране. Сначала можно скачать файл.</p><div className={styles.actions}><button type="button" disabled={busy || (enabled && !saved)} onClick={removeSaved}>Подтвердить удаление</button><button type="button" onClick={cancelDelete}>Отмена</button></div></div>}
    {busy && <p className={styles.note}>Управление сохранением доступно после окончания записи или воспроизведения.</p>}
    {message && <p className={styles.status} role="status">{message}</p>}
    {exitHref&&<div ref={exitPanel} tabIndex={-1} role="alert" aria-label="Подтверждение выхода из тренажёра" className={styles.warning}><p>Перейти со страницы? Несохранённые ответы и аудио этой вкладки будут потеряны. Сначала можно скачать работу и отдельную аудиозапись.</p><div className={styles.actions}><button type="button" disabled={busy} onClick={()=>{if(exitGuard.current.busy||pendingWrites.current)return;allowExit.current=true;location.assign(exitHref);}}>Перейти без сохранения</button><button type="button" onClick={()=>{setExitHref(null);exitLink.current?.focus();}}>Остаться в тренажёре</button></div></div>}
  </details></section>;
}
