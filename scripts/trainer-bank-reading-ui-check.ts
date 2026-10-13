import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import crypto from 'node:crypto';
import {chromium} from 'playwright';
import AxeBuilder from '@axe-core/playwright';
import {trainerBank} from '../src/lib/trainers/bank-sources';
import {bankRecordKey,parseBankRecord} from '../src/lib/trainers/bank-records';
import {READING_LABELS} from '../src/lib/trainers/draft-reading';
async function main(){
 const base=process.env.TRAINER_CHECK_BASE??'http://127.0.0.1:3043';assert.ok(['localhost','127.0.0.1'].includes(new URL(base).hostname));
 const browser=await chromium.launch({headless:true});
 try{
  const context=await browser.newContext(),page=await context.newPage(),other=await context.newPage(),errors:string[]=[],posts:string[]=[];
  page.on('pageerror',e=>errors.push(e.message));context.on('request',r=>{if(['POST','PUT','PATCH','DELETE'].includes(r.method()))posts.push(r.url());});
  const actor='synthetic-reading-bank-ui';
  await page.goto(base+'/trainers/material-review');await page.getByRole('heading',{name:'Нужно войти',exact:true}).waitFor();
  await page.evaluate(actor=>{localStorage.setItem('ashyq:v2:session',JSON.stringify({user:{id:actor,name:'Synthetic reviewer',email:'synthetic@example.invalid',role:'teacher',avatarColor:'red'},expiresAt:new Date(Date.now()+3600000).toISOString()}));dispatchEvent(new Event('storage'));},actor);
  await other.goto(base+'/trainers');
  const preview=page.getByRole('region',{name:'Пробное Reading · DRAFT',exact:true});
  for(const source of trainerBank.sources.filter(source=>source.exercise.type==='reading')){
   if(source.exercise.type!=='reading')throw new Error('Reading source');const pair=source.exercise.value,key=bankRecordKey(actor,source.ref);
   const select=async()=>{await page.getByLabel('Партия материалов',{exact:true}).selectOption(source.ref.batchId);await page.getByLabel('Выбери материал',{exact:true}).selectOption(source.ref.unitId);};
   await select();const bank=preview.getByRole('region',{name:`Сохранение пробы · ${source.ref.unitId} · версия ${source.ref.version}`,exact:true});await bank.waitFor();assert.equal(await page.evaluate(key=>localStorage.getItem(key),key),null);
   const save=async()=>{await bank.getByRole('button',{name:'Сохранить текущую пробу',exact:true}).click();await bank.getByRole('status').filter({hasText:'Работа сохранена в этом браузере'}).waitFor();};
   const reload=async()=>{await page.reload();await select();assert.equal(await preview.getByRole('button',{name:'Пройти Reading-черновик',exact:true}).count(),1,'never automatically resume');await bank.getByRole('button',{name:'Продолжить сохранённую пробу',exact:true}).click();await bank.getByRole('button',{name:'Подтвердить загрузку',exact:true}).click();};
   await preview.getByRole('button',{name:'Пройти Reading-черновик',exact:true}).click();
   await preview.getByLabel('Почему эта категория · 1',{exact:true}).fill(`Partial ${source.ref.unitId} before selection.`);await save();await reload();assert.equal(await preview.getByLabel('Почему эта категория · 1',{exact:true}).inputValue(),`Partial ${source.ref.unitId} before selection.`);
   if(source.ref.unitId==='R01'){
    await preview.getByLabel('Почему эта категория · 1',{exact:true}).fill('Unsaved separate Reading reasoning.');
    await page.getByLabel('Выбери материал',{exact:true}).selectOption('R02');await page.getByRole('alert').filter({hasText:'несохранённое решение или работа'}).waitFor();await page.getByRole('button',{name:'Остаться на материале',exact:true}).click();
    await page.getByRole('navigation',{name:'Основная навигация',exact:true}).getByRole('link',{name:'О нас',exact:true}).first().click();await page.getByRole('alert').filter({hasText:'несохранённое решение или работа'}).waitFor();await page.getByRole('button',{name:'Остаться на материале',exact:true}).click();
    await other.evaluate(key=>new Promise<void>(ready=>{void navigator.locks.request(key,()=>new Promise<void>(release=>{(window as unknown as {releaseReading:()=>void}).releaseReading=release;ready();}));}),key);
    await bank.getByRole('button',{name:'Сохранить текущую пробу',exact:true}).click();await bank.getByRole('status').filter({hasText:'Идёт запись.'}).waitFor();assert.equal(await preview.getByLabel('Почему эта категория · 1',{exact:true}).isDisabled(),true);assert.equal(await page.getByLabel('Выбери материал',{exact:true}).isDisabled(),true);
    await other.evaluate(()=>(window as unknown as {releaseReading:()=>void}).releaseReading());await bank.getByRole('status').filter({hasText:'Работа сохранена в этом браузере'}).waitFor();
   }
   let freshRaw='';
   for(const [roundIndex,round]of pair.rounds.entries()){
    for(const [i,claim]of round.claims.entries()){
     const choice=roundIndex?claim.answer:READING_LABELS[(READING_LABELS.indexOf(claim.answer)+1)%3];
     await preview.getByLabel(`Категория до разбора · ${i+1}`,{exact:true}).selectOption(choice);await preview.getByLabel(`Почему эта категория · ${i+1}`,{exact:true}).fill(`First explanation ${round.id}/${i}; quality not evaluated.`);await preview.getByLabel(`Своя цитата из текста · ${i+1}`,{exact:true}).fill(choice==='NOT GIVEN'?'':claim.evidence);
    }
    await preview.getByRole('button',{name:'Зафиксировать ответы и открыть разбор',exact:true}).click();await save();await reload();
    for(const [i,claim]of round.claims.entries()){
     assert.equal(await preview.getByLabel(`Почему эта категория · ${i+1}`,{exact:true}).inputValue(),`First explanation ${round.id}/${i}; quality not evaluated.`);assert.equal(await preview.getByLabel(`Почему эта категория · ${i+1}`,{exact:true}).isDisabled(),true);
     await preview.getByLabel(`Категория после разбора · ${i+1}`,{exact:true}).selectOption(READING_LABELS[(READING_LABELS.indexOf(claim.answer)+1)%3]);
    }
    await preview.getByLabel('Что проверишь в новом тексте?',{exact:true}).fill(`Repair plan ${round.id}.`);await save();await reload();
    for(const [i,claim]of round.claims.entries())assert.equal(await preview.getByLabel(`Категория после разбора · ${i+1}`,{exact:true}).inputValue(),READING_LABELS[(READING_LABELS.indexOf(claim.answer)+1)%3],'wrong intermediate repairs preserved, not marked correct');
    const advance=preview.getByRole('button',{name:roundIndex?'Сравнить две Reading-попытки':'Перейти к новому Reading-тексту',exact:true});await advance.click();await preview.getByRole('status').filter({hasText:'ещё отличается'}).waitFor();
    for(const [i,claim]of round.claims.entries())await preview.getByLabel(`Категория после разбора · ${i+1}`,{exact:true}).selectOption(claim.answer);
    await advance.click();await save();
    if(!roundIndex){freshRaw=(await page.evaluate(key=>localStorage.getItem(key),key))!;await reload();await preview.getByRole('heading',{name:`Новый текст · ${pair.rounds[1].id}`,exact:true}).waitFor();}
   }
   await reload();await preview.getByRole('heading',{name:'Сравнение двух Reading-попыток',exact:true}).waitFor();assert.equal(await preview.getByText('Категории до разбора совпали с ключом: 0 из 3. Это не оценка объяснений.',{exact:true}).count(),1);assert.equal(await preview.getByText('Категории до разбора совпали с ключом: 3 из 3. Это не оценка объяснений.',{exact:true}).count(),1);
   for(const round of pair.rounds)await preview.getByText(`План после разбора: Repair plan ${round.id}.`,{exact:true}).waitFor();
   if(source.ref.unitId==='R01'){
    const before=await page.evaluate(key=>localStorage.getItem(key),key);await bank.getByLabel('Восстановить файл этой версии задания',{exact:true}).setInputFiles({name:'synthetic-fresh-phase.json',mimeType:'application/json',buffer:Buffer.from(freshRaw)});
    const newer=JSON.stringify({...parseBankRecord(before,source)!,revision:crypto.randomUUID()});await other.evaluate(({key,raw})=>localStorage.setItem(key,raw),{key,raw:newer});
    await bank.getByRole('button',{name:'Подтвердить восстановление',exact:true}).click();await bank.getByRole('status').filter({hasText:'другой вкладке'}).waitFor();assert.equal(await page.evaluate(key=>localStorage.getItem(key),key),newer);await preview.getByRole('heading',{name:'Сравнение двух Reading-попыток',exact:true}).waitFor();await bank.getByRole('button',{name:'Отменить действие',exact:true}).click();
    const pending=page.waitForEvent('download');await bank.getByRole('button',{name:'Скачать текущую работу',exact:true}).click();const downloaded=await pending;assert.ok(parseBankRecord(await fs.readFile((await downloaded.path())!,'utf8'),source));
   }
   await bank.getByRole('button',{name:'Добавить завершённую пробу в историю',exact:true}).click();await bank.getByRole('status').filter({hasText:'Работа сохранена в этом браузере'}).waitFor();
   await bank.getByRole('button',{name:'Добавить завершённую пробу в историю',exact:true}).click();await bank.getByRole('status').filter({hasText:'Работа сохранена в этом браузере'}).waitFor();
   let record=parseBankRecord(await page.evaluate(key=>localStorage.getItem(key),key),source)!;assert.equal(record.checkpoint,null);assert.equal(record.history.length,1);assert.equal(record.history[0].data.type,'reading');
   await page.reload();await select();await bank.getByText(/История этой версии/).click();await bank.getByRole('button',{name:`Загрузить занятие ${record.history[0].savedAt}`,exact:true}).click();await bank.getByRole('button',{name:'Подтвердить загрузку',exact:true}).click();await preview.getByRole('heading',{name:'Сравнение двух Reading-попыток',exact:true}).waitFor();
   if(source.ref.unitId==='R01'){
    for(const width of [320,390,768,1440]){await page.setViewportSize({width,height:900});assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1),false);assert.deepEqual((await new AxeBuilder({page}).include('main').analyze()).violations,[]);}
    await page.setViewportSize({width:390,height:844});await preview.getByRole('heading',{name:'Сравнение двух Reading-попыток',exact:true}).evaluate(node=>node.scrollIntoView({block:'center',behavior:'instant'}));await page.screenshot({path:'artifacts/trainers-complete-033/bank-reading-report-mobile.png'});
   }
   await preview.getByRole('button',{name:'Начать новую Reading-пробу',exact:true}).click();await preview.getByRole('button',{name:'Подтвердить новую Reading-пробу',exact:true}).click();assert.equal(await preview.getByRole('button',{name:'Пройти Reading-черновик',exact:true}).count(),1);record=parseBankRecord(await page.evaluate(key=>localStorage.getItem(key),key),source)!;assert.equal(record.history.length,1,'reset keeps stored history');
  }
  assert.equal(await page.evaluate(()=>Object.keys(localStorage).filter(key=>key.startsWith('ashyq:trainer-review:')).length),0);assert.deepEqual(errors,[]);assert.deepEqual(posts,[]);
  console.log('PASS10 real Reading pair trials/20 passages: manual partial/revealed/wrong-repair/fresh/report save-reload-explicit-resume, immutable first work, history/dedupe/resume/reset preservation, exact current JSON; two-tab held lock and stale import preserve screen/storage, dirty navigation guards, four widths/axe/no server or review writes. Synthetic browser attempts are not human learning evidence.');
 }finally{await browser.close();}
}
main().catch(error=>{console.error(error);process.exitCode=1;});
