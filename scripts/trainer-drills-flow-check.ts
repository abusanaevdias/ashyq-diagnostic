import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import { chromium } from 'playwright';
import AxeBuilder from '@axe-core/playwright';
import { drillModes, writingDrills } from '../src/lib/writing-trainer/drills';
import { checkpointKey, parseRecord, createEntry, emptyRecord } from '../src/lib/trainers/checkpoints';

async function main() {
  const browser=await chromium.launch({headless:true});
  const base=process.env.TRAINER_CHECK_BASE ?? 'http://127.0.0.1:3043';
  try {
    const context=await browser.newContext();const page=await context.newPage();const errors:string[]=[];page.on('dialog',dialog=>dialog.accept());page.on('pageerror',error=>errors.push(error.message));
    await page.goto(base+'/writing/trainer/drills');await page.getByRole('button',{name:'Сохранять на этом устройстве',exact:true}).click();
    const key=checkpointKey('writing-drills','guest');
    const expected:Record<string,{draft:string;choices:number[];attemptCount:number;revealedByHelp:boolean}[]>={};
    for(const mode of drillModes) {
      const card=page.getByRole('article').filter({has:page.getByRole('heading',{name:mode.title,exact:true})});
      await card.getByRole('button',{name:/Начать/}).click();
      for(const [index,item] of writingDrills.filter(item=>item.mode===mode.id).entries()) {
        await page.getByRole('heading',{name:item.title,exact:true}).waitFor();
        assert.equal(await page.getByRole('radio').count(),0);
        await page.getByRole('button',{name:'Я написал свой вариант · показать решения →',exact:true}).click();
        await page.getByRole('status').filter({hasText:'Сначала напиши собственный вариант'}).waitFor();
        const draft=item.id===writingDrills[0].id?'x'.repeat(600):`My first ${item.id} draft is an original sentence for later comparison.`;
        await page.locator('#writing-drill-draft').fill(draft);
        await page.getByRole('button',{name:'Я написал свой вариант · показать решения →',exact:true}).click();
        assert.equal(await page.locator('#writing-drill-draft').isDisabled(),true);
        const best=item.choices.findIndex(choice=>choice.best), wrong=item.choices.map((_,i)=>i).filter(i=>i!==best);
        const choices=index===0?wrong:[wrong[0],best];
        for(const choice of choices) {await page.getByRole('radio').nth(choice).check();await page.getByRole('button',{name:'Проверить выбор →',exact:true}).click();}
        if(index===0) await page.getByRole('button',{name:'Показать разбор',exact:true}).click();
        expected[item.id]=[{draft,choices,attemptCount:choices.length,revealedByHelp:index===0}];
        await page.waitForFunction(key=>{const raw=localStorage.getItem(key);return raw&&JSON.parse(raw).checkpoint?.data.revealed===true;},key);
        await page.reload();await page.getByRole('button',{name:'Продолжить сохранённую',exact:true}).click();
        assert.equal(await page.locator('#writing-drill-draft').inputValue(),draft);
        for(const width of [320,390,768,1440]) {await page.setViewportSize({width,height:900});assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1),false);}
        const axe=await new AxeBuilder({page}).include('main').analyze();assert.deepEqual(axe.violations.map(v=>({id:v.id,targets:v.nodes.map(n=>n.target)})),[]);
        await page.locator('#drill-repair').fill(`Own revision preserving the original thought ${item.id}.`);await page.locator('#drill-reflection').fill(`Own explanation of my repair ${item.id}.`);
        await page.getByRole('button',{name:index===0?'Следующее задание →':'К упражнениям →',exact:true}).click();
      }
    }
    await page.waitForFunction(key=>{const raw=localStorage.getItem(key);return raw&&JSON.parse(raw).checkpoint?.data.completed.length===6;},key);
    const record=parseRecord(await page.evaluate(key=>localStorage.getItem(key),key),'writing-drills')!;
    const records=record.checkpoint!.data.drillRecords as Record<string,{savedAt:string;draft:string;choices:number[];attemptCount:number;revealedByHelp:boolean;repair?:{revision:string;reflection:string;unchanged:boolean}}[]>;
    assert.ok(Object.values(records).flat().every(value=>!Number.isNaN(Date.parse(value.savedAt))));
    const actual=Object.fromEntries(Object.entries(records).map(([id,entries])=>[id,entries.map(entry=>({draft:entry.draft,choices:entry.choices,attemptCount:entry.attemptCount,revealedByHelp:entry.revealedByHelp}))]));
    assert.deepEqual(actual,expected,'finishing a drill must preserve its first free-text attempt and choice/help history');
    await fs.mkdir('artifacts/trainers-complete-033',{recursive:true});
    const download=page.waitForEvent('download');
    await page.getByRole('button',{name:'Скачать текущую работу',exact:true}).click();
    const file='artifacts/trainers-complete-033/writing-drill-records-export.json';
    await (await download).saveAs(file);
    assert.deepEqual(parseRecord(await fs.readFile(file,'utf8'),'writing-drills')?.checkpoint?.data.drillRecords,records,'completed records must survive export parsing');
    await page.reload();await page.getByRole('button',{name:'Продолжить сохранённую',exact:true}).click();
    await page.getByText('Посмотреть первые варианты, свои правки и помощь',{exact:true}).click();
    for(const width of [320,390,768,1440]) {await page.setViewportSize({width,height:900});assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1),false,'expanded record with long unbroken draft must fit');}
    const historyAxe=await new AxeBuilder({page}).include('main').analyze();assert.deepEqual(historyAxe.violations.map(v=>({id:v.id,targets:v.nodes.map(n=>n.target)})),[]);
    const legacyContext=await browser.newContext();const legacyPage=await legacyContext.newPage();
    legacyPage.on('pageerror',error=>errors.push(error.message));
    const entry=createEntry({mode:'combine',index:0,draft:'An original legacy draft for comparison.',optionsVisible:true,choice:null,attempts:2,feedback:'Legacy revealed attempt',revealed:true,completed:[]});
    await legacyPage.goto(base+'/writing/trainer/drills');
    await legacyPage.evaluate(({key,value})=>localStorage.setItem(key,JSON.stringify(value)),{key,value:{...emptyRecord('writing-drills'),revision:entry.id,checkpoint:entry}});
    await legacyPage.reload();await legacyPage.getByRole('button',{name:'Продолжить сохранённую',exact:true}).click();
    await legacyPage.locator('#drill-repair').fill('Own revised legacy response preserving my idea.');await legacyPage.locator('#drill-reflection').fill('Own explanation after the legacy revealed state.');await legacyPage.getByRole('button',{name:'Следующее задание →',exact:true}).click();
    await legacyPage.waitForFunction(({key,id})=>{const raw=localStorage.getItem(key);return raw&&JSON.parse(raw).checkpoint?.data.drillRecords?.[id]?.[0]?.revealedByHelp===null;},{key,id:writingDrills[0].id});
    await legacyPage.getByText('Посмотреть первые варианты, свои правки и помощь',{exact:true}).click();
    await legacyPage.getByText(/Способ открытия разбора не сохранён в ранней версии/).waitFor();
    await legacyContext.close();
    assert.deepEqual(errors,[]);
    console.log('PASS six Writing drills: draft gate, locked first attempt, wrong retries/help or correct choice, revealed-state restore, all first drafts/choice/help records preserved after completion, four widths/axe. Completion and choices do not grade the free text.');
  } finally {await browser.close();}
}
main().catch(error=>{console.error(error);process.exitCode=1;});
