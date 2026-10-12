import assert from 'node:assert/strict';
import { chromium, type Page } from 'playwright';
import AxeBuilder from '@axe-core/playwright';
import { translationCases } from '../src/lib/sat-translation/cases';
import { cases as methodCases } from '../src/lib/math-method-switch/cases';
import { checkpointKey, parseRecord } from '../src/lib/trainers/checkpoints';
const base=process.env.TRAINER_CHECK_BASE ?? 'http://127.0.0.1:3043';
async function restore(page:Page,key:string,phase:string) {
  await page.waitForFunction(({key,phase})=>{const r=localStorage.getItem(key);return r&&JSON.parse(r).checkpoint?.data.phase===phase;},{key,phase});
  await page.reload();await page.getByRole('button',{name:'Продолжить сохранённую',exact:true}).click();
}
async function audit(page:Page) {
  for(const width of [320,390,768,1440]) {await page.setViewportSize({width,height:900});assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1),false);}
  const result=await new AxeBuilder({page}).include('main').analyze();assert.deepEqual(result.violations.map(v=>({id:v.id,targets:v.nodes.map(n=>n.target)})),[]);
}
async function main() {
  const browser=await chromium.launch({headless:true});
  try {
    for(const [index,entry] of translationCases.entries()) {
      const context=await browser.newContext();const page=await context.newPage();const errors:string[]=[];page.on('pageerror',error=>errors.push(error.message));
      const key=checkpointKey('sat-translation','guest');
      await page.goto(base+'/trainers/sat-translation');await page.getByRole('button',{name:'Сохранять на этом устройстве',exact:true}).click();
      await page.getByRole('button',{name:'Начать →',exact:true}).nth(index).click();
      for(const [round,item] of entry.items.entries()) {
        await page.getByRole('button',{name:'Зафиксировать модель →',exact:true}).click();await page.getByRole('alert').filter({hasText:'Выбери смысл x'}).waitFor();
        await page.getByLabel('Что обозначает x?',{exact:true}).selectOption(item.variable);
        await page.getByLabel('Разовый платёж, $',{exact:true}).fill(String(item.setup));
        await page.locator('#model-rate').fill(String(item.rate));await page.getByLabel('Общая сумма, $',{exact:true}).fill(String(item.total));
        await page.getByRole('radio',{name:round===0?'(Разовый платёж + ставка) × x = общая сумма':'Разовый платёж + ставка × x = общая сумма',exact:true}).check();
        await page.getByRole('button',{name:'Зафиксировать модель →',exact:true}).click();await restore(page,key,'calculate');
        assert.equal(await page.locator('#model-setup').count(),0,'committed model must remain locked');
        await page.getByLabel('Твои действия',{exact:true}).fill(`${item.total} - ${item.setup} = ${item.total-item.setup}; divide by ${item.rate}.`);
        await page.getByLabel('Полученное значение x',{exact:true}).fill(String(item.answer));
        await page.getByRole('button',{name:'Открыть разбор →',exact:true}).click();
        if(round===0) await page.getByRole('heading',{name:'Сначала пересмотри модель',exact:true}).waitFor();
        const next=page.getByRole('button',{name:round===0?'Проверить на новой задаче →':'Сравнить две попытки →',exact:true});
        await next.click();await page.getByRole('alert').filter({hasText:'Запиши, что проверишь'}).waitFor();
        await page.locator('#model-repair').fill('The setup fee belongs to the whole order and must be added once.');
        await next.click();
      }
      await page.getByRole('heading',{name:'Что получилось на двух задачах',exact:true}).waitFor();await restore(page,key,'result');
      const record=parseRecord(await page.evaluate(key=>localStorage.getItem(key),key),'sat-translation')!;
      const attempts=record.checkpoint!.data.attempts as {model:{form:string};answer:number;repair:string}[];
      assert.equal(attempts[0].model.form,'repeated');assert.equal(attempts[0].answer,entry.items[0].answer,'correct number must not erase a wrong model');
      assert.equal(attempts[1].model.form,'once');assert.ok(attempts.every(a=>a.repair.trim()));
      await audit(page);assert.deepEqual(errors,[]);await context.close();console.log(`PASS Translation ${index}: locked model restore, wrong model with correct number retained, required repair, fresh correct task, widths/axe`);
    }
    for(const [index,entry] of methodCases.entries()) {
      const context=await browser.newContext();const page=await context.newPage();const errors:string[]=[];page.on('pageerror',error=>errors.push(error.message));
      const key=checkpointKey('math-method-switch','guest');
      await page.goto(base+'/trainers/math-method-switch');await page.getByRole('button',{name:'Сохранять на этом устройстве',exact:true}).click();
      await page.getByRole('button',{name:'Начать →',exact:true}).nth(index).click();
      for(const [round,item] of entry.items.entries()) {
        await page.getByLabel('Твои действия',{exact:true}).fill('Compare both expressions, solve for x, then substitute to find y.');
        await page.getByLabel('Координата x',{exact:true}).fill(String(round===0?item.x+1:item.x));await page.getByLabel('Координата y',{exact:true}).fill(String(item.y));
        await page.getByLabel('Какой способ ты использовал?',{exact:true}).selectOption(round===0?'algebra':'table');
        if(round===0) await restore(page,key,'solve');
        await page.getByRole('button',{name:'Зафиксировать и открыть разбор →',exact:true}).click();
        if(round===0) {
          await page.getByLabel('Выбери другой способ для новой задачи',{exact:true}).selectOption('graph');
          await restore(page,key,'review');assert.equal(await page.getByLabel('Выбери другой способ для новой задачи',{exact:true}).inputValue(),'graph');
        }
        await page.getByLabel('Что проверишь в следующий раз?',{exact:true}).fill('Substitute the intersection into both equations and check the positive-x restriction.');
        await page.getByRole('button',{name:round===0?'Попробовать на новой задаче →':'Сравнить попытки →',exact:true}).click();
      }
      await page.getByRole('heading',{name:'Две попытки рядом',exact:true}).waitFor();
      await page.waitForFunction(key=>{const r=localStorage.getItem(key);return r&&JSON.parse(r).checkpoint?.data.phase==='result';},key);
      const record=parseRecord(await page.evaluate(key=>localStorage.getItem(key),key),'math-method-switch')!;
      const attempts=record.checkpoint!.data.attempts as {x:number;method:string;seconds:number|null}[];
      assert.equal(attempts[0].x,entry.items[0].x+1);assert.equal(attempts[0].seconds,null,'resumed duration cannot be reported as uninterrupted');
      assert.equal(attempts[1].x,entry.items[1].x);assert.equal(attempts[1].method,'table','actual method may differ from the planned graph');
      assert.equal(typeof attempts[1].seconds,'number');assert.ok(attempts[1].seconds!>=0);
      await audit(page);assert.deepEqual(errors,[]);await context.close();console.log(`PASS Method Switch ${index}: wrong first retained, solve/review restore, omitted resumed duration, fresh measured attempt and actual changed method, widths/axe`);
    }
  } finally {await browser.close();}
}
main().catch(error=>{console.error(error);process.exitCode=1;});
