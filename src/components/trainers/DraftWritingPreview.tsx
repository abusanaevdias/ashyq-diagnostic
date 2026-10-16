'use client';

import { useCallback, useEffect, useRef, useState, type Dispatch, type SetStateAction } from 'react';
import { parseDraftWriting, type DraftWritingDrill } from '@/lib/trainers/draft-writing';
import { appendDrillChoice } from '@/lib/trainers/drill-records';
import styles from './TrainerCheckpoint.module.css';
import BankCheckpoint from './BankCheckpoint';
import {isPublishedBankSource} from '@/lib/trainers/bank-publication';
import type { BankSource } from '@/lib/trainers/bank-sources';
import {bankWritingPair,emptyBankWritingRound,type BankWritingRound,type BankWritingState} from '@/lib/trainers/bank-writing-state';

const unchanged=()=>{};
function Round({ item, following, guide, state, setState, onComplete }: { item: DraftWritingDrill; following: boolean;guide?:{goal:string;plan:string};state:BankWritingRound;setState:Dispatch<SetStateAction<BankWritingRound>>;onComplete: (record: BankWritingRound) => void }) {
  const {draft,locked,choice,revealed,trail,help,attempts,revision,reflection,acknowledged,exposure}=state;
  function setter<K extends keyof BankWritingRound>(key:K):Dispatch<SetStateAction<BankWritingRound[K]>>{return action=>setState(old=>({...old,[key]:typeof action==='function'?(action as (value:BankWritingRound[K])=>BankWritingRound[K])(old[key]):action}));}
  const setDraft=setter('draft'),setLocked=setter('locked'),setChoice=setter('choice'),setRevealed=setter('revealed'),setTrail=setter('trail'),setHelp=setter('help'),setAttempts=setter('attempts'),setRevision=setter('revision'),setReflection=setter('reflection'),setAcknowledged=setter('acknowledged'),setExposure=setter('exposure');
  const [feedback, setFeedback] = useState(()=>revealed&&help?'Разбор открыт по запросу. Это не самостоятельный выбор верного варианта.':trail.length&&(revealed||choice===null)?item.choices[trail.at(-1)!].feedback:'');
  const heading = useRef<HTMLHeadingElement>(null);
  const repair = useRef<HTMLHeadingElement>(null);
  useEffect(() => { heading.current?.focus(); }, []);
  useEffect(() => { if (revealed) repair.current?.focus(); }, [revealed]);
  return <>
    <h4 ref={heading} tabIndex={-1}>{following ? 'Следующее задание того же типа практики' : 'Самостоятельная попытка'} · {item.id} · {item.title}</h4>
    {guide&&<div className={styles.outcome}><p><strong>Тот же приём в другом контексте:</strong> {guide.goal}</p><p>Твой план перед этой пробой:</p><p className={styles.frozenText}>{guide.plan}</p></div>}
    <p>{following ? 'Сначала напиши свой вариант. Если уже видел этот материал или его разбор, отметь это ниже.' : 'Если ключ уже знаком, отметь это. Незнакомый текст сам по себе также не доказывает независимость ответа.'}</p>
    <p><strong>{item.task}</strong></p>
    <div className={styles.materialText} lang="en">{item.source.map((line,index) => <p key={index}>{line}</p>)}</div>
    <fieldset className={styles.filters} disabled={locked}><legend>Знаком ли тебе этот материал или его разбор?</legend>
      {([['unknown','Не уверен'],['unseen','Не видел раньше'],['seen','Уже видел материал или ключ']] as const).map(([value,label]) => <label key={value}><input type="radio" name="draft-writing-exposure" checked={exposure === value} onChange={() => setExposure(value)}/>{label}</label>)}
    </fieldset>
    <label htmlFor="draft-preview-answer">Твоя первая попытка</label>
    <p>Ответ напиши на английском. Объяснение своего способа проверки можно дать на русском.</p>
    <textarea id="draft-preview-answer" maxLength={4000} rows={4} value={draft} disabled={locked} onChange={event => { setDraft(event.target.value); setFeedback(''); }}/>
    {!locked ? <button type="button" onClick={() => { if (draft.trim().length < 12) { setFeedback('Сначала напиши свой вариант: хотя бы 12 символов.'); return; } setLocked(true); setFeedback(''); }}>Зафиксировать попытку и показать варианты</button> : <>
      <p>Первая попытка и знакомство с материалом зафиксированы. Варианты проверяют выбор, а не качество написанного тобой текста.</p>
      <fieldset disabled={revealed} className={styles.filters}><legend>Какой вариант выполняет задание?</legend>{item.choices.map((option,index) => <label key={index}><input type="radio" name="draft-preview-choice" checked={choice === index} onChange={() => { setChoice(index); setFeedback(''); }}/><span lang="en">{option.text}</span></label>)}</fieldset>
      {!revealed && <div className={styles.actions}>
        <button type="button" onClick={() => { if (choice === null) { setFeedback('Выбери вариант для сравнения.'); return; } setAttempts(old => old + 1); setTrail(old => appendDrillChoice(old,choice)); setFeedback(item.choices[choice].feedback); if (item.choices[choice].best) setRevealed(true); else setChoice(null); }}>Проверить выбранный вариант</button>
        <button type="button" onClick={() => { setHelp(true); setRevealed(true); setFeedback('Разбор открыт по запросу. Это не самостоятельный выбор верного варианта.'); }}>Показать разбор без выбора</button>
      </div>}
    </>}
    {feedback && <p role="status" className={styles.warning}>{feedback}</p>}
    {revealed && <>
      <div className={styles.outcome}>
        <h4 ref={repair} tabIndex={-1}>Сравни с первой попыткой</h4><p className={styles.frozenText}>{draft}</p>
        <p><strong>Подготовленный пример:</strong> <span lang="en">{item.example}</span></p><p>{item.explanation}</p>
        <p>Проверок вариантов: {attempts}. Выборы: {trail.length ? trail.map(index => index + 1).join(' → ') : 'не было'}. {attempts > 20 && 'Показаны первый выбор и последние 19.'} {help ? 'Разбор открыт по запросу.' : 'Подготовленный верный вариант выбран после указанного числа проверок.'} Это не оценка написанного тобой текста.</p>
        <details><summary>Другие допустимые формулировки и замечания автору</summary><p>Список не исчерпывающий. Иной верный вариант не становится ошибкой из-за несовпадения с образцом.</p>{item.accepted_alternatives.map((line,index) => <p key={index}>{line}</p>)}{item.review_notes.map((line,index) => <p key={index}>{line}</p>)}</details>
      </div>
      <label htmlFor="draft-writing-revision">Твой вариант после разбора</label>
      <textarea id="draft-writing-revision" maxLength={4000} rows={5} value={revision} onChange={event => { setRevision(event.target.value); setFeedback(''); }}/>
      <p>Перепиши с учётом разбора. Корректную первую версию можно оставить без изменений. Наличие правки не означает улучшение.</p>
      <label htmlFor="draft-writing-reflection">Что проверишь в следующем задании?</label>
      {item.transfer_goal&&<p><strong>Приём для следующей пробы:</strong> {item.transfer_goal}</p>}
      <textarea id="draft-writing-reflection" maxLength={1500} rows={3} value={reflection} onChange={event => { setReflection(event.target.value); setFeedback(''); }}/>
      <label className={styles.consent}><input type="checkbox" checked={acknowledged} onChange={event => setAcknowledged(event.target.checked)}/> Понимаю: мои тексты и объяснение требуют ручной проверки; совпадение с образцом и число слов не являются оценкой.</label>
      <div className={styles.actions}><button type="button" onClick={() => {
        if (revision.trim().length < 12 || reflection.trim().length < 12 || !acknowledged) { setFeedback('Запиши вариант после разбора и план проверки (хотя бы по 12 символов), затем подтверди границы оценки.'); return; }
        onComplete(structuredClone(state));
      }}>{following ? 'Завершить пробу и сравнить попытки' : 'Зафиксировать пересмотр и продолжить'}</button></div>
    </>}
  </>;
}

