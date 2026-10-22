import type { Confidence, ReadingTask, TfngAnswer } from '@/lib/reading-evidence/cases';
import './LearningFeedback.css';
import React from 'react';

type Check={label:string;state:'good'|'bad'|'review'|'neutral';value:string;detail?:string};
export function FeedbackSummary({title,checks,next,compact=false,label="Результат этой попытки"}:{title:string;checks:Check[];next?:string;compact?:boolean;label?:string}){
 const good=checks.filter(c=>c.state==='good').length,bad=checks.filter(c=>c.state==='bad').length;
 const tone=bad?(good?'mixed':'retry'):checks.some(c=>c.state==='review')?'mixed':good?'success':'neutral';
 return <section className={`learning-feedback ${tone} ${compact?'compact':''}`} aria-label="Результат проверки">
  <div className="feedback-heading" role="status" aria-atomic="true"><span className="feedback-symbol" aria-hidden="true">{tone==='success'?'✓':tone==='retry'?'×':tone==='mixed'?'!':'—'}</span><div><p className="feedback-kicker">{label}</p><h3>{title}</h3></div></div>
  <ul className="feedback-checks">{checks.map((c,i)=><li key={i} className={'check-'+c.state}><div><strong>{c.label}</strong><span className="check-state"><b aria-hidden="true">{c.state==='good'?'✓':c.state==='bad'?'×':c.state==='review'?'!':'—'}</b>{c.value}</span></div>{c.detail&&<p>{c.detail}</p>}</li>)}</ul>
  {next&&<p className="feedback-next"><strong>Следующий шаг</strong>{next}</p>}
 </section>;
}
export function ReadingFeedback({task,attempt,evidenceOk,compact=false,label='Результат этой попытки'}:{task:ReadingTask;attempt:{answer:TfngAnswer;evidenceId:string;confidence:Confidence};evidenceOk:boolean;compact?:boolean;label?:string}){
 const ok=attempt.answer===task.answer,ng=task.answer==='NOT GIVEN';
 const title=ng?(ok&&evidenceOk?'Ответ верный. Область проверки подходит':ok?'Ответ верный. Область проверки нужно заменить':evidenceOk?'Область выбрана. Ответ нужно исправить':'Пересмотри ответ и область проверки'):(ok&&evidenceOk?'Ответ и опора верны':ok?'Ответ верный. Опору нужно заменить':evidenceOk?'Опора найдена. Ответ нужно исправить':'Нужно исправить ответ и опору');
 const chosen=task.sentences.find((s)=>s.id===attempt.evidenceId),key=task.sentences.find((s)=>s.id===task.evidenceId);
 return <div className="reading-feedback-group"><FeedbackSummary title={title} compact={compact} label={label} checks={[
  {label:'Ответ',state:ok?'good':'bad',value:ok?'Верно':'Пока неверно',detail:`Твой ответ: ${attempt.answer}. Верный ответ: ${task.answer}.`},
  {label:ng?'Область проверки':'Опора в тексте',state:evidenceOk?'good':'bad',value:evidenceOk?'Подходит':'Нужно заменить',detail:evidenceOk?(ng?'Выбрана релевантная область. Для NOT GIVEN всё равно нужно проверить весь отрывок.':'Эта фраза обосновывает верный ответ '+task.answer+'.'):ng?'Это предложение не относится к факту, который нужно проверить.':`Ты выбрал: «${chosen?.text ?? ''}». ${task.explanation}`},
  {label:'Твоя уверенность',state:'neutral',value:{low:'Низкая',medium:'Средняя',high:'Высокая'}[attempt.confidence],detail:'Самооценка до разбора. Она не влияет на проверку ответа.'}
 ]} next={compact?undefined:ng?'Проверь весь отрывок: есть ли в нём именно этот факт? Сравни релевантную область с утверждением и затем повтори решение.':ok&&evidenceOk?'Объясни себе, почему этот ответ подходит. Затем повтори решение и проверь себя на новом тексте.':ok?'Оставь ответ '+attempt.answer+', но найди предложение, которое обосновывает его. Ниже можно открыть объяснение.':'Сверь утверждение с ключевой фразой. Затем ответь на тот же вопрос заново.'}/>
 {!compact&&<div className="evidence-comparison"><div className={evidenceOk?'evidence-good':'evidence-retry'}><p><strong>Ты выбрал {chosen?.id.toUpperCase()}</strong> · {evidenceOk?'подходит':'не подходит'}</p><blockquote lang="en">{chosen?.text}</blockquote></div>{!evidenceOk&&<div className="evidence-good"><p><strong>{ng?'Релевантная область':'Подходящая опора'} · {key?.id.toUpperCase()}</strong></p><blockquote lang="en">{key?.text}</blockquote><p>{ng?'Сверь с остальным отрывком: результата по этому факту в нём нет.':'Сравни смысл этой фразы с утверждением в вопросе.'}</p></div>}</div>}
 </div>;
}
export function LearningRoute({phase,steps,round}:{phase:string;steps:[string,string][];round?:string}){
 const index=steps.findIndex(([key])=>key===phase);if(index<0)return null;
 return <nav className="learning-route" aria-label="Путь по занятию"><div><span>{round||'Твоё занятие'}</span><strong>Шаг {index+1} из {steps.length} · {steps[index][1]}</strong></div><div className="route-dots" role="progressbar" aria-label="Этап занятия" aria-valuemin={1} aria-valuemax={steps.length} aria-valuenow={index+1} aria-valuetext={`Шаг ${index+1} из ${steps.length}`}>{steps.map(([key],i)=><i key={key} className={i<index?'done':i===index?'current':''}/>)}</div>{index+1<steps.length&&<p>Дальше: {steps[index+1][1].toLowerCase()}</p>}</nav>;
}
