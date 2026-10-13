'use client';

import { useEffect, useRef, useState } from 'react';
import { mentionsTask2Issue, parseDraftTask2, task2Words, type DraftTask2, type Task2Correction, type Task2Round } from '@/lib/trainers/draft-task2';
import styles from './TrainerCheckpoint.module.css';

type Attempt = { corrections: Task2Correction[]; noIssues: boolean; argumentQuote: string; argumentReason: string; revision: string; reflection: string };
const blank = (): Attempt => ({corrections:[{quote:'',replacement:'',reason:''}],noIssues:false,argumentQuote:'',argumentReason:'',revision:'',reflection:''});
function Source({ item, highlight }: { item: Task2Round; highlight: boolean }) {
  const spans = highlight ? item.issues.map(i=>({start:item.text.indexOf(i.before),end:item.text.indexOf(i.before)+i.before.length,id:i.id})).sort((a,b)=>a.start-b.start) : [];
  return <div lang="en" className={`${styles.materialText} ${styles.frozenText} ${styles.essaySource}`} data-task2-source>{spans.map((span,index)=><span key={span.id}>{item.text.slice(index?spans[index-1].end:0,span.start)}<mark className={styles.errorHighlight} aria-label={`Языковая цель ${span.id}: ${item.text.slice(span.start,span.end)}`}>{item.text.slice(span.start,span.end)} <strong>[{span.id}]</strong></mark></span>)}{item.text.slice(spans.at(-1)?.end??0)}</div>;
}
function Preview({ pair }: { pair: DraftTask2 }) {
  const [started,setStarted]=useState(false),[index,setIndex]=useState(0),[revealed,setRevealed]=useState(false),[result,setResult]=useState(false);
  const [attempt,setAttempt]=useState<Attempt>(blank),[saved,setSaved]=useState<Attempt[]>([]),[checked,setChecked]=useState(false),[error,setError]=useState('');
  const stage = useRef<HTMLHeadingElement>(null);
  useEffect(()=>{ if (started) { stage.current?.focus({preventScroll:true}); stage.current?.scrollIntoView({block:'start',behavior:'instant'}); } },[started,index,revealed,result]);
  const item=pair.rounds[index];
  function change(patch: Partial<Attempt>) { setAttempt(old=>({...old,...patch})); setError(''); }
  function updateRow(position:number,patch:Partial<Task2Correction>) { change({corrections:attempt.corrections.map((row,i)=>i===position?{...row,...patch}:row)}); }
  function reveal() {
    if (!attempt.noIssues && (!attempt.corrections.length || attempt.corrections.some(row=>!row.quote.trim()||row.replacement.trim().length<2||row.reason.trim().length<3))) {setError('Заполни исходный фрагмент, свою правку и объяснение для каждой строки или явно отметь, что не нашёл языковых проблем.');return;}
    if (!attempt.noIssues && attempt.corrections.some(row=>!item.text.includes(row.quote.trim()))) {setError('Исходный фрагмент нужно скопировать точно из этого эссе. Его наличие не подтверждает качество правки.');return;}
    if (!attempt.argumentQuote.trim() || !item.text.includes(attempt.argumentQuote.trim()) || attempt.argumentReason.trim().length<12) {setError('Скопируй фрагмент аргумента из эссе и объясни свою мысль хотя бы в 12 символах. Длина — только проверка заполнения.');return;}
    setAttempt(old=>({...old,corrections:old.noIssues?[]:old.corrections.map(row=>({...row,quote:row.quote.trim()})),argumentQuote:old.argumentQuote.trim()}));
    setRevealed(true);setError('');
  }
  function next() {
    if (task2Words(attempt.revision)<250 || !checked || attempt.reflection.trim().length<12) {setError('Нужны отдельная версия от 250 слов, подтверждение сравнения и конкретная рефлексия. Число слов не оценивает качество.');return;}
    setSaved(old=>[...old,attempt]);setError('');
    if(index===1) setResult(true); else {setIndex(1);setRevealed(false);setAttempt(blank());setChecked(false);}
  }
  function reset(){setStarted(false);setIndex(0);setRevealed(false);setResult(false);setAttempt(blank());setSaved([]);setChecked(false);setError('');}
  return <section className={styles.preview} aria-labelledby="task2-draft-title"><h3 id="task2-draft-title">Пробное эссе · DRAFT</h3>
    <p>Сам найди языковые проблемы, объясни слабое место аргумента, сравни с разбором и создай отдельную версию. Затем повтори работу на другом эссе. Свободный текст проверяется вручную: нет AI, автоматического band или оценки качества по количеству слов. Проба временная, без истории и решения о публикации. Просмотр ключа заранее влияет на независимость.</p>
    {!started?<button type="button" onClick={()=>setStarted(true)}>Начать пробу эссе</button>:result?<>
      <h4 ref={stage} tabIndex={-1} className={styles.essayStage}>Два эссе: первая работа и версии после разбора</h4><p>Разбор использован в обоих текстах. Новое эссе начато после изучения первого, но до показа его собственного ключа. Это не измерение роста IELTS band.</p>
      {saved.map((value,i)=><section className={styles.outcome} key={i}><h4>{i?'Новый текст':'Первый текст'}</h4><p lang="en">{pair.rounds[i].prompt}</p><h5>Твои правки до разбора</h5>{value.noIssues?<p>Языковые проблемы не были указаны.</p>:value.corrections.map((row,j)=><div key={j}><p lang="en">{row.quote} → {row.replacement}</p><p>{row.reason}</p></div>)}<h5>Твой анализ аргумента до разбора</h5><p lang="en">{value.argumentQuote}</p><p>{value.argumentReason}</p><h5>Твоя версия после разбора</h5><p lang="en" className={styles.frozenText}>{value.revision}</p><h5>Твоя рефлексия</h5><p>{value.reflection}</p></section>)}
    </>:<>
      <h4 ref={stage} tabIndex={-1} className={styles.essayStage}>{revealed?(index?'Разбор нового текста':'Разбор первого текста'):(index?'Новый текст · самостоятельный поиск':'Первый текст · самостоятельный поиск')}</h4><p lang="en"><strong>{item.prompt}</strong></p><p>Учебный текст: {task2Words(item.text)} слов. {revealed?'Языковые цели теперь подчёркнуты и отмечены номерами; ниже — объяснения.':'До разбора цели не подсвечены; корректные предложения можно оставить.'}</p>
      <Source item={item} highlight={revealed}/>
      {!revealed?<>
        <label className={styles.consent}><input type="checkbox" checked={attempt.noIssues} onChange={event=>change({noIssues:event.target.checked})}/>Не нашёл языковых проблем; хочу сравнить свою попытку с разбором</label>
        <fieldset disabled={attempt.noIssues} className={styles.previewReasons}><legend>Твои языковые правки до подсказок</legend>{attempt.corrections.map((row,i)=><div key={i} className={styles.outcome}>
          <label htmlFor={`task2-quote-${i}`}>Исходный фрагмент {i+1}</label><textarea id={`task2-quote-${i}`} maxLength={1000} rows={2} value={row.quote} onChange={event=>updateRow(i,{quote:event.target.value})}/>
          <label htmlFor={`task2-replacement-${i}`}>Твоя правка {i+1}</label><textarea id={`task2-replacement-${i}`} maxLength={1500} rows={2} value={row.replacement} onChange={event=>updateRow(i,{replacement:event.target.value})}/>
          <label htmlFor={`task2-reason-${i}`}>Почему меняешь {i+1}</label><textarea id={`task2-reason-${i}`} maxLength={1500} rows={2} value={row.reason} onChange={event=>updateRow(i,{reason:event.target.value})}/>
          {attempt.corrections.length>1&&<button type="button" onClick={()=>change({corrections:attempt.corrections.filter((_,j)=>i!==j)})}>Убрать правку {i+1}</button>}</div>)}<button type="button" disabled={attempt.corrections.length>=12} onClick={()=>change({corrections:[...attempt.corrections,{quote:'',replacement:'',reason:''}]})}>Добавить языковую правку</button></fieldset>
        <div className={styles.previewReasons}>
          <label htmlFor="task2-argument-quote">Фрагмент аргумента, который хочешь проверить</label><textarea id="task2-argument-quote" maxLength={2000} rows={3} value={attempt.argumentQuote} onChange={event=>change({argumentQuote:event.target.value})}/>
          <label htmlFor="task2-argument-reason">Что нужно уточнить или объяснить в аргументе?</label><textarea id="task2-argument-reason" maxLength={3000} rows={4} value={attempt.argumentReason} onChange={event=>change({argumentReason:event.target.value})}/>
        </div>
        <button type="button" onClick={reveal}>Зафиксировать поиск и показать разбор</button>
      </>:<>
        <h4>Языковые цели: сравни со своими правками</h4><p>Подсвечены подготовленные цели, а не все возможные замечания. Отметка «указан» означает только наличие исходного фрагмента в твоей записи. Предложенное исправление ещё требует проверки; другие корректные формулировки допустимы.</p>
        {item.issues.map(issue=><section key={issue.id} className={styles.outcome}><h5>{issue.id} · {mentionsTask2Issue(attempt.corrections,issue)?'Исходный фрагмент указан; правка не оценена':'Этот целевой фрагмент не указан в твоих заметках'}</h5><p lang="en"><mark className={styles.errorHighlight}>{issue.before}</mark> → <strong>{issue.after}</strong></p><p>{issue.why}</p><p>Другие варианты (неполный список): <span lang="en">{issue.alternatives.join(' / ')}</span></p></section>)}
        <details className={styles.outcome}><summary>Твои зафиксированные правки и анализ до подсказок</summary>{attempt.noIssues?<p>Языковые проблемы не были указаны.</p>:attempt.corrections.map((row,i)=><div key={i}><p lang="en">{row.quote} → {row.replacement}</p><p>{row.reason}</p></div>)}<p lang="en">{attempt.argumentQuote}</p><p>{attempt.argumentReason}</p></details>
        <h4>Развитие аргумента</h4><blockquote lang="en" className={styles.warning}>{item.argument.before}</blockquote><p>{item.argument.explanation}</p><p lang="en">{item.argument.example}</p>
        <h4>Четыре направления проверки, без band</h4>{item.criteria.map(c=><div key={c.name}><h5>{c.name}</h5><p>{c.note}</p></div>)}
        <details className={styles.outcome}><summary>Показать версию только с языковыми правками</summary><p>Аргумент намеренно ещё не улучшен.</p><p lang="en" className={styles.frozenText}>{item.languageOnly}</p></details>
        <details className={styles.outcome}><summary>Показать пример с развитием аргумента</summary><p>Один подготовленный вариант, не единственно правильный или «идеальный» ответ. Официальная оценка не проводилась.</p><p lang="en" className={styles.frozenText}>{item.example}</p></details>
        <label htmlFor="task2-revision">Твоя отдельная версия эссе после разбора</label><textarea id="task2-revision" maxLength={24000} rows={14} value={attempt.revision} onChange={event=>change({revision:event.target.value})}/><p>{task2Words(attempt.revision)} слов; минимум 250 — проверка объёма, не качества. Можно сохранить корректные части исходного текста.</p>
        <label className={styles.consent}><input type="checkbox" checked={checked} onChange={event=>setChecked(event.target.checked)}/>Я сравнил язык, развитие аргумента и сохранность позиции; моя версия ещё не получила внешнюю оценку</label>
        <label htmlFor="task2-reflection">Что изменил и что ещё требует проверки?</label><textarea id="task2-reflection" maxLength={3000} rows={4} value={attempt.reflection} onChange={event=>change({reflection:event.target.value})}/>
        <button type="button" onClick={next}>{index?'Завершить пробу двух эссе':'Перейти к новому эссе'}</button>
      </>}
    </>}
    {error&&<p role="alert" className={styles.warning}>{error}</p>}{started&&<div className={styles.actions}><button type="button" onClick={reset}>Начать новую временную пробу эссе</button></div>}
  </section>;
}
export default function DraftTask2Preview({ value }: { value: unknown }) {
  if (!value || typeof value!=='object' || !('kind' in value) || value.kind!=='task2-pair-v1') return null;
  const pair=parseDraftTask2(value);
  return pair?<Preview pair={pair}/>:<p role="alert">Структура Task 2 не прошла проверку. Другое эссе не подставлено.</p>;
}