function Preview({ item, next,source,onDirty,onBusy }: { item: DraftWritingDrill; next: DraftWritingDrill | null;source:BankSource|null;onDirty:(dirty:boolean)=>void;onBusy:(busy:boolean)=>void }) {
  const [started, setStarted] = useState(false);
  const [records, setRecords] = useState<BankWritingRound[]>([]);
  const [roundState,setRoundState]=useState(()=>emptyBankWritingRound(item.id));
  const [generation, setGeneration] = useState(0);
  const [roundGeneration,setRoundGeneration]=useState(0),[bankBusy,setBankBusy]=useState(false),[resetRequested,setResetRequested]=useState(false),[focusTick,setFocusTick]=useState(0);
  const heading=useRef<HTMLHeadingElement>(null);
  const handleBusy=useCallback((value:boolean)=>{setBankBusy(value);onBusy(value);},[onBusy]);
  const snapshot:BankWritingState={type:'writing-drill',started,current:roundState,records};
  function restore(value:BankWritingState){setStarted(value.started);setRoundState(value.current);setRecords(value.records);setRoundGeneration(value=>value+1);setResetRequested(false);setFocusTick(value=>value+1);}
  const done = records.length === (next ? 2 : 1);
  const current = records.length === 0 ? item : next;
  const report = useRef<HTMLHeadingElement>(null);
  useEffect(() => { if (done) report.current?.focus();else if(!started&&focusTick)heading.current?.focus(); }, [done,started,focusTick]);
  function reset() { setStarted(false);setRecords([]);setRoundState(emptyBankWritingRound(item.id));setGeneration(value => value+1);setResetRequested(false);setFocusTick(value=>value+1); }
  return <section className={styles.preview} aria-labelledby="draft-preview-title">
    <h3 ref={heading} tabIndex={-1} id="draft-preview-title">{source&&isPublishedBankSource(source.ref)?'Практика Writing':'Пробное прохождение · DRAFT'}</h3>
    <p>Проверь путь ученика до решения о материале. {source?'Первую работу, разбор, пересмотр и следующее задание можно сохранить отдельной кнопкой ниже в этом браузере.':'Попытка временная: при закрытии страницы тексты будут потеряны.'} Она не публикует задание и не оценивает свободный текст.</p>
    <fieldset className={styles.practiceBody} disabled={bankBusy}><legend>Короткая Writing-практика</legend>
    {!started ? <button type="button" onClick={() => setStarted(true)}>{source&&isPublishedBankSource(source.ref)?'Начать задание':'Пройти черновик как ученик'}</button> : <>
      {!done && current && <Round key={`${generation}:${roundGeneration}:${current.id}`} item={current} following={records.length>0} guide={records.length>0&&item.transfer_goal?{goal:item.transfer_goal,plan:records[0].reflection}:undefined} state={roundState} setState={setRoundState} onComplete={record => {setRecords(old => [...old,record]);if(!records.length&&next)setRoundState(emptyBankWritingRound(next.id));}}/>}
      {done && <div className={styles.outcome}>
        <h4 ref={report} tabIndex={-1}>{source?'Отчёт пробы':'Отчёт временной пробы'}</h4>
        <p>Первый ответ, пересмотр после помощи и другое задание показаны отдельно. Это не band, не доказательство освоения и не автоматическая оценка улучшения.</p>
        {!next && <p>Другого задания того же типа нет в доступном наборе. Перенос навыка не проверялся.</p>}
        {records.map((record,index) => <section key={record.id} aria-label={`Попытки ${record.id}`}>
          <h5>{index ? 'Другое задание' : 'Первое задание'} · {record.id} · {index?next?.title:item.title}</h5>
          <p>Знакомство до попытки: {record.exposure === 'unseen' ? 'по словам участника, не видел раньше' : record.exposure === 'seen' ? 'уже видел материал или ключ' : 'не установлено'}. Разбор по запросу: {record.help ? 'да' : 'нет'}. Проверок вариантов: {record.attempts}; выборы: {record.trail.length ? record.trail.map(value => value+1).join(' → ') : 'не было'}.{record.attempts>20 && ' Сохранены первый выбор и последние 19.'}</p>
          <p><strong>Первая попытка</strong></p><p className={styles.frozenText}>{record.draft}</p>
          <p><strong>После разбора</strong></p><p className={styles.frozenText}>{record.revision}</p>
          <p>{record.draft === record.revision ? 'Текст оставлен без изменений.' : 'Текст изменён; качество изменений вручную ещё не проверено.'}</p>
          <p><strong>План проверки</strong></p><p className={styles.frozenText}>{record.reflection}</p>
        </section>)}
      </div>}
    </>}
    </fieldset>
    {source&&<BankCheckpoint key={generation} source={source} data={snapshot} onRestore={value=>{if(value.type==='writing-drill')restore(value);}} onDirty={onDirty} onBusy={handleBusy}/>}
    {started&&<div className={styles.actions}><button type="button" disabled={bankBusy} onClick={()=>source?setResetRequested(true):reset()}>Начать новую пробу</button></div>}
    {resetRequested&&<div role="alert" className={styles.warning}><p>Новая проба очистит текст на экране. Сохранённая работа и история останутся; несохранённые изменения сначала сохрани или скачай.</p><div className={styles.actions}><button type="button" disabled={bankBusy} onClick={reset}>Подтвердить новую пробу</button><button type="button" disabled={bankBusy} onClick={()=>setResetRequested(false)}>Продолжить текущую пробу</button></div></div>}
  </section>;
}

