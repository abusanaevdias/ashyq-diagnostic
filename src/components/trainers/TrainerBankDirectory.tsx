'use client';
import Link from 'next/link';
import {useEffect,useMemo,useRef,useState} from 'react';
import RequireRole from '@/components/lms/RequireRole';
import {BANK_PAGE_SIZE,bankPage,bankPracticeHref,filterBankSources,readBankSummary,type BankFilters,type BankSummary} from '@/lib/trainers/bank-navigation';
import {readBankPresence,type BankPresence} from '@/lib/trainers/bank-presence';
import {bankSkillLabel} from '@/lib/trainers/bank-skill-labels';
import {bankRecordKey} from '@/lib/trainers/bank-records';
import {BANK_RECORD_CHANGED} from '@/lib/trainers/bank-storage';
import {trainerBank,type BankSource} from '@/lib/trainers/bank-sources';
import {trainerById,trainerCatalog} from '@/lib/trainers/catalog';
import styles from './TrainerBankDirectory.module.css';

const entryLabel={ 'not-started':'Сохранено начало пробы', 'in-progress':'Работа в процессе', complete:'Проба завершена' };
function Card({source,actor}:{source:BankSource;actor:string}){
 const [summary,setSummary]=useState<BankSummary|null>(null),[stale,setStale]=useState(false),href=bankPracticeHref(source.ref),trainer=trainerById(source.trainer);
 useEffect(()=>{
  if(!summary)return;
  const invalidate=(event:Event)=>{if(event instanceof StorageEvent&&event.key!==null&&event.key!==bankRecordKey(actor,source.ref))return;setStale(true);};
  window.addEventListener('storage',invalidate);window.addEventListener(BANK_RECORD_CHANGED,invalidate);return()=>{window.removeEventListener('storage',invalidate);window.removeEventListener(BANK_RECORD_CHANGED,invalidate);};
 },[summary,actor,source]);
 function read(){try{setSummary(readBankSummary(actor,source.ref,localStorage));}catch{setSummary({kind:'unavailable'});}setStale(false);}
 return <article className={styles.card} aria-labelledby={`bank-card-${source.ref.unitId}`}>
  <span className={styles.tag}>{trainer.exam} · {trainer.skill} · DRAFT</span><h2 id={`bank-card-${source.ref.unitId}`}>{source.title}</h2><p>{source.practiceType}</p><p>{bankSkillLabel(source.skill)}</p><p>{source.ref.unitId} · версия {source.ref.version}. Сложность ещё не откалибрована.</p>
  {summary&&<div className={styles.summary} role="status">
   {stale?<p>Запись могла измениться. Обнови сводку перед продолжением.</p>:summary.kind==='empty'?<p>Сохранённой пробы этой версии пока нет.</p>:summary.kind==='incompatible'?<p>Запись есть, но она несовместима или повреждена. Открой пробу, чтобы скачать исходные данные для восстановления.</p>:summary.kind==='source-unavailable'?<p>Версия задания недоступна. Обнови библиотеку.</p>:summary.kind==='unavailable'?<p>Не удалось прочитать сохранение в этом браузере. Отсутствие записи не подтверждено.</p>:<>
    {summary.current?<p>{entryLabel[summary.current.state]} · {new Date(summary.current.savedAt).toLocaleString('ru-RU')}</p>:<p>Текущего сохранённого черновика нет.</p>}<p>Записей в истории: {summary.history.length}. Завершение пробы не означает освоение навыка.</p>
    {summary.history.length>0&&<details><summary>Даты сохранённых проб</summary><ul>{summary.history.map(entry=><li key={entry.id}>{entryLabel[entry.state]} · {new Date(entry.savedAt).toLocaleString('ru-RU')}</li>)}</ul></details>}
    {(summary.current||summary.history.length>0)&&<p>Открой пробу и выбери сохранённую работу внутри неё. Автоматической загрузки нет.</p>}
   </>}
  </div>}
  <div className={styles.actions}>{href&&<a href={href} aria-label={`Открыть пробу ${source.ref.unitId}: ${source.title}`}>Открыть пробу →</a>}<button type="button" className={styles.read} onClick={read}>{summary?'Обновить локальную сводку':'Проверить локальное сохранение'}</button></div>
 </article>;
}
function Directory({actor}:{actor:string}){
 const [filters,setFilters]=useState<BankFilters>({exam:'all',trainer:'all',query:''}),[requestedPage,setPage]=useState(0);
 const [presence,setPresence]=useState<BankPresence|null>(null),[onlyLocal,setOnlyLocal]=useState(false),[presenceStale,setPresenceStale]=useState(false);
 const needsRefresh=onlyLocal&&(presence?.kind!=='ready'||presenceStale);
 function showLocal(){try{const value=readBankPresence(actor,localStorage);setPresence(value);setPresenceStale(false);setOnlyLocal(value.kind==='ready');setPage(0);}catch{setPresence({kind:'unavailable',reason:'blocked'});setOnlyLocal(false);}}
 useEffect(()=>{
  if(presence?.kind!=='ready')return;
  const prefix=`ashyq:trainer-bank:v2:${encodeURIComponent(actor)}:`;
  const invalidate=(event:Event)=>{if(event instanceof StorageEvent&&event.key!==null&&!event.key.startsWith(prefix))return;setPresenceStale(true);};
  const shown=(event:PageTransitionEvent)=>{if(event.persisted)setPresenceStale(true);};
  const visible=()=>{if(document.visibilityState==='visible')setPresenceStale(true);};
  window.addEventListener('storage',invalidate);window.addEventListener(BANK_RECORD_CHANGED,invalidate);window.addEventListener('pageshow',shown);document.addEventListener('visibilitychange',visible);
  return()=>{window.removeEventListener('storage',invalidate);window.removeEventListener(BANK_RECORD_CHANGED,invalidate);window.removeEventListener('pageshow',shown);document.removeEventListener('visibilitychange',visible);};
 },[presence,actor]);
 const results=useRef<HTMLParagraphElement|null>(null);
 function goPage(index:number){setPage(index);requestAnimationFrame(()=>{results.current?.scrollIntoView({block:'start',behavior:'instant'});results.current?.focus({preventScroll:true});});}
 const selected=useMemo(()=>{const all=filterBankSources(filters);return needsRefresh?[]:onlyLocal&&presence?.kind==='ready'?all.filter(source=>presence.currentIds.includes(source.ref.unitId)):all;},[filters,needsRefresh,onlyLocal,presence]),page=bankPage(selected,requestedPage);
 function change(next:Partial<BankFilters>){setFilters(old=>({...old,...next}));setPage(0);}
 return <><header className={styles.header}><h1>Выбери навык для практики</h1><p>{trainerBank.sources.length} черновиков для учителя и автора. Пройди задание перед методической проверкой.</p><p>Сохранение по кнопке в этом браузере. Аудио скачивается отдельно.</p><nav className={styles.links} aria-label="Проверка материалов"><Link href="/trainers/material-review">Методическая проверка →</Link></nav><details className={styles.explainer}><summary>Открытые примеры и история</summary><nav className={styles.links} aria-label="Другие разделы практики"><Link href="/trainers">Открытые примеры для всех →</Link><Link href="/trainers/history">История открытых примеров →</Link></nav><p>Локальные записи относятся к текущему аккаунту. Они не синхронизируются между устройствами; перенос возможен через файл. Проба не публикует черновик и не подтверждает освоение навыка.</p></details></header>
  <fieldset className={styles.controls}><legend>Найти задание</legend><div className={styles.exams}>{(['all','IELTS','SAT'] as const).map(exam=><button type="button" key={exam} aria-pressed={filters.exam===exam} onClick={()=>change({exam,trainer:'all'})}>{exam==='all'?'Все экзамены':exam}</button>)}</div><div className={styles.fields}><div><label htmlFor="bank-trainer">Тренажёр</label><select id="bank-trainer" value={filters.trainer} onChange={event=>change({trainer:event.target.value as BankFilters['trainer']})}><option value="all">Все тренажёры</option>{trainerCatalog.filter(t=>filters.exam==='all'||t.exam===filters.exam).map(t=><option key={t.id} value={t.id}>{t.title}</option>)}</select></div><div><label htmlFor="bank-search">Навык, название или номер задания</label><input id="bank-search" type="search" value={filters.query} maxLength={200} placeholder="Например: аргумент или R01" onChange={event=>change({query:event.target.value})}/></div></div></fieldset>
  <div className={styles.exams} role="group" aria-label="Локальные записи"><button type="button" aria-pressed={!onlyLocal} onClick={()=>{setOnlyLocal(false);setPage(0);}}>Все задания</button><button type="button" aria-pressed={onlyLocal&&!needsRefresh} onClick={showLocal}>{presence?'Обновить локальные записи':'Показать локальные записи'}</button></div>
  {presence?.kind==='unavailable'&&<p role="status">{presence.reason==='capacity'?'Список превышает безопасный лимит. Записи не удалены; открой сводку нужного задания отдельно.':presence.reason==='changed'?'Список изменился во время чтения. Повтори обновление; частичный список не показан.':'Не удалось прочитать список записей. Отсутствие сохранений не подтверждено.'}</p>}
  {presence?.kind==='ready'&&!presenceStale&&onlyLocal&&<p>Показаны задания с локальной записью этой версии. Запись может быть пустой или несовместимой; её содержимое проверяется по кнопке на карточке.</p>}
  {presence?.kind==='ready'&&!presenceStale&&presence.archives.length>0&&<p>Записей предыдущих версий: {presence.archives.length}. <Link href="/trainers/material-review">Открыть архив при проверке материалов →</Link></p>}
  {needsRefresh?<p role="status">Список мог измениться. Обнови локальные записи; прежняя выборка скрыта.</p>:<p ref={results} tabIndex={-1} className={styles.results} role="status">Найдено: {page.total}. {page.total>0&&`На экране ${page.page*BANK_PAGE_SIZE+1}–${Math.min(page.total,(page.page+1)*BANK_PAGE_SIZE)}.`}</p>}
  {needsRefresh?null:page.total?<div className={styles.grid}>{page.items.map(source=><Card key={JSON.stringify(source.ref)} source={source} actor={actor}/>)}</div>:<section className={styles.empty}><h2>Подходящих заданий нет</h2><p>Попробуй другой навык или сбрось фильтры.</p><button type="button" className={styles.read} onClick={()=>change({exam:'all',trainer:'all',query:''})}>Сбросить фильтры</button></section>}
  {!needsRefresh&&page.pages>1&&<nav className={styles.pager} aria-label="Страницы заданий"><button type="button" disabled={page.page===0} onClick={()=>goPage(page.page-1)}>Предыдущая</button><span>Страница {page.page+1} из {page.pages}</span><button type="button" disabled={page.page===page.pages-1} onClick={()=>goPage(page.page+1)}>Следующая</button></nav>}
 </>;
}
export default function TrainerBankDirectory(){return <RequireRole roles={['teacher','author']}>{user=><Directory key={`${user.id}:${user.role}`} actor={user.id}/>}</RequireRole>;}
