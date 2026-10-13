import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import { chromium } from 'playwright';
import AxeBuilder from '@axe-core/playwright';
import batch from '../src/data/trainer-drafts/batch-03.json';
import { nextDraftWriting, parseDraftWriting } from '../src/lib/trainers/draft-writing';
import { draftBatches, type DraftUnit } from '../src/lib/trainers/draft-review';

async function main() {
  for (const unit of batch.units) assert.ok(parseDraftWriting(unit.exercise_data),unit.id);
  const original = batch.units[0].exercise_data;
  for (const value of [null,[],{}, {...original,publication_ready:true},{...original,mode:'unknown'},{...original,source:[]},{...original,accepted_alternatives:[]},{...original,choices:original.choices.map(choice=>({...choice,best:true}))},{...original,example:'Wrong example'},{...original,task:'x'.repeat(4001)},{...original,choices:[original.choices[1],original.choices[1],original.choices[0]]}]) assert.equal(parseDraftWriting(value),null);
  const normalized = parseDraftWriting({...original,unexpected:'discard me'})!;
  assert.equal('unexpected' in normalized,false); assert.notEqual(normalized.source,original.source);
  const units: { batchId: string; unit: DraftUnit }[] = draftBatches.flatMap(b=>b.units.map(unit=>({batchId:b.batch,unit}))).filter(value=>parseDraftWriting(value.unit.exercise_data));
  const values = units.map(value=>value.unit.exercise_data);
  assert.equal(units.length,24);
  for (const {unit} of units) {
    const item = parseDraftWriting(unit.exercise_data)!, next = nextDraftWriting(item,values)!;
    assert.ok(next); assert.notEqual(item.id,next.id); assert.equal(item.mode,next.mode); assert.notDeepEqual(item.source,next.source);
    assert.equal(nextDraftWriting(item,[item]),null);
    assert.equal(nextDraftWriting(item,values.filter(value=>parseDraftWriting(value)?.mode!==item.mode)),null);
    assert.equal(nextDraftWriting(item,[item,{...item,id:'DISTINCT-ID'}]),null,'renamed identical source is not a different task');
    assert.equal(nextDraftWriting(item,[item,{...item,id:'OTHER',source:['Different source']}]),null,'same prepared example is rejected');
    assert.equal(nextDraftWriting(item,[null,{},...values])?.id,next.id);
    assert.equal(nextDraftWriting(item,[...values].reverse())?.id,next.id,'deterministic source order');
  }
  const base = process.env.TRAINER_CHECK_BASE ?? 'http://127.0.0.1:3043';
  assert.ok(['localhost','127.0.0.1'].includes(new URL(base).hostname),'LocalDemo fixtures only');
  const browser = await chromium.launch({headless:true});
  try {
    const context = await browser.newContext(); const page = await context.newPage();
    const errors:string[] = [], writes:string[] = [];
    page.on('pageerror',error=>errors.push(error.message));
    page.on('request',request=>{if(['POST','PUT','PATCH','DELETE'].includes(request.method())) writes.push(request.url());});
    await page.goto(base+'/trainers/material-review');
    await page.getByRole('heading',{name:'Нужно войти',exact:true}).waitFor();
    await page.evaluate(()=>{localStorage.setItem('ashyq:v2:session',JSON.stringify({user:{id:'synthetic-draft-preview',name:'Synthetic reviewer',email:'synthetic@example.invalid',role:'teacher',avatarColor:'red'},expiresAt:new Date(Date.now()+3600000).toISOString()}));dispatchEvent(new Event('storage'));});
    await page.getByLabel('Партия материалов',{exact:true}).selectOption('03');
    for (const [index,{batchId,unit}] of units.entries()) {
      await page.getByLabel('Партия материалов',{exact:true}).selectOption(batchId);
      await page.getByLabel('Выбери материал',{exact:true}).selectOption(unit.id);
      const preview = page.getByRole('region',{name:'Пробное прохождение · DRAFT',exact:true});
      await preview.getByRole('button',{name:'Пройти черновик как ученик',exact:true}).click();
      const first=parseDraftWriting(unit.exercise_data)!, next=nextDraftWriting(first,values)!;
      const records:{id:string;draft:string;revision:string;reflection:string;help:boolean}[]=[];
      assert.equal(await preview.getByText(next.task,{exact:true}).count(),0,'next task hidden before first revision');
      for (const [round,item] of [first,next].entries()) {
        const stage=preview.getByRole('heading',{level:4}).filter({hasText:item.id}); await stage.waitFor();
        assert.equal(await stage.evaluate(node=>document.activeElement===node),true,'stage focus');
        const options=preview.getByRole('group',{name:'Какой вариант выполняет задание?',exact:true});
        assert.equal(await options.count(),0,'options hidden before own attempt');
        const exposure=preview.getByRole('group',{name:'Знаком ли тебе этот материал или его разбор?',exact:true});
        const exposureIndex=(index+round)%3;
        await exposure.getByRole('radio').nth(exposureIndex).check();
        await preview.getByRole('button',{name:'Зафиксировать попытку и показать варианты',exact:true}).click();
        await preview.getByRole('status').filter({hasText:'12 символов'}).waitFor();
        const own=index===0&&round===0?'Я'.repeat(4000):`Synthetic independent text for ${item.id}, round ${round}.`;
        await preview.getByLabel('Твоя первая попытка',{exact:true}).fill(own);
        await preview.getByRole('button',{name:'Зафиксировать попытку и показать варианты',exact:true}).click();
        assert.equal(await preview.getByLabel('Твоя первая попытка',{exact:true}).isDisabled(),true);
        assert.equal(await exposure.getByRole('radio').first().isDisabled(),true);
        await preview.getByRole('button',{name:'Проверить выбранный вариант',exact:true}).click();
        await preview.getByRole('status').filter({hasText:'Выбери вариант'}).waitFor();
        const wrong=item.choices.findIndex(choice=>!choice.best), correct=item.choices.findIndex(choice=>choice.best);
        const retries=index===0&&round===0?22:1;
        for(let attempt=0;attempt<retries;attempt++) {
          await options.getByRole('radio').nth(wrong).check();
          await preview.getByRole('button',{name:'Проверить выбранный вариант',exact:true}).click();
          await preview.getByRole('status').filter({hasText:item.choices[wrong].feedback}).waitFor();
        }
        assert.equal(await preview.getByLabel('Твой вариант после разбора',{exact:true}).count(),0,'repair follows revealed explanation');
        const help=(index+round)%2===0;
        if(help) await preview.getByRole('button',{name:'Показать разбор без выбора',exact:true}).click();
        else {await options.getByRole('radio').nth(correct).check();await preview.getByRole('button',{name:'Проверить выбранный вариант',exact:true}).click();}
        const repairHeading=preview.getByRole('heading',{name:'Сравни с первой попыткой',exact:true});await repairHeading.waitFor();
        assert.equal(await repairHeading.evaluate(node=>document.activeElement===node),true,'repair focus');
        assert.equal(await preview.locator('p').filter({hasText:own}).textContent(),own);
        await preview.getByText('Другие допустимые формулировки и замечания автору',{exact:true}).click();
        for(const line of item.accepted_alternatives) await preview.locator('details').getByText(line,{exact:true}).waitFor();
        const continueButton=preview.getByRole('button',{name:round?'Завершить пробу и сравнить попытки':'Зафиксировать пересмотр и продолжить',exact:true});
        await continueButton.click();await preview.getByRole('status').filter({hasText:'подтверди границы оценки'}).waitFor();
        const revision=round?own:`An intentionally incorrect repair for ${item.id}; this is not marked correct.`;
        const reflection=`Check the scope and reasoning next time for ${item.id}.`;
        await preview.getByLabel('Твой вариант после разбора',{exact:true}).fill(revision);
        await preview.getByLabel('Что проверишь в следующем задании?',{exact:true}).fill(reflection);
        await continueButton.click();await preview.getByRole('status').filter({hasText:'подтверди границы оценки'}).waitFor();
        await preview.getByRole('checkbox').check();
        if(index===units.length-1&&round===0) {
          await fs.mkdir('artifacts/trainers-complete-033',{recursive:true});
          await page.setViewportSize({width:390,height:844});
          await preview.getByLabel('Твой вариант после разбора',{exact:true}).evaluate(node=>window.scrollTo({top:node.getBoundingClientRect().top+scrollY-190,behavior:'instant'}));
          await page.evaluate(()=>new Promise<void>(resolve=>requestAnimationFrame(()=>requestAnimationFrame(()=>resolve()))));
          await page.screenshot({path:'artifacts/trainers-complete-033/draft-writing-repair-mobile.png'});
        }
        records.push({id:item.id,draft:own,revision,reflection,help});
        await continueButton.click();
      }
      const report=preview.getByRole('heading',{name:'Отчёт временной пробы',exact:true});await report.waitFor();
      assert.equal(await report.evaluate(node=>document.activeElement===node),true,'report focus');
      for(const record of records) {
        const section=preview.getByRole('region',{name:`Попытки ${record.id}`,exact:true});
        await section.getByText(record.revision,{exact:true}).first().waitFor();
        await section.getByText(record.reflection,{exact:true}).waitFor();
        await section.getByText(record.draft,{exact:true}).first().waitFor();
        assert.ok((await section.textContent())!.includes(`Разбор по запросу: ${record.help?'да':'нет'}`));
      }
      await preview.getByText('Текст изменён; качество изменений вручную ещё не проверено.',{exact:true}).waitFor();
      await preview.getByText('Текст оставлен без изменений.',{exact:true}).waitFor();
      if(index===0||index===units.length-1) {
        for(const width of [320,390,768,1440]) {await page.setViewportSize({width,height:900});assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1),false,`report overflow ${unit.id}/${width}`);}
        const axe=await new AxeBuilder({page}).include('main').analyze();assert.deepEqual(axe.violations.map(value=>({id:value.id,targets:value.nodes.map(node=>node.target)})),[]);
        if(index===units.length-1) {await page.setViewportSize({width:390,height:844});await report.locator('..').screenshot({path:'artifacts/trainers-complete-033/draft-writing-report-mobile.png',animations:'disabled'});}
      }
      await preview.getByRole('button',{name:'Начать новую временную пробу',exact:true}).click();
      assert.equal(await preview.getByLabel('Твоя первая попытка',{exact:true}).inputValue(),'');
      assert.equal(await preview.getByRole('group',{name:'Какой вариант выполняет задание?',exact:true}).count(),0);
    }
    await page.reload();await page.getByLabel('Партия материалов',{exact:true}).selectOption('03');
    assert.equal(await page.getByRole('button',{name:'Пройти черновик как ученик',exact:true}).count(),1);
    assert.equal(await page.evaluate(()=>Object.keys(localStorage).filter(key=>key.startsWith('ashyq:trainer-review:')||key.startsWith('ashyq:trainer-checkpoint:')).length),0,'temporary trial writes no reviews/checkpoints');
    assert.deepEqual(writes,[]);assert.deepEqual(errors,[]);
    console.log('PASS24 two-task writing trials/48 rounds including legacy v2: deterministic distinct same-mode sources, self-reported exposure, first-answer freeze, retry/help provenance, separate required repair/reflection/manual acknowledgement, wrong repair not graded, unchanged repair allowed, bounded choice trail, report/reset/reload/no writes, focus/four widths/axe. Existing next source is not guaranteed unseen, free text is not scored.');
  } finally {await browser.close();}
}
main().catch(error=>{console.error(error);process.exitCode=1;});