export default function DraftWritingPreview({ value, nextValue,source=null,onDirty=unchanged,onBusy=unchanged }: { value: unknown; nextValue?: unknown;source?:BankSource|null;onDirty?:(dirty:boolean)=>void;onBusy?:(busy:boolean)=>void }) {
  if (!value || typeof value !== 'object' || !('kind' in value) || value.kind !== 'writing-drill-v1') return null;
  const item = parseDraftWriting(value);
  if (!item) return <p role="alert">Данные черновика не подходят для пробного прохождения. Проверь структуру материала; другое задание не подставлено.</p>;
  const bankPair=source?bankWritingPair(source):null;
  if(source&&(!bankPair||JSON.stringify(item)!==JSON.stringify(bankPair[0])))return <p role="alert">Версия пары Writing не прошла проверку. Другой материал не подставлен.</p>;
  const candidate = parseDraftWriting(nextValue);
  const next = item.transfer ?? (candidate && candidate.mode === item.mode && candidate.id !== item.id && candidate.example !== item.example && JSON.stringify(candidate.source) !== JSON.stringify(item.source) ? candidate : null);
  return <Preview key={`${item.id}:${bankPair?.[1].id??next?.id??'none'}`} item={item} next={bankPair?.[1]??next} source={source} onDirty={onDirty} onBusy={onBusy}/>;
}
