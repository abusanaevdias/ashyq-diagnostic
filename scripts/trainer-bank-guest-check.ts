import assert from 'node:assert/strict';
import {chromium} from 'playwright';
import AxeBuilder from '@axe-core/playwright';
import {trainerBank,bankSourceQuery} from '../src/lib/trainers/bank-sources';
async function main(){
 const base=process.env.TRAINER_CHECK_BASE??'http://127.0.0.1:3043';assert.ok(['localhost','127.0.0.1','ashyq-diagnostic.vercel.app'].includes(new URL(base).hostname));const browser=await chromium.launch({headless:true});
 try{
  const context=await browser.newContext(),page=await context.newPage(),source=trainerBank.sources.find(s=>s.exercise.type==='task2')!,errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
  for(const [path,title]of [['/trainers/bank','Нужно войти'],['/trainers/bank/practice?'+bankSourceQuery(source.ref),'Нужно войти для пробы'],['/trainers/bank/practice?'+bankSourceQuery(source.ref)+'&nativeStart=1','Нужно войти для пробы']] as const){
   const response=await page.goto(base+path);assert.equal(response?.status(),200);await page.getByRole('heading',{name:title,exact:true}).waitFor();assert.match((await page.locator('meta[name=robots]').getAttribute('content'))!,/\bnoindex\b/);assert.equal(await page.getByRole('button',{name:'Сохранить текущую пробу',exact:true}).count(),0);assert.equal(await page.locator('article').count(),0);assert.equal(await page.locator('main').count(),1);
   for(const width of [320,390,768,1440]){await page.setViewportSize({width,height:900});assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1),false);}assert.deepEqual((await new AxeBuilder({page}).include('main').withTags(['wcag2a','wcag2aa','wcag21aa']).analyze()).violations,[]);
  }
  assert.deepEqual(errors,[]);console.log(`PASS anonymous bank/practice/native-return gates at ${base}: no draft trial/records, noindex, one main, four widths/axe. UI evidence only; no authenticated teacher, RLS or publication certification.`);
 }finally{await browser.close();}
}
main().catch(error=>{console.error(error);process.exitCode=1;});
