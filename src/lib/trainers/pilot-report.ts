import {validSnapshot,MAX_RECORD_BYTES,type Snapshot} from './checkpoints';
import {trainerById,type TrainerId} from './catalog';
import {practiceOutcome,outcomeLabel} from './outcomes';
import type {DocxBlock} from './docx-package';
import {speakingCriteria} from '../speaking-second-take/prompts';

const labels:Record<string,string>={choice:'Выбранный вариант · номер',attempts:'Число проверок вариантов',optionsVisible:'Варианты открыты',attemptedLevel:'Открытая помощь при первом ответе',answer:'Ответ',evidenceId:'Выбранная опора в тексте · ID',confidence:'Уверенность пользователя',reason:'Обоснование пользователя',prediction:'Прогноз пользователя',choiceIndex:'Выбранный вариант · индекс с нуля',answerIndex:'Выбранный вариант · индекс с нуля',reasons:'Причины выбора',stepIndex:'Выбранный переход · индекс с нуля',mechanism:'Тип ошибки по выбору пользователя',repairLine:'Правка строки пользователя',ownAnswer:'Итоговый ответ после разбора',transferStep:'Переход на другом задании · индекс с нуля',transferAnswer:'Ответ на другом задании',type:'Ожидаемый тип ответа по выбору пользователя',cue:'Опора пользователя',diagnosis:'Самоописание затруднения',level:'Уровень открытой помощи',repaired:'Ответ после разбора',textMode:'Текстовый режим',textHelp:'Открывался текст записи',stopped:'Прослушивание прерывалось',selected:'Выбранные особенности · индексы с нуля',overview:'Overview пользователя',evidence:'Выбранные опоры · индексы из задания',correction:'Правка неточности пользователя',draft:'Текст пользователя',revision:'Пересмотр текста пользователя',focus:'Выбранное направление пересмотра',noChanges:'Пользователь не внёс изменения',variable:'Переменная',setup:'Разовый платёж',rate:'Повторяющийся платёж',total:'Итоговая величина',form:'Выбранная модель платежа',model:'Модель условия пользователя',working:'Ход решения пользователя',repair:'План или правка после разбора',x:'Координата x',y:'Координата y',method:'Способ решения',alternative:'Другой способ для сравнения',plan:'План пользователя',seconds:'Зафиксированная длительность в секундах · не оценка качества',notes:'Текущие заметки подготовки',kind:'Тип наблюдения пользователя',markerNote:'Незавершённая заметка',noMarkers:'Заявление пользователя: отдельные моменты не выделены',markers:'Наблюдения пользователя',second:'Секунда наблюдения',note:'Заметка',ratings:'Самооценка · не оценка эксперта',confirmed:'Подтверждение пользователя',preparationNotes:'Зафиксированные заметки подготовки',noSpecificMoments:'Заявление: конкретные моменты не выделены',grammarDrafts:'Грамматические правки пользователя',grammarChecked:'Грамматический разбор открыт',appliedGrammar:'Применённые правки · могли использовать образец',revisionDrafts:'Переписывание до открытия разбора',postFeedbackDrafts:'Переписывание после открытия разбора',revealed:'Разбор открыт',appliedRevisions:'Применённые версии',task:'Ответ на вопрос',coherence:'Связность',lexical:'Лексика',grammar:'Грамматика',currentChoices:'Последовательность проверенных вариантов · номера 1–3',revealedByHelp:'Разбор открыт через помощь',completed:'Отмеченные завершённые задания · ID',drillRecords:'История коротких заданий',choices:'Последовательность проверенных вариантов · номера 1–3',attemptCount:'Число проверок вариантов',repairRevision:'Своя версия после разбора',repairReflection:'Объяснение собственной правки',repairUnchanged:'Первый вариант сохранён без правок',reflection:'Объяснение собственной правки',unchanged:'Первый вариант сохранён без правок',savedAt:'Дата сохранения',id:'ID наблюдения'};
const fields:Record<TrainerId,string[]>={
 'reading-evidence':['answer','evidenceId','confidence','reason'],
 'sat-optionless':['prediction','choiceIndex'],
 'sat-distractor':['answerIndex','reasons'],
 'math-forensics':['stepIndex','mechanism','repairLine','ownAnswer','transferStep','transferAnswer'],
 'listening-replay':['prediction','cue','answer','confidence','diagnosis','repair','level','textMode','textHelp','stopped'],
 'task1-overview':['selected','overview','evidence','reasons','correction','draft','revision','focus','noChanges'],
 'sat-translation':['variable','setup','rate','total','form','model','answer','working','repair'],
 'math-method-switch':['x','y','working','method','alternative','plan'],
 'speaking-second-take':['notes','kind','markerNote','noMarkers'],
 'writing-task2':[],
 'writing-drills':['draft','repairRevision','repairReflection','repairUnchanged','choice','attempts','currentChoices','optionsVisible','revealed','revealedByHelp','completed','drillRecords'],
};
Object.assign(labels,{choice:'Выбранный вариант · индекс с нуля',attempts:'Число проверок',optionsVisible:'Варианты открыты',level:'Уровень помощи в записи · индекс с нуля; не доказательство прослушивания',attemptedLevel:'Проверялось исправление на выбранном уровне помощи'});
Object.assign(labels,{choiceIndex:'Выбранный вариант',answerIndex:'Выбранный вариант',choice:'Выбранный вариант · номер',stepIndex:'Выбранный переход · номер',transferStep:'Переход на другом задании · номер',selected:'Выбранные особенности · номера'});
const phaseNames:Record<string,string>={choose:'Выбор задания',start:'Начало',first:'Первый ответ',predict:'Прогноз',choice:'Выбранный вариант · номер',attempts:'Число проверок вариантов',optionsVisible:'Варианты открыты',attemptedLevel:'Открытая помощь при первом ответе',answer:'Ответ',review:'Разбор',repair:'Пересмотр',transfer:'Другое задание',result:'Итог',report:'Итог',select:'Выбор особенностей',evidence:'Поиск опоры',accuracy:'Правка неточностей',draft:'Первый полный текст',revise:'Переписывание',solve:'Решение',model:'Модель условия',calculate:'Вычисление',options:'Варианты',reasons:'Обоснование',prepare:'Подготовка',capture:'Запись',compare:'Сравнение',grammar:'Грамматика',task:'Ответ на вопрос',coherence:'Связность',lexical:'Лексика'};
const enums:Record<string,Record<string,string>>={confidence:{low:'Низкая',medium:'Средняя',high:'Высокая'},method:{algebra:'Алгебра',graph:'График',table:'Таблица',other:'Другой'},alternative:{algebra:'Алгебра',graph:'График',table:'Таблица',other:'Другой'},form:{once:'Разовый',repeated:'Повторяющийся',omitted:'Пропущен'}};
/** Existing public v1 records only. Reports preserve user fields, not hidden source/key bodies. */
export function pilotReportBlocks(trainer:TrainerId,value:Snapshot):DocxBlock[]{
 if(!validSnapshot(trainer,value,MAX_RECORD_BYTES))throw new Error('Данные не подходят этой версии тренажёра или превышают лимит отчёта Word. Скопируй нужные ответы перед выходом.');
 const item=trainerById(trainer),outcome=practiceOutcome(trainer,value,MAX_RECORD_BYTES)!;
 const blocks:DocxBlock[]=[{kind:'heading1',text:`ASHYQ · ${item.title}`},{kind:'paragraph',text:`Открытый тренажёр · запись версии 1 · ${item.id}\nСтраница: ${item.href}`},{kind:'paragraph',text:'Ответы и заметки пользователя, без экзаменационного балла или подтверждения освоения. Свободный текст и самооценка требуют проверки. Word — читаемый отчёт; JSON — точное восстановление. Аудио не вложено. Неоткрытые задания, образцы и ключи не включены.'}];
 const heading=(text:string)=>blocks.push({kind:'heading2',text}),field=(name:string,text:string)=>blocks.push({kind:'paragraph',text:`${name}: ${text}`});
 field('Состояние',outcome.complete?'Этапы пробы завершены':'Работа в процессе');
 for(const key of ['caseIndex','index','round','phase','mode'])if(Object.hasOwn(value,key)){const raw=value[key],shown=raw===null||(['caseIndex','index'].includes(key)&&(value.phase==='choose'||value.phase==='start'||trainer==='writing-drills'&&value.mode===null))?'не выбрано':key==='phase'?phaseNames[String(raw)]??String(raw):key==='mode'?({combine:'Объединение мыслей',grammar:'Грамматика',argument:'Развитие аргумента'} as Record<string,string>)[String(raw)]??String(raw):key==='round'?(raw===0||raw==='first'?'Первое задание':'Другое задание'):typeof raw==='number'?String(raw+1):String(raw);field({caseIndex:'Выбранный пример · номер',index:'Текущее задание · номер',round:'Текущий раунд',phase:'Фаза записи',mode:'Тип коротких заданий'}[key]!,shown);}
 const render=(name:string,data:unknown,depth=0,key?:string)=>{
  if(depth>6)throw new Error('Структура отчёта слишком сложная. Скачай JSON.');
  if(typeof data==='string'&&key&&enums[key])data=data.trim()===''?'не выбрано':enums[key][data]??data;
  if(typeof data==='number'&&key){if(['choiceIndex','answerIndex'].includes(key))data='ABCD'[data];else if(['stepIndex','transferStep','choice'].includes(key))data=data+1;}
  if(data===null||typeof data!=='object'){field(name,data===null?'не указано':data===true?'да':data===false?'нет':data===''?'не заполнено':String(data));return;}
  blocks.push({kind:'heading3',text:name});
  if(Array.isArray(data)){if(!data.length)field(name,'пусто');data.forEach((entry,i)=>render(name===labels.ratings?speakingCriteria[i].name:`Пункт ${i+1}`,['selected','choices','currentChoices'].includes(key??'')&&typeof entry==='number'?entry+1:entry,depth+1));return;}
  for(const [key,entry] of Object.entries(data)){if(key==='url')continue;render(labels[key]??`Идентификатор ${key}`,entry,depth+1,key);}
 };
 heading('Поля текущей работы · могут повторять последнюю зафиксированную попытку');
 for(const key of fields[trainer])if(Object.hasOwn(value,key))render(labels[key],trainer==='listening-replay'&&key==='level'&&value.phase!=='repair'?null:value[key],0,key);
 if(trainer==='listening-replay')render(labels.attemptedLevel,value.attemptedLevel);
 if(trainer==='writing-drills'&&value.drillRecords&&Object.values(value.drillRecords as Record<string,Array<Record<string,unknown>>>).some(records=>records.some(record=>!Object.hasOwn(record,'repair'))))field('Ранние попытки','Собственная правка после разбора и её объяснение в этой версии не записывались. Их содержание не восстановлено.');
 if(trainer==='writing-task2'){
  const session=value.session as Snapshot;field('Эссе · ID',String(session.caseId));field('Текущий этап',phaseNames[String(session.stage)]??String(session.stage));
  for(const key of ['grammarDrafts','grammarChecked','appliedGrammar','revisionDrafts','postFeedbackDrafts','revealed','appliedRevisions'])render(labels[key],session[key]);
 }else if(trainer==='speaking-second-take'){
  (value.takes as Snapshot[]).forEach((take,i)=>{heading(i===0?'Первый ответ':i===1?'Повтор той же темы · после самопроверки':'Другая тема · после двух ответов');render('Заметки и самопроверка ответа',take);for(const key of ['preparationNotes','noSpecificMoments'])if(!Object.hasOwn(take,key))field(labels[key],'нет данных в старой записи');});
 }else if(['sat-translation','math-method-switch'].includes(trainer)){
  (value.attempts as unknown[]).forEach((attempt,i)=>{heading(i===0?'Первая зафиксированная попытка':'Другое задание · после работы с первым');render('Сохранённый ответ',attempt);});
 }else{
  for(const [key,title] of [['first','Первый зафиксированный ответ'],['firstAttempt','Первый зафиксированный ответ'],['repair','Ответ после разбора'],['transfer','Другое задание · после работы с первым'],['transferAttempt','Другое задание · после работы с первым']])if(value[key]&&typeof value[key]==='object'){heading(title);render('Сохранённый ответ',value[key]);}
 }
 heading('Проверки именно этих заданий');
 const stage={first:'Первый ответ',repair:'После разбора',transfer:'Другое задание',self:'Самопроверка'};
 for(const check of outcome.checks)field(`${stage[check.stage]} · ${check.label}`,outcomeLabel(check));
 field('Следующее действие',outcome.advice);field('Ограничение результата',outcome.limitation);
 return blocks;
}
