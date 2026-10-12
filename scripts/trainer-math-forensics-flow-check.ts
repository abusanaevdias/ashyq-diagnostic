import assert from 'node:assert/strict';
import { chromium } from 'playwright';
import AxeBuilder from '@axe-core/playwright';
import { mathForensicsCases } from '../src/lib/math-forensics/cases';
import { checkpointKey, parseRecord } from '../src/lib/trainers/checkpoints';

async function main() {
  const browser=await chromium.launch({headless:true});
  const base=process.env.TRAINER_CHECK_BASE ?? 'http://127.0.0.1:3043';
  try {
    for(const [index,item] of mathForensicsCases.entries()) {
      const context=await browser.newContext();const page=await context.newPage();
      const errors:string[]=[];page.on('pageerror',error=>errors.push(error.message));
      const key=checkpointKey('math-forensics','guest');
      await page.goto(base+'/trainers/math-forensics');
      await page.getByRole('button',{name:'Сохранять на этом устройстве',exact:true}).click();
      await page.getByRole('button',{name:'Начать →',exact:true}).nth(index).click();
      await page.getByRole('button',{name:'Зафиксировать попытку →',exact:true}).click();
      await page.getByRole('alert').filter({hasText:'Выбери первую неверную строку'}).waitFor();
      const wrong=(item.wrongStepIndex+1)%item.steps.length;
      await page.getByRole('group',{name:'Выбери первую неверную строку решения',exact:true}).getByRole('button').nth(wrong).click();
      await page.getByRole('radio',{name:item.mechanism,exact:true}).check();
      await page.getByLabel('Как должна выглядеть только эта строка?',{exact:true}).fill(item.correctedStep);
      await page.getByRole('button',{name:'Зафиксировать попытку →',exact:true}).click();
      await page.getByRole('button',{name:'Продолжить решение →',exact:true}).click();
      await page.waitForFunction(key=>{const raw=localStorage.getItem(key);return raw&&JSON.parse(raw).checkpoint?.data.phase==='continue';},key);
      await page.reload();await page.getByRole('button',{name:'Продолжить сохранённую',exact:true}).click();
      await page.getByLabel('Твой конечный ответ',{exact:true}).fill('NaN');
      await page.getByRole('button',{name:'Зафиксировать решение →',exact:true}).click();
      await page.getByRole('alert').filter({hasText:'Введи конечное числовое значение'}).waitFor();
      await page.getByLabel('Твой конечный ответ',{exact:true}).fill(String(item.finalAnswer).replace('.',','));
      await page.getByRole('button',{name:'Зафиксировать решение →',exact:true}).click();
      await page.waitForFunction(key=>{const raw=localStorage.getItem(key);return raw&&JSON.parse(raw).checkpoint?.data.phase==='transfer';},key);
      await page.reload();await page.getByRole('button',{name:'Продолжить сохранённую',exact:true}).click();
      await page.getByRole('group',{name:'Выбери первую неверную строку решения',exact:true}).getByRole('button').nth(item.transfer.wrongStepIndex).click();
      await page.getByLabel('Правильный числовой ответ',{exact:true}).fill(String(item.transfer.answer));
      await page.getByRole('button',{name:'Проверить новый пример →',exact:true}).click();
      await page.getByRole('heading',{name:'5. Что удалось проверить',exact:true}).waitFor();
      await page.waitForFunction(key=>{const raw=localStorage.getItem(key);return raw&&JSON.parse(raw).checkpoint?.data.phase==='result';},key);
      const record=parseRecord(await page.evaluate(key=>localStorage.getItem(key),key),'math-forensics')!;
      const data=record.checkpoint!.data as {firstAttempt:{stepIndex:number;repairLine:string};transferAttempt:{stepIndex:number;answer:string}};
      assert.equal(data.firstAttempt.stepIndex,wrong);
      assert.equal(data.firstAttempt.repairLine,item.correctedStep);
      assert.equal(data.transferAttempt.stepIndex,item.transfer.wrongStepIndex);
      assert.equal(data.transferAttempt.answer,String(item.transfer.answer));
      for(const width of [320,390,768,1440]){await page.setViewportSize({width,height:900});assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1),false);}
      const axe=await new AxeBuilder({page}).include('main').analyze();assert.deepEqual(axe.violations.map(v=>({id:v.id,targets:v.nodes.map(n=>n.target)})),[]);
      assert.deepEqual(errors,[]);await context.close();
      console.log(`PASS Math Forensics ${item.id}: wrong first step preserved, repair/continuation/transfer restores, invalid numeric guard, fresh correct result, four widths/axe. Free correction is not automatically scored.`);
    }
  } finally {await browser.close();}
}
main().catch(error=>{console.error(error);process.exitCode=1;});
