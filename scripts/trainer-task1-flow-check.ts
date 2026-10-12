import assert from 'node:assert/strict';
import { chromium } from 'playwright';
import AxeBuilder from '@axe-core/playwright';
import { overviewItems } from '../src/lib/task1-overview/cases';
import { checkpointKey, parseRecord } from '../src/lib/trainers/checkpoints';

async function main() {
  const base=process.env.TRAINER_CHECK_BASE ?? 'http://127.0.0.1:3043';
  const browser=await chromium.launch({headless:true});
  try {
    const context=await browser.newContext();
    const page=await context.newPage();
    const errors:string[]=[];
    page.on('pageerror',error=>errors.push(error.message));
    const key=checkpointKey('task1-overview','guest');
    await page.goto(base+'/trainers/task1-overview');
    await page.getByRole('button',{name:'Сохранять на этом устройстве',exact:true}).click();
    await page.getByRole('button',{name:'Начать с первого графика →',exact:true}).click();
    await page.getByRole('button',{name:'Зафиксировать overview →',exact:true}).click();
    await page.getByRole('alert').filter({hasText:'Выбери ровно три'}).waitFor();
    for (const round of [0,1]) {
      const item=overviewItems[round];
      const selected=round===0?[0,3,4]:[0,1,2];
      for(const index of selected) await page.getByRole('checkbox',{name:item.claims[index].text,exact:true}).check();
      await page.getByLabel('Твой overview: одно-два предложения на английском',{exact:true}).fill(round===0?'Bus and rail use increased, but I need to check whether bus use doubled.':item.modelOverview);
      await page.getByRole('button',{name:'Зафиксировать overview →',exact:true}).click();
      if(round===0) {
        await page.waitForFunction(key=>{const r=localStorage.getItem(key);return r&&JSON.parse(r).checkpoint?.data.phase==='evidence';},key);
        await page.reload();
        await page.getByRole('button',{name:'Продолжить сохранённую',exact:true}).click();
        await page.getByRole('heading',{name:'2. Найди опору для утверждений',exact:true}).waitFor();
        await page.getByRole('button',{name:'Зафиксировать опоры →',exact:true}).click();
        await page.getByRole('alert').filter({hasText:'Для каждого выбранного'}).waitFor();
      }
      for(let i=0;i<selected.length;i++) await page.getByLabel(`Опора для утверждения ${i+1}`,{exact:true}).selectOption(String(item.claims[selected[i]].evidence));
      await page.getByRole('button',{name:'Зафиксировать опоры →',exact:true}).click();
      for(let i=0;i<item.inaccurate.length;i++) await page.getByLabel(`Как оценить предложение ${i+1}?`,{exact:true}).selectOption(String(item.inaccurate[i].reason));
      await page.getByLabel('Твой исправленный абзац на английском',{exact:true}).fill(item.inaccurate.map(entry=>entry.correction).join(' '));
      await page.getByRole('button',{name:'Открыть разбор →',exact:true}).click();
      if(round===0) {
        await page.getByText('Отдельный верный факт может быть лишней деталью для overview.',{exact:false}).waitFor();
        await page.getByRole('button',{name:'Собрать полный ответ →',exact:true}).click();
        await page.getByLabel('Полный черновик на английском',{exact:true}).fill(item.modelResponse);
        await page.getByRole('button',{name:'Перейти к самопроверке →',exact:true}).click();
        await page.getByLabel('На чём сосредоточишься?',{exact:true}).selectOption('Главное и точность данных');
        await page.getByRole('button',{name:'Сохранить и попробовать новый график →',exact:true}).click();
        await page.getByRole('alert').filter({hasText:'Внеси правку или явно отметь'}).waitFor();
        await page.getByRole('checkbox',{name:'Я проверил выбранный аспект и решил сохранить текст без правок',exact:true}).check();
        await page.getByRole('button',{name:'Сохранить и попробовать новый график →',exact:true}).click();
        await page.waitForFunction(key=>{const r=localStorage.getItem(key);return r&&JSON.parse(r).checkpoint?.data.round===1;},key);
        await page.reload();
        await page.getByRole('button',{name:'Продолжить сохранённую',exact:true}).click();
        await page.getByRole('heading',{name:'1. Выбери главное и напиши overview',exact:true}).waitFor();
      } else await page.getByRole('button',{name:'Сравнить две попытки →',exact:true}).click();
    }
    await page.getByRole('heading',{name:'Что получилось на двух графиках',exact:true}).waitFor();
    await page.waitForFunction(key=>{const r=localStorage.getItem(key);return r&&JSON.parse(r).checkpoint?.data.phase==='result';},key);
    const record=parseRecord(await page.evaluate(key=>localStorage.getItem(key),key),'task1-overview')!;
    const data=record.checkpoint!.data as { first:{selected:number[]};transfer:{selected:number[]};draft:string;revision:string;noChanges:boolean };
    assert.deepEqual(data.first.selected,[0,3,4]);
    assert.deepEqual(data.transfer.selected,[0,1,2]);
    assert.equal(data.draft,overviewItems[0].modelResponse);
    assert.equal(data.revision,data.draft);
    assert.equal(data.noChanges,true);
    for(const width of [320,390,768,1440]) { await page.setViewportSize({width,height:900});assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1),false,`result overflow ${width}`); }
    const axe=await new AxeBuilder({page}).include('main').analyze();
    assert.deepEqual(axe.violations.map(v=>({id:v.id,targets:v.nodes.map(n=>n.target)})),[]);
    assert.deepEqual(errors,[]);
    console.log('PASS Task 1 full browser flow: wrong first selection preserved, evidence restore, accuracy reasons, draft/explicit unchanged revision, transfer restore/new selection, four result widths and axe. Authored model used as synthetic test input, not learner-quality evidence.');
  } finally { await browser.close(); }
}
main().catch(error=>{console.error(error);process.exitCode=1;});
