import type { BankSnapshot } from '../src/lib/trainers/bank-records';
function task2(value:BankSnapshot|undefined){if(!value||value.type!=='task2')throw new Error('Expected Task2 record');return value;}
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {chromium} from 'playwright';
import AxeBuilder from '@axe-core/playwright';
import {trainerBank} from '../src/lib/trainers/bank-sources';
import {bankRecordKey,parseBankRecord} from '../src/lib/trainers/bank-records';
async function main(){
 const base=process.env.TRAINER_CHECK_BASE??'http://127.0.0.1:3043';assert.ok(['localhost','127.0.0.1'].includes(new URL(base).hostname));
 const browser=await chromium.launch({headless:true});
 try{
  const context=await browser.newContext(),page=await context.newPage(),errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
  const actor='synthetic-bank-ui';
  await page.goto(base+'/trainers/material-review');await page.getByRole('heading',{name:'Нужно войти',exact:true}).waitFor();
  await page.evaluate(actor=>{localStorage.setItem('ashyq:v2:session',JSON.stringify({user:{id:actor,name:'Synthetic reviewer',email:'synthetic@example.invalid',role:'teacher',avatarColor:'red'},expiresAt:new Date(Date.now()+3600000).toISOString()}));dispatchEvent(new Event('storage'));},actor);
  const source=trainerBank.sources.find(s=>s.ref.unitId==='W01')!,key=bankRecordKey(actor,source.ref);
  const preview=page.getByRole('region',{name:'Пробное эссе · DRAFT',exact:true});
  const bank=preview.getByRole('region',{name:'Сохранение пробы · W01 · версия 2.0',exact:true});
  await bank.waitFor();assert.equal(await page.evaluate(key=>localStorage.getItem(key),key),null);
  await preview.getByRole('button',{name:'Начать пробу эссе',exact:true}).click();
  await preview.getByLabel('Исходный фрагмент 1',{exact:true}).fill('Synthetic unfinished first search.');
  await bank.getByRole('button',{name:'Сохранить текущую пробу',exact:true}).click();
  await bank.getByRole('status').filter({hasText:'Работа сохранена в этом браузере'}).waitFor();
  const firstRaw=await page.evaluate(key=>localStorage.getItem(key),key);assert.ok(parseBankRecord(firstRaw,source));
  await page.reload();await bank.getByRole('button',{name:'Продолжить сохранённую пробу',exact:true}).waitFor();
  assert.equal(await preview.getByLabel('Исходный фрагмент 1',{exact:true}).count(),0,'no automatic resume');
  await bank.getByRole('button',{name:'Продолжить сохранённую пробу',exact:true}).click();await bank.getByRole('button',{name:'Подтвердить загрузку',exact:true}).click();
  assert.equal(await preview.getByLabel('Исходный фрагмент 1',{exact:true}).inputValue(),'Synthetic unfinished first search.');
  await preview.getByLabel('Исходный фрагмент 1',{exact:true}).fill('Unsaved newer text.');
  await page.getByLabel('Выбери материал',{exact:true}).selectOption('W02');await page.getByRole('alert').filter({hasText:'несохранённое решение или работа'}).waitFor();
  await page.getByRole('button',{name:'Остаться на материале',exact:true}).click();assert.equal(await page.getByLabel('Выбери материал',{exact:true}).inputValue(),'W01');
  await page.getByRole('navigation',{name:'Основная навигация',exact:true}).getByRole('link',{name:'О нас',exact:true}).first().click();
  await page.getByRole('alert').filter({hasText:'несохранённое решение или работа'}).waitFor();assert.equal(await page.getByRole('link',{name:'Перейти без сохранения',exact:true}).getAttribute('href'),'/about');assert.ok(page.url().includes('/trainers/material-review'));await page.getByRole('button',{name:'Остаться на материале',exact:true}).click();
  await page.getByLabel('Замечание',{exact:true}).fill('Synthetic review note independent of the practice.');await page.getByLabel('Результат проверки',{exact:true}).selectOption('hold');
  await page.getByRole('button',{name:'Сохранить решение в этом браузере',exact:true}).click();await page.getByRole('status').filter({hasText:'Решение для W01 сохранено'}).waitFor();
  await page.getByLabel('Выбери материал',{exact:true}).selectOption('W02');await page.getByRole('alert').filter({hasText:'несохранённое решение или работа'}).waitFor();await page.getByRole('button',{name:'Остаться на материале',exact:true}).click();
  // File export contains the current unsaved work and exact source; download does not overwrite storage.
  const pending=page.waitForEvent('download');await bank.getByRole('button',{name:'Скачать текущую работу',exact:true}).click();const file=await pending;const filePath=await file.path();assert.ok(filePath);const exported=await fs.readFile(filePath,'utf8');assert.equal(task2(parseBankRecord(exported,source)?.checkpoint?.data).attempt.corrections[0].quote,'Unsaved newer text.');assert.equal(await page.evaluate(key=>localStorage.getItem(key),key),firstRaw);
  await bank.getByRole('button',{name:'Сохранить текущую пробу',exact:true}).click();await bank.getByRole('status').filter({hasText:'Работа сохранена в этом браузере'}).waitFor();
  await page.getByLabel('Замечание',{exact:true}).fill('Synthetic review note remains dirty while practice is saved.');
  await page.evaluate(key=>new Promise<void>(ready=>{void navigator.locks.request(key,()=>new Promise<void>(release=>{(window as unknown as {__releaseBankLock:()=>void}).__releaseBankLock=release;ready();}));}),key);
  await bank.getByRole('button',{name:'Сохранить текущую пробу',exact:true}).click();await bank.getByRole('status').filter({hasText:'Идёт запись.'}).waitFor();
  assert.equal(await preview.getByLabel('Исходный фрагмент 1',{exact:true}).isDisabled(),true);assert.equal(await page.getByLabel('Партия материалов',{exact:true}).isDisabled(),true);assert.equal(await page.getByLabel('Результат проверки',{exact:true}).isDisabled(),true);assert.equal(await preview.getByRole('button',{name:'Начать новую пробу эссе',exact:true}).isDisabled(),true);
  await page.getByRole('navigation',{name:'Основная навигация',exact:true}).getByRole('link',{name:'О нас',exact:true}).first().click();await page.getByRole('status').filter({hasText:'Дождись завершения записи перед выходом.'}).waitFor();assert.ok(page.url().includes('/trainers/material-review'));
  await page.evaluate(()=>(window as unknown as {__releaseBankLock:()=>void}).__releaseBankLock());await bank.getByRole('status').filter({hasText:'Работа сохранена в этом браузере'}).waitFor();
  await page.getByLabel('Выбери материал',{exact:true}).selectOption('W02');await page.getByRole('alert').filter({hasText:'несохранённое решение или работа'}).waitFor();await page.getByRole('button',{name:'Остаться на материале',exact:true}).click();assert.equal(await page.getByLabel('Замечание',{exact:true}).inputValue(),'Synthetic review note remains dirty while practice is saved.');
  await page.getByRole('button',{name:'Сохранить решение в этом браузере',exact:true}).click();await page.getByRole('status').filter({hasText:'Решение для W01 сохранено'}).waitFor();
  await preview.getByRole('button',{name:'Начать новую пробу эссе',exact:true}).click();await preview.getByRole('button',{name:'Подтвердить новую пробу',exact:true}).click();
  await bank.getByRole('button',{name:'Сохранить текущую пробу',exact:true}).click();await bank.getByRole('button',{name:'Подтвердить замену',exact:true}).waitFor();await bank.getByRole('button',{name:'Отменить действие',exact:true}).click();
  await bank.getByRole('button',{name:'Продолжить сохранённую пробу',exact:true}).click();await bank.getByRole('button',{name:'Подтвердить загрузку',exact:true}).click();assert.equal(await preview.getByLabel('Исходный фрагмент 1',{exact:true}).inputValue(),'Unsaved newer text.');
  await bank.getByRole('button',{name:'Очистить сохранённую работу и историю',exact:true}).click();await bank.getByRole('button',{name:'Подтвердить очистку',exact:true}).click();await bank.getByRole('status').filter({hasText:'Локальная запись и её история очищены'}).waitFor();
  const cleared=await page.evaluate(key=>localStorage.getItem(key),key);assert.equal(parseBankRecord(cleared,source)?.checkpoint,null);
  await bank.getByLabel('Восстановить файл этой версии задания',{exact:true}).setInputFiles({name:'synthetic-source-record.json',mimeType:'application/json',buffer:Buffer.from(exported)});
  assert.equal(await page.evaluate(key=>localStorage.getItem(key),key),cleared,'import awaits explicit confirmation');await bank.getByRole('button',{name:'Подтвердить восстановление',exact:true}).click();await bank.getByRole('status').filter({hasText:'Работа сохранена в этом браузере'}).waitFor();
  assert.equal(await preview.getByLabel('Исходный фрагмент 1',{exact:true}).inputValue(),'Unsaved newer text.');
  for(const width of [320,390,768,1440]){await page.setViewportSize({width,height:900});assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1),false);}
  assert.deepEqual((await new AxeBuilder({page}).include('main').analyze()).violations,[]);
  await fs.mkdir('artifacts/trainers-complete-033',{recursive:true});await page.setViewportSize({width:390,height:844});await bank.screenshot({path:'artifacts/trainers-complete-033/bank-task2-save-mobile.png'});
  // Corrupt data stays exact until an explicit recovery clear.
  await page.evaluate(key=>{localStorage.setItem(key,'{broken raw\n');dispatchEvent(new Event('storage'));},key);
  assert.equal(await bank.getByRole('button',{name:'Сохранить текущую пробу',exact:true}).isDisabled(),true);
  const recoveryPending=page.waitForEvent('download');await bank.getByRole('button',{name:'Скачать исходную запись пробы',exact:true}).click();const recovery=await recoveryPending;assert.equal(await fs.readFile((await recovery.path())!,'utf8'),'{broken raw\n');
  await bank.getByRole('button',{name:'Очистить несовместимую запись',exact:true}).click();assert.equal(await page.evaluate(key=>localStorage.getItem(key),key),'{broken raw\n');await bank.getByRole('button',{name:'Подтвердить очистку',exact:true}).click();await bank.getByRole('status').filter({hasText:'Локальная запись и её история очищены'}).waitFor();
  assert.ok(parseBankRecord(await page.evaluate(key=>localStorage.getItem(key),key),source));assert.deepEqual(errors,[]);
  console.log('PASS actual Task2 bank UI: opt-in manual save, no automatic resume, exact partial reload/confirm restore, independent review/practice dirty guards, unsaved-current export, reset/replacement confirmation, clear tombstone, confirmed file import, corrupt exact recovery/explicit clear, four widths/axe. Full completion/history/race/role checks remain separate.');
 }finally{await browser.close();}
}
main().catch(error=>{console.error(error);process.exitCode=1;});
