import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import { chromium } from 'playwright';
import AxeBuilder from '@axe-core/playwright';
import { draftArchives, draftBatch, emptyDraftReview, parseDraftReview, reviewKey } from '../src/lib/trainers/draft-review';

async function main(){
  const archived=draftArchives[0];assert.equal(archived.version,'1.0');assert.equal(draftBatch.version,'2.0');assert.notEqual(archived.content_sha256,draftBatch.content_sha256);
  const base=process.env.TRAINER_CHECK_BASE??'http://127.0.0.1:3043';assert.ok(['127.0.0.1','localhost'].includes(new URL(base).hostname));
  const actor='synthetic-archive-a',key=reviewKey(actor,archived),currentKey=reviewKey(actor,draftBatch);
  const old=emptyDraftReview(actor,archived);
  old.decisions.W01={decision:'recommend',attested:true,comment:'<img src=x onerror=alert(1)> Synthetic OLD source only. '+ 'Ж'.repeat(2900),savedAt:'2026-10-13T00:00:00.000Z'};
  const raw=JSON.stringify(old,null,3)+'\n';assert.ok(parseDraftReview(raw,actor,archived));
  const browser=await chromium.launch({headless:true});
  try{
    const context=await browser.newContext(),page=await context.newPage(),errors:string[]=[],posts:string[]=[];
    page.on('pageerror',e=>errors.push(e.message));page.on('request',r=>{if(['POST','PUT','PATCH','DELETE'].includes(r.method()))posts.push(r.url());});
    await page.goto(base+'/trainers/material-review');await page.getByRole('heading',{name:'Нужно войти',exact:true}).waitFor();
    const session=(id:string,role='teacher')=>({user:{id,name:'Synthetic reviewer',email:'synthetic@example.invalid',role,avatarColor:'red'},expiresAt:new Date(Date.now()+3600000).toISOString()});
    await page.evaluate(({key,raw,session})=>{localStorage.setItem(key,raw);localStorage.setItem('ashyq:v2:session',JSON.stringify(session));dispatchEvent(new Event('storage'));},{key,raw,session:session(actor)});
    const archive=page.getByRole('region',{name:'Архив прежней версии · 1.0',exact:true});await archive.waitFor();
    await page.getByRole('heading',{name:'Рассмотрено 0 из 12',exact:true}).waitFor();
    await archive.getByText('Рассмотрено в прежней версии: 1 из 12. Это отдельные архивные решения.',{exact:true}).waitFor();
    assert.equal(await page.getByLabel('Результат проверки',{exact:true}).inputValue(),'pending');
    assert.equal(await page.getByLabel('Замечание',{exact:true}).inputValue(),'');
    assert.equal(await page.getByRole('checkbox',{name:'Проверил условие, ключ, допустимые альтернативы и понятность разбора.',exact:true}).isChecked(),false);
    assert.equal(await page.evaluate(k=>localStorage.getItem(k),currentKey),null,'reading old source does not create a current decision');
    async function downloaded(label:string){const pending=page.waitForEvent('download');await archive.getByRole('button',{name:label,exact:true}).click();const download=await pending;const path=await download.path();assert.ok(path);return {name:download.suggestedFilename(),raw:await fs.readFile(path,'utf8')};}
    const exported=await downloaded('Скачать решения прежней версии');assert.equal(exported.raw,raw,'exact raw preserved including whitespace/newline');assert.ok(exported.name.endsWith('v1.0-review.json'));
    const source=await downloaded('Скачать материалы прежней версии');assert.deepEqual(JSON.parse(source.raw),archived);assert.ok(source.name.endsWith('v1.0-source.json'));
    await archive.getByText('Читать материалы и решения прежней версии',{exact:true}).click();
    await archive.getByText('W01 · Practical skills at school · архив 1.0',{exact:true}).click();
    await archive.getByText(old.decisions.W01.comment,{exact:true}).waitFor();assert.equal(await archive.locator('img').count(),0,'comment is text, not HTML');
    await archive.getByText('Архивный ключ и границы',{exact:true}).first().click();
    for(const width of [320,390,768,1440]){await page.setViewportSize({width,height:900});assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1),false,`archive long comment/table ${width}`);}
    assert.deepEqual((await new AxeBuilder({page}).include('main').analyze()).violations,[]);
    await page.setViewportSize({width:390,height:844});await fs.mkdir('artifacts/trainers-complete-033',{recursive:true});
    await archive.getByText('Читать материалы и решения прежней версии',{exact:true}).click();
    await archive.screenshot({path:'artifacts/trainers-complete-033/draft-archive-mobile.png'});
    // Saving a new-source decision must leave the archived bytes intact.
    await page.getByLabel('Результат проверки',{exact:true}).selectOption('hold');await page.getByLabel('Замечание',{exact:true}).fill('Synthetic NEW source, not methodological approval.');
    await page.getByRole('button',{name:'Сохранить решение в этом браузере',exact:true}).click();await page.getByRole('status').filter({hasText:'Решение для W01 сохранено локально.'}).waitFor();
    assert.equal(await page.evaluate(k=>localStorage.getItem(k),key),raw);
    const currentRaw=await page.evaluate(k=>localStorage.getItem(k),currentKey);assert.equal(parseDraftReview(currentRaw,actor,draftBatch)?.decisions.W01.decision,'hold');
    await page.reload();await page.getByRole('heading',{name:'Рассмотрено 1 из 12',exact:true}).waitFor();await archive.getByText('Рассмотрено в прежней версии: 1 из 12. Это отдельные архивные решения.',{exact:true}).waitFor();
    // Other accounts neither see the note nor receive migrated decisions.
    await page.evaluate(value=>{localStorage.setItem('ashyq:v2:session',JSON.stringify(value));dispatchEvent(new Event('storage'));},session('synthetic-archive-b'));
    await archive.getByText('Для этого аккаунта в этом браузере решений прежней версии нет.',{exact:true}).waitFor();await page.getByRole('heading',{name:'Рассмотрено 0 из 12',exact:true}).waitFor();
    assert.equal(await archive.getByRole('button',{name:'Скачать решения прежней версии',exact:true}).count(),0);assert.equal(await archive.getByText(old.decisions.W01.comment,{exact:true}).count(),0);
    await page.evaluate(value=>{localStorage.setItem('ashyq:v2:session',JSON.stringify(value));dispatchEvent(new Event('storage'));},session(actor));
    for(const broken of ['', '{bad raw\n','{"format":"ashyq-draft-review-v1","extra":"'+ 'Я'.repeat(650001)+'"}']){
      await page.evaluate(({key,broken})=>{localStorage.setItem(key,broken);dispatchEvent(new Event('storage'));},{key,broken});
      await archive.getByRole('status').filter({hasText:'Исходная запись прежней версии не распознана'}).waitFor();assert.equal(await archive.getByRole('button',{name:'Скачать решения прежней версии',exact:true}).count(),0);
      const recovery=await downloaded('Скачать исходную запись прежней версии');assert.equal(recovery.raw,broken);assert.ok(recovery.name.endsWith('review-recovery.txt'));assert.equal(await page.evaluate(k=>localStorage.getItem(k),key),broken);
      assert.equal(await page.evaluate(k=>localStorage.getItem(k),currentKey),currentRaw,'recovery does not replace current source decisions');
    }
    await page.getByLabel('Партия материалов',{exact:true}).selectOption('02');assert.equal(await archive.count(),0);
    await page.evaluate(value=>{localStorage.setItem('ashyq:v2:session',JSON.stringify(value));dispatchEvent(new Event('storage'));},session(actor,'student'));
    await page.getByRole('heading',{name:'Недостаточно прав',exact:true}).waitFor();assert.equal(await page.getByRole('button',{name:'Скачать материалы прежней версии',exact:true}).count(),0);
    assert.deepEqual(errors,[]);assert.deepEqual(posts,[]);
    console.log('PASS archive v1/current v2 source-bound decisions, no attestation migration, exact old source/review bytes and empty/corrupt/UTF8-large recovery, new-source save/reload leaves old intact, escaped long comment/tables/four widths/axe, account/role/batch separation and no server writes. UI gate is not server RLS or methodology approval.');
  }finally{await browser.close();}
}
main().catch(error=>{console.error(error);process.exitCode=1;});
