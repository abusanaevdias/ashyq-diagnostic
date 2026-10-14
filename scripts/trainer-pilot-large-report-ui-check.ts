import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {chromium} from 'playwright';
import {checkpointKey} from '../src/lib/trainers/checkpoints';
async function main(){
 const base=process.env.TRAINER_CHECK_BASE??'http://127.0.0.1:3043';assert.ok(['localhost','127.0.0.1'].includes(new URL(base).hostname));const browser=await chromium.launch({headless:true});
 try{
  const context=await browser.newContext({acceptDownloads:true}),page=await context.newPage(),errors:string[]=[],downloads:string[]=[];page.on('pageerror',e=>errors.push(e.message));page.on('download',d=>downloads.push(d.suggestedFilename()));await page.goto(base+'/trainers/speaking-second-take');
  const panel=page.getByRole('region',{name:'Сохранение: Запиши ответ второй раз',exact:true});await panel.waitFor();await page.getByRole('button',{name:/Начать подготовку/}).click();
  const notes:string[]=[];
  for(let take=0;take<3;take++){
   await page.getByRole('button',{name:/Я готов к ответу/}).click();await page.getByRole('button',{name:/Самостоятельная попытка без аудио/}).click();
   for(let marker=0;marker<50;marker++){const prefix=`${take}.${marker} `,note=prefix+'Я'.repeat(1000-prefix.length);notes.push(note);await page.getByLabel('Конкретный момент: слово, фраза или идея',{exact:true}).fill(note);await page.getByRole('button',{name:'Добавить наблюдение без таймкода',exact:true}).click();}
   for(let criterion=0;criterion<4;criterion++)await page.locator(`#speaking-rating-${criterion}`).selectOption({label:'Нужно поработать'});
   await page.getByLabel('План: что конкретно сделаешь в следующем ответе?',{exact:true}).fill(`Own next plan ${take}`);await page.getByRole('checkbox',{name:'Я ответил вслух самостоятельно и заполнил самопроверку',exact:true}).check();await page.getByRole('button',{name:/Сохранить самопроверку/}).click();
   if(take<2)await page.getByRole('button',{name:take===0?/Повторить ту же тему по плану/:/Проверить себя на новой теме/}).click();
  }
  await page.getByRole('heading',{name:'Три попытки: что ты заметил',exact:true}).waitFor();const key=checkpointKey('speaking-second-take','guest');assert.equal(await page.evaluate(key=>localStorage.getItem(key),key),null);
  await panel.getByRole('button',{name:'Скачать текущую работу',exact:true}).click();await panel.getByRole('status').filter({hasText:'превышает лимит снимка JSON (100 КБ)'}).waitFor();assert.equal(downloads.length,0);
  const pending=page.waitForEvent('download');await panel.getByRole('button',{name:'Скачать отчёт Word',exact:true}).click();const download=await pending;assert.equal(await download.failure(),null);const path=await download.path();assert.ok(path);const bytes=await fs.readFile(path);assert.ok(bytes.length>300_000);const xml=bytes.toString('utf8');for(const note of notes)assert.ok(xml.includes(note));assert.equal(downloads.length,1);assert.equal(await page.evaluate(key=>localStorage.getItem(key),key),null);assert.deepEqual(errors,[]);
  console.log('PASS actual three public Speaking takes/150 legal1000-character Cyrillic notes: JSON budget rejects without download/write; larger bounded Word preserves every observation and plan. Manual synthetic no-audio responses; no speech quality, microphone/Office/device or large JSON restoration claim.');
 }finally{await browser.close();}
}
main().catch(error=>{console.error(error);process.exitCode=1;});
