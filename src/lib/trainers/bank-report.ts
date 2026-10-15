import {isPublishedBankSource} from './bank-publication';
import type {BankSource} from './bank-sources';
import {findBankSource} from './bank-sources';
import {bankSnapshotComplete,validSourceSnapshot,type BankSnapshot} from './bank-snapshots';
import type {DocxBlock} from './docx-package';
import {speakingCriteria} from '../speaking-second-take/prompts';

/** Response-only report. Never serializes the source exercise or unopened answer/model. */
export function bankReportBlocks(source:BankSource,state:BankSnapshot):DocxBlock[]{
 const trusted=findBankSource(source.ref);if(!trusted)throw new Error('Версия задания недоступна. Отчёт не создан.');source=trusted;
 if(!validSourceSnapshot(source,state))throw new Error('Работа не соответствует версии задания. Отчёт не создан.');
 const blocks:DocxBlock[]=[],heading=(text:string)=>blocks.push({kind:'heading2',text}),field=(name:string,value:string|number|null)=>blocks.push({kind:'paragraph',text:`${name}: ${value===null?'не указано':value===''?'не заполнено':value}`});
 blocks.push({kind:'heading1',text:`ASHYQ · ${source.title}`},{kind:'paragraph',text:`Задание ${source.ref.unitId} · пакет ${source.ref.batchId} · версия ${source.ref.version}\nИсточник: ${source.ref.contentHash}`},{kind:'paragraph',text:`${source.practiceType} · ${bankSnapshotComplete(state)?'Этапы пробы завершены':'Работа в процессе'}. ${isPublishedBankSource(source.ref)?'Материал включён в опубликованный реестр по записи одобрения; сложность не откалибрована.':'Учебный материал DRAFT, методически не утверждён, сложность не откалибрована.'}`},{kind:'paragraph',text:'Это отчёт с ответами и заметками пользователя. Завершение и выбор варианта не подтверждают освоение или экзаменационный балл. Свободный текст требует проверки. Word не предназначен для восстановления: для этого скачай JSON. Неоткрытые ответы и образцы в отчёт не включены.'});
 const round=(index:number)=>heading(index===0?'Первое задание':index===1?'Другое задание · после работы с первым':'');
 switch(state.type){
  case 'reading-lab':{
   const rows=state.report?state.attempts:[...state.attempts,{first:state.frozen??state.response,repair:state.repair}];
   rows.forEach((a,i)=>{round(i);field('Первая попытка зафиксирована и разбор открыт',i<state.attempts.length||state.frozen!==null?'да':'нет');field('Собственная мысль до ответа · не оценена',a.first.prediction);field('Первый ответ',a.first.answer);field('Первая цитата',a.first.quote);field('Первое объяснение · не оценено',a.first.reason);field('Заявленная уверенность',a.first.confidence);field('Ответ после разбора',a.repair.answer);field('Объяснение пересмотра · не оценено',a.repair.reason);field('Альтернативный ответ требует проверки',a.repair.alternative?'да':'нет');});break;
  }
  case 'task2':{
   const rows=state.result?state.saved:[...state.saved,state.attempt];
   rows.forEach((a,i)=>{round(i);field('Разбор открыт',i<state.saved.length||state.revealed?'да':'нет');field('Заявление пользователя: ошибок не найдено',a.noIssues?'да':'нет');a.corrections.forEach((c,j)=>{heading(`Правка ${j+1} пользователя`);field('Исходный фрагмент',c.quote);field('Предложенная замена',c.replacement);field('Обоснование',c.reason);});field('Фрагмент аргумента',a.argumentQuote);field('Почему его нужно развить',a.argumentReason);field('Переписанный текст после разбора · не оценён',a.revision);field('Вывод пользователя',a.reflection);});break;
  }
  case 'reading':{
   const rows=state.report?state.attempts:[...state.attempts,{first:state.frozen??state.responses,repair:state.repairs,reflection:state.reflection}];
   rows.forEach((a,i)=>{round(i);field('Ответ зафиксирован и разбор открыт',i<state.attempts.length||state.frozen!==null?'да':'нет');a.first.forEach((r,j)=>{heading(`Утверждение ${j+1}`);field('Первый выбор',r.choice);field('Цитата пользователя',r.excerpt);field('Обоснование пользователя · не оценено',r.reason);field('Выбор после разбора',a.repair[j]??'');});field('Вывод пользователя',a.reflection);});break;
  }
  case 'math':{
   const rows=state.report?state.attempts:[...state.attempts,{...state}];
   rows.forEach((a,i)=>{round(i);field('Разбор открыт',i<state.attempts.length||state.checked?'да':'нет');field('Первый ход решения · не оценён',a.working);field('Первый ответ',a.answer);field('Выбранный пункт задания',a.choice===null?null:a.choice+1);field('Пересмотр решения после разбора · не оценён',a.repairedWorking);field('Пересмотр ответа',a.repairedAnswer);field('Вывод пользователя',a.reflection);});break;
  }
  case 'sat-rw':{
   const rows=state.report?state.attempts:[...state.attempts,{...state}];
   rows.forEach((a,i)=>{round(i);field('Разбор открыт',i<state.attempts.length||state.checked?'да':'нет');field('Прогноз до вариантов · не оценён',a.prediction);field('Выбранный вариант',a.choice===null?null:'ABCD'[a.choice]);a.reasons.forEach((r,j)=>{if(r)field(`Обоснование для ${'ABCD'[j]} · не оценено`,r);});field('Вывод после разбора · не оценён',a.repair);});break;
  }
  case 'task1':{
   const rows=state.phase==='report'?state.attempts:[...state.attempts,{...state}];
   rows.forEach((a,i)=>{round(i);field('Разбор открыт',i<state.attempts.length||state.phase==='feedback'||state.phase==='report'?'да':'нет');field('Выбранные особенности',a.selected.map(n=>n+1).join(', '));field('Первый overview · не оценён',a.overview);Object.entries(a.evidence).forEach(([key,value])=>field(`Опора для особенности ${Number(key)+1}`,value));field('Первый полный текст · не оценён',a.draft);field('Пересмотр после разбора · не оценён',a.revision);field('Вывод пользователя',a.reflection);});break;
  }
  case 'writing-drill':{
   const rows=state.records.length===2?state.records:[...state.records,state.current];
   rows.forEach((a,i)=>{round(i);field('Идентификатор задания',a.id);field('Знакомство с заданием по заявлению пользователя',a.exposure==='unknown'?'неизвестно':a.exposure==='seen'?'уже видел':'не видел');field('Первый текст · не оценён',a.draft);field('Разбор открыт',a.revealed?'да':'нет');field('Помощь для открытия разбора',a.help?'использована':'не использована');field('Число проверок вариантов',a.attempts);field('Последний выбор',a.choice===null?null:a.choice+1);field('Пересмотр текста · не оценён',a.revision);field('Вывод пользователя',a.reflection);});break;
  }
  case 'listening':{
   const rows=state.report?state.attempts:[...state.attempts,{prediction:state.prediction,answer:state.answer,repair:state.repair,reflection:state.reflection,before:state.locked?state.before:state.evidence,after:state.evidence}];
   const help=(prefix:string,e:{played:boolean;ended:boolean;segment:boolean;transcript:boolean})=>{field(`${prefix} · запуск аудио`,e.played?'да':'нет');field(`${prefix} · событие окончания аудио`,e.ended?'да':'нет');field(`${prefix} · фрагмент`,e.segment?'открывался':'не открывался');field(`${prefix} · текст записи`,e.transcript?'открывался':'не открывался');};
   rows.forEach((a,i)=>{round(i);field('Ответ зафиксирован',i<state.attempts.length||state.locked?'да':'нет');field('Прогноз пользователя · не оценён',a.prediction);field('Первый ответ',a.answer);help('До фиксации ответа',a.before);help('Последние события',a.after);field('Ответ после разбора',a.repair);field('Вывод пользователя',a.reflection);});field('Ограничение', 'События проигрывателя не доказывают внимательное прослушивание. Аудио не вложено.');break;
  }
  case 'speaking':{
   field('Фаза пробы',state.phase);field('Текущие заметки подготовки',state.notes);state.takes.forEach((a,i)=>{heading(i===0?'Первый ответ':i===1?'Повтор той же темы · после саморазбора':'Другая тема · после двух ответов');field('Зафиксированные заметки подготовки',a.preparationNotes);field('Длительность записи в секундах',a.seconds);field('Заявление: конкретные моменты не выделены',a.noSpecificMoments===null?null:a.noSpecificMoments?'да':'нет');a.markers.forEach((m,j)=>{heading(`Момент ${j+1}`);field('Секунда',m.second);field('Тип отметки пользователя',m.kind);field('Заметка',m.note);});a.ratings.forEach((r,j)=>field(`Самооценка ${speakingCriteria[j].name} · не экспертная оценка`,r));field('План пользователя',a.plan);field('Подтверждение пользователя',a.confirmed?'да':'нет');});field('Ограничение','Аудиозаписи не вложены. Нет транскрипции, автоматической оценки речи или IELTS band.');break;
  }
 }
 return blocks;
}
