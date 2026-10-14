import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import {chromium} from 'playwright';
import AxeBuilder from '@axe-core/playwright';
import {trainerBank} from '../src/lib/trainers/bank-sources';
import {bankPracticeHref} from '../src/lib/trainers/bank-navigation';
import {bankRecordKey,emptyBankRecord,createBankEntry} from '../src/lib/trainers/bank-records';
import {emptyBankSnapshot} from '../src/lib/trainers/bank-snapshots';
import {bankReportBlocks} from '../src/lib/trainers/bank-report';
async function main(){
 const base=process.env.TRAINER_CHECK_BASE??'http://127.0.0.1:3043';assert.ok(['localhost','127.0.0.1'].includes(new URL(base).hostname));const browser=await chromium.launch({headless:true});
 try{
  const context=await browser.newContext({acceptDownloads:true}),page=await context.newPage(),errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));const actor='synthetic-word-report';await page.goto(base+'/trainers/bank');await page.getByRole('heading',{name:'Нужно войти',exact:true}).waitFor();
  await page.evaluate(actor=>{localStorage.setItem('ashyq:v2:session',JSON.stringify({user:{id:actor,name:'Synthetic reviewer',email:'synthetic@example.invalid',role:'teacher',avatarColor:'red'},expiresAt:new Date(Date.now()+3600000).toISOString()}));dispatchEvent(new Event('storage'));},actor);
  const representatives=trainerBank.sources.filter((s,i,all)=>all.findIndex(x=>x.trainer===s.trainer)===i);
  for(const source of representatives){
   const state=emptyBankSnapshot(source)!;const marker=`PRIVATE ${source.ref.unitId} <tag> 🧪`;
   switch(state.type){case 'task2':state.started=true;state.attempt.corrections[0].quote=marker;break;case 'reading':state.started=true;state.responses[0].reason=marker;break;case 'math':state.started=true;state.working=marker;break;case 'sat-rw':state.started=true;state.prediction=marker;break;case 'task1':state.started=true;state.overview=marker;break;case 'writing-drill':state.started=true;state.current.draft=marker;break;case 'listening':state.started=true;state.prediction=marker;break;case 'speaking':state.phase='prepare';state.notes=marker;break;}
   const oldMarker=`ARCHIVED ${source.ref.unitId} <tag> 🧪`,oldState=JSON.parse(JSON.stringify(state).replace(marker,oldMarker)),entry=createBankEntry(source,oldState,new Date('2026-10-13T10:00:00.000Z'));
   const key=bankRecordKey(actor,source.ref),raw=JSON.stringify({...emptyBankRecord(source),revision:crypto.randomUUID(),checkpoint:createBankEntry(source,state),history:[entry]});await page.evaluate(({key,raw})=>localStorage.setItem(key,raw),{key,raw});
   await page.goto(base+bankPracticeHref(source.ref));const bank=page.getByRole('region',{name:`Сохранение пробы · ${source.ref.unitId} · версия ${source.ref.version}`,exact:true});await bank.waitFor();await bank.getByRole('button',{name:'Продолжить сохранённую пробу',exact:true}).click();await bank.getByRole('button',{name:'Подтвердить загрузку',exact:true}).click();
   const before=await page.evaluate(key=>localStorage.getItem(key),key);const pending=page.waitForEvent('download');await bank.getByRole('button',{name:'Скачать отчёт Word',exact:true}).click();const download=await pending;assert.equal(download.suggestedFilename(),`ASHYQ-${source.ref.unitId}-v${source.ref.version}-current.docx`);assert.equal(await download.failure(),null);const file=await download.path();assert.ok(file);const bytes=await fs.readFile(file),xml=bytes.toString('utf8');assert.equal(bytes.readUInt32LE(0),0x04034b50);assert.ok(xml.includes(marker.replace('<tag>','&lt;tag&gt;')));assert.ok(xml.includes(source.ref.contentHash));assert.equal(await page.evaluate(key=>localStorage.getItem(key),key),before,'export does not write or clear');assert.ok(bankReportBlocks(source,state).some(b=>b.text.includes(marker)));
   await bank.getByRole('status').filter({hasText:'Отчёт Word скачан'}).waitFor();
   await bank.locator('summary').click();const oldPending=page.waitForEvent('download');await bank.getByRole('button',{name:`Скачать Word занятия ${entry.savedAt}`,exact:true}).click();const oldDownload=await oldPending;assert.equal(oldDownload.suggestedFilename(),`ASHYQ-${source.ref.unitId}-v${source.ref.version}-history-${entry.id}.docx`);assert.equal(await oldDownload.failure(),null);const oldFile=await oldDownload.path();assert.ok(oldFile);const oldXml=(await fs.readFile(oldFile)).toString('utf8');assert.ok(oldXml.includes(oldMarker.replace('<tag>','&lt;tag&gt;')));assert.ok(oldXml.includes(entry.savedAt));assert.equal(oldXml.includes(marker.replace('<tag>','&lt;tag&gt;')),false,'history report not current screen');assert.equal(await page.evaluate(key=>localStorage.getItem(key),key),before);
   for(const width of [320,390,768,1440]){await page.setViewportSize({width,height:900});assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1),false);assert.deepEqual((await new AxeBuilder({page}).include('main').withTags(['wcag2a','wcag2aa','wcag21aa']).analyze()).violations,[]);}
  }
  assert.equal(representatives.length,11);assert.deepEqual(errors,[]);console.log('PASS11 bank trainer families actual source-route resume/current and separate history DOCX downloads, response/source/name/date/ZIP/nonwriting checks and four widths/axe. Synthetic partial work, not real login/RLS/Office/phone or completed-flow acceptance.');
 }finally{await browser.close();}
}
main().catch(error=>{console.error(error);process.exitCode=1;});
