import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import {chromium} from 'playwright';
import {trainerBank,type BankSource} from '../src/lib/trainers/bank-sources';
import {bankRecordKey,createBankEntry,emptyBankRecord,parseBankRecord} from '../src/lib/trainers/bank-records';
import {emptyBankTask2State,type BankTask2State} from '../src/lib/trainers/bank-task2-state';
function fixture(source:BankSource):BankTask2State{
 if(source.exercise.type!=='task2')throw new Error('Synthetic fixture requires Task2');
 const saved=source.exercise.value.rounds.map(r=>({corrections:[],noIssues:true,argumentQuote:r.argument.before,argumentReason:'Synthetic fixture, not an independent learner result.',revision:r.text,reflection:'Synthetic manual comparison; quality remains ungraded.'}));
 return {type:'task2',started:true,index:1,revealed:true,result:true,attempt:structuredClone(saved[1]),saved,checked:true};
}
async function main(){
 const base=process.env.TRAINER_CHECK_BASE??'http://127.0.0.1:3043';assert.ok(['localhost','127.0.0.1'].includes(new URL(base).hostname));
 const browser=await chromium.launch({headless:true});
 try{
  const context=await browser.newContext(),page=await context.newPage(),errors:string[]=[],posts:string[]=[];
  page.on('pageerror',e=>errors.push(e.message));context.on('request',r=>{if(['POST','PUT','PATCH','DELETE'].includes(r.method()))posts.push(r.url());});
  const session=(id:string,role='teacher')=>({user:{id,name:'Synthetic teacher',email:'synthetic@example.invalid',role,avatarColor:'red'},expiresAt:new Date(Date.now()+3600000).toISOString()});
  const actor='synthetic-bank-history';
  await page.goto(base+'/trainers/material-review');await page.getByRole('heading',{name:'Нужно войти',exact:true}).waitFor();await page.evaluate(s=>{localStorage.setItem('ashyq:v2:session',JSON.stringify(s));dispatchEvent(new Event('storage'));},session(actor));
  const source=trainerBank.sources.find(s=>s.ref.unitId==='W01')!;if(source.exercise.type!=='task2')throw new Error('W01');
  const preview=page.getByRole('region',{name:'Пробное эссе · DRAFT',exact:true}),bank=preview.getByRole('region',{name:'Сохранение пробы · W01 · версия 2.0',exact:true}),key=bankRecordKey(actor,source.ref);
  const save=async()=>{await bank.getByRole('button',{name:'Сохранить текущую пробу',exact:true}).click();await bank.getByRole('status').filter({hasText:'Работа сохранена в этом браузере'}).waitFor();};
  const reload=async()=>{await page.reload();await bank.getByRole('button',{name:'Продолжить сохранённую пробу',exact:true}).click();await bank.getByRole('button',{name:'Подтвердить загрузку',exact:true}).click();};
  await preview.getByRole('button',{name:'Начать пробу эссе',exact:true}).click();
  let freshRaw='';
  for(const [i,r]of source.exercise.value.rounds.entries()){
   await preview.getByLabel('Исходный фрагмент 1',{exact:true}).fill(r.issues[0].before);await preview.getByLabel('Твоя правка 1',{exact:true}).fill('Intentionally incorrect repair; retained without grading.');await preview.getByLabel('Почему меняешь 1',{exact:true}).fill(`Synthetic first explanation ${i}.`);
   await preview.getByLabel('Фрагмент аргумента, который хочешь проверить',{exact:true}).fill(r.argument.before);await preview.getByLabel('Что нужно уточнить или объяснить в аргументе?',{exact:true}).fill(`Synthetic argument analysis ${i}.`);
   await preview.getByRole('button',{name:'Зафиксировать поиск и показать разбор',exact:true}).click();await save();await reload();
   await preview.getByRole('heading',{name:i?'Разбор нового текста':'Разбор первого текста',exact:true}).waitFor();assert.equal(await preview.getByLabel('Исходный фрагмент 1',{exact:true}).count(),0,'frozen search remains frozen after resume');
   await preview.getByLabel('Твоя отдельная версия эссе после разбора',{exact:true}).fill(r.text);await preview.getByRole('checkbox',{name:/Я сравнил язык/}).check();await preview.getByLabel('Что изменил и что ещё требует проверки?',{exact:true}).fill(`Synthetic revised reflection ${i}.`);
   await preview.getByRole('button',{name:i?'Завершить пробу двух эссе':'Перейти к новому эссе',exact:true}).click();
   if(!i){await save();freshRaw=(await page.evaluate(key=>localStorage.getItem(key),key))!;assert.equal(parseBankRecord(freshRaw,source)?.checkpoint?.data.saved.length,1);await reload();await preview.getByRole('heading',{name:'Новый текст · самостоятельный поиск',exact:true}).waitFor();}
  }
  await preview.getByRole('heading',{name:'Два эссе: первая работа и версии после разбора',exact:true}).waitFor();await save();await reload();
  for(const i of [0,1])await preview.getByText(`Synthetic revised reflection ${i}.`,{exact:true}).waitFor();
  await bank.getByRole('button',{name:'Добавить завершённую пробу в историю',exact:true}).click();await bank.getByRole('status').filter({hasText:'Работа сохранена в этом браузере'}).waitFor();
  let record=parseBankRecord(await page.evaluate(key=>localStorage.getItem(key),key),source)!;assert.equal(record.checkpoint,null);assert.equal(record.history.length,1);assert.equal(record.history[0].data.saved.length,2);
  await bank.getByRole('button',{name:'Добавить завершённую пробу в историю',exact:true}).click();await bank.getByRole('status').filter({hasText:'Работа сохранена в этом браузере'}).waitFor();record=parseBankRecord(await page.evaluate(key=>localStorage.getItem(key),key),source)!;assert.equal(record.history.length,1);
  await page.reload();await bank.getByText(/История этой версии/).click();await bank.getByRole('button',{name:`Загрузить занятие ${record.history[0].savedAt}`,exact:true}).click();await bank.getByRole('button',{name:'Подтвердить загрузку',exact:true}).click();await preview.getByRole('heading',{name:'Два эссе: первая работа и версии после разбора',exact:true}).waitFor();
  const otherState={...emptyBankTask2State(),started:true,attempt:{...emptyBankTask2State().attempt,argumentReason:'Another stored partial work; must survive archiving.'}};
  const otherEntry=createBankEntry(source,otherState),otherRecord={...record,revision:crypto.randomUUID(),checkpoint:otherEntry};
  await page.evaluate(({key,raw})=>{localStorage.setItem(key,raw);dispatchEvent(new Event('storage'));},{key,raw:JSON.stringify(otherRecord)});
  await bank.getByRole('button',{name:'Добавить завершённую пробу в историю',exact:true}).click();await bank.getByRole('status').filter({hasText:'Работа сохранена в этом браузере'}).waitFor();record=parseBankRecord(await page.evaluate(key=>localStorage.getItem(key),key),source)!;assert.equal(record.checkpoint?.id,otherEntry.id,'archive does not erase a different saved checkpoint');
  await bank.getByRole('button',{name:'Сохранить текущую пробу',exact:true}).click();await bank.getByRole('button',{name:'Подтвердить замену',exact:true}).waitFor();await bank.getByRole('button',{name:'Отменить действие',exact:true}).click();
  // A stale import must neither replace storage nor apply its earlier exercise phase to the screen.
  await bank.getByLabel('Восстановить файл этой версии задания',{exact:true}).setInputFiles({name:'synthetic-fresh-phase.json',mimeType:'application/json',buffer:Buffer.from(freshRaw)});
  const newer={...record,revision:crypto.randomUUID()};await page.evaluate(({key,raw})=>{localStorage.setItem(key,raw);dispatchEvent(new Event('storage'));},{key,raw:JSON.stringify(newer)});
  await bank.getByRole('button',{name:'Подтвердить восстановление',exact:true}).click();await bank.getByRole('status').filter({hasText:'другой вкладке'}).waitFor();assert.equal((await page.evaluate(key=>localStorage.getItem(key),key)),JSON.stringify(newer));await preview.getByRole('heading',{name:'Два эссе: первая работа и версии после разбора',exact:true}).waitFor();await bank.getByRole('button',{name:'Отменить действие',exact:true}).click();
  await page.evaluate(s=>{localStorage.setItem('ashyq:v2:session',JSON.stringify(s));dispatchEvent(new Event('storage'));},session('synthetic-bank-fixtures'));
  // Exercise all8 source-specific UI import/history adapters using explicitly synthetic completed fixtures.
  for(const s of trainerBank.sources.filter(s=>s.exercise.type==='task2')){
   await page.getByLabel('Партия материалов',{exact:true}).selectOption(s.ref.batchId);await page.getByLabel('Выбери материал',{exact:true}).selectOption(s.ref.unitId);
   const widget=preview.getByRole('region',{name:`Сохранение пробы · ${s.ref.unitId} · версия ${s.ref.version}`,exact:true});
   const imported={...emptyBankRecord(s),revision:crypto.randomUUID(),checkpoint:createBankEntry(s,fixture(s))};
   await widget.getByLabel('Восстановить файл этой версии задания',{exact:true}).setInputFiles({name:`synthetic-${s.ref.unitId}.json`,mimeType:'application/json',buffer:Buffer.from(JSON.stringify(imported))});await widget.getByRole('button',{name:'Подтвердить восстановление',exact:true}).click();await widget.getByRole('status').filter({hasText:'Работа сохранена в этом браузере'}).waitFor();
   await widget.getByRole('button',{name:'Добавить завершённую пробу в историю',exact:true}).click();await widget.getByRole('status').filter({hasText:'Работа сохранена в этом браузере'}).waitFor();assert.equal(parseBankRecord(await page.evaluate(key=>localStorage.getItem(key),bankRecordKey('synthetic-bank-fixtures',s.ref)),s)?.history.length,1);
  }
  await page.getByRole('heading',{name:'Рассмотрено 0 из 3',exact:true}).waitFor();
  await page.evaluate(s=>{localStorage.setItem('ashyq:v2:session',JSON.stringify(s));dispatchEvent(new Event('storage'));},session('synthetic-bank-fixtures','student'));await page.getByRole('heading',{name:'Недостаточно прав',exact:true}).waitFor();assert.equal(await page.getByRole('heading',{name:/Сохранение пробы/}).count(),0);
  assert.deepEqual(errors,[]);assert.deepEqual(posts,[]);
  console.log('PASS full W01 two-essay UI with revealed/fresh/report reloads, immutable first search and separate revisions, history archive/dedupe/resume, preservation of a different saved checkpoint, stale-import storage AND on-screen protection; all8 source-specific import/history UI adapters with labelled synthetic fixtures; account/role/review isolation and no server writes. No human methodological approval or quality/band claim.');
 }finally{await browser.close();}
}
main().catch(error=>{console.error(error);process.exitCode=1;});
