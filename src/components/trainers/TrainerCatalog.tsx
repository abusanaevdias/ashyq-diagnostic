'use client';
import {useState} from 'react';
import {trainerCatalog,type TrainerId} from '@/lib/trainers/catalog';
import TrainerPracticeLink from './TrainerPracticeLink';
import FluidSegments from '../ui/FluidSegments';
import styles from '@/app/trainers/trainers.module.css';

const details:Record<TrainerId,{art:string;description:string;action:string}>={
 'reading-evidence':{art:'T / F / NG',description:'Выбери ответ и точную опору в тексте. Разберись в логике и попробуй новый вопрос.',action:'Попробовать Reading'},
 'listening-replay':{art:'13 → 30',description:'Предскажи тип ответа, послушай запись и восстанови пропущенное с постепенной помощью.',action:'Попробовать Listening'},
 'speaking-second-take':{art:'1 → 2',description:'Прослушай себя, составь план правки и сравни повтор с ответом на новую тему.',action:'Попробовать Speaking'},
 'task1-overview':{art:'↗ ↘ →',description:'Выбери главное, проверь опору на данные и убери неточности перед полным отчётом.',action:'Попробовать Task 1'},
 'writing-task2':{art:'make → makes',description:'Найди ошибки в готовом учебном эссе и перепиши его по критериям шаг за шагом.',action:'Попробовать Writing'},
 'writing-drills':{art:'idea + why',description:'Объедини мысли, исправь грамматику или развей один аргумент перед работой над целым эссе.',action:'Выбрать короткое упражнение'},
 'sat-optionless':{art:'? → A B C D',description:'Сначала запиши свой прогноз. Затем сравни его с вариантами и реши новый вопрос.',action:'Попробовать SAT R&W'},
 'sat-distractor':{art:'A / B / C / D',description:'Объясни, почему ложные варианты не подходят. Проверь своё обоснование на новом тексте.',action:'Разобрать варианты'},
 'math-forensics':{art:'× → ✓',description:'Разбери чужое решение, исправь первый неверный переход и реши новую задачу.',action:'Попробовать SAT Math'},
 'sat-translation':{art:'words → x',description:'Отдели разовый платёж от ставки. Зафиксируй модель до расчёта и проверь её на новой задаче.',action:'Собрать модель'},
 'math-method-switch':{art:'x + y',description:'Реши систему сам. Сравни алгебру, график и таблицу и попробуй другой путь.',action:'Выбрать другой способ'},
};
export default function TrainerCatalog(){
 const [exam,setExam]=useState('all');const shown=trainerCatalog.filter(t=>exam==='all'||t.exam===exam);
 return <section aria-label="Каталог тренажёров">
  <div className={styles.controls}><FluidSegments value={exam} label="Фильтр по экзамену">{[['all','Все'],['IELTS','IELTS'],['SAT','SAT']].map(([id,label])=><button type="button" key={id} aria-pressed={exam===id} onClick={()=>setExam(id)}>{label}</button>)}</FluidSegments><p role="status">{shown.length} из {trainerCatalog.length} направлений</p></div>
  <div className={styles.grid}>{shown.map(t=>{const d=details[t.id];return <article key={t.id} className={styles.card} data-trainer-exam={t.exam} data-motion-reveal data-motion-card><span>{t.exam} · {t.skill}</span><div className={styles.art} aria-hidden="true">{d.art}</div><h2>{t.id==='task1-overview'?'Собери overview по графику':t.title}</h2><p>{d.description}</p><TrainerPracticeLink href={t.id==='writing-task2'?'/writing/trainer':t.href}>{d.action} <span aria-hidden="true">→</span></TrainerPracticeLink></article>;})}</div>
 </section>;
}
