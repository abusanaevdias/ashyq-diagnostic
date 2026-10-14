'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import RequireRole from '@/components/lms/RequireRole';
import { useLmsData } from '@/lib/lms/hooks';
import {blankOwnDraft as blank,ownStorageFailure,readOwnDraft,writeOwnDraft,clearOwnDraft,serializeOwnDraft,ownDraftExport,parseOwnDraftExport,ownDraftWord,MAX_OWN_DRAFT_BYTES,type OwnDraft as Draft,type OwnDraftRead} from '@/lib/writing-trainer/own-draft';
import {DOCX_MIME} from '@/lib/trainers/docx-package';
import { getRepos } from '@/lib/lms/repos';
import type { User } from '@/lib/lms/types';
import WritingAiPanel from './WritingAiPanel';
import styles from './OwnEssayTrainer.module.css';

type Step = 'grammar' | 'task' | 'coherence' | 'lexical';
const steps: Array<{ id: Step; label: string; instruction: string; questions: string[] }> = [
  { id: 'grammar', label: 'Грамматика', instruction: 'Найди возможные ошибки сам и исправь их в рабочей версии.', questions: ['Согласованы ли подлежащее и сказуемое?', 'Верно ли выбраны время, артикли и предлоги?', 'Понятны ли сложные предложения и пунктуация?'] },
  { id: 'task', label: 'Ответ на вопрос', instruction: 'Проверь, отвечает ли эссе на все части задания и развивает ли аргументы.', questions: ['Ясна ли твоя позиция?', 'Есть ли объяснение и пример для каждого основного тезиса?', 'Нет ли абзаца, который уходит от вопроса?'] },
  { id: 'coherence', label: 'Связность', instruction: 'Проверь порядок идей и связь между предложениями и абзацами.', questions: ['Есть ли одна главная идея у каждого абзаца?', 'Легко ли проследить ход мысли?', 'Не повторяются ли связки механически?'] },
  { id: 'lexical', label: 'Лексика', instruction: 'Уточни слова и выражения, сохраняя собственную мысль.', questions: ['Подходят ли слова по смыслу?', 'Нет ли повторов, которые мешают чтению?', 'Проверены ли написание и сочетаемость слов?'] },
];

const words = (value: string) => value.trim() ? value.trim().split(/\s+/).length : 0;

export default function OwnEssayTrainer() {
  if (process.env.NODE_ENV === 'production' && process.env.NEXT_PUBLIC_AUTH_PROVIDER !== 'supabase') {
    return <section className={styles.state} aria-labelledby="own-config-title"><h1 id="own-config-title">Личный режим временно недоступен</h1><p>Для собственного эссе нужен вход через учебный кабинет ASHYQ. Пока можно пройти два готовых примера.</p><div className={styles.links}><Link href="/writing/trainer/practice">Готовые эссе</Link></div></section>;
  }
  return <RequireRole roles={['student', 'teacher']}>{(user) => <EnrolledOwnEssay key={user.id} user={user} />}</RequireRole>;
}

function EnrolledOwnEssay({ user }: { user: User }) {
  const { data: classes, loading, error } = useLmsData(() => getRepos().classes.listForUser(user), `own-writing-classes:${user.id}`);
  if (loading) return <p className={styles.state} role="status">Проверяем доступ к IELTS-классу…</p>;
  if (error) return <p className={styles.state} role="alert">Не удалось проверить класс: {error}</p>;
  if (!classes?.some((item) => /\bIELTS\b/i.test(item.subject))) {
    return <section className={styles.state} aria-labelledby="own-locked"><h1 id="own-locked">Режим для IELTS-класса</h1><p>Для работы со своим эссе нужно учиться в IELTS-классе ASHYQ или вести его. Два готовых примера можно пройти без класса.</p><div className={styles.links}><Link href={user.role === 'teacher' ? '/teacher' : '/classes'}>Мои классы</Link><Link href="/writing/trainer/practice">Готовые эссе</Link></div></section>;
  }
  return <EssayWorkspace key={user.id} userId={user.id} role={user.role} />;
}

