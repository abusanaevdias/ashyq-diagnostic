import assert from 'node:assert/strict';
import {chromium,type Page} from 'playwright';
import {bankPracticeHref} from '../src/lib/trainers/bank-navigation';
import {trainerBank} from '../src/lib/trainers/bank-sources';

async function rejectBack(page:Page,field:string,value:string){
 const original=page.url(),dialogPromise=page.waitForEvent('dialog',{timeout:5000}),back=page.goBack({timeout:5000}).catch(error=>error);
 const dialog=await dialogPromise;assert.equal(dialog.type(),'beforeunload');await dialog.dismiss();const result=await back;
 if(result instanceof Error)assert.equal(result.name,'TimeoutError','only a canceled-navigation observation timeout is tolerated');
 assert.equal(page.url(),original);assert.equal(await page.getByLabel(field,{exact:true}).inputValue(),value);
}
async function main(){
 const base=process.env.TRAINER_CHECK_BASE??'http://127.0.0.1:3043';assert.ok(['localhost','127.0.0.1'].includes(new URL(base).hostname));const browser=await chromium.launch({headless:true});
 try{
  for(const kind of ['task2','speaking'] as const){
   const context=await browser.newContext(),page=await context.newPage(),source=trainerBank.sources.find(s=>s.exercise.type===kind)!,url=base+bankPracticeHref(source.ref)!,documents:string[]=[],errors:string[]=[];
   page.on('pageerror',error=>errors.push(error.message));context.on('request',request=>{if(request.isNavigationRequest()&&request.resourceType()==='document')documents.push(request.url());});
   await page.goto(url);await page.getByRole('heading',{name:kind==='speaking'?'Нужно войти для Speaking-черновика':'Нужно войти для пробы',exact:true}).waitFor();
   const login=page.getByRole('link',{name:kind==='speaking'?'Войти в учебный кабинет':'Войти и продолжить →',exact:true}),href=await login.getAttribute('href');assert.ok(href);assert.ok(new URL(href,base).searchParams.get('next')?.endsWith('&nativeStart=1'));
   await login.click();await page.getByRole('heading',{name:'Вход в ASHYQ',exact:true}).waitFor();assert.ok(documents.some(url=>new URL(url).pathname==='/login'),'login itself is a native document');
   const before=documents.length;await page.getByRole('button',{name:/^Войти как учитель\./}).click();await page.waitForURL(url);await page.getByRole('region',{name:`Сохранение пробы · ${source.ref.unitId} · версия ${source.ref.version}`,exact:true}).waitFor();assert.ok(documents.slice(before).includes(url),'actual SPA login return starts a native response document');assert.equal(await page.evaluate(()=>performance.getEntriesByType('navigation')[0]?.name),url);assert.equal(new URL(page.url()).searchParams.has('nativeStart'),false);
   let field:string,value:string;
   if(kind==='task2'){await page.getByRole('button',{name:'Начать пробу эссе',exact:true}).click();field='Исходный фрагмент 1';value='Own unsaved writing after real local demo login.';}
   else{assert.equal(await page.evaluate(()=>(document as unknown as {featurePolicy:{allowsFeature:(name:string)=>boolean}}).featurePolicy.allowsFeature('microphone')),true);await page.getByRole('button',{name:/Начать подготовку/}).click();await page.getByRole('button',{name:/Я готов к ответу/}).click();await page.getByRole('button',{name:/Самостоятельная попытка без аудио/}).click();field='Конкретный момент: слово, фраза или идея';value='Own unsaved Speaking note, without any microphone request.';}
   await page.getByLabel(field,{exact:true}).fill(value);await rejectBack(page,field,value);
   // Explicit discard still makes one deliberate transition, without a second native prompt.
   let extra=0;page.on('dialog',async dialog=>{extra++;await dialog.dismiss();});await page.getByRole('link',{name:kind==='speaking'?'← К проверке материалов':'← К банку практики',exact:true}).click();await page.getByRole('button',{name:kind==='speaking'?'Подтвердить переход':'Перейти без сохранения',exact:true}).click();await page.waitForURL(base+(kind==='speaking'?'/trainers/material-review':'/trainers/bank'));assert.equal(extra,0);assert.deepEqual(errors,[]);
   if(kind==='task2'){
    await page.getByLabel('Навык, название или номер задания',{exact:true}).fill(source.ref.unitId);const before=documents.length;await page.getByRole('article',{name:source.title,exact:true}).getByRole('link').click();await page.waitForURL(url);await page.getByRole('button',{name:'Начать пробу эссе',exact:true}).click();assert.ok(documents.slice(before).includes(url),'directory practice link creates a new document');await page.getByLabel(field,{exact:true}).fill('Own unsaved writing from the directory.');page.removeAllListeners('dialog');await rejectBack(page,field,'Own unsaved writing from the directory.');
   }
   await context.close();
  }
  console.log('PASS actual LocalDemo teacher login SPA return and native directory entry: source identity retained, response fields mount only in the final document, browser Back warns and dismissal preserves unsaved writing/Speaking notes, scoped Speaking microphone policy and explicit discard has no duplicate prompt. No physical microphone, real auth/RLS or OS-kill guarantee.');
 }finally{await browser.close();}
}
main().catch(error=>{console.error(error);process.exitCode=1;});
