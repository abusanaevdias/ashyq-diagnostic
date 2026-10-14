import assert from 'node:assert/strict';
import {chromium} from 'playwright';
import {trainerBank} from '../src/lib/trainers/bank-sources';
import {bankPracticeHref} from '../src/lib/trainers/bank-navigation';
async function main(){
 const base=process.env.TRAINER_CHECK_BASE??'http://127.0.0.1:3043';assert.ok(['localhost','127.0.0.1'].includes(new URL(base).hostname));const browser=await chromium.launch({headless:true});
 try{
  const page=await browser.newPage(),errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));await page.goto(base+'/trainers');
  const session=(role:string)=>({user:{id:'synthetic-native-query',name:'Synthetic reviewer',email:'synthetic@example.invalid',role,avatarColor:'red'},expiresAt:new Date(Date.now()+3600000).toISOString()});
  await page.evaluate(value=>localStorage.setItem('ashyq:v2:session',JSON.stringify(value)),session('teacher'));
  for(const type of ['task2','speaking'] as const){
   const source=trainerBank.sources.find(s=>s.exercise.type===type)!,url=base+bankPracticeHref(source.ref)!;
   for(const suffix of ['nativeStart=0','nativeStart=','nativeStart=1%20','nativeStart=1&nativeStart=1']){
    const target=url+'&'+suffix;await page.goto(target);await page.getByRole('heading',{name:type==='speaking'?'Не удалось открыть черновик':'Версия задания недоступна',exact:true}).waitFor();assert.equal(page.url(),target);assert.equal(await page.getByRole('button',{name:'Сохранить текущую пробу',exact:true}).count(),0);
   }
   const stale=new URL(url);stale.searchParams.set(type==='speaking'?'reviewHash':'sourceHash','0'.repeat(64));stale.searchParams.set('nativeStart','1');await page.goto(stale.href);await page.getByRole('heading',{name:type==='speaking'?'Версия Speaking-черновика недоступна':'Версия задания недоступна',exact:true}).waitFor();assert.equal(page.url(),stale.href);
   await page.evaluate(value=>{localStorage.setItem('ashyq:v2:session',JSON.stringify(value));dispatchEvent(new Event('storage'));},session('student'));await page.goto(url+'&nativeStart=1');await page.getByRole('heading',{name:'Недостаточно прав',exact:true}).waitFor();assert.equal(page.url(),url+'&nativeStart=1');assert.equal(await page.getByRole('button',{name:'Сохранить текущую пробу',exact:true}).count(),0);await page.evaluate(value=>{localStorage.setItem('ashyq:v2:session',JSON.stringify(value));dispatchEvent(new Event('storage'));},session('teacher'));await page.waitForURL(url);
  }
  assert.deepEqual(errors,[]);console.log('PASS bank/Speaking native-entry query boundaries: invalid/empty/whitespace/duplicate flag and stale source never redirect or mount trial; student is denied and only a valid teacher transition strips the flag into its canonical document. LocalDemo UI only.');
 }finally{await browser.close();}
}
main().catch(error=>{console.error(error);process.exitCode=1;});