function EssayWorkspace({ userId, role }: { userId: string; role: User['role'] }) {
  const [draft,setDraft]=useState<Draft>(blank);
  const [read,setRead]=useState<OwnDraftRead|{kind:'loading'}>({kind:'loading'});
  const baseline=useRef<{raw:string|null;fingerprint:string}|null>(null);
  const [storageError,setStorageError]=useState(''),[downloadError,setDownloadError]=useState('');
  const importTicket=useRef(0);
  const [imported,setImported]=useState<{draft:Draft;expected:string|null|undefined}|null>(null);
  useEffect(()=>{let next:OwnDraftRead;try{next=readOwnDraft(userId,sessionStorage);}catch{next={kind:'blocked'};}if(next.kind==='ready'){baseline.current={raw:next.raw,fingerprint:serializeOwnDraft(next.draft)};setDraft(next.draft);}setRead(next);},[userId]);
  useEffect(()=>{
    if(read.kind!=='ready'||!baseline.current)return;
    try{const fingerprint=serializeOwnDraft(draft);if(fingerprint===baseline.current.fingerprint)return;const raw=writeOwnDraft(userId,draft,baseline.current.raw,sessionStorage);baseline.current={raw,fingerprint};setRead({kind:'ready',raw,draft});setStorageError('');}
    catch(error){setStorageError(ownStorageFailure(error));setRead({kind:'blocked'});}
  },[draft,userId,read.kind]);
  useEffect(()=>{if(read.kind==='loading')return;const warn=(event:BeforeUnloadEvent)=>{if((baseline.current?.fingerprint??JSON.stringify(blank()))===JSON.stringify(draft))return;event.preventDefault();event.returnValue='';};window.addEventListener('beforeunload',warn);return()=>window.removeEventListener('beforeunload',warn);},[draft,read.kind]);

  const current = draft.step >= 0 && draft.step < steps.length ? steps[draft.step] : null;
  const isReport = draft.step === steps.length;
  const started = draft.step >= 0;

  function start() {
    if (!draft.prompt.trim() || !draft.original.trim()) return;
    setDraft((old) => ({ ...old, working: old.original, step: 0 }));
  }

  function next() {
    if (!current) return;
    if(!draft.working.trim()){setDownloadError('Рабочая версия пустая. Добавь текст перед сохранением этапа.');return;}
    setDownloadError('');
    setDraft((old) => ({ ...old, versions: { ...old.versions, [current.id]: old.working }, step: Math.min(old.step + 1, steps.length) }));
  }

  function clear(){
    if(read.kind==='loading'||read.kind==='blocked')return;
    if(!window.confirm('Удалить сохранённую запись и текст на экране? Сначала скачай их, если они нужны.'))return;
    try{const expected=read.kind==='ready'?baseline.current?.raw:read.raw;if(expected===undefined)throw Error('Сначала проверь сохранённую запись.');clearOwnDraft(userId,expected,sessionStorage);const empty=blank();baseline.current={raw:null,fingerprint:serializeOwnDraft(empty)};setDraft(empty);setRead({kind:'ready',raw:null,draft:empty});setStorageError('');setDownloadError('');setImported(null);importTicket.current++;}
    catch(error){setStorageError(ownStorageFailure(error));}
  }
  function fileDownload(content:BlobPart,mime:string,name:string){const url=URL.createObjectURL(new Blob([content],{type:mime})),link=document.createElement('a');link.href=url;link.download=name;document.body.appendChild(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);}
  function downloadJson(){try{fileDownload(ownDraftExport(draft),'application/json;charset=utf-8','ASHYQ-own-essay.json');setDownloadError('');}catch(error){setDownloadError(error instanceof Error?error.message:'Не удалось скачать JSON.');}}
  function downloadWord(){try{fileDownload(ownDraftWord(draft).buffer as ArrayBuffer,DOCX_MIME,'ASHYQ-own-essay.docx');setDownloadError('');}catch(error){setDownloadError(error instanceof Error?error.message:'Не удалось скачать Word.');}}
  async function importFile(file:File|undefined){const ticket=++importTicket.current;setImported(null);if(!file)return;try{if(file.type===DOCX_MIME||/\.docx$/i.test(file.name))throw Error('Word — отчёт для чтения. Для восстановления выбери JSON личной практики.');if(file.size>MAX_OWN_DRAFT_BYTES*2)throw Error('Файл слишком большой. Работа не заменена.');const raw=await file.text();if(ticket!==importTicket.current)return;const value=parseOwnDraftExport(raw);if(!value)throw Error('Файл повреждён или относится к другому формату. Работа и сохранение не заменены.');setImported({draft:value,expected:read.kind==='ready'?baseline.current?.raw:read.kind==='incompatible'?read.raw:undefined});setDownloadError('');}catch(error){if(ticket!==importTicket.current)return;setDownloadError(error instanceof Error?error.message:'Не удалось прочитать файл.');}}
  function restoreFile(){if(!imported)return;try{if(imported.expected===undefined){setDraft(imported.draft);setRead({kind:'blocked'});}else{const raw=writeOwnDraft(userId,imported.draft,imported.expected,sessionStorage);baseline.current={raw,fingerprint:serializeOwnDraft(imported.draft)};setDraft(imported.draft);setRead({kind:'ready',raw,draft:imported.draft});setStorageError('');}setImported(null);importTicket.current++;setDownloadError('');}catch(error){setDownloadError(ownStorageFailure(error));}}

  function download() {
    try {
      const content = [`IELTS Academic Writing Task 2 — личная практика`, `Задание: ${draft.prompt}`, ``, `Исходный текст (${words(draft.original)} слов):`, draft.original, ``, `Последняя версия (${words(draft.working)} слов):`, draft.working, ``, ...steps.flatMap(({ id, label }) => [`${label}: ${draft.notes[id] || 'без заметки'}`, `Версия после этапа:`, draft.versions[id] || 'не сохранена', ``])].join('\n');
      const url = URL.createObjectURL(new Blob([content], { type: 'text/plain;charset=utf-8' }));
      const link = document.createElement('a');
      link.href = url;
      link.download = 'ashyq-writing-task-2.txt';
      link.click();
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
      setDownloadError('');
    } catch { setDownloadError('Не удалось скачать файл. Скопируй текст вручную перед закрытием вкладки.'); }
  }

  if(read.kind==='loading')return <p className={styles.state} role="status">Проверяем сохранение в этой вкладке…</p>;
  return <div className={styles.page}>
    <div className={styles.topline}><span>ASHYQ / WRITING LAB</span><span>IELTS ACADEMIC · TASK 2</span></div>
    <header className={styles.hero}><p className={styles.eyebrow}>ЛИЧНАЯ ПРАКТИКА · {role === 'teacher' ? 'УЧИТЕЛЬ' : 'УЧЕНИК'}</p><h1>Работай со своим эссе</h1><p>Добавь задание и свой текст, затем перепиши эссе по четырём критериям. Ты сам решаешь, какие изменения принять.</p><div className={styles.links}><Link href="/writing/trainer">Как устроен тренажёр</Link><Link href="/writing/trainer/practice">Готовые примеры</Link></div></header>
    <div className={styles.notice}><strong>Что доступно сейчас</strong><p>Черновик остаётся в этой вкладке. {process.env.NEXT_PUBLIC_WRITING_AI_ENABLED === '1' ? 'В пилоте после собственной правки можно запросить AI-подсказки: только по отдельному согласию задание и обе версии эссе отправятся в OpenAI.' : 'AI-разбор пока не включён: текст не отправляется внешнему сервису.'} Автоматическая оценка собственного эссе и официальный балл IELTS недоступны.</p></div>
    <section className={styles.card} aria-label="Файлы и восстановление личной практики"><h2>Сохрани копию работы</h2><p>Word и текст — для чтения. JSON — для восстановления задания, заметок, версий и сохранённых подсказок. Файлы проверяются в браузере; их загрузка не отправляет эссе на AI.</p><div className={styles.actions}><button type="button" className={styles.secondary} onClick={downloadJson}>Скачать JSON для восстановления</button><button type="button" className={styles.secondary} onClick={downloadWord}>Скачать отчёт Word</button><button type="button" className={styles.secondary} onClick={download}>Скачать текст</button></div><label htmlFor="own-restore-file">Восстановить JSON личной практики</label><input id="own-restore-file" type="file" accept=".json,application/json" onChange={event=>{void importFile(event.target.files?.[0]);event.target.value='';}}/>
      {read.kind==='incompatible'&&<div className={styles.notice} role="alert"><p>Сохранённая запись повреждена или несовместима. Она не заменена. Автосохранение новой работы остановлено.</p><div className={styles.actions}><button type="button" className={styles.secondary} onClick={()=>{try{fileDownload(read.raw,'text/plain;charset=utf-8','ASHYQ-own-essay-recovery.txt');}catch{setDownloadError('Не удалось скачать исходную запись.');}}}>Скачать исходную запись</button><button type="button" className={styles.delete} onClick={clear}>Очистить запись после скачивания</button></div></div>}
      {read.kind==='blocked'&&<p className={styles.error} role="alert">Хранилище недоступно или сохранение остановлено. Работа на экране доступна для скачивания. Отсутствие прежнего черновика не подтверждено.</p>}
      {imported&&<div className={styles.notice} role="alert"><p>Файл заменит работу на экране{imported.expected===undefined?' без сохранения в браузере': ' и запись в этой вкладке'}. Сначала скачай нужные текущие и исходные данные.</p><div className={styles.actions}><button type="button" className={styles.primary} onClick={restoreFile}>Подтвердить восстановление JSON</button><button type="button" className={styles.secondary} onClick={()=>{importTicket.current++;setImported(null);}}>Отменить восстановление</button></div></div>}
      {storageError&&<p className={styles.error} role="alert">{storageError}</p>}{downloadError&&<p className={styles.error} role="alert">{downloadError}</p>}
    </section>
    {!started ? <section className={styles.card} aria-labelledby="start-own-title"><h2 id="start-own-title">1. Добавь своё эссе</h2><label htmlFor="own-prompt">Задание Task 2</label><textarea id="own-prompt" value={draft.prompt} onChange={(event) => setDraft((old) => ({ ...old, prompt: event.target.value }))} maxLength={1000} rows={4} placeholder="Вставь полный вопрос IELTS Task 2" /><label htmlFor="own-original">Твой исходный текст</label><textarea id="own-original" lang="en" value={draft.original} onChange={(event) => setDraft((old) => ({ ...old, original: event.target.value }))} maxLength={10000} rows={15} placeholder="Вставь или напиши своё эссе" /><div className={styles.actions}><button className={styles.primary} type="button" onClick={start} disabled={!draft.prompt.trim() || !draft.original.trim()}>Начать правку</button><span>{words(draft.original)} слов · для Task 2 обычно требуется не менее 250</span></div></section> : <>
      <nav className={styles.progress} aria-label="Этапы правки">{steps.map((item, index) => <span key={item.id} aria-current={draft.step === index ? 'step' : undefined} className={draft.step === index ? styles.activeStep : ''}>{index + 1}. {item.label}</span>)}<span className={isReport ? styles.activeStep : ''} aria-current={isReport ? 'step' : undefined}>5. Итог</span></nav>
      <section className={styles.promptCard}><span className={styles.eyebrow}>ТВОЁ ЗАДАНИЕ</span><p lang="en">{draft.prompt}</p></section>
      {current ? <section className={styles.card} aria-labelledby="own-stage-title"><p className={styles.eyebrow}>ШАГ {draft.step + 1} ИЗ 4</p><h2 id="own-stage-title">{current.label}</h2><p>{current.instruction}</p><ul>{current.questions.map((question) => <li key={question}>{question}</li>)}</ul><div className={styles.columns}><div><h3>Исходный текст</h3><p lang="en" className={styles.essay}>{draft.original}</p></div><div><label htmlFor="own-working">Рабочая версия</label><textarea id="own-working" lang="en" value={draft.working} onChange={(event) => setDraft((old) => ({ ...old, working: event.target.value }))} maxLength={10000} rows={20} /></div></div><label htmlFor="own-notes">Что ты изменил и почему?</label><textarea id="own-notes" value={draft.notes[current.id]} onChange={(event) => setDraft((old) => ({ ...old, notes: { ...old.notes, [current.id]: event.target.value } }))} maxLength={1000} rows={3} placeholder="Короткая заметка для себя" /><div className={styles.actions}>{draft.step > 0 ? <button type="button" className={styles.secondary} onClick={() => setDraft((old) => ({ ...old, step: old.step - 1 }))}>Назад</button> : null}<button type="button" className={styles.primary} onClick={next}>Сохранить шаг и продолжить</button><span>{words(draft.working)} слов</span></div></section> : null}
      {current && process.env.NEXT_PUBLIC_WRITING_AI_ENABLED === '1' ? <WritingAiPanel key={current.id} criterion={current.id} prompt={draft.prompt} original={draft.original} working={draft.working} saved={draft.ai[current.id]} onSave={(value) => setDraft((old) => ({ ...old, ai: { ...old.ai, [current.id]: value } }))} /> : null}
      {isReport ? <section className={styles.card} aria-labelledby="own-report-title"><p className={styles.eyebrow}>ЛИЧНЫЙ ИТОГ</p><h2 id="own-report-title">Что изменилось</h2><p>Сравни исходный текст с последней версией. Правки не проверены учителем; AI-подсказки, если ты их запросил, остаются предварительными. Здесь нет оценки IELTS.</p><div className={styles.columns}><div><h3>Было · {words(draft.original)} слов</h3><p lang="en" className={styles.essay}>{draft.original}</p></div><div><h3>Стало · {words(draft.working)} слов</h3><p lang="en" className={styles.essay}>{draft.working}</p></div></div><div className={styles.notes}>{steps.map(({ id, label }) => <div key={id}><h3>{label}</h3><p>{draft.notes[id] || 'Заметка не добавлена.'}</p><details><summary>Версия после этапа</summary><p lang="en" className={styles.version}>{draft.versions[id] || 'Версия не сохранена.'}</p></details>{draft.ai[id] ? <p className={styles.aiStale}>AI-разбор был сделан для версии на этом этапе. Вернись к этапу, чтобы посмотреть его.</p> : null}</div>)}</div><div className={styles.actions}><button type="button" className={styles.secondary} onClick={() => setDraft((old) => ({ ...old, step: steps.length - 1 }))}>Вернуться к правке</button><button type="button" className={styles.primary} onClick={download}>Скачать результат .txt</button></div></section> : null}
      <div className={styles.bottom}><p>Черновик сохраняется только в текущей вкладке. На общем устройстве удали его после работы.</p><div className={styles.actions}><button type="button" className={styles.secondary} onClick={download}>Скачать черновик</button><button type="button" className={styles.delete} disabled={read.kind==='blocked'} onClick={clear}>Удалить мой черновик</button></div></div>
    </>}
  </div>;
}
