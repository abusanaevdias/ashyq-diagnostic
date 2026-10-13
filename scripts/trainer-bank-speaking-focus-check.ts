import assert from 'node:assert/strict';
import {chromium} from 'playwright';
import {trainerBank} from '../src/lib/trainers/bank-sources';
async function main(){
 const base=process.env.TRAINER_CHECK_BASE??'http://127.0.0.1:3043';assert.ok(['localhost','127.0.0.1'].includes(new URL(base).hostname));const browser=await chromium.launch({headless:true});
 try{
  const page=await browser.newPage(),source=trainerBank.sources.find(s=>s.exercise.type==='speaking')!;await page.goto(base+'/trainers/material-review');await page.getByRole('heading',{name:'Нужно войти',exact:true}).waitFor();await page.evaluate(()=>{localStorage.setItem('ashyq:v2:session',JSON.stringify({user:{id:'synthetic-speaking-keyboard',name:'Synthetic reviewer',email:'synthetic@example.invalid',role:'teacher',avatarColor:'red'},expiresAt:new Date(Date.now()+3600000).toISOString()}));dispatchEvent(new Event('storage'));});
  await page.goto(base+'/trainers/speaking-second-take?'+new URLSearchParams({reviewBatch:source.ref.batchId,reviewVersion:source.ref.version,reviewUnit:source.ref.unitId,reviewHash:source.ref.contentHash}));await page.getByRole('button',{name:/Начать подготовку/}).click();await page.getByLabel('Твои заметки: ключевые идеи, не готовый текст',{exact:true}).fill('Synthetic keyboard navigation notes.');
  const alert=page.getByRole('alert',{name:'Подтверждение выхода',exact:true}),stage=page.locator('#speaking-stage-title');
  await page.getByRole('button',{name:'← К началу',exact:true}).click();await alert.waitFor();assert.equal(await alert.evaluate(n=>n===document.activeElement),true);await page.keyboard.press('Tab');assert.equal(await page.getByRole('button',{name:'Подтвердить сброс',exact:true}).evaluate(n=>n===document.activeElement),true);await page.keyboard.press('Tab');await page.keyboard.press('Enter');assert.equal(await stage.evaluate(n=>n===document.activeElement),true);assert.equal(await page.getByLabel('Твои заметки: ключевые идеи, не готовый текст',{exact:true}).inputValue(),'Synthetic keyboard navigation notes.');
  await page.getByRole('link',{name:'← К проверке материалов',exact:true}).click();await alert.waitFor();assert.equal(await alert.evaluate(n=>n===document.activeElement),true);await page.getByRole('button',{name:'Остаться в пробе',exact:true}).click();assert.equal(await stage.evaluate(n=>n===document.activeElement),true);
  await page.getByRole('button',{name:'← К началу',exact:true}).click();await page.getByRole('button',{name:'Подтвердить сброс',exact:true}).click();await page.getByRole('button',{name:/Начать подготовку/}).waitFor();assert.equal(await page.getByRole('heading',{level:1}).evaluate(n=>n===document.activeElement),true);
  console.log('PASS Speaking confirmation receives focus; keyboard can stay without losing notes; cancellation returns to the stage and confirmed reset focuses the start heading. Synthetic local fixture only.');
 }finally{await browser.close();}
}
main().catch(error=>{console.error(error);process.exitCode=1;});
