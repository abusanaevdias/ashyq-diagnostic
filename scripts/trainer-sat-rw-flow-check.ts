import assert from 'node:assert/strict';
import { chromium, type Page } from 'playwright';
import AxeBuilder from '@axe-core/playwright';
import { optionlessCases } from '../src/lib/sat-optionless/cases';
import { distractorCases, expectedReason } from '../src/lib/sat-distractor/cases';
import { checkpointKey, parseRecord } from '../src/lib/trainers/checkpoints';

const base=process.env.TRAINER_CHECK_BASE ?? 'http://127.0.0.1:3043';
async function restore(page:Page,key:string,phase:string) {
  await page.waitForFunction(({key,phase})=>{const raw=localStorage.getItem(key);return raw&&JSON.parse(raw).checkpoint?.data.phase===phase;},{key,phase});
  await page.reload();
  await page.getByRole('button',{name:'Продолжить сохранённую',exact:true}).click();
}
async function audit(page:Page) {
  for(const width of [320,390,768,1440]) { await page.setViewportSize({width,height:900});assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1),false,`overflow ${width}`); }
  const axe=await new AxeBuilder({page}).include('main').analyze();
  assert.deepEqual(axe.violations.map(v=>({id:v.id,targets:v.nodes.map(n=>n.target)})),[]);
}
async function main() {
  const browser=await chromium.launch({headless:true});
  try {
    for(const [caseIndex,entry] of optionlessCases.entries()) {
      const context=await browser.newContext();const page=await context.newPage();
      const errors:string[]=[];page.on('pageerror',error=>errors.push(error.message));
      await page.goto(base+'/trainers/sat-optionless');
      await page.getByRole('button',{name:'Сохранять на этом устройстве',exact:true}).click();
      await page.getByRole('button',{name:'Начать →',exact:true}).nth(caseIndex).click();
      const key=checkpointKey('sat-optionless','guest');
      for(const round of ['first','transfer'] as const) {
        const item=entry[round];
        assert.equal(await page.getByRole('radio').count(),0,'options must remain hidden before prediction');
        await page.getByRole('button',{name:'Зафиксировать прогноз →',exact:true}).click();
        await page.getByRole('alert').filter({hasText:/Впиши знак|Сначала запиши/}).waitFor();
        const input=page.getByLabel(item.predictionPrompt,{exact:true});
        if(entry.predictionType==='relation') await input.selectOption(item.modelPrediction);
        else await input.fill(item.modelPrediction);
        await page.getByRole('button',{name:'Зафиксировать прогноз →',exact:true}).click();
        await restore(page,key,'options');
        assert.equal(await page.getByRole('radio').count(),4);
        assert.equal(await page.locator('#optionless-prediction').count(),0,'committed prediction is locked');
        const selected=round==='first'?(item.correctIndex+1)%4:item.correctIndex;
        await page.getByRole('radio').nth(selected).check();
        await page.getByRole('button',{name:'Проверить выбор →',exact:true}).click();
        if(round==='first') await page.getByRole('button',{name:'Проверить навык на новом тексте →',exact:true}).click();
      }
      await page.getByRole('heading',{name:'6. Разбери новый пример',exact:true}).waitFor();
      await restore(page,key,'result');
      const record=parseRecord(await page.evaluate(key=>localStorage.getItem(key),key),'sat-optionless')!;
      const data=record.checkpoint!.data as {first:{prediction:string;choiceIndex:number};transfer:{prediction:string;choiceIndex:number}};
      assert.equal(data.first.prediction,entry.first.modelPrediction);
      assert.equal(data.first.choiceIndex,(entry.first.correctIndex+1)%4);
      assert.equal(data.transfer.choiceIndex,entry.transfer.correctIndex);
      await audit(page);assert.deepEqual(errors,[]);await context.close();
      console.log(`PASS Optionless ${entry.id}: prediction gate, locked options restore, wrong first and correct fresh result, four widths/axe`);
    }
    for(const [caseIndex,entry] of distractorCases.entries()) {
      const context=await browser.newContext();const page=await context.newPage();
      const errors:string[]=[];page.on('pageerror',error=>errors.push(error.message));
      await page.goto(base+'/trainers/sat-distractor');
      await page.getByRole('button',{name:'Сохранять на этом устройстве',exact:true}).click();
      await page.getByRole('button',{name:'Начать →',exact:true}).nth(caseIndex).click();
      const key=checkpointKey('sat-distractor','guest');
      for(const round of ['first','transfer'] as const) {
        const item=entry[round];const selected=round==='first'?(item.correctIndex+1)%4:item.correctIndex;
        await page.getByRole('radio').nth(selected).check();
        await page.getByRole('button',{name:'Зафиксировать выбор →',exact:true}).click();
        await page.getByRole('button',{name:'Открыть разбор →',exact:true}).click();
        await page.getByRole('alert').filter({hasText:'Для каждого из трёх'}).waitFor();
        for(let i=0;i<item.choices.length;i++) if(i!==selected) await page.getByLabel(`Как ты оцениваешь вариант ${'ABCD'[i]}?`,{exact:true}).selectOption(expectedReason(item,i));
        await restore(page,key,'reasons');
        assert.equal(await page.getByRole('combobox').count(),3,'exactly three alternatives after restoring');
        await page.getByRole('button',{name:'Открыть разбор →',exact:true}).click();
        if(round==='first') {
          await page.getByText('Ты заметил, что верный вариант может подойти, но выбрал другой.',{exact:false}).waitFor();
          await page.getByRole('button',{name:'Проверить на новом тексте →',exact:true}).click();
        }
      }
      await page.getByRole('heading',{name:'6. Что показал новый вопрос',exact:true}).waitFor();
      await restore(page,key,'result');
      const record=parseRecord(await page.evaluate(key=>localStorage.getItem(key),key),'sat-distractor')!;
      const data=record.checkpoint!.data as {first:{answerIndex:number;reasons:Record<number,string>};transfer:{answerIndex:number}};
      assert.equal(data.first.answerIndex,(entry.first.correctIndex+1)%4);
      assert.equal(data.first.reasons[entry.first.correctIndex],'may-be-correct');
      assert.equal(data.transfer.answerIndex,entry.transfer.correctIndex);
      await audit(page);assert.deepEqual(errors,[]);await context.close();
      console.log(`PASS Distractor ${entry.id}: missing-reason guard, reasons restore, wrong-first/may-be-correct provenance, fresh transfer, four widths/axe`);
    }
  } finally { await browser.close(); }
}
main().catch(error=>{console.error(error);process.exitCode=1;});
